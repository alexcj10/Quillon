import { Note } from '../types';
import {
    EntityRegistry,
    findEntity,
    disambiguateEntity
} from './entityRegistry';

/**
 * Context Validator - Validates AI responses against known context
 * Detects hallucinations, verifies factual claims, and provides confidence scores
 */

export interface ValidationIssue {
    type: 'hallucination' | 'low_confidence' | 'entity_mismatch' | 'url_invalid' | 'domain_mismatch';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    evidence?: string;
    suggestion?: string;
}

export interface ValidationResult {
    isValid: boolean;
    confidence: number; // 0-1 overall confidence score
    issues: ValidationIssue[];
    suggestions: string[];
    verifiedClaims: FactualClaim[];
    citations: Citation[];
}

export interface FactualClaim {
    claim: string;
    type: 'url' | 'date' | 'name' | 'number' | 'relationship' | 'entity';
    verified: boolean;
    source?: string; // Note ID or title
    confidence: number;
    position: { start: number; end: number }; // Position in response text
}

export interface Citation {
    noteId: string;
    noteTitle: string;
    snippet: string;
    relevance: number; // 0-1
}

/**
 * Extract URLs from text
 */
function extractUrls(text: string): FactualClaim[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const claims: FactualClaim[] = [];
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
        claims.push({
            claim: match[0].trim(),
            type: 'url',
            verified: false,
            confidence: 0,
            position: { start: match.index, end: match.index + match[0].length }
        });
    }

    return claims;
}

/**
 * Extract entity references (acronyms, proper nouns, etc.)
 */
function extractEntityReferences(text: string): FactualClaim[] {
    const claims: FactualClaim[] = [];

    // Extract acronyms (2-6 uppercase letters, possibly with numbers)
    const acronymRegex = /\b([A-Z]{2,6}[\d.]*)\b/g;
    let match;

    while ((match = acronymRegex.exec(text)) !== null) {
        claims.push({
            claim: match[0],
            type: 'entity',
            verified: false,
            confidence: 0,
            position: { start: match.index, end: match.index + match[0].length }
        });
    }

    // Extract quoted names or terms
    const quotedRegex = /"([^"]+)"/g;
    while ((match = quotedRegex.exec(text)) !== null) {
        claims.push({
            claim: match[1],
            type: 'name',
            verified: false,
            confidence: 0,
            position: { start: match.index, end: match.index + match[0].length }
        });
    }

    return claims;
}

/**
 * Extract dates from text
 * TODO: Phase 2 - Enable date validation
 */
/* 
function extractDates(text: string): FactualClaim[] {
    const claims: FactualClaim[] = [];

    // Match various date formats
    const dateRegex = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b/gi;
    let match;

    while ((match = dateRegex.exec(text)) !== null) {
        claims.push({
            claim: match[0],
            type: 'date',
            verified: false,
            confidence: 0,
            position: { start: match.index, end: match.index + match[0].length }
        });
    }

    return claims;
}
*/

/**
 * Extract numbers and numerical claims
 * TODO: Phase 2 - Enable number validation
 */
/*
function extractNumbers(text: string): FactualClaim[] {
    const claims: FactualClaim[] = [];

    // Match numbers with context (e.g., "9137868684", "version 2.5")
    const numberRegex = /\b(\d+(?:\.\d+)?(?:\s*(?:million|billion|thousand|%|percent))?)\b/gi;
    let match;

    while ((match = numberRegex.exec(text)) !== null) {
        // Skip very small numbers (likely not factual claims)
        if (match[0].length > 2) {
            claims.push({
                claim: match[0],
                type: 'number',
                verified: false,
                confidence: 0,
                position: { start: match.index, end: match.index + match[0].length }
            });
        }
    }

    return claims;
}
*/

/**
 * Verify a URL claim against context
 */
function verifyUrlClaim(
    claim: FactualClaim,
    registry: EntityRegistry,
    context: Note[]
): { verified: boolean; confidence: number; source?: string; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];

    // Check if URL exists in registry
    const urlEntity = registry.urls.get(claim.claim);

    if (urlEntity) {
        return {
            verified: true,
            confidence: 1.0,
            source: urlEntity.sourceNoteTitle,
            issues: []
        };
    }

    // Check if URL domain exists in any note
    try {
        const claimUrl = new URL(claim.claim);
        const claimDomain = claimUrl.hostname;

        for (const note of context) {
            const noteContent = `${note.title} ${note.content}`;
            const urlMatches = noteContent.match(/(https?:\/\/[^\s]+)/g) || [];

            for (const url of urlMatches) {
                try {
                    const noteUrl = new URL(url);
                    if (noteUrl.hostname === claimDomain) {
                        // Same domain found, but different path
                        issues.push({
                            type: 'url_invalid',
                            severity: 'warning',
                            message: `URL domain matches notes (${claimDomain}), but exact URL not found`,
                            evidence: `Found ${url} in note "${note.title}"`,
                            suggestion: `Verify the exact URL path is correct`
                        });

                        return {
                            verified: false,
                            confidence: 0.5, // Partial match
                            source: note.title,
                            issues
                        };
                    }
                } catch {
                    // Invalid URL in note, skip
                }
            }
        }

        // No matching domain found
        issues.push({
            type: 'hallucination',
            severity: 'critical',
            message: `URL not found in any notes: ${claim.claim}`,
            suggestion: `This URL may be hallucinated. Verify it exists in your notes.`
        });

        return {
            verified: false,
            confidence: 0,
            issues
        };
    } catch {
        // Invalid URL format
        issues.push({
            type: 'url_invalid',
            severity: 'critical',
            message: `Invalid URL format: ${claim.claim}`
        });

        return {
            verified: false,
            confidence: 0,
            issues
        };
    }
}

/**
 * Verify an entity claim against registry
 */
function verifyEntityClaim(
    claim: FactualClaim,
    registry: EntityRegistry,
    queryContext?: string[]
): { verified: boolean; confidence: number; source?: string; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];

    // Find entity matches
    const matches = findEntity(claim.claim, registry, {
        minConfidence: 0.5,
        preferRecent: true,
        entityType: 'acronym' // Focus on acronyms for now
    });

    if (matches.length === 0) {
        issues.push({
            type: 'entity_mismatch',
            severity: 'warning',
            message: `Entity "${claim.claim}" not found in notes`,
            suggestion: `Verify this entity exists in your notes or clarify the reference`
        });

        return {
            verified: false,
            confidence: 0,
            issues
        };
    }

    // Try to disambiguate
    const bestMatch = disambiguateEntity(matches, queryContext);

    if (!bestMatch) {
        // Ambiguous - multiple matches
        issues.push({
            type: 'entity_mismatch',
            severity: 'warning',
            message: `Entity "${claim.claim}" is ambiguous (${matches.length} possible matches)`,
            evidence: matches.map(m => `"${m.entity.value}" in "${m.entity.sourceNoteTitle}"`).join(', '),
            suggestion: `Clarify which entity you mean: ${matches.map(m => m.entity.value).join(', ')}`
        });

        return {
            verified: false,
            confidence: matches[0].confidence,
            source: matches[0].entity.sourceNoteTitle,
            issues
        };
    }

    // Check for potential confusion (e.g., LFM vs LLM)
    const similarMatches = matches.filter(m =>
        m.entity.value !== bestMatch.entity.value &&
        m.confidence > 0.4
    );

    if (similarMatches.length > 0) {
        issues.push({
            type: 'entity_mismatch',
            severity: 'info',
            message: `Entity "${claim.claim}" might be confused with similar entities`,
            evidence: similarMatches.map(m => `"${m.entity.value}" (confidence: ${m.confidence.toFixed(2)})`).join(', '),
            suggestion: `Verify you meant "${bestMatch.entity.value}" and not ${similarMatches.map(m => m.entity.value).join(' or ')}`
        });
    }

    return {
        verified: bestMatch.matchType === 'exact',
        confidence: bestMatch.confidence,
        source: bestMatch.entity.sourceNoteTitle,
        issues
    };
}

/**
 * Main validation function
 */
export async function validateResponse(params: {
    query: string;
    response: string;
    context: Note[];
    entityRegistry: EntityRegistry;
}): Promise<ValidationResult> {
    const { query, response, context, entityRegistry } = params;

    const allIssues: ValidationIssue[] = [];
    const verifiedClaims: FactualClaim[] = [];
    const citations: Citation[] = [];

    // Extract all factual claims from response
    const urlClaims = extractUrls(response);
    const entityClaims = extractEntityReferences(response);
    // Note: Date and number validation will be added in Phase 2
    // const dateClaims = extractDates(response);
    // const numberClaims = extractNumbers(response);

    // Extract context hints from query
    const queryContext = query.toLowerCase().split(/\s+/);

    // Verify each claim
    let totalConfidence = 0;
    let claimCount = 0;

    // Verify URLs (highest priority)
    for (const claim of urlClaims) {
        const verification = verifyUrlClaim(claim, entityRegistry, context);
        claim.verified = verification.verified;
        claim.confidence = verification.confidence;
        claim.source = verification.source;

        allIssues.push(...verification.issues);
        verifiedClaims.push(claim);

        totalConfidence += verification.confidence;
        claimCount++;

        // Add citation if verified
        if (verification.verified && verification.source) {
            const sourceNote = context.find(n => n.title === verification.source);
            if (sourceNote) {
                citations.push({
                    noteId: sourceNote.id,
                    noteTitle: sourceNote.title,
                    snippet: claim.claim,
                    relevance: 1.0
                });
            }
        }
    }

    // Verify entities
    for (const claim of entityClaims) {
        const verification = verifyEntityClaim(claim, entityRegistry, queryContext);
        claim.verified = verification.verified;
        claim.confidence = verification.confidence;
        claim.source = verification.source;

        allIssues.push(...verification.issues);
        verifiedClaims.push(claim);

        totalConfidence += verification.confidence;
        claimCount++;

        // Add citation if verified
        if (verification.verified && verification.source) {
            const sourceNote = context.find(n => n.title === verification.source);
            if (sourceNote) {
                citations.push({
                    noteId: sourceNote.id,
                    noteTitle: sourceNote.title,
                    snippet: claim.claim,
                    relevance: verification.confidence
                });
            }
        }
    }

    // Calculate overall confidence
    const overallConfidence = claimCount > 0 ? totalConfidence / claimCount : 1.0;

    // Determine if response is valid
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const isValid = criticalIssues.length === 0 && overallConfidence >= 0.5;

    // Generate suggestions based on issues
    const suggestions: string[] = [];

    if (!isValid) {
        if (overallConfidence < 0.5) {
            suggestions.push('The response has low confidence. Consider asking for more specific information.');
        }

        if (criticalIssues.length > 0) {
            suggestions.push('Critical validation errors detected. The response may contain hallucinated information.');
        }

        // Add specific suggestions from issues
        allIssues.forEach(issue => {
            if (issue.suggestion && !suggestions.includes(issue.suggestion)) {
                suggestions.push(issue.suggestion);
            }
        });
    }

    return {
        isValid,
        confidence: overallConfidence,
        issues: allIssues,
        suggestions,
        verifiedClaims,
        citations
    };
}

/**
 * Generate a clarification prompt based on validation issues
 */
export function generateClarificationPrompt(validationResult: ValidationResult): string {
    const { issues, suggestions } = validationResult;

    if (issues.length === 0) {
        return '';
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical');

    if (criticalIssues.length > 0) {
        const issueMessages = criticalIssues.map(i => i.message).join('; ');
        return `I'm not confident in my answer because: ${issueMessages}. ${suggestions[0] || 'Could you provide more details?'}`;
    }

    const warningIssues = issues.filter(i => i.severity === 'warning');

    if (warningIssues.length > 0) {
        return `I found some information, but I'm not entirely sure. ${suggestions[0] || 'Could you clarify your question?'}`;
    }

    return '';
}

/**
 * Format citations for display
 */
export function formatCitations(citations: Citation[]): string {
    if (citations.length === 0) {
        return '';
    }

    const uniqueCitations = Array.from(
        new Map(citations.map(c => [c.noteId, c])).values()
    );

    return '\n\n**Sources:**\n' + uniqueCitations
        .sort((a, b) => b.relevance - a.relevance)
        .map(c => `- "${c.noteTitle}"`)
        .join('\n');
}
