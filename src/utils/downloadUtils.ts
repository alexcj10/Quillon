import { Note } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DownloadOptions {
  format: 'txt' | 'pdf';
  suggestedName?: string;
}

// Enhanced utility function for cross-device downloads
function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  
  // Enhanced for mobile compatibility
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  
  // Add to DOM, trigger click, and clean up
  document.body.appendChild(link);
  
  // Multiple click attempts for better mobile compatibility
  try {
    link.click();
  } catch (e) {
    // Fallback for older browsers
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    link.dispatchEvent(event);
  }
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

// Device detection utility
function getDeviceInfo() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);
  const isSafari = /safari/i.test(userAgent) && !/chrome/i.test(userAgent);
  
  return {
    isMobile,
    isTablet,
    isIOS,
    isAndroid,
    isSafari,
    isDesktop: !isMobile && !isTablet
  };
}

// Convert image to base64 for embedding
function getQuillonLogo(): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const base64 = canvas.toDataURL('image/png');
      resolve(base64);
    };
    img.onerror = () => {
      // Fallback: create a simple green text-based logo
      resolve('data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="#27ae60" stroke="#2c3e50" stroke-width="3"/>
          <text x="50" y="60" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle">Q</text>
        </svg>
      `));
    };
    img.src = './letter-q.png';
  });
}

// Generate true PDF using jsPDF and html2canvas
async function generateTruePDF(note: Note, fileName: string): Promise<void> {
  try {
    const logoBase64 = await getQuillonLogo();
    const htmlContent = generateMobilePDFContent(note, logoBase64);
    
    // Create a temporary container for rendering
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = htmlContent;
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '794px'; // A4 width in pixels at 96 DPI
    tempContainer.style.background = 'white';
    document.body.appendChild(tempContainer);
    
    // Wait a bit for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Convert HTML to canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123, // A4 height in pixels
      scrollX: 0,
      scrollY: 0
    });
    
    // Remove temporary container
    document.body.removeChild(tempContainer);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate dimensions to fit A4
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Download the PDF
    pdf.save(fileName);
    
    console.log(`✅ True PDF generated and downloaded: ${fileName}`);
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw error;
  }
}

// Generate mobile-friendly PDF as HTML with proper download
function generateMobilePDFContent(note: Note, logoBase64: string): string {
  const createdDate = new Date(note.createdAt).toLocaleDateString();
  const updatedDate = note.updatedAt !== note.createdAt ? new Date(note.updatedAt).toLocaleDateString() : null;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${note.title || 'Untitled Note'} - Quillon</title>
    <style>
        @page {
            margin: 0.5in;
            size: A4;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
            line-height: 1.7;
            color: #2c3e50;
            background: white;
            position: relative;
            min-height: 100vh;
        }
        

        
        .document {
            max-width: 100%;
            margin: 0;
            padding: 30px 20px;
            position: relative;
            z-index: 1;
        }
        
        .header {
            display: flex;
            align-items: center;
            border-bottom: 3px solid #27ae60;
            padding-bottom: 20px;
            margin-bottom: 30px;
            position: relative;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            margin-right: 20px;
            border-radius: 50%;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .header-content {
            flex: 1;
        }
        
        .title {
            font-size: 32px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 12px;
            word-wrap: break-word;
            line-height: 1.2;
        }
        
        .metadata {
            font-size: 14px;
            color: #7f8c8d;
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .metadata-item {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #f8f9fa;
            padding: 6px 12px;
            border-radius: 20px;
            border: 1px solid #e9ecef;
        }
        
        .content {
            font-size: 16px;
            line-height: 1.8;
            white-space: pre-wrap;
            word-wrap: break-word;
            margin-bottom: 30px;
            min-height: 100px;
            text-align: justify;
            color: #34495e;
        }
        
        .tags-section {
            border-top: 2px solid #ecf0f1;
            padding-top: 20px;
            margin-top: 30px;
        }
        
        .tags-label {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 12px;
            font-size: 16px;
        }
        
        .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .tag {
            background: linear-gradient(135deg, #27ae60, #229954);
            color: white;
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(39, 174, 96, 0.3);
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            position: relative;
        }
        

        
        .footer-text {
            font-size: 12px;
            color: #95a5a6;
            font-weight: 500;
        }
        
        .brand {
            color: #27ae60;
            font-weight: 600;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .document {
                padding: 0;
            }
            

        }
        
        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                text-align: center;
            }
            
            .logo {
                margin: 0 0 15px 0;
            }
            
            .title {
                font-size: 28px;
            }
            
            .metadata {
                justify-content: center;
            }
        }
    </style>
</head>
<body>

    <div class="document">
        <div class="header">
            <img src="${logoBase64}" alt="Quillon Logo" class="logo">
            <div class="header-content">
                <div class="title">${note.title || 'Untitled Note'}</div>
                <div class="metadata">
                    <div class="metadata-item">
                        <strong>📅 Created:</strong> ${createdDate}
                    </div>
                    ${updatedDate ? `<div class="metadata-item"><strong>🔄 Updated:</strong> ${updatedDate}</div>` : ''}
                    ${note.isPrivate ? '<div class="metadata-item"><strong>🔒 Status:</strong> Private</div>' : ''}
                    ${note.isFavorite ? '<div class="metadata-item"><strong>⭐ Favorite</strong></div>' : ''}
                </div>
            </div>
        </div>
        
        <div class="content">${note.content || 'No content available.'}</div>
        
        ${note.tags && note.tags.length > 0 ? `
        <div class="tags-section">
            <div class="tags-label">🏷️ Tags:</div>
            <div class="tags">
                ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="footer">
            <div class="footer-text">
                Generated by <span class="brand">Quillon – Tag it. Find it. Done.</span> on ${new Date().toLocaleDateString()}
            </div>
        </div>
    </div>
    
    <script>
        // Mobile-friendly PDF generation
        function downloadAsPDF() {
            // For mobile devices, create a downloadable HTML file that can be converted to PDF
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                // Create HTML file for mobile download
                const htmlContent = document.documentElement.outerHTML;
                const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = '${note.title || 'note'}-quillon.html';
                link.click();
                URL.revokeObjectURL(url);
                
                // Show instructions for mobile users
                setTimeout(() => {
                    alert('📱 Mobile Instructions:\n\n1. Open the downloaded HTML file\n2. Use your browser\'s "Share" or "Print" option\n3. Select "Save as PDF" or "Print to PDF"\n\nThis ensures the best quality PDF with your Quillon watermark!');
                }, 1000);
            } else {
                // Desktop: use print dialog
                window.print();
            }
        }
        
        // Auto-trigger download after page loads
        window.onload = () => {
            setTimeout(downloadAsPDF, 500);
        };
    </script>
</body>
</html>`;
}

// Generate clean TXT content without emojis
function generateTXTContent(note: Note): string {
  const createdDate = new Date(note.createdAt).toLocaleDateString();
  const updatedDate = note.updatedAt !== note.createdAt ? new Date(note.updatedAt).toLocaleDateString() : null;
  
  // Remove emojis from content
  const cleanContent = (note.content || 'No content available.')
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const quillonBanner = `
================================================================
                          QUILLON                            
                   Tag it. Find it. Done.                    
================================================================
`;
  
  const watermark = `
                            QUILLON
                     Tag it. Find it. Done.
`;
  
  const txtContent = [
    quillonBanner,
    '',
    `Title: ${note.title || 'Untitled Note'}`,
    '='.repeat(Math.max(60, `Title: ${note.title || 'Untitled Note'}`.length + 4)),
    '',
    `Created: ${createdDate}`,
    updatedDate ? `Updated: ${updatedDate}` : '',
    note.isPrivate ? 'Status: Private' : 'Status: Public',
    note.isFavorite ? 'Favorite: Yes' : '',
    '',
    'Content:',
    '-'.repeat(60),
    cleanContent,
    '',
    watermark,
    '',
    note.tags && note.tags.length > 0 ? `Tags: ${note.tags.map(tag => `#${tag}`).join(' ')}` : '',
    '',
    '-'.repeat(60),
    `Generated by Quillon on ${new Date().toLocaleDateString()}`,
    '-'.repeat(60)
  ].filter(line => line !== '').join('\n');
  
  return txtContent;
}

export async function downloadNote(note: Note, options: DownloadOptions) {
  const { format, suggestedName } = options;
  
  // Create filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const noteTitle = note.title ? note.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-') : 'untitled';
  const defaultFileName = suggestedName || `${noteTitle}-quillon-${timestamp}`;
  const fileName = `${defaultFileName}.${format}`;
  
  try {
    if (format === 'txt') {
      // Generate TXT content with Quillon branding and emoji support
      const txtContent = generateTXTContent(note);
      
      // Use UTF-8 encoding to support emojis
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      triggerDownload(blob, fileName);
      
      console.log(`✅ TXT download initiated: ${fileName}`);
      
    } else if (format === 'pdf') {
      // Generate true PDF using jsPDF - works on ALL devices!
      try {
        await generateTruePDF(note, fileName);
        console.log(`✅ True PDF downloaded successfully: ${fileName}`);
        
      } catch (pdfError) {
        console.warn('PDF generation failed, using HTML fallback:', pdfError);
        
        // Fallback to HTML if PDF generation fails
        const logoBase64 = await getQuillonLogo();
        const htmlContent = generateMobilePDFContent(note, logoBase64);
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        triggerDownload(blob, `${defaultFileName}.html`);
        
        alert('🚨 PDF generation failed. Downloaded as HTML instead.\n\n💡 Open the file and use Ctrl+P (Cmd+P on Mac) to save as PDF.');
      }
    }
    
  } catch (error) {
    console.error(`❌ Download failed:`, error);
    
    // User-friendly error with emoji
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    alert(`🚨 Download Failed\n\n${errorMessage}\n\n💡 Try again or contact Quillon support if the issue persists.`);
  }
}