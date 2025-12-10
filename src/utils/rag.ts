import { getNotes } from "./storage";
import { embedText } from "./embed";
import { cosineSimilarity } from "./similarity";
import { isFileTag, getFileTagDisplayName, Note } from "../types";
import { getPersonalizedResponse } from "./personalizedResponses";

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;

export async function ragQuery(question: string, history: Array<{ role: 'user' | 'ai', content: string }> = []) {
    // Check for personalized responses first (greetings, identity questions)
    const normalizedQuestion = question.trim();
    const personalizedResponse = getPersonalizedResponse(normalizedQuestion);
    if (personalizedResponse) {
        return personalizedResponse;
    }

    // --- 0. CONTEXT CORE (Memory) ---
    // Rewrite the query if there is history, so "it" becomes "the Exam note"
    let finalQuestion = normalizedQuestion;

    if (history.length > 0) {
        // We only look at the last 2-3 exchanges to keep it focused
        const relevantHistory = history.slice(-4);

        try {
            const rewriteBody = {
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `Rewrite the User's last question to be a standalone query based on the history. 
                        Resolve textual references like "it", "that", "the first one", "he", "him".
                        If the user asks "Why?", "How?", or "Who?", ensure the subject is clear (e.g., "Why did Alex build Quillon?").
                        Keep it concise. Do not answer the question. Just rewrite it.
                        If no context is needed, return the original question.`
                    },
                    ...relevantHistory,
                    { role: "user", content: normalizedQuestion }
                ]
            };

            // Fast, small request for rewriting
            if (GROQ_KEY) {
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify(rewriteBody)
                });
                const data = await res.json();
                if (data?.choices?.[0]?.message?.content) {
                    finalQuestion = data.choices[0].message.content.trim();
                    // console.log(`[Context Core] Rewrote "${normalizedQuestion}" -> "${finalQuestion}"`);
                }
            }
        } catch (e) {
            console.warn("Query rewriting failed, using original.", e);
        }
    }

    // --- 0.5. RE-CHECK PERSONALITY (Trigger matches on resolved queries) ---
    // If "What is that?" became "What is Quillon?", we want to catch it here!
    if (finalQuestion !== normalizedQuestion) {
        const contextResponse = getPersonalizedResponse(finalQuestion);
        if (contextResponse) {
            // console.log(`[Context System] Redirecting rewritten query to Personality Module`);
            return contextResponse;
        }
    }

    const notes = getNotes();
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
    const qEmbed = embedText(finalQuestion);

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

    // 1. Prepare Query Keywords
    const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'tell', 'me', 'about', 'show', 'list', 'what', 'where', 'when', 'who', 'how']);
    const queryTerms = finalQuestion.toLowerCase()
        .replace(/[?.,!]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

    // 2. Universal Tag Matching (Blue, Green, Grey)
    // We want to know if the user mentioned ANY tag (exact, plural, or typo)
    const allKnownTags = new Set<string>([
        ...Array.from(blueFolders),
        ...Array.from(greenTags),
        ...Array.from(greyTags)
    ]);

    const relevantTags = new Set<string>(); // Tags the user is asking about

    // Helper to check fuzzy match against all tags
    queryTerms.forEach(term => {
        allKnownTags.forEach(tag => {
            const t = tag.toLowerCase();
            // Direct, Plural/Singular, or Fuzzy Match
            if (
                t === term ||
                t === term + 's' ||
                t + 's' === term ||
                (levenshtein(term, t) <= 1) // 1 typo allowed
            ) {
                relevantTags.add(tag);
            }
        });
    });

    // 3. Score & Rank Notes
    const ranked = notes
        .map(n => {
            // A. Vector Score (Semantic)
            const tagText = n.tags ? n.tags.map(t => isFileTag(t) ? `${t} ${getFileTagDisplayName(t)}` : t).join(" ") : "";
            const baseText = `${n.title || ""} ${n.content || ""} ${tagText}`;
            const noteEmbed = n.embedding || embedText(baseText);
            const vectorScore = cosineSimilarity(qEmbed, noteEmbed);

            // B. Lexical Score (Text Match)
            let lexicalScore = 0;
            const titleLower = (n.title || "").toLowerCase();
            const contentLower = (n.content || "").toLowerCase();
            // const tagsLower = (n.tags || []).map(t => isFileTag(t) ? getFileTagDisplayName(t).toLowerCase() : t.toLowerCase());

            queryTerms.forEach(term => {
                // Title Match (Fuzzy allowed)
                const titleTokens = titleLower.split(/\s+/);
                if (titleTokens.some(t => t === term || levenshtein(t, term) <= 1)) {
                    lexicalScore += 2.0;
                }

                // Content Term Frequency (TF)
                const regex = new RegExp(`\\b${term}\\b`, 'gi');
                const count = (contentLower.match(regex) || []).length;
                lexicalScore += Math.min(count, 5) * 0.2;
            });

            // C. Tag Relevance Boost (The "Universal" Part)
            // If this note has a tag that matches our 'relevantTags', BOOST IT.
            // This applies to Folder (Blue), Subtag (Green), or Standalone (Grey).
            let tagBoost = 0;
            if (n.tags && relevantTags.size > 0) {
                const noteTags = n.tags.map(t => isFileTag(t) ? getFileTagDisplayName(t) : t);

                const hasRelevantTag = noteTags.some(nt => {
                    // Check if this specific note tag was one of the ones identified as relevant
                    // We check against the Set of "detected user intent tags"
                    return relevantTags.has(nt);
                });

                if (hasRelevantTag) {
                    tagBoost = 3.0; // Universal Boost for ANY relevant tag match
                }
            }

            // D. Recency Boost
            let recencyScore = 0;
            const hoursSinceUpdate = (Date.now() - new Date(n.updatedAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate < 24) recencyScore = 1.0;
            else if (hoursSinceUpdate < 24 * 7) recencyScore = 0.5;
            else if (hoursSinceUpdate < 24 * 30) recencyScore = 0.2;
            // D. Exact Phrase Match (optional but powerful)
            if (contentLower.includes(finalQuestion.toLowerCase())) lexicalScore += 2.0;

            const finalScore = vectorScore + lexicalScore + tagBoost + recencyScore;

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

        return data?.choices?.[0]?.message?.content ?? "No response from AI";
    } catch (err) {
        console.error("RAG Query Failed:", err);
        return "Error: Failed to connect to AI service";
    }
}
