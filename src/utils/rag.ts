import { embedText } from "./embed";
import { cosineSimilarity } from "./similarity";
import { isFileTag, getFileTagDisplayName, Note } from "../types";
import { QUILLON_USER_MANUAL } from "./quillonManual";
import { buildEntityRegistry, EntityRegistry } from "./entityRegistry";
import { validateResponse, formatCitations } from "./contextValidator";
import { verifyContentLightweight, formatLightweightSources } from "./contentVerifier";
import { correctLocally } from "./selfCorrection";

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;

export async function ragQuery(
    question: string,
    allNotes: Note[],
    history: Array<{ role: 'user' | 'ai', content: string }> = [],
    options: { includePrivate: boolean } = { includePrivate: false }
) {
    // Normalize the question
    const normalizedQuestion = question.trim();
    // NOTE: We no longer short-circuit with personalized responses here.
    // The LLM (AI) will intelligently decide if it's conversational or note-related.

    // NOTE: Removed personality re-check. AI handles everything now.

    // SECURITY & SEPARATION:
    // SECURITY & SEPARATION:
    // User requested "Totally Separate" modes.
    // - Public Mode: See ONLY Public Notes.
    // - Private Mode: See ONLY Private Notes.
    const notes = allNotes.filter(n => options.includePrivate ? n.isPrivate : !n.isPrivate);
    // 1. Calculate Global Tag Structure and "State of Reality"
    // Fix: STRICT SEPARATION for Stats as well.
    // We filter active notes based on the SAME logic as the RAG context (Public only OR Private only).
    // We also exclude TRASH.
    const activeNotes = allNotes.filter(n => !n.isDeleted && (options.includePrivate ? n.isPrivate : !n.isPrivate));

    // Dynamic Stats Calculation
    const totalActiveNotes = activeNotes.length;
    let lastVaultUpdate = "Never";
    if (totalActiveNotes > 0) {
        const timestamps = activeNotes.map(n => new Date(n.updatedAt).getTime());
        const lastTs = Math.max(...timestamps);
        lastVaultUpdate = new Date(lastTs).toLocaleString();
    }

    // Build Entity Registry for validation
    const entityRegistry: EntityRegistry = buildEntityRegistry(activeNotes);

    // --- 0. PLANNER CORE (Deep Reasoning) ---
    // Instead of just rewriting, we break the query into steps for better retrieval.
    let searchQueries: string[] = [normalizedQuestion];

    // CRITICAL FIX: SHORT-CIRCUIT FOR SMALL VAULTS
    // If the user has very few notes (< 5), we DO NOT want to "hallucinate" hypothetical answers via the Planner.
    // We also don't need expansion. We can just search raw.
    // This prevents the AI from inventing "Meeting Notes" when only 1 note exists.
    const USE_COMPLEX_RAG = totalActiveNotes >= 5;

    // --- 0.5 SMART EXPANDER (The "Translator") ---
    // We run this IN PARALLEL with the Planner if possible.
    // Ideally, for "difficult" queries, we want expansion.

    // We'll init the Planner Promise
    let plannerPromise = Promise.resolve<string[]>([]);

    if (USE_COMPLEX_RAG && (history.length > 0 || normalizedQuestion.length > 10)) {
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
                           2. If the user asks "What is [X]" or mentions a specific name, include "[X]" as a search query to catch titles.
                           3. If complex (e.g. "Compare X and Y"), output ["X", "Y"] in queries.
                           4. If simple, Just output ["query"].`
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
    const expanderPromise = USE_COMPLEX_RAG ? expandQuery(normalizedQuestion) : Promise.resolve([]);

    // Await both
    const [plannedQueries, expandedQueries] = await Promise.all([plannerPromise, expanderPromise]);

    // Merge all queries: Original + Planned + Expanded
    const uniqueQueries = new Set<string>([normalizedQuestion, ...plannedQueries, ...expandedQueries]);
    searchQueries = Array.from(uniqueQueries);

    const blueFolders = new Set<string>();
    const greenTags = new Set<string>();
    const greyTags = new Set<string>();

    activeNotes.forEach(note => {
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
*** STATE OF REALITY (VAULT STATISTICS) ***
- **Total Notes in Vault**: ${totalActiveNotes}
- **Last Vault Update**: ${lastVaultUpdate}
- **Current Mode**: ${options.includePrivate ? "PRIVATE ONLY (Hidden Notes Visible)" : "PUBLIC ONLY (Hidden Notes Invisible)"}

*** GLOBAL TAG STRUCTURE ***
- **Folders (Blue)**: ${Array.from(blueFolders).map(f => `${f} (${activeNotes.filter(n => n.tags.includes(`file${f}`)).length})`).join(", ") || "None"}
- **Folder Tags (Green)**: ${Array.from(greenTags).join(", ") || "None"}
- **Standalone Tags (Grey)**: ${Array.from(greyTags).join(", ") || "None"}
`;

    // 1.5. RECENT ACTIVITY (Short-Term Memory)
    // We grab the last 5 modified notes to give the AI "temporal awareness".
    const recentNotes = [...notes]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map(n => `- [${new Date(n.updatedAt).toLocaleTimeString()}] **${n.title || "Untitled"}**: ${n.content?.substring(0, 50)}...`)
        .join("\n");

    const recentContext = `
*** RECENT ACTIVITY (SHORT-TERM MEMORY) ***
What the user was just working on:
${recentNotes}
*** END MEMORY ***
`;

    // 1.8. LONG-TERM MEMORY (The "Stacking" Upgrade)
    // We look for a special note tagged "#memory" or titled "Pownin Memory"
    const memoryNote = notes.find(n =>
        (n.title && n.title.toLowerCase().includes("pownin memory")) ||
        (n.tags && n.tags.some(t => t.toLowerCase() === "memory" || t.toLowerCase() === "pownin"))
    );
    const longTermMemoryContext = memoryNote ? `
*** LONG-TERM MEMORY (USER FACTS) ***
Trusted facts about the user (from note "${memoryNote.title}"):
${memoryNote.content}
*** END LONG-TERM MEMORY ***
` : "";

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
                if (hasRelevantTag) tagBoost = 8.0;
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
                if (ratio >= 0.8) lexicalScore += 25.0; // MASSIVE boost for near-perfect title matches
                else if (ratio >= 0.5) lexicalScore += 15.0;
                else if (matches >= 1) lexicalScore += 5.0;
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

    let finalNotesToProcess = [
        ...tier1Notes.map(r => ({ n: r.n, type: 'Direct Match' })),
        ...Array.from(linkedNotes.values()).map(n => ({ n, type: 'Linked Context' }))
    ];

    // --- SMART PAGINATION (The "Turn Page" Mechanic) ---
    // If the user asks for "more", "rest", or "next", we filter out notes we JUST talked about.
    const isPaginationRequest = /\b(more|rest|continue|next|others|other)\b/i.test(normalizedQuestion);
    let filteredCount = 0;

    if (isPaginationRequest && history.length > 0) {
        const lastMsg = history[history.length - 1];
        if (lastMsg.role === 'ai') {
            const lastContent = lastMsg.content.toLowerCase();
            const initialCount = finalNotesToProcess.length;

            finalNotesToProcess = finalNotesToProcess.filter(item => {
                const title = (item.n.title || "").toLowerCase();
                // If the Title was explicitly mentioned in the last answer, assume it's "Seen".
                // We keep it ONLY if it wasn't seen.
                return !(title.length > 2 && lastContent.includes(title));
            });
            filteredCount = initialCount - finalNotesToProcess.length;
        }
    }

    // Dynamic Context Construction
    const MAX_TOKENS = 4000; // REDUCED for Safety with 70b model
    let currentTokens = 0;
    let isTruncated = false;
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
            isTruncated = true;
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
Use them to provide a more complete answer, following the connections between notes.
${isTruncated ? `
*** TRUNCATION WARNING ***
The search results were too large and have been cut off to fit the model's memory. 
INSTRUCTION: IF (and ONLY IF) the missing context prevents you from giving a complete answer to a complex question, append this note at the end:
"\n\n> ⚠️ **Note**: *I found a lot of information, but some notes were skipped to keep the answer short. If you need more details, try asking a more specific question.*"
If the user's question is simple (like a greeting) or fully answered by the visible context, DO NOT include this note.` : ""}
${filteredCount > 0 ? `
*** PAGINATION ACTIVE ***
User asked for "More/Rest". I have REMOVED ${filteredCount} notes that were likely already discussed.
The notes below are "Page 2" (Fresh Results). Focus on answering with THESE new notes.` : ""}
`;

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
7
*** CORE IDENTITY & DEFINITIONS (ABSOLUTE TRUTH) ***
- **WHO YOU ARE**: You are Pownin, the AI assistant for **Quillon**.
- **WHAT IS QUILLON**: "Quillon" refers **EXCLUSIVELY** to this note-taking application.
- **NEGATIVE CONSTRAINTS**: "Quillon" is NOT a sword part, NOT an architectural feature, and NOT a French surname in this context. If the user asks about "Quillon", they mean THIS APP.
- **YOUR GOAL**: Toggle intelligently between User Notes and App Knowledge.

${recentContext}
${longTermMemoryContext}

*** HIERARCHY OF TRUTH (FOLLOW STRICTLY) ***
1. **USER NOTES (ABSOLUTE FIRST PRIORITY)**: ALWAYS check the notes context below. If the answer exists in notes, USE IT. Override everything else.
2. **CONVERSATIONAL INTELLIGENCE (Second Priority)**: If the question is purely conversational (greeting, farewell, thanks, casual chat) AND no notes are relevant, respond naturally like a friendly assistant.
   - Greetings (hi, hello, hey, yo, sup, wsg) → Respond warmly
   - Farewells (bye, later, yup later, k bye, ttyl, peace) → Say goodbye nicely
   - Thanks (thanks, thx, ty, tysm) → You're welcome!
   - Affirmations (yep, yup, ok, cool, bet, aight) → Acknowledge casually
   - Negations (nope, nah, im good) → Accept gracefully
   - Humor/Reactions (lol, haha, wow) → Respond playfully
3. **APP KNOWLEDGE BASE (Third Priority)**: If no notes exist AND it's about Quillon/the app, use the manual below.
4. **GENERAL KNOWLEDGE (Fourth Priority)**: Only use for questions unrelated to app/notes (e.g., "capital of France").
5. **NOT FOUND (Last Resort)**: If user asks for specific personal data that doesn't exist in notes, say: "I couldn't find that in your notes. Try adding a note about this!"

*** APP KNOWLEDGE BASE (MANUAL) ***
${QUILLON_USER_MANUAL}
*** END KNOWLEDGE BASE ***

Relevant Notes (Top Matches):
${context}

Instructions:
1. **Analyze the Request**: 
   - Is it about the **User's Data**? (e.g. "my ideas", "next feature", "A1 link") -> **TARGET: NOTES**
   - Is it about the **App Itself**? (e.g. "what is Quillon?", "how to tag") -> **TARGET: MANUAL + NOTES** (Check if user notes have custom info, otherwise use Manual).
   - Is it **General Knowledge**? (e.g. "capital of France", "what is AI") -> **TARGET: GENERAL KNOWLEDGE**
   - Is it **Casual Conversation**? (e.g. greetings, farewells, affirmations) -> **TARGET: CONVERSATIONAL**

2. **Smart Execution (The Toggle)**: 
   - **Step 1**: Look at "Relevant Notes". Do they answer the question?
     - **YES**: Answer using the notes. Blend in Manual info ONLY if it helps explain the note.
     - **NO (Notes Not Found)**: 
       - Is the question about Quillon/App features? -> Answer from the **APP KNOWLEDGE BASE**.
       - Is the question seeking specific personal data (e.g. "what's my password", "my meeting notes")? -> **SAY**: "I couldn't find any notes about that. Try adding a note with this info, or rephrase your question!"
       - Is the question general knowledge? -> Answer from your general knowledge confidently.

3. **Anti-Hallucination (CRITICAL)**:
   - If asking "What is Quillon", DEFINITELY use the Manual's definition ("Lightweight note app..."). DO NOT talk about swords.
   - If asking about a specific note title (e.g. "A1"), and you see it in the context, output its content.
   - **If no relevant notes exist for a personal data question, SAY SO.** Never invent information. Say: "I couldn't find that in your notes."

4. **Slang & Casual Language Understanding (SUPER IMPORTANT)**:
   - Users often use informal language, slangs, and abbreviations.
   - **EXAMPLES TO UNDERSTAND NATURALLY**:
     - "yup later" / "k bye" / "ttyl" = **Farewell** (respond with goodbye)
     - "yep" / "nah" / "aight" / "bet" = **Affirmation/Acknowledgement** (respond casually)
     - "wsg" = "what's good" (greeting), "wyd" = "what you doing"
     - "lol" / "lmao" / "haha" = **Laughter** (respond playfully)
   - **DO NOT over-analyze casual messages**. If someone says "yup later", they are saying goodbye, NOT asking you to explain what "later" means!

5. **Tone & Style**:
   - Be "Human-Like": Natural, confident, helpful, and conversational.
   - **NO ROBOTIC PREAMBLES**: Never start with "Based on...", "The text says...". Just answer.
   - **Match the User's Energy**: If they're casual ("yo whats up"), be casual back. If they're formal, be professional.
   - **Example**: "Quillon is your speed-focused note app. By the way, I found a note where you mentioned..."

6. **Conflict Resolution (The Genius)**:
   - If User Notes contradict each other, prefer the one with the **LATER DATE** (check "Last Updated").
   - Explicitly mention the conflict: "I found two plans, but since 'Plan B' is newer (updated today), I'm assuming that's the current one."

7. **Advanced Reasoning Modules (The Stacking Upgrade)**:
   - **THE CLARIFIER (Ambiguity Handler)**: If the user asks a vague question (e.g. "How is the project?") and you see multiple distinct projects (e.g. note "Project A" and note "Project B"), DO NOT guess. Instead, say: "I see notes for both **Project A** and **Project B**. Which one would you like an update on?"
   - **THE CRITIC (Gap Analysis)**: If the user asks to "Review", "Critique", or "Check" a note, do not just summarize it. Actively look for MISSING information. 
     - *Example*: "The plan looks good, but I noticed you haven't listed a **Deadline** or **Budget** yet. You might want to add those."
   - **THE CONNECTOR (Hidden Link Detector)**: If you answer a question using Note A, but you see that Note B is also relevant (e.g. shares a tag or keyword), EXPLICITLY mention it.
     - *Example*: "I found the answer in **Project Alpha**. By the way, **Project Beta** also mentions similar 'API Keys' if you want to check that."
   - **THE ACTION AGENT (Task Extractor)**: If you see uncompleted tasks (e.g. "TODO", "FIXME", or "[ ]") inside the notes, weave them directly into your main answer using bullet points.
     - **CRITICAL**: Do NOT create a separate "Detected Tasks" section at the end. Do NOT repeat the list. Just include the actionable items naturally in your main response.
     - *Format*: "I found these tasks for you:\n- [ ] Task 1 (Context)\n- [ ] Task 2..."

8. **Conciseness (Anti-Yapping)**:
   - Do NOT summarize your own answer. Say it once clearly.
   - Do NOT say "To summarize..." or "In conclusion...".
   - If the main answer covers it, stop.

8. **Current Date & Time**: It is currently ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}.
9. **Confidence**: Don't apologize for being an AI. Don't say "As an AI...". Confidently state what you find or know.
10. **Literalness**: If a link or key is in the notes, provide it accurately. `
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

        // --- 4.5. SELF-CORRECTING VALIDATION LAYER ---
        // Validate and AUTO-CORRECT instead of rejecting!
        try {
            const validationResult = await validateResponse({
                query: normalizedQuestion,
                response: initialAnswer,
                context: finalNotesToProcess.map(item => item.n),
                entityRegistry
            });

            const contentVerification = await verifyContentLightweight({
                response: initialAnswer,
                context: finalNotesToProcess.map(item => item.n)
            });

            // Check if we need to self-correct
            const criticalIssues = validationResult.issues.filter(i => i.severity === 'critical');
            const needsCorrection =
                criticalIssues.length > 0 ||
                (!contentVerification.isAccurate && contentVerification.confidence < 0.6);

            if (needsCorrection) {
                // LOCAL CORRECTION - No API calls!
                console.log('🔧 Correcting locally...');

                const correctionResult = correctLocally(
                    initialAnswer,
                    validationResult,
                    finalNotesToProcess.map(item => item.n),
                    entityRegistry
                );

                // Use corrected answer
                const finalAnswer = correctionResult.correctedAnswer;

                // Log corrections made
                if (correctionResult.wasCorrected) {
                    console.log('✅ Corrections:', correctionResult.corrections);
                }

                // Add sources if available
                if (validationResult.citations.length > 0) {
                    const citations = formatCitations(validationResult.citations);
                    return finalAnswer + citations;
                }

                return finalAnswer;
            }

            // If validation passed, optionally add citations
            if (validationResult.citations.length > 0 && validationResult.confidence > 0.7) {
                const citations = formatCitations(validationResult.citations);
                if (normalizedQuestion.length > 20 && !initialAnswer.includes('**Sources:**')) {
                    return initialAnswer + citations;
                }
            }

            // Add content sources if available
            if (contentVerification.matchedNotes.length > 0 && contentVerification.confidence >= 0.7) {
                const sources = formatLightweightSources(contentVerification.matchedNotes);
                if (normalizedQuestion.length > 20 && !initialAnswer.includes('**Sources')) {
                    return initialAnswer + sources;
                }
            }

        } catch (validationError) {
            console.warn('Validation failed, proceeding with unvalidated response:', validationError);
            // Continue with original response if validation fails
        }

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
        `ID: ${i}\nTitle: ${n.title || "NO_TITLE"}\nContent Snippet: ${(n.content || "").substring(0, 600)}...`
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
                    - **TITLE OVERLAP**: If the query shares words with a note's TITLE, that note is extremely likely to be the one the user wants. Prioritize title matches even if the snippet is short.
                    - If a note looks like a "messy thought", a "key list", or a "link collection", SELECT IT.
                    - Technical strings (keys, long tokens, URLs) are highly relevant if the user query contains technical acronyms (API, GSK, KEY, URL).
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
