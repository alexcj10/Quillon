// Test file to verify the context validation system
// This demonstrates how the validation prevents the LFM 2.5 bug

import { buildEntityRegistry, findEntity } from './entityRegistry';
import { validateResponse } from './contextValidator';
import { Note } from '../types/index';

// Mock notes for testing
const mockNotes: Note[] = [
    {
        id: '1',
        title: 'LFM2.5',
        content: 'https://huggingface.co/LiquidAI/LFM2.5-VL-1.6B',
        tags: [],
        color: '#ffffff',
        isPinned: false,
        isFavorite: false,
        isPrivate: false,
        isDeleted: false,
        createdAt: '2026-01-08T00:00:00Z',
        updatedAt: '2026-01-08T00:00:00Z'
    },
    {
        id: '2',
        title: 'LLM Tutorial',
        content: 'Check out this LLM from scratch tutorial: https://youtube.com/example',
        tags: [],
        color: '#ffffff',
        isPinned: false,
        isFavorite: false,
        isPrivate: false,
        isDeleted: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
    }
];

// Test 1: Entity Registry Building
console.log('=== Test 1: Entity Registry Building ===');
const registry = buildEntityRegistry(mockNotes);
console.log('✅ Registry built successfully');
console.log(`   - Total entities: ${registry.entities.size}`);
console.log(`   - Acronyms: ${registry.acronyms.size}`);
console.log(`   - URLs: ${registry.urls.size}`);

// Test 2: Entity Matching (LFM should match LFM2.5)
console.log('\n=== Test 2: Entity Matching ===');
const lfmMatches = findEntity('LFM', registry, {
    minConfidence: 0.5,
    preferRecent: true,
    entityType: 'acronym'
});
console.log(`Query: "LFM"`);
console.log(`Matches found: ${lfmMatches.length}`);
lfmMatches.forEach(match => {
    console.log(`   - ${match.entity.value} (confidence: ${match.confidence.toFixed(2)}, type: ${match.matchType})`);
});

// Test 3: Disambiguation (LFM vs LLM)
console.log('\n=== Test 3: Disambiguation ===');
const llmMatches = findEntity('LLM', registry, {
    minConfidence: 0.5,
    preferRecent: true,
    entityType: 'acronym'
});
console.log(`Query: "LLM"`);
console.log(`Matches found: ${llmMatches.length}`);
llmMatches.forEach(match => {
    console.log(`   - ${match.entity.value} (confidence: ${match.confidence.toFixed(2)})`);
});

// Test 4: Hallucination Detection
console.log('\n=== Test 4: Hallucination Detection ===');
const hallucinatedResponse = 'The LFM link is https://youtube.com/playlist?list=PLPTV0NXA_ZSgsLAr8YCgCwh';
validateResponse({
    query: 'Give me LFM link',
    response: hallucinatedResponse,
    context: mockNotes,
    entityRegistry: registry
}).then(result => {
    console.log(`Response: "${hallucinatedResponse}"`);
    console.log(`Valid: ${result.isValid}`);
    console.log(`Confidence: ${result.confidence.toFixed(2)}`);
    console.log(`Issues: ${result.issues.length}`);
    result.issues.forEach(issue => {
        console.log(`   - [${issue.severity}] ${issue.message}`);
    });
});

// Test 5: Valid Response
console.log('\n=== Test 5: Valid Response ===');
const validResponse = 'The LFM2.5 link is https://huggingface.co/LiquidAI/LFM2.5-VL-1.6B';
validateResponse({
    query: 'Give me LFM link',
    response: validResponse,
    context: mockNotes,
    entityRegistry: registry
}).then(result => {
    console.log(`Response: "${validResponse}"`);
    console.log(`Valid: ${result.isValid}`);
    console.log(`Confidence: ${result.confidence.toFixed(2)}`);
    console.log(`Citations: ${result.citations.length}`);
    result.citations.forEach(citation => {
        console.log(`   - Source: "${citation.noteTitle}"`);
    });
});

console.log('\n=== All Tests Complete ===');
