import { Note } from '../types';
import jsPDF from 'jspdf';

// Define a simple type for the download options
interface DownloadOptions {
  format: 'txt' | 'pdf';
  suggestedName?: string;
  onSuccess?: (message: string, format: 'txt' | 'pdf') => void;
}

/**
 * Triggers a file download in the browser with enhanced cross-device compatibility.
 * @param blob - The data Blob to download.
 * @param fileName - The suggested name for the downloaded file.
 */
function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;

  // Set target to _blank as a fallback for mobile browsers
  link.setAttribute('target', '_blank');
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Clean up the DOM and revoke the object URL after a short delay
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Displays a lightweight, non-intrusive toast notification at the top-center of the screen.
 * The animation has been refined to prevent any page layout shifts.
 * @param message - The message to display in the toast.
 */
function showToast(message: string) {
  // Remove any existing toast to prevent duplicates
  const existingToast = document.getElementById('quillon-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Inject the toast's stylesheet into the head once
  // Inject or update the toast's stylesheet
  let style = document.getElementById('quillon-toast-style') as HTMLStyleElement;
  if (!style) {
    style = document.createElement('style');
    style.id = 'quillon-toast-style';
    document.head.appendChild(style);
  }

  style.innerHTML = `
      @keyframes quillonToastSlide {
        0% { transform: translate(-50%, -100px); opacity: 0; }
        10% { transform: translate(-50%, 0); opacity: 1; }
        90% { transform: translate(-50%, 0); opacity: 1; }
        100% { transform: translate(-50%, -100px); opacity: 0; }
      }
      #quillon-toast {
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #27ae60;
        color: #fff;
        padding: 10px 20px;
        border-radius: 50px;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.5;
        letter-spacing: 0.01em;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: quillonToastSlide 3.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        width: max-content;
        max-width: 90vw;
        white-space: nowrap;
      }
      @media (max-width: 768px) {
        #quillon-toast {
          padding: 8px 16px;
          min-width: unset;
          width: auto;
          font-size: 13px;
          line-height: 1.4;
          top: 16px;
          border-radius: 50px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
      }`;

  const toast = document.createElement('div');
  toast.id = 'quillon-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Remove the toast element after the animation completes
  setTimeout(() => {
    toast.remove();
  }, 3500); // Duration matches the animation
}

/**
 * Loads the Quillon logo as a base64 string for embedding in the PDF.
 * Returns null if the logo fails to load.
 * @returns A Promise that resolves to the base64 string or null.
 */
function getQuillonLogo(): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      } catch (error) {
        console.warn('Error processing logo:', error);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn('Could not load Quillon logo. PDF will be generated without it.');
      resolve(null);
    };
    // Ensure this path is correct relative to your public/index.html file
    img.src = './letter-q.png';
  });
}

/**
 * Preserves the exact content including line breaks for TXT files (keeps emojis).
 * This function extracts text while maintaining all user formatting.
 * @param content - The raw HTML content of the note.
 * @returns Plain text content with preserved formatting and emojis for TXT.
 */
function getExactTextContentForTXT(content: string | null | undefined): string {
  if (!content) return 'No content available.';

  try {
    // Create a temporary element to leverage the browser's parsing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Handle different HTML elements to preserve formatting
    // Replace <br> and <br/> with actual line breaks
    tempDiv.querySelectorAll('br').forEach(br => {
      br.parentNode?.replaceChild(document.createTextNode('\n'), br);
    });

    // Handle paragraph breaks - add double line breaks for paragraphs
    tempDiv.querySelectorAll('p').forEach((p, index) => {
      if (index > 0) {
        // Add line break before each paragraph (except the first)
        p.parentNode?.insertBefore(document.createTextNode('\n\n'), p);
      }
      // Add line break after each paragraph
      if (p.nextSibling) {
        p.parentNode?.insertBefore(document.createTextNode('\n'), p.nextSibling);
      }
    });

    // Handle div elements - treat them as block elements
    tempDiv.querySelectorAll('div').forEach((div, index) => {
      if (index > 0 && div.previousSibling && div.previousSibling.nodeType === Node.TEXT_NODE) {
        div.parentNode?.insertBefore(document.createTextNode('\n'), div);
      }
    });

    // Handle list items
    tempDiv.querySelectorAll('li').forEach(li => {
      li.parentNode?.insertBefore(document.createTextNode('\n• '), li);
    });

    // Get the final text content - this preserves emojis naturally for TXT
    let textContent = tempDiv.textContent || tempDiv.innerText || '';

    // Clean up excessive line breaks but preserve intentional ones
    textContent = textContent
      .replace(/\n{3,}/g, '\n\n') // Replace 3+ consecutive line breaks with 2
      .trim(); // Remove leading/trailing whitespace

    return textContent;
  } catch (error) {
    console.warn('Error extracting text content:', error);
    // Fallback: just strip HTML tags but preserve content
    return content.replace(/<[^>]*>/g, '').trim();
  }
}

/**
 * Extracts exact content for PDF but removes emojis to avoid rendering issues.
 * Preserves all line breaks and formatting exactly as user wrote them.
 * @param content - The raw HTML content of the note.
 * @returns Plain text content with preserved formatting but without emojis for PDF.
 */
function getExactTextContentForPDF(content: string | null | undefined): string {
  if (!content) return 'No content available.';

  try {
    // Create a temporary element to leverage the browser's parsing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Handle different HTML elements to preserve formatting EXACTLY
    // Replace <br> and <br/> with actual line breaks
    tempDiv.querySelectorAll('br').forEach(br => {
      br.parentNode?.replaceChild(document.createTextNode('\n'), br);
    });

    // Handle paragraph breaks - preserve exactly as user intended
    tempDiv.querySelectorAll('p').forEach((p, index) => {
      if (index > 0) {
        p.parentNode?.insertBefore(document.createTextNode('\n\n'), p);
      }
      if (p.nextSibling) {
        p.parentNode?.insertBefore(document.createTextNode('\n'), p.nextSibling);
      }
    });

    // Handle div elements - treat them as block elements
    tempDiv.querySelectorAll('div').forEach((div, index) => {
      if (index > 0 && div.previousSibling && div.previousSibling.nodeType === Node.TEXT_NODE) {
        div.parentNode?.insertBefore(document.createTextNode('\n'), div);
      }
    });

    // Handle list items
    tempDiv.querySelectorAll('li').forEach(li => {
      li.parentNode?.insertBefore(document.createTextNode('\n• '), li);
    });

    // Get the text content
    let textContent = tempDiv.textContent || tempDiv.innerText || '';

    // Remove ONLY emojis but keep all other characters and formatting
    textContent = textContent
      // Remove comprehensive emoji ranges but keep everything else
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F251}]/gu, '')
      // Clean up excessive line breaks but preserve user's intentional spacing
      .replace(/\n{3,}/g, '\n\n') // Replace 3+ consecutive line breaks with 2
      // Remove only control characters that cause PDF issues, but keep line breaks
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
      // Normalize line endings but preserve them
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    return textContent;
  } catch (error) {
    console.warn('Error extracting text content for PDF:', error);
    // Fallback: strip HTML and emojis
    return content
      .replace(/<[^>]*>/g, '')
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F251}]/gu, '')
      .trim();
  }
}

/**
 * Minimal text sanitization for PDF - only fixes what's absolutely necessary.
 * @param text - The input text to sanitize.
 * @returns Text safe for PDF generation.
 */
function minimalSanitizeForPDF(text: string): string {
  if (!text) return '';

  return text
    // Replace only the most problematic characters that break jsPDF
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // En dash, Em dash
    .replace(/[\u00A0]/g, ' ') // Non-breaking space
    // Keep all line breaks and spacing exactly as is
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Generates the content for the .txt file download with preserved formatting.
 * @param note - The note object.
 * @returns A formatted string for the TXT file with exact user formatting.
 */
function generateTXTContent(note: Note): string {
  const createdDate = new Date(note.createdAt).toLocaleString();
  const updatedDate = note.updatedAt !== note.createdAt ? new Date(note.updatedAt).toLocaleString() : null;
  const exactContent = getExactTextContentForTXT(note.content); // Keep emojis for TXT

  const txtContent = [
    'QUILLON - Tag it. Find it. Done.',
    '====================================',
    '',
    `Title: ${note.title || 'Untitled Note'}`,
    '',
    `Created: ${createdDate}`,
    updatedDate ? `Updated: ${updatedDate}` : null,
    `Status: ${note.isPrivate ? 'Private' : 'Public'}`,
    note.isFavorite ? 'Favorite: Yes' : null,
    note.tags && note.tags.length > 0 ? `Tags: ${note.tags.map(tag => `#${tag}`).join(' ')}` : null,
    '',
    '------------------------------------',
    'CONTENT',
    '------------------------------------',
    '',
    exactContent, // Use exact content with preserved formatting and emojis
    '',
    '====================================',
    `Generated by Quillon on ${new Date().toLocaleDateString()}`
  ].filter(line => line !== null).join('\n');

  return txtContent;
}

/**
 * Safely adds text to PDF with minimal processing.
 * @param pdf - The jsPDF instance.
 * @param text - The text to add.
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @param options - Text options.
 */
function safeAddTextToPDF(pdf: jsPDF, text: string, x: number, y: number, options?: any): void {
  try {
    const cleanText = minimalSanitizeForPDF(text);
    pdf.text(cleanText, x, y, options);
  } catch (error) {
    console.warn('Error adding text to PDF:', error);
    // Fallback: use only ASCII characters
    try {
      const asciiText = text.replace(/[^\x20-\x7E\n\r\t]/g, '');
      pdf.text(asciiText, x, y, options);
    } catch (fallbackError) {
      console.error('ASCII fallback failed:', fallbackError);
      pdf.text('Text could not be displayed', x, y, options);
    }
  }
}

/**
 * Safely splits text for PDF while preserving exact line breaks.
 * @param pdf - The jsPDF instance.
 * @param text - The text to split.
 * @param maxWidth - Maximum width for text.
 * @returns Array of text lines with preserved formatting.
 */
function safeSplitTextForPDF(pdf: jsPDF, text: string, maxWidth: number): string[] {
  try {
    const cleanText = minimalSanitizeForPDF(text);

    // CRITICAL: Split by existing line breaks FIRST to preserve user formatting
    const userLines = cleanText.split('\n');
    const finalLines: string[] = [];

    userLines.forEach(userLine => {
      if (userLine.trim() === '') {
        // Preserve empty lines exactly as user intended
        finalLines.push('');
      } else {
        try {
          // Only split for width if the line is too long
          const wrappedLines = pdf.splitTextToSize(userLine, maxWidth);
          finalLines.push(...wrappedLines);
        } catch (splitError) {
          console.warn('Split error, using manual wrap:', splitError);
          // Manual word wrap as last resort
          const words = userLine.split(' ');
          let currentLine = '';

          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            // Rough character width estimation
            if (testLine.length * 6 > maxWidth) {
              if (currentLine) {
                finalLines.push(currentLine);
                currentLine = word;
              } else {
                finalLines.push(word);
              }
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            finalLines.push(currentLine);
          }
        }
      }
    });

    return finalLines;
  } catch (error) {
    console.warn('Major error in text splitting:', error);
    return ['Content could not be processed'];
  }
}

/**
 * Generates a PDF with perfect formatting preservation and no emojis.
 * @param note - The note object.
 * @param fileName - The desired filename for the PDF.
 */
async function generateNativePDF(note: Note, fileName: string): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    let y = margin;

    // 1. Header with Logo (if available)
    const logoBase64 = await getQuillonLogo();
    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, 'PNG', margin, y, 40, 40);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(26);
        pdf.setTextColor('#27ae60');
        safeAddTextToPDF(pdf, 'QUILLON', margin + 50, y + 28);
      } catch (logoError) {
        console.warn('Error adding logo:', logoError);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(26);
        pdf.setTextColor('#27ae60');
        safeAddTextToPDF(pdf, 'QUILLON', margin, y + 20);
      }
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(26);
      pdf.setTextColor('#27ae60');
      safeAddTextToPDF(pdf, 'QUILLON', margin, y + 20);
    }

    y += 70;
    pdf.setDrawColor('#e0e0e0').line(margin, y - 20, pageWidth - margin, y - 20);

    // 2. Note Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor('#2c3e50');

    const noteTitle = note.title || 'Untitled Note';
    const splitTitle = safeSplitTextForPDF(pdf, noteTitle, pageWidth - margin * 2);

    splitTitle.forEach((line: string) => {
      safeAddTextToPDF(pdf, line, margin, y);
      y += 24;
    });
    y += 20;

    // 3. Metadata
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor('#34495e');

    const createdDate = `Created: ${new Date(note.createdAt).toLocaleString()}`;
    safeAddTextToPDF(pdf, createdDate, margin, y);
    y += 15;

    if (note.updatedAt !== note.createdAt) {
      const updatedDate = `Updated: ${new Date(note.updatedAt).toLocaleString()}`;
      safeAddTextToPDF(pdf, updatedDate, margin, y);
      y += 15;
    }

    const status = `Status: ${note.isPrivate ? 'Private' : 'Public'}`;
    safeAddTextToPDF(pdf, status, margin, y);
    y += 15;

    if (note.isFavorite) {
      safeAddTextToPDF(pdf, 'Favorite: Yes', margin, y);
      y += 15;
    }

    y += 20;

    // 4. Tags
    if (note.tags && note.tags.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor('#2c3e50');
      safeAddTextToPDF(pdf, 'Tags:', margin, y);
      y += 18;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor('#27ae60');

      const tagsString = note.tags.map(tag => `#${tag}`).join('  ');
      const splitTags = safeSplitTextForPDF(pdf, tagsString, pageWidth - margin * 2);

      splitTags.forEach((line: string) => {
        if (y > pageHeight - margin - 60) {
          pdf.addPage();
          y = margin;
        }
        safeAddTextToPDF(pdf, line, margin, y);
        y += 14;
      });
      y += 20;
    }

    // 5. Content separator
    pdf.setDrawColor('#e0e0e0').line(margin, y, pageWidth - margin, y);
    y += 30;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor('#2c3e50');
    safeAddTextToPDF(pdf, 'CONTENT', margin, y);
    y += 30;

    // 6. Note Content with EXACT formatting preserved
    const exactContent = getExactTextContentForPDF(note.content); // No emojis, exact formatting
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor('#2c3e50');

    const contentLines = safeSplitTextForPDF(pdf, exactContent, pageWidth - margin * 2);

    contentLines.forEach((line: string) => {
      if (y > pageHeight - margin - 40) {
        pdf.addPage();
        y = margin;
      }

      // Handle empty lines (preserve exact spacing)
      if (line.trim() === '') {
        y += 18; // Same height as text line to preserve spacing
      } else {
        safeAddTextToPDF(pdf, line, margin, y);
        y += 18; // Consistent line height
      }
    });

    // 7. Footer on all pages
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor('#7f8c8d');

      const footerText = 'Generated by Quillon | Tag it. Find it. Done.';
      const pageNumText = `Page ${i} of ${pageCount}`;

      safeAddTextToPDF(pdf, footerText, margin, pageHeight - margin / 2);
      safeAddTextToPDF(pdf, pageNumText, pageWidth - margin - 80, pageHeight - margin / 2);
    }

    // Trigger the download
    pdf.save(fileName);

  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main exportable function to handle downloading a note in the specified format.
 * @param note - The note object to download.
 * @param options - Download options including format and callbacks.
 */
export async function downloadNote(note: Note, options: DownloadOptions) {
  const { format, suggestedName, onSuccess } = options;

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const noteTitle = (note.title || 'untitled')
    .replace(/[^a-zA-Z0-9\s]/g, '') // Clean filename, no emojis
    .replace(/\s+/g, '-')
    .slice(0, 50);
  const fileName = `${suggestedName || noteTitle}-${timestamp}.${format}`;

  try {
    showToast(`Preparing ${format.toUpperCase()} download...`);

    if (format === 'txt') {
      const txtContent = generateTXTContent(note);
      // Use UTF-8 BOM to ensure proper emoji display in text editors
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + txtContent], { type: 'text/plain;charset=utf-8' });
      triggerDownload(blob, fileName);

    } else if (format === 'pdf') {
      await generateNativePDF(note, fileName);
    }

    showToast('Download completed successfully!');
    if (onSuccess) {
      onSuccess(`Note downloaded as ${format.toUpperCase()}`, format);
    }
    console.log(`✅ ${format.toUpperCase()} download completed: ${fileName}`);

  } catch (error) {
    console.error(`❌ Download failed for ${fileName}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    showToast(`Download failed: ${errorMessage}`);
    throw error;
  }
}
