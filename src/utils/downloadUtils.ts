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
  if (!document.getElementById('quillon-toast-style')) {
    const style = document.createElement('style');
    style.id = 'quillon-toast-style';
    style.innerHTML = `
      @keyframes quillonToastSlide {
        0% { transform: translate(-50%, -100px); opacity: 0; }
        10% { transform: translate(-50%, 0); opacity: 1; }
        90% { transform: translate(-50%, 0); opacity: 1; }
        100% { transform: translate(-50%, -100px); opacity: 0; }
      }
      #quillon-toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #27ae60;
        color: #fff;
        padding: 12px 24px;
        border-radius: 30px;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 15px;
        font-weight: 500;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: quillonToastSlide 3.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        width: max-content;
        max-width: 90vw;
        white-space: nowrap;
      }`;
    document.head.appendChild(style);
  }

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
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null); // Canvas not supported
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const base64 = canvas.toDataURL('image/png');
      resolve(base64);
    };
    img.onerror = () => {
      console.warn('Could not load Quillon logo. PDF will be generated without it.');
      resolve(null); // Resolve with null if the image fails to load
    };
    // Ensure this path is correct relative to your public/index.html file
    img.src = './letter-q.png';
  });
}

/**
 * Cleans the note content by stripping HTML tags and decoding entities.
 * @param content - The raw HTML content of the note.
 * @returns Plain text content.
 */
function getCleanTextContent(content: string | null | undefined): string {
    if (!content) return 'No content available.';
    
    // Create a temporary element to leverage the browser's parsing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Replace <br> with newlines before stripping tags
    tempDiv.querySelectorAll('br').forEach(br => br.parentNode?.replaceChild(document.createTextNode('\n'), br));
    
    // Get text content, which naturally handles entities
    return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * Generates the content for the .txt file download.
 * @param note - The note object.
 * @returns A formatted string for the TXT file.
 */
function generateTXTContent(note: Note): string {
  const createdDate = new Date(note.createdAt).toLocaleString();
  const updatedDate = note.updatedAt !== note.createdAt ? new Date(note.updatedAt).toLocaleString() : null;
  const cleanContent = getCleanTextContent(note.content);

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
    cleanContent,
    '',
    '====================================',
    `Generated by Quillon on ${new Date().toLocaleDateString()}`
  ].filter(line => line !== null).join('\n');
  
  return txtContent;
}

/**
 * Generates a high-quality, text-based PDF using jsPDF.
 * This approach creates a professional-looking document with selectable text.
 * @param note - The note object.
 * @param fileName - The desired filename for the PDF.
 */
async function generateNativePDF(note: Note, fileName: string): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  // 1. Header with Logo (if available)
  const logoBase64 = await getQuillonLogo();
  if (logoBase64) {
    pdf.addImage(logoBase64, 'PNG', margin, y, 40, 40);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(26);
    pdf.setTextColor('#27ae60');
    pdf.text('QUILLON', margin + 50, y + 28);
  } else {
    // Fallback if logo is missing
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(26);
    pdf.setTextColor('#27ae60');
    pdf.text('QUILLON', margin, y + 20);
  }
  y += 70;
  pdf.setDrawColor('#e0e0e0').line(margin, y - 20, pageWidth - margin, y - 20);

  // 2. Note Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor('#2c3e50');
  const splitTitle = pdf.splitTextToSize(note.title || 'Untitled Note', pageWidth - margin * 2);
  pdf.text(splitTitle, margin, y);
  y += (splitTitle.length * 20) + 20;

  // 3. Metadata
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor('#34495e');
  const createdDate = `Created: ${new Date(note.createdAt).toLocaleString()}`;
  pdf.text(createdDate, margin, y);
  if (note.updatedAt !== note.createdAt) {
    const updatedDate = `Updated: ${new Date(note.updatedAt).toLocaleString()}`;
    pdf.text(updatedDate, margin, y + 15);
    y += 15;
  }
  y += 30;

  // 4. Note Content (with text wrapping and page breaks)
  const cleanContent = getCleanTextContent(note.content);
  pdf.setFontSize(12);
  pdf.setTextColor('#2c3e50');
  const contentLines = pdf.splitTextToSize(cleanContent, pageWidth - margin * 2);
  
  contentLines.forEach((line: string) => {
    if (y > pageHeight - margin - 20) { // Check space for line and footer
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y, { lineHeightFactor: 1.5 });
    y += 12 * 1.5; // Font size * line height factor
  });

  // 5. Tags
  if (note.tags && note.tags.length > 0) {
    y += 20;
    if (y > pageHeight - margin - 40) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Tags:', margin, y);
    y += 18;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor('#27ae60');
    const tagsString = note.tags.map(tag => `#${tag}`).join('  ');
    const splitTags = pdf.splitTextToSize(tagsString, pageWidth - margin * 2);
    splitTags.forEach((line: string) => {
        if (y > pageHeight - margin - 20) {
            pdf.addPage();
            y = margin;
        }
        pdf.text(line, margin, y);
        y += 14;
    });
  }

  // 6. Footer on all pages
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor('#7f8c8d');
    const footerText = `Generated by Quillon | Tag it. Find it. Done.`;
    const pageNumText = `Page ${i} of ${pageCount}`;
    pdf.text(footerText, margin, pageHeight - margin / 2);
    pdf.text(pageNumText, pageWidth - margin - pdf.getStringUnitWidth(pageNumText) * 9, pageHeight - margin / 2);
  }

  // Trigger the download
  pdf.save(fileName);
}


/**
 * Main exportable function to handle downloading a note in the specified format.
 * @param note - The note object to download.
 * @param options - Download options including format and callbacks.
 */
export async function downloadNote(note: Note, options: DownloadOptions) {
  const { format, suggestedName, onSuccess } = options;

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const noteTitle = (note.title || 'untitled').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 50);
  const fileName = `${suggestedName || noteTitle}-${timestamp}.${format}`;

  try {
    showToast(`Preparing ${format.toUpperCase()} download...`);
    
    if (format === 'txt') {
      const txtContent = generateTXTContent(note);
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      triggerDownload(blob, fileName);
      
    } else if (format === 'pdf') {
      await generateNativePDF(note, fileName);
    }
    
    showToast('Download started!');
    if (onSuccess) {
      onSuccess(`Note downloaded as ${format.toUpperCase()}`, format);
    }
    console.log(`✅ ${format.toUpperCase()} download initiated: ${fileName}`);

  } catch (error) {
    console.error(`❌ Download failed for ${fileName}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    showToast(`Download failed: ${errorMessage}`);
  }
}