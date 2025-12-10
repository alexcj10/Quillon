import { getNotes } from "./storage";
import { embedText } from "./embed";
import { cosineSimilarity } from "./similarity";
import { isFileTag, getFileTagDisplayName } from "../types";
import { getPersonalizedResponse } from "./personalizedResponses";

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;

export async function ragQuery(question: string) {
    // Check for personalized responses first (greetings, identity questions)
    const personalizedResponse = getPersonalizedResponse(question);
    if (personalizedResponse) {
        return personalizedResponse;
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
    const qEmbed = embedText(question);

    const ranked = notes
        .map(n => {
            // Consistent embedding text logic
            // We rely on n.embedding being up to date from initializeEmbeddings/NoteContext
            // But if we fallback, we must match the logic:
            const tagText = n.tags ? n.tags.map(t => isFileTag(t) ? `${t} ${getFileTagDisplayName(t)}` : t).join(" ") : "";
            const baseText = `${n.title || ""} ${n.content || ""} ${tagText}`;

            const noteEmbed = n.embedding || embedText(baseText);
            let score = cosineSimilarity(qEmbed, noteEmbed);

            // KEYWORD BOOSTING:
            // If the user's question explicitly mentions a tag/folder name, boost this note.
            // This fixes the issue where short queries ("J") don't match long notes semantically.
            if (n.tags) {
                for (const t of n.tags) {
                    const displayName = isFileTag(t) ? getFileTagDisplayName(t) : t;
                    // Robust check: word boundary, case insensitive
                    // e.g. "J" matches "j" but "Java" does not match "J"
                    // Escape special regex chars in displayName just in case
                    const escapedName = displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`\\b${escapedName}\\b`, 'i');

                    if (regex.test(question)) {
                        // Massive boost to ensure it enters the context window
                        // console.log(`[RAG] Boosting note "${n.title}" due to tag match "${displayName}"`);
                        score += 10.0;
                        break; // Only boost once per note
                    }
                }
            }

            return { n, score };
        })
        .sort((a, b) => b.score - a.score)
    // Dynamic Context Construction with Token Limit
    const MAX_TOKENS = 3000; // Safe limit for Groq's 12k TPM (allows ~3-4 requests/min)
    let currentTokens = 0;
    const selectedNotes: string[] = [];

    // Estimate tokens (rough approximation: 4 chars ~= 1 token)
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);

    for (const r of ranked) {
        const richTags = r.n.tags ? r.n.tags.map(t => {
            if (isFileTag(t)) return `${getFileTagDisplayName(t)} (Blue Folder)`;
            if (tagsInFileFolders.has(t)) return `${t} (Green Tag)`;
            return `${t} (Grey Tag)`;
        }).join(", ") : "None";

        const noteEntry = `Title: ${r.n.title}\nLast Updated: ${new Date(r.n.updatedAt).toLocaleString()}\nTags: ${richTags}\nContent: ${r.n.content}`;
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

        if (selectedNotes.length >= 10) break; // Hard limit on note count
    }

    const context = selectedNotes.join("\n\n");

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

When answering about notes, be specific about which folder (Blue) or tag (Green/Grey) they belong to.
Be helpful, friendly, and conversational. If asked about your identity, remember you are Pownin, created by Quillon.

Relevant Notes:
${context}`
            },
            { role: "user", content: question }
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
