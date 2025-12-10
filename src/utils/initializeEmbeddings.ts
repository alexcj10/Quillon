import { Note, isFileTag, getFileTagDisplayName } from "../types";
import { embedText } from "./embed";

export function initializeEmbeddings(notes: Note[]): { changed: boolean; notes: Note[] } {
    let changed = false;
    const updated = notes.map(n => {
        // We behave as if we always need to update to ensure latest embedding logic is applied
        // (e.g. including file tag display names)
        const tagText = n.tags ? n.tags.map(t => isFileTag(t) ? `${t} ${getFileTagDisplayName(t)}` : t).join(" ") : "";
        const text = `${n.title || ""} ${n.content || ""} ${tagText}`;

        const newEmbedding = embedText(text);

        // Simple check to avoid unnecessary state updates if embedding hasn't changed effectively
        // But since we can't easily compare arrays efficiently here without loop, we'll just assume true
        // or arguably only if !n.embedding or string changed. 
        // For safety/reliablity after this code change, let's just update.

        const newNote = { ...n, embedding: newEmbedding };
        changed = true;
        return newNote;
    });
    return { changed, notes: updated };
}
