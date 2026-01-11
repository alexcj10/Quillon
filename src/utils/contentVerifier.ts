import { Note } from '../types/index';
import { embedText } from './embed';
import { cosineSimilarity } from './similarity';

/**
 * Lightweight Content Verifier - Zero API calls!
 * Uses embeddings and semantic similarity for content validation
 */

export interface LightweightVerificationResult {
    isAccurate: boolean;
    confidence: number; // 0-1
    matchedNotes: MatchedNote[];
    issues: string[];
}

export interface MatchedNote {
    noteId: string;
    noteTitle: string;
    similarity: number;
    snippet: string;
}

/**
 * Calculate semantic similarity between AI response and note content
 * Uses existing embeddings - NO API CALLS!
 */
function calculateSemanticSimilarity(
    responseEmbedding: number[],
    noteEmbedding: number[]
): number {
    return cosineSimilarity(responseEmbedding, noteEmbedding);
}

/**
 * Extract key sentences from text for snippet matching
 */
function extractKeySentences(text: string): string[] {
    // Split by sentence endings
    const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10); // Filter out very short sentences

    return sentences;
}

/**
 * Check if response contains information not in any note
 * Uses n-gram matching for hallucination detection
 */
function detectHallucinations(response: string, notes: Note[]): string[] {
    const hallucinations: string[] = [];

    // Extract key phrases from response (3-5 word chunks)
    const responseSentences = extractKeySentences(response);

    // Combine all note content
    const allNoteContent = notes.map(n => `${n.title} ${n.content}`).join(' ').toLowerCase();

    for (const sentence of responseSentences) {
        const words = sentence.toLowerCase().split(/\s+/).filter(w => w.length > 3);

        // Skip if sentence is too short
        if (words.length < 3) continue;

        // Check if any significant 3-word phrase from sentence exists in notes
        let foundMatch = false;
        for (let i = 0; i <= words.length - 3; i++) {
            const phrase = words.slice(i, i + 3).join(' ');
            if (allNoteContent.includes(phrase)) {
                foundMatch = true;
                break;
            }
        }

        // If no 3-word phrase matched, might be hallucination
        if (!foundMatch && words.length >= 5) {
            // Double-check with individual important words
            const importantWords = words.filter(w =>
                !['the', 'and', 'for', 'with', 'you', 'your', 'have', 'this', 'that', 'will', 'can'].includes(w)
            );

            const wordMatchCount = importantWords.filter(w => allNoteContent.includes(w)).length;
            const wordMatchRatio = wordMatchCount / importantWords.length;

            // If less than 50% of important words found, likely hallucination
            if (wordMatchRatio < 0.5) {
                hallucinations.push(sentence);
            }
        }
    }

    return hallucinations;
}

/**
 * Verify content using embeddings and semantic similarity
 * NO API CALLS - uses existing note embeddings!
 */
export async function verifyContentLightweight(params: {
    response: string;
    context: Note[];
}): Promise<LightweightVerificationResult> {
    const { response, context } = params;

    const issues: string[] = [];
    const matchedNotes: MatchedNote[] = [];

    // Step 1: Generate embedding for AI response
    const responseEmbedding = embedText(response);

    // Step 2: Calculate similarity with each note
    const similarities: Array<{ note: Note; similarity: number }> = [];

    for (const note of context) {
        // Use existing embedding or generate new one
        const noteText = `${note.title} ${note.content}`;
        const noteEmbedding = note.embedding || embedText(noteText);

        const similarity = calculateSemanticSimilarity(responseEmbedding, noteEmbedding);
        similarities.push({ note, similarity });
    }

    // Sort by similarity (highest first)
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Step 3: Check if response is well-supported by notes
    const topSimilarity = similarities[0]?.similarity || 0;

    // If top similarity is high, response is likely accurate
    if (topSimilarity >= 0.7) {
        // Extract snippet from best matching note
        const bestNote = similarities[0].note;
        const sentences = extractKeySentences(bestNote.content);
        const snippet = sentences[0] || bestNote.content.substring(0, 100);

        matchedNotes.push({
            noteId: bestNote.id,
            noteTitle: bestNote.title,
            similarity: topSimilarity,
            snippet
        });
    }

    // Add all notes with similarity > 0.6
    for (const { note, similarity } of similarities) {
        if (similarity >= 0.6 && !matchedNotes.find(m => m.noteId === note.id)) {
            const sentences = extractKeySentences(note.content);
            const snippet = sentences[0] || note.content.substring(0, 100);

            matchedNotes.push({
                noteId: note.id,
                noteTitle: note.title,
                similarity,
                snippet
            });
        }
    }

    // Step 4: Detect potential hallucinations
    const hallucinations = detectHallucinations(response, context);

    if (hallucinations.length > 0) {
        issues.push(`Potential hallucinations detected: ${hallucinations.length} sentences may not be supported by your notes`);
    }

    // Step 5: Calculate overall confidence
    let confidence = topSimilarity;

    // Penalize if hallucinations detected
    if (hallucinations.length > 0) {
        const hallucinationPenalty = Math.min(0.3, hallucinations.length * 0.1);
        confidence = Math.max(0, confidence - hallucinationPenalty);
    }

    // Boost if multiple notes support the response
    if (matchedNotes.length > 1) {
        const avgSimilarity = matchedNotes.reduce((sum, m) => sum + m.similarity, 0) / matchedNotes.length;
        confidence = Math.min(1.0, (confidence + avgSimilarity) / 2);
    }

    // Step 6: Determine if accurate
    const isAccurate = confidence >= 0.65 && hallucinations.length === 0;

    return {
        isAccurate,
        confidence,
        matchedNotes,
        issues
    };
}

/**
 * Generate feedback for low-confidence responses
 */
export function generateLightweightFeedback(result: LightweightVerificationResult): string {
    if (result.isAccurate) {
        return ''; // No feedback needed
    }

    let feedback = "I'm not fully confident in my answer. ";

    if (result.confidence < 0.5) {
        feedback += "The response doesn't closely match your notes. ";
    } else if (result.confidence < 0.65) {
        feedback += "The response partially matches your notes but may have some inaccuracies. ";
    }

    if (result.issues.length > 0) {
        feedback += "\n\n" + result.issues.join('\n');
    }

    feedback += `\n\nConfidence: ${(result.confidence * 100).toFixed(0)}%`;
    feedback += "\n\nCould you rephrase your question or provide more details?";

    return feedback;
}

/**
 * Format matched notes as sources
 */
export function formatLightweightSources(matches: MatchedNote[]): string {
    if (matches.length === 0) return '';

    let sources = '\n\n**Sources:**\n';
    matches
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3) // Top 3 matches
        .forEach(match => {
            const confidence = (match.similarity * 100).toFixed(0);
            sources += `- **${match.noteTitle}** (${confidence}% match)\n`;
        });

    return sources;
}
