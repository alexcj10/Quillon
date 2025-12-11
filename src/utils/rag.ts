import { getNotes } from "./storage";
import { embedText } from "./embed";
import { cosineSimilarity } from "./similarity";
import { isFileTag, getFileTagDisplayName, Note } from "../types";
import { getPersonalizedResponse } from "./personalizedResponses";

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;

export async function ragQuery(
    question: string, 
    history: Array<{ role: 'user' | 'ai', content: string }> = [],
    options: { includePrivate: boolean } = { includePrivate: false }
) {
    // Check for personalized responses first (greetings, identity questions)
    const normalizedQuestion = question.trim();
    const personalizedResponse = getPersonalizedResponse(normalizedQuestion);
    if (personalizedResponse) {
        return personalizedResponse;
    }

    // --- 0. PLANNER CORE (Deep Reasoning) ---
    // Instead of just rewriting, we break the query into steps for better retrieval.
    let searchQueries: string[] = [normalizedQuestion];

    if (history.length > 0 || normalizedQuestion.length > 15) {
        // We look at history + current query
        const relevantHistory = history.slice(-3);

        try {
            const plannerBody = {
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `You are Pownin's reasoning engine (Nexus Core).
                        Goal: Analyze the User's request.
                        Output: JSON object with:
                        - "queries": string[] (1-3 atomic string search queries)
                        - "hypothetical_answer": string (A short, ideal paragraph that WOULD answer the user's question. Hallucinate facts if needed to generate keywords.)
                        
                        Rules:
                        1. Resolve pronouns ("it", "he") using History.
                        2. If complex (e.g. "Compare X and Y"), output ["X", "Y"] in queries.
                        3. If simple, Just output ["query"].`
                    },
                    ...relevantHistory,
                    { role: "user", content: normalizedQuestion }
                ],
                response_format: { type: "json_object" } 
            };

            if (GROQ_KEY) {
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify(plannerBody)
                });
                const data = await res.json();
                const planRaw = data?.choices?.[0]?.message?.content;
                if (planRaw) {
                    try {
                        // The model might return { "queries": [...] } or just [...]
                        const parsed = JSON.parse(planRaw);
                        if (Array.isArray(parsed)) {
                            searchQueries = parsed;
                        } else if (parsed.queries && Array.isArray(parsed.queries)) {
                            searchQueries = parsed.queries;
                        }
                        
                        if (parsed.hypothetical_answer) {
                            // HyDE: We treat the hypothetical answer as a generic "Concept Vector"
                            // We add it to the search queries so it gets its own embedding
                            searchQueries.push(parsed.hypothetical_answer);
                        }
                    } catch (e) {
                         // Fallback: just use text if JSON fails
                         searchQueries = [planRaw.replace(/[\[\]"]/g, '')]; 
                    }
                }
            }
        } catch (e) {
            console.warn("Planner failed, using original.", e);
        }
    }

    // --- 0.5. RE-CHECK PERSONALITY FOR FIRST STEP ---
    // Sometimes the 'Plan' reveals it's a personality question (e.g. "Who is he?" -> "Who is Alex?")
    if (searchQueries.length > 0 && searchQueries[0] !== normalizedQuestion) {
        const contextResponse = getPersonalizedResponse(searchQueries[0]);
        if (contextResponse) return contextResponse;
    }

    const allNotes = getNotes();
    // SECURITY: Filter out Private notes UNLESS explicitly allowed by the caller (Authenticated User)
    const notes = allNotes.filter(n => !n.isPrivate || (n.isPrivate && options.includePrivate));
    // Ensure we have notes
    if (!notes || notes.length === 0) return "No notes found.";

    // 1. Calculate Global Tag Structure (from ALL notes, not just retrieved ones)
    const blueFolders = new Set<string>();
    const greenTags = new Set<string>();
    const greyTags = new Set<string>();

    // Helper to map tags to their types globally

    notes.forEach(note => {
        const hasFileTag = note.tags.some(t => isFileTag(t));

        note.tags.forEach(t => {
            if (isFileTag(t)) {
                blueFolders.add(getFileTagDisplayName(t));
            } else if (hasFileTag) {
                greenTags.add(t);
            } else {
                // Potential grey tag, but need to check if it's green in ANY other note? 
                // In this app's logic, a tag is Green if it appears in a note with a file tag.
                // However, the strict logic in NoteFilters implies a tag instances are colored.
                // But for global context, if a tag is used as a Green tag somewhere, it's interesting.
                // Simpler approach: If a note has a file tag, its other tags are Green. If not, they are Grey.

                // We'll just collect them here. If we want to be strict global types:
                // If a tag is EVER used in a folder, is it always green?
                // The app likely treats tag *instances* as green/grey.
                greyTags.add(t);
            }
        });
    });

    // Remove duplicates: If a tag is in greenTags, it might also be in greyTags (used in regular notes too).
    // The AI should know it *can* be green.

    const globalTagContext = `
Global Tag Structure:
- **Folders (Blue)**: ${Array.from(blueFolders).join(", ") || "None"}
- **Folder Tags (Green)**: ${Array.from(greenTags).join(", ") || "None"}
- **Standalone Tags (Grey)**: ${Array.from(greyTags).join(", ") || "None"}
`;

    // 2. Identify which tags are "Green" (inside a file folder) for detailed context
    const tagsInFileFolders = new Set<string>();
    notes.forEach(note => {
        const hasFileTag = note.tags.some(t => isFileTag(t));
        if (hasFileTag) {
            note.tags.forEach(t => {
                if (!isFileTag(t)) tagsInFileFolders.add(t);
            });
        }
    });

    /* DEBUG LOGGING */
    // console.log(`[RAG] Loaded ${notes.length} notes from storage.`);
    // const qEmbed = embedText(finalQuestion); // Legacy, replaced by multi-query embeds

    // --- UNIVERSAL HYBRID SEARCH ALGORITHM ("Universal Beast Mode") ---

    // Helper: Levenshtein Distance for Fuzzy Matching (Typos)
    const levenshtein = (a: string, b: string): number => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
                else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
        return matrix[b.length][a.length];
    };

    // Construct a combined query string for the LLM Prompt
    const finalQuestion = searchQueries.join(" / ");

    // 0.8. Prepare Multi-Query Embeddings & Terms
    // We compute embeddings for EACH query in the plan.
    // A note is relevant if it matches ANY of the planned queries.
    const queryEmbeds = searchQueries.map(q => embedText(q));

    const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'tell', 'me', 'about', 'show', 'list', 'what', 'where', 'when', 'who', 'how']);

    // Union of all terms from all queries
    const allQueryTerms = new Set<string>();
    searchQueries.forEach(q => {
        q.toLowerCase()
            .replace(/[?.,!]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.has(w))
            .forEach(w => allQueryTerms.add(w));
    });
    const queryTerms = Array.from(allQueryTerms);

    // 2. Universal Tag Matching (Blue, Green, Grey)
    const allKnownTags = new Set<string>([
        ...Array.from(blueFolders),
        ...Array.from(greenTags),
        ...Array.from(greyTags)
    ]);

    const relevantTags = new Set<string>();
    queryTerms.forEach(term => {
        allKnownTags.forEach(tag => {
            const t = tag.toLowerCase();
            if (t === term || t === term + 's' || t + 's' === term || (levenshtein(term, t) <= 1)) {
                relevantTags.add(tag);
            }
        });
    });

    // 3. Score & Rank Notes
    const ranked = notes
        .map(n => {
            // A. Vector Score (Max-Sim Multi-Query)
            const tagText = n.tags ? n.tags.map(t => isFileTag(t) ? `${t} ${getFileTagDisplayName(t)}` : t).join(" ") : "";
            const baseText = `${n.title || ""} ${n.content || ""} ${tagText}`;
            const noteEmbed = n.embedding || embedText(baseText);

            // We take the BEST score across all planned queries.
            // If the note matches Step 1 perfectly but not Step 2, it's still a perfect result for Step 1.
            const vectorScore = Math.max(...queryEmbeds.map(qEmb => cosineSimilarity(qEmb, noteEmbed)));

            // B. Lexical Score (Text Match)
            let lexicalScore = 0;
            const titleLower = (n.title || "").toLowerCase();
            const contentLower = (n.content || "").toLowerCase();
            const titleTokens = titleLower.split(/\s+/);

            queryTerms.forEach(term => {
                // Title Match (Fuzzy allowed)
                if (titleTokens.some(t => t === term || levenshtein(t, term) <= 1)) {
                    lexicalScore += 2.0;
                }

                // Content Term Frequency (TF)
                const regex = new RegExp(`\\b${term}\\b`, 'gi');
                const count = (contentLower.match(regex) || []).length;
                lexicalScore += Math.min(count, 5) * 0.2;
            });

            // C. Tag Relevance Boost
            let tagBoost = 0;
            if (n.tags && relevantTags.size > 0) {
                const noteTags = n.tags.map(t => isFileTag(t) ? getFileTagDisplayName(t) : t);
                const hasRelevantTag = noteTags.some(nt => relevantTags.has(nt));
                if (hasRelevantTag) tagBoost = 3.0;
            }

            // D. Recency Boost
            let recencyScore = 0;
            const hoursSinceUpdate = (Date.now() - new Date(n.updatedAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate < 24) recencyScore = 1.0;
            else if (hoursSinceUpdate < 24 * 7) recencyScore = 0.5;
            else if (hoursSinceUpdate < 24 * 30) recencyScore = 0.2;

            // E. TITLE TOKEN OVERLAP (The "Human Logic" Fix)
            const tTokens = titleTokens.filter(t => t.length > 2);
            let matches = 0;
            if (tTokens.length > 0) {
                tTokens.forEach(tt => {
                    if (queryTerms.some(qt => qt === tt || levenshtein(qt, tt) <= 1)) {
                        matches++;
                    }
                });
                const ratio = matches / tTokens.length;
                if (ratio >= 0.5) lexicalScore += 10.0;
                else if (matches >= 1) lexicalScore += 3.0;
            }

            // F. Exact Phrase Match (Check against ANY query)
            const hasExactMatch = searchQueries.some(q => contentLower.includes(q.toLowerCase()));
            if (hasExactMatch) lexicalScore += 4.0;

            const finalScore = vectorScore * 10 + lexicalScore + tagBoost + recencyScore;

            return { n, score: finalScore, debug: { vectorScore, lexicalScore, tagBoost, recencyScore } };
        })
        .sort((a, b) => b.score - a.score);

    // --- 4. CONTEXT CHAINING (Graph Brain) ---
    // Scan Tier 1 notes for references to OTHER notes ("Mental Links")
    const tier1Notes = ranked.slice(0, 10); // Look at top 10 strongest matches
    const linkedNotes = new Map<string, Note>();

    // Create a fast lookup map for all available note titles
    const titleMap = new Map<string, Note>();
    notes.forEach(n => {
        if (n.title && n.title.length >= 3) {
            titleMap.set(n.title.toLowerCase(), n);
        }
    });

    tier1Notes.forEach(r => {
        const contentLower = (r.n.content || "").toLowerCase();

        // Check if this note mentions any OTHER note title
        titleMap.forEach((targetNote, targetTitle) => {
            // Avoid self-reference
            if (targetNote.id === r.n.id) return;

            // If the content mentions another note's title, LINK IT.
            // (Using robust boundary check to avoid partial word matches)
            if (contentLower.includes(targetTitle)) {
                // Ensure it's not already in Tier 1
                const isAlreadyInTier1 = tier1Notes.some(t1 => t1.n.id === targetNote.id);
                if (!isAlreadyInTier1) {
                    linkedNotes.set(targetNote.id, targetNote);
                }
            }
        });
    });

    // Combine Tier 1 (Direct Match) + Tier 2 (Linked Context)
    const finalNotesToProcess = [
        ...tier1Notes.map(r => ({ n: r.n, type: 'Direct Match' })),
        ...Array.from(linkedNotes.values()).map(n => ({ n, type: 'Linked Context' }))
    ];

    // Dynamic Context Construction with Token Limit
    const MAX_TOKENS = 3000; // Safe limit for Groq's 12k TPM (allows ~3-4 requests/min)
    let currentTokens = 0;
    const selectedNotes: string[] = [];

    // Estimate tokens (rough approximation: 4 chars ~= 1 token)
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);

    for (const item of finalNotesToProcess) {
        // Debug Log for verification (optional)
        // console.log(`[RAG] Processing ${item.type}: ${item.n.title}`);

        const richTags = item.n.tags ? item.n.tags.map(t => {
            if (isFileTag(t)) return `${getFileTagDisplayName(t)} (Blue Folder)`;
            if (tagsInFileFolders.has(t)) return `${t} (Green Tag)`;
            return `${t} (Grey Tag)`;
        }).join(", ") : "None";

        const noteEntry = `[${item.type}]\nTitle: ${item.n.title}\nLast Updated: ${new Date(item.n.updatedAt).toLocaleString()}\nTags: ${richTags}\nContent: ${item.n.content}`;
        const noteTokens = estimateTokens(noteEntry);

        if (currentTokens + noteTokens > MAX_TOKENS) {
            // If the first note itself is too big, truncate and add it
            if (selectedNotes.length === 0) {
                const allowedChars = MAX_TOKENS * 4;
                selectedNotes.push(noteEntry.substring(0, allowedChars) + "\n... (truncated)");
            }
            break; // Stop adding notes once limit is reached
        }

        selectedNotes.push(noteEntry);
        currentTokens += noteTokens;

        if (selectedNotes.length >= 15) break;
    }

    const context = selectedNotes.join("\n\n");

    // Add instruction for AI to understand the [Linked Context] tag
    const systemPromptExtras = `
Notes labeled [Linked Context] were automatically retrieved because they are mentioned in the Direct Match notes. 
Use them to provide a more complete answer, following the connections between notes.`;

    const body = {
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system", content: `You are Pownin, an intelligent AI assistant developed by Quillon for a note-taking app.
You have access to the user's notes and help them search, organize, and understand their content.

${globalTagContext}

Context:
- **Folders (Blue)**: Main categories or folders (e.g., "Alex" folder)
- **Folder Tags (Green)**: Sub-tags inside Blue Folders
- **Standalone Tags (Grey)**: Tags not in any folder

${systemPromptExtras}

When answering about notes, be specific about which folder (Blue) or tag (Green/Grey) they belong to.
Be helpful, friendly, and conversational. If asked about your identity, remember you are Pownin, created by Quillon.

Relevant Notes:
${context}`
            },
            { role: "user", content: finalQuestion }
        ]
    };

    if (!GROQ_KEY) {
        console.error("Missing VITE_GROQ_KEY");
        return "Error: Missing API Key in .env file";
    }

    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Groq API Error:", data);
            return `Error: ${data.error?.message || res.statusText}`;
        }

        const initialAnswer = data?.choices?.[0]?.message?.content ?? "No response from AI";
        if (!initialAnswer || initialAnswer.startsWith("Error")) return initialAnswer;

        // --- 5. REFLECTION CORE (The Mirror) 🪞 ---
        // We verify the answer quality before returning it. 
        // Only trigger this for complex queries (length > 20 chars) to save latency on simple ones.
        if (normalizedQuestion.length > 20) {
            try {
                const reflectionBody = {
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: `You are Pownin's Quality Control.
                            Task: Rate the AI Answer based on the User Question.
                            Score: 0-100.
                            Critique: Short 1 sentence reason.
                            
                            Output JSON: { "score": number, "critique": string }`
                        },
                        { role: "user", content: `Question: ${finalQuestion}\n\nAnswer: ${initialAnswer}` }
                    ],
                    response_format: { type: "json_object" }
                };

                const refRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify(reflectionBody)
                });
                const refData = await refRes.json();
                const critiqueRaw = refData?.choices?.[0]?.message?.content;

                if (critiqueRaw) {
                    const critique = JSON.parse(critiqueRaw);
                    // If score is low (< 85), we REWRITE.
                    if (critique.score < 85) {
                        // console.log(`[Reflection] Low Score (${critique.score}). Rewriting... Reason: ${critique.critique}`);

                        // Rewrite Call
                        const rewriteBody = {
                            model: "llama-3.3-70b-versatile",
                            messages: [
                                {
                                    role: "system",
                                    content: `You are Pownin. The previous answer was not good enough.
                                    Critique: ${critique.critique}
                                    
                                    Rewrite the answer to be perfect. Use the same Context.`
                                },
                                // Re-inject the context and original system prompt logic implicitly by just asking for better one
                                { role: "user", content: `Context: ${context}\n\nOriginal Question: ${finalQuestion}\n\nBetter Answer:` }
                            ]
                        };
                        const rwRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                            method: "POST",
                            headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
                            body: JSON.stringify(rewriteBody)
                        });
                        const rwData = await rwRes.json();
                        return rwData?.choices?.[0]?.message?.content ?? initialAnswer;
                    }
                }
            } catch (e) {
                console.warn("Reflection failed, returning initial answer.", e);
            }
        }

        return initialAnswer;
    } catch (err) {
        console.error("RAG Query Failed:", err);
        return "Error: Failed to connect to AI service";
    }
}
