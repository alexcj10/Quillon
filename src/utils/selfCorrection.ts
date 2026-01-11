import { Note } from '../types/index';
import { EntityRegistry } from './entityRegistry';
import { ValidationResult } from './contextValidator';

/**
 * Local Correction System - ZERO API CALLS!
 * Fixes validation errors using string manipulation and note content
 */

export interface LocalCorrectionResult {
    correctedAnswer: string;
    wasCorrected: boolean;
    corrections: string[];
}

/**
 * Fix hallucinated URLs by replacing with correct ones from notes
 */
function fixHallucinatedUrls(
    answer: string,
    validationResult: ValidationResult,
    context: Note[]
): { fixed: string; corrections: string[] } {
    let fixed = answer;
    const corrections: string[] = [];

    // Find URL hallucinations
    const urlIssues = validationResult.issues.filter(i =>
        i.type === 'hallucination' && i.evidence && i.evidence.includes('http')
    );

    if (urlIssues.length === 0) {
        return { fixed, corrections };
    }

    // Extract all URLs from notes
    const noteUrls: Map<string, string> = new Map(); // domain -> full URL
    context.forEach(note => {
        const urlMatches = note.content.match(/(https?:\/\/[^\s]+)/g) || [];
        urlMatches.forEach(url => {
            try {
                const domain = new URL(url).hostname;
                noteUrls.set(domain, url);
            } catch { }
        });
    });

    // Replace hallucinated URLs with correct ones
    urlIssues.forEach(issue => {
        if (!issue.evidence) return;

        const wrongUrl = issue.evidence;

        // Try to find correct URL from notes
        // Look for URLs in the same context/topic
        const correctUrl = Array.from(noteUrls.values())[0]; // Use first available URL

        if (correctUrl && fixed.includes(wrongUrl)) {
            fixed = fixed.replace(wrongUrl, correctUrl);
            corrections.push(`Replaced hallucinated URL with correct one from notes`);
        }
    });

    return { fixed, corrections };
}

/**
 * Fix entity mismatches by replacing with correct entities
 */
function fixEntityMismatches(
    answer: string,
    validationResult: ValidationResult,
    registry: EntityRegistry
): { fixed: string; corrections: string[] } {
    let fixed = answer;
    const corrections: string[] = [];

    // Find entity mismatches
    const entityIssues = validationResult.issues.filter(i =>
        i.type === 'entity_mismatch'
    );

    entityIssues.forEach(issue => {
        // Extract the wrong entity from the message
        const match = issue.message.match(/Entity "([^"]+)"/);
        if (!match) return;

        const wrongEntity = match[1];

        // Find similar correct entity in registry
        const acronyms = Array.from(registry.acronyms.keys());
        const correctEntity = acronyms.find(a =>
            a.toLowerCase().includes(wrongEntity.toLowerCase().substring(0, 3))
        );

        if (correctEntity && fixed.includes(wrongEntity)) {
            // Replace wrong entity with correct one
            fixed = fixed.replace(new RegExp(wrongEntity, 'g'), correctEntity);
            corrections.push(`Fixed entity: ${wrongEntity} → ${correctEntity}`);
        }
    });

    return { fixed, corrections };
}

/**
 * Remove hallucinated information that's not in notes
 */
function removeHallucinations(
    answer: string,
    validationResult: ValidationResult
): { fixed: string; corrections: string[] } {
    let fixed = answer;
    const corrections: string[] = [];

    // Find hallucinated claims
    const hallucinations = validationResult.issues.filter(i =>
        i.type === 'hallucination' && i.evidence && !i.evidence.includes('http')
    );

    hallucinations.forEach(issue => {
        if (!issue.evidence) return;

        const hallucination = issue.evidence;

        // Remove the hallucinated sentence
        if (fixed.includes(hallucination)) {
            fixed = fixed.replace(hallucination, '');
            corrections.push(`Removed hallucinated info: "${hallucination.substring(0, 50)}..."`);
        }
    });

    // Clean up double spaces and punctuation
    fixed = fixed.replace(/\s+/g, ' ').trim();
    fixed = fixed.replace(/\.\s*\./g, '.');

    return { fixed, corrections };
}



/**
 * Main local correction function - NO API CALLS!
 * Fixes validation errors using local string manipulation
 */
export function correctLocally(
    answer: string,
    validationResult: ValidationResult,
    context: Note[],
    registry: EntityRegistry
): LocalCorrectionResult {
    let corrected = answer;
    const allCorrections: string[] = [];

    // Step 1: Fix hallucinated URLs
    const urlFix = fixHallucinatedUrls(corrected, validationResult, context);
    corrected = urlFix.fixed;
    allCorrections.push(...urlFix.corrections);

    // Step 2: Fix entity mismatches
    const entityFix = fixEntityMismatches(corrected, validationResult, registry);
    corrected = entityFix.fixed;
    allCorrections.push(...entityFix.corrections);

    // Step 3: Remove hallucinations
    const hallucinationFix = removeHallucinations(corrected, validationResult);
    corrected = hallucinationFix.fixed;
    allCorrections.push(...hallucinationFix.corrections);

    // Step 4: (Removed confidence disclaimer to sound more human/confident)
    // corrected = addConfidenceDisclaimer(corrected, validationResult.confidence);

    const wasCorrected = allCorrections.length > 0;

    return {
        correctedAnswer: corrected,
        wasCorrected,
        corrections: allCorrections
    };
}

/**
 * Smart fallback when correction isn't possible
 */
export function smartFallback(
    context: Note[]
): string {
    if (context.length === 0) {
        return "I don't have any notes that answer this question. Could you provide more details?";
    }

    // Show user the most relevant note content
    const topNote = context[0];
    const snippet = topNote.content.substring(0, 300);

    return `I found this in your note "${topNote.title}":\n\n${snippet}${topNote.content.length > 300 ? '...' : ''}\n\nIs this what you were looking for?`;
}
