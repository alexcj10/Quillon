import { evaluate } from 'mathjs';

/**
 * Checks if the input starts with the calculator command prefix @c-
 */
export function isMathCommand(input: string): boolean {
    return input.trim().toLowerCase().startsWith('@c-');
}

/**
 * Extracts the expression from a math command
 * Example: "@c-1+1" -> "1+1"
 */
export function extractMathExpression(input: string): string {
    if (!isMathCommand(input)) return '';
    // Remove @c- (case insensitive)
    return input.slice(3).trim();
}

/**
 * Evaluates the math expression safely.
 * Returns the result as a string, or null if invalid/error.
 */
export function evaluateMathCommand(input: string): string | null {
    const expression = extractMathExpression(input);
    if (!expression) return null;

    try {
        // Basic security check: limit length to prevent massive malicious payloads
        if (expression.length > 1000) return null;

        const result = evaluate(expression);

        if (typeof result === 'number') {
            // Round to reasonable decimals if needed to avoid floating point ugliness
            // but keep precision for integers
            return Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(6)).toString();
        }

        if (result && typeof result.toString === 'function') {
            return result.toString();
        }

        return null;
    } catch (error) {
        // Silently fail on invalid expressions (e.g. while typing "sqr" instead of "sqrt")
        return null;
    }
}
