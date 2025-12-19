import { getNotes } from "./storage";
import { embedText } from "./embed";
import { cosineSimilarity } from "./similarity";
import { isFileTag, getFileTagDisplayName, Note } from "../types";
import { getPersonalizedResponse } from "./personalizedResponses";
import { QUILLON_USER_MANUAL } from "./quillonManual";

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

    // --- 0.5 SMART EXPANDER (The "Translator") ---
    // We run this IN PARALLEL with the Planner if possible.
    // Ideally, for "difficult" queries, we want expansion.

    // We'll init the Planner Promise
    let plannerPromise = Promise.resolve<string[]>([]);

    if (history.length > 0 || normalizedQuestion.length > 10) {
        plannerPromise = (async () => {
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
                        ...history.slice(0, -1).slice(-3).map(m => ({
                            role: m.role === 'ai' ? 'assistant' : 'user',
                            content: m.content
                        })),
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
                            const parsed = JSON.parse(planRaw);
                            let queries = [];
                            if (Array.isArray(parsed)) {
                                queries = parsed;
                            } else if (parsed.queries && Array.isArray(parsed.queries)) {
                                queries = parsed.queries;
                            }

                            if (parsed.hypothetical_answer) {
                                queries.push(parsed.hypothetical_answer);
                            }
                            return queries;
                        } catch (e) {
                            return [planRaw.replace(/[\[\]"]/g, '')];
                        }
                    }
                }
            } catch (e) {
                console.warn("Planner failed", e);
            }
            return [];
        })();
    }

    // Run Expander Function (New Feature)
    // This handles "messy" queries like "tht note abt mtg" -> "meeting note"
    const expanderPromise = expandQuery(normalizedQuestion);

    // Await both
    const [plannedQueries, expandedQueries] = await Promise.all([plannerPromise, expanderPromise]);

    // Merge all queries: Original + Planned + Expanded
    const uniqueQueries = new Set<string>([normalizedQuestion, ...plannedQueries, ...expandedQueries]);
    searchQueries = Array.from(uniqueQueries);

    // --- 0.5. RE-CHECK PERSONALITY FOR FIRST STEP ---
    if (searchQueries.length > 0 && searchQueries[0] !== normalizedQuestion) {
        const contextResponse = getPersonalizedResponse(searchQueries[0]);
        if (contextResponse) return contextResponse;
    }

    const allNotes = getNotes();
    // SECURITY: Filter out Private notes UNLESS explicitly allowed by the caller
    const notes = allNotes.filter(n => !n.isPrivate || (n.isPrivate && options.includePrivate));
    if (!notes || notes.length === 0) return "No notes found.";

    // 1. Calculate Global Tag Structure
    const blueFolders = new Set<string>();
    const greenTags = new Set<string>();
    const greyTags = new Set<string>();

    notes.forEach(note => {
        const hasFileTag = note.tags.some(t => isFileTag(t));
        note.tags.forEach(t => {
            if (isFileTag(t)) {
                blueFolders.add(getFileTagDisplayName(t));
            } else if (hasFileTag) {
                greenTags.add(t);
            } else {
                greyTags.add(t);
            }
        });
    });

    const globalTagContext = `
Global Tag Structure:
- **Folders (Blue)**: ${Array.from(blueFolders).join(", ") || "None"}
- **Folder Tags (Green)**: ${Array.from(greenTags).join(", ") || "None"}
- **Standalone Tags (Grey)**: ${Array.from(greyTags).join(", ") || "None"}
`;

    // 2. Identify which tags are "Green"
    const tagsInFileFolders = new Set<string>();
    notes.forEach(note => {
        const hasFileTag = note.tags.some(t => isFileTag(t));
        if (hasFileTag) {
            note.tags.forEach(t => {
                if (!isFileTag(t)) tagsInFileFolders.add(t);
            });
        }
    });

    // --- UNIVERSAL HYBRID SEARCH ALGORITHM ---

    // Helper: Levenshtein Distance
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

    const finalQuestion = searchQueries.join(" / ");
    const queryEmbeds = searchQueries.map(q => embedText(q));

    const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'tell', 'me', 'about', 'show', 'list', 'what', 'where', 'when', 'who', 'how']);

    const allQueryTerms = new Set<string>();
    searchQueries.forEach(q => {
        q.toLowerCase()
            .replace(/[?.,!]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.has(w))
            .forEach(w => allQueryTerms.add(w));
    });
    const queryTerms = Array.from(allQueryTerms);

    // 2. Universal Tag Matching
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
    let ranked = notes
        .map(n => {
            // A. Vector Score
            const tagText = n.tags ? n.tags.map(t => isFileTag(t) ? `${t} ${getFileTagDisplayName(t)}` : t).join(" ") : "";
            const baseText = `${n.title || ""} ${n.content || ""} ${tagText}`;
            const noteEmbed = n.embedding || embedText(baseText);
            const vectorScore = Math.max(...queryEmbeds.map(qEmb => cosineSimilarity(qEmb, noteEmbed)));

            // B. Lexical Score
            let lexicalScore = 0;
            const titleLower = (n.title || "").toLowerCase();
            const contentLower = (n.content || "").toLowerCase();
            const titleTokens = titleLower.split(/\s+/);

            queryTerms.forEach(term => {
                // Title Match
                if (titleTokens.some(t => t === term || levenshtein(t, term) <= 1)) {
                    lexicalScore += 2.0;
                }
                // Content TF
                const regex = new RegExp(`\\b${term}\\b`, 'gi');
                const count = (contentLower.match(regex) || []).length;
                lexicalScore += Math.min(count, 5) * 0.2;
            });

            // C. Tag Boost
            let tagBoost = 0;
            if (n.tags && relevantTags.size > 0) {
                const noteTags = n.tags.map(t => isFileTag(t) ? getFileTagDisplayName(t) : t);
                const hasRelevantTag = noteTags.some(nt => relevantTags.has(nt));
                if (hasRelevantTag) tagBoost = 3.0;
            }

            // D. Recency
            let recencyScore = 0;
            const hoursSinceUpdate = (Date.now() - new Date(n.updatedAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate < 24) recencyScore = 1.0;
            else if (hoursSinceUpdate < 24 * 7) recencyScore = 0.5;
            else if (hoursSinceUpdate < 24 * 30) recencyScore = 0.2;

            // E. KEYWORD SNIPER (Title Overlap)
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

            // F. Exact Phrase
            const hasExactMatch = searchQueries.some(q => contentLower.includes(q.toLowerCase()));
            if (hasExactMatch) lexicalScore += 4.0;

            const finalScore = vectorScore * 10 + lexicalScore + tagBoost + recencyScore;
            return { n, score: finalScore, debug: { vectorScore, lexicalScore, tagBoost, recencyScore } };
        })
        .sort((a, b) => b.score - a.score);

    // --- 3.5. ORACLE RERANKER (The "Judge") ---
    // This is the new Critical Layer for "Messy Notes".
    // We take the top 15 candidates and ask the AI to pick the winners based on content.
    // This fixes cases where "Equation for X" is in the content but the title is "Quick Note 5".

    // We only rerun if we have enough candidates
    if (ranked.length > 0) {
        const topCandidates = ranked.slice(0, 15).map(r => r.n);
        const rerankedNotes = await rerankNotes(normalizedQuestion, topCandidates);

        // We promote the reranked notes to the top of the list, preserving their internal order from the reranker
        // We then append the rest of the original ranked list (deduplicated)
        const rerankedIds = new Set(rerankedNotes.map(rn => rn.id));

        // Re-construct ranked list: Leaders (Reranked) + Followers (Original high scorers that weren't picked but might be relevant context)
        const leaders = rerankedNotes.map(n => {
            // Find prompt original score to restore debug info, but boost main score
            const original = ranked.find(r => r.n.id === n.id);
            return {
                n,
                score: 999,
                debug: original?.debug ?? { vectorScore: 0, lexicalScore: 0, tagBoost: 0, recencyScore: 0 }
            };
        });
        const followers = ranked.filter(r => !rerankedIds.has(r.n.id));

        ranked = [...leaders, ...followers];
    }

    // --- 4. CONTEXT CHAINING (Graph Brain) ---
    const tier1Notes = ranked.slice(0, 10);
    const linkedNotes = new Map<string, Note>();
    const titleMap = new Map<string, Note>();
    notes.forEach(n => {
        if (n.title && n.title.length >= 3) {
            titleMap.set(n.title.toLowerCase(), n);
        }
    });

    tier1Notes.forEach(r => {
        const contentLower = (r.n.content || "").toLowerCase();
        titleMap.forEach((targetNote, targetTitle) => {
            if (targetNote.id === r.n.id) return;
            if (contentLower.includes(targetTitle)) {
                const isAlreadyInTier1 = tier1Notes.some(t1 => t1.n.id === targetNote.id);
                if (!isAlreadyInTier1) {
                    linkedNotes.set(targetNote.id, targetNote);
                }
            }
        });
    });

    const finalNotesToProcess = [
        ...tier1Notes.map(r => ({ n: r.n, type: 'Direct Match' })),
        ...Array.from(linkedNotes.values()).map(n => ({ n, type: 'Linked Context' }))
    ];

    // Dynamic Context Construction
    const MAX_TOKENS = 4000; // Increased
    let currentTokens = 0;
    const selectedNotes: string[] = [];
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);

    for (const item of finalNotesToProcess) {
        const richTags = item.n.tags ? item.n.tags.map(t => {
            if (isFileTag(t)) return `${getFileTagDisplayName(t)} (Blue Folder)`;
            if (tagsInFileFolders.has(t)) return `${t} (Green Tag)`;
            return `${t} (Grey Tag)`;
        }).join(", ") : "None";

        const noteEntry = `[${item.type}]\nTitle: ${item.n.title || "Untitled"}\nLast Updated: ${new Date(item.n.updatedAt).toLocaleString()}\nTags: ${richTags}\nContent: ${item.n.content}`;
        const noteTokens = estimateTokens(noteEntry);

        if (currentTokens + noteTokens > MAX_TOKENS) {
            if (selectedNotes.length === 0) {
                const allowedChars = MAX_TOKENS * 4;
                selectedNotes.push(noteEntry.substring(0, allowedChars) + "\n... (truncated)");
            }
            break;
        }
        selectedNotes.push(noteEntry);
        currentTokens += noteTokens;
        if (selectedNotes.length >= 15) break;
    }

    const context = selectedNotes.join("\n\n");

    const systemPromptExtras = `
Notes labeled [Linked Context] were automatically retrieved because they are mentioned in the Direct Match notes. 
Use them to provide a more complete answer, following the connections between notes.`;

    const historyMessages = history.slice(0, -1).slice(-6).map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
    }));

    const body = {
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system", content: `You are Pownin, an intelligent AI assistant developed by Quillon.
You are now powered by Smart RAG 2.0.

${globalTagContext}

${systemPromptExtras}

*** APP KNOWLEDGE BASE (HOW TO USE QUILLON) ***
${QUILLON_USER_MANUAL}
*** END KNOWLEDGE BASE ***

Relevant Notes (Top Matches):
${context}

Instructions:
1. **Analyze the Request**: Determine if the user is asking a General Question (jokes, small talk, general knowledge) or a Context Question (about their notes, work, or specific topics found in the "Relevant Notes").
2. **Smart Context Usage**: 
   - **IF** the user's query relates to the content of the provided notes, **USE THE NOTES** to answer in detail.
   - **IF** the user is just chatting, asking for a joke, or asking a question unrelated to the notes, **IGNORE THE NOTES** and answer from your general knowledge. DO NOT mention "I don't see that in your notes" for casual queries.
   - **IF** the query is ambiguous (e.g., "What is it?"), assume it refers to the most relevant note context.
3. **Tone**: Be casual, friendly, and concise. Talk like a helpful teammate, not a robot.
4. **Formatting**: Use Markdown for readability.
5. **Current Date & Time**: It is currently ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}.
6. **Handling Personal Questions**: If asked about time/date, just state it. DO NOT say "I don't have real-time access" or "I've been instructed". Act like you have a clock.
7. **Handling Follow-ups**: If the user asks "Really?" or expresses doubt, DO NOT apologize or say "I am an AI". Instead, confidently re-affirm your answer or check your context again. Trust your previous knowledge.`
            },
            ...historyMessages,
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

        // --- 5. REFLECTION CORE (The Mirror) ---
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
                    if (critique.score < 85) {
                        const rewriteBody = {
                            model: "llama-3.3-70b-versatile",
                            messages: [
                                {
                                    role: "system",
                                    content: `You are Pownin. The previous answer was not good enough.
                                    Critique: ${critique.critique}
                                    
                                    Rewrite the answer to be perfect. Use the same Context.`
                                },
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

// --- HELPER FUNCTIONS (Smart RAG) ---

async function expandQuery(originalQuery: string): Promise<string[]> {
    if (!GROQ_KEY) return [];
    try {
        const body = {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are a Search Query Expander.
                    Goal: Generate 3 variations of the user's query to catch "messy" notes.
                    Rules:
                    1. Fix typos (e.g., "mtg" -> "meeting").
                    2. Add synonyms (e.g., "car" -> "vehicle", "auto").
                    3. Output specific keywords.
                    Output: JSON { "queries": string[] }`
                },
                { role: "user", content: originalQuery }
            ],
            response_format: { type: "json_object" }
        };
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        return parsed.queries || [];
    } catch (e) {
        // console.warn("Expansion failed", e);
        return [];
    }
}

async function rerankNotes(query: string, candidates: Note[]): Promise<Note[]> {
    if (!GROQ_KEY || candidates.length === 0) return candidates;

    // We create a simplified list for the LLM to judge
    const candidateText = candidates.map((n, i) =>
        `ID: ${i}\nTitle: ${n.title || "NO_TITLE"}\nContent Snippet: ${(n.content || "").substring(0, 150)}...`
    ).join("\n\n");

    try {
        const body = {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are the ORACLE Reranker.
                    Goal: Select the notes that are MOST relevant to the User's Query.
                    Input: A list of numbered notes.
                    Output: JSON { "relevant_ids": number[] } (Indices of the best notes, in order of relevance).
                    
                    CRITICAL:
                    - IGNORE bad titles. Populated "Content Snippet" is what matters.
                    - If a note looks like a "messy thought" but matches the topic, SELECT IT.
                    - Be strict: only select if it actually seems related.`
                },
                { role: "user", content: `Query: ${query}\n\nCandidates:\n${candidateText}` }
            ],
            response_format: { type: "json_object" }
        };

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        const relevantIndices: number[] = parsed.relevant_ids || [];

        return relevantIndices.map(idx => candidates[idx]).filter(n => n !== undefined);
    } catch (e) {
        // console.warn("Reranking failed", e);
        return candidates; // Fallback to original order
    }
}
