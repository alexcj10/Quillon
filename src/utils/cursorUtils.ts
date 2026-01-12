/**
 * Utility for calculating the pixel coordinates (x, y) of the cursor in a textarea.
 * This is useful for positioning overlays like a Command Explorer near the cursor.
 */

export interface CursorPosition {
    top: number;
    left: number;
    lineHeight: number;
}

/**
 * Calculates the cursor position within a textarea.
 * Returns coordinates relative to the textarea's top-left corner.
 */
export function getTextareaCursorXY(
    element: HTMLTextAreaElement,
    position: number
): CursorPosition {
    const { offsetLeft: _x, offsetTop: _y } = element;

    // Create a mirror div to calculate text measurement
    const div = document.createElement('div');
    const style = window.getComputedStyle(element);

    // Copy essential styles
    const propertiesToCopy = [
        'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
        'borderStyle', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
        'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform',
        'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing',
        'tabSize', 'MozTabSize'
    ];

    propertiesToCopy.forEach(prop => {
        // @ts-ignore
        div.style[prop] = style[prop];
    });

    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordBreak = 'break-word';

    // The mirror div should have the same text content up to the cursor
    const content = element.value.substring(0, position);
    div.textContent = content;

    // Add a marker for the cursor position
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    document.body.appendChild(div);

    const { offsetLeft, offsetTop } = span;
    const lineHeight = parseInt(style.lineHeight);

    document.body.removeChild(div);

    return {
        top: offsetTop,
        left: offsetLeft,
        lineHeight: isNaN(lineHeight) ? 0 : lineHeight
    };
}
