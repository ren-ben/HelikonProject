import { jsPDF } from 'jspdf';
import { convertMarkdownToDocx } from '@mohtasham/md-to-docx';

/**
 * Download a blob as a file
 */
export function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Export markdown to DOCX
 */
export async function exportToDocx(markdownContent, filename) {
  const blob = await convertMarkdownToDocx(markdownContent);
  downloadBlob(blob, `${filename}.docx`);
}

/**
 * Export markdown to MD file
 */
export function exportToMarkdown(markdownContent, filename) {
  const blob = new Blob([markdownContent], { type: 'text/markdown' });
  downloadBlob(blob, `${filename}.md`);
}

/**
 * Export text to TXT file
 */
export function exportToText(textContent, filename) {
  const blob = new Blob([textContent], { type: 'text/plain' });
  downloadBlob(blob, `${filename}.txt`);
}

/**
 * Export content to PDF with text wrapping
 * @param {string} textContent - Plain text or formatted content
 * @param {string} filename - Output filename
 * @param {object} options - PDF options
 */
export async function exportTextToPDF(textContent, filename, options = {}) {
  const {
    title = '',
    metadata = {},
    fontSize = 10,
    lineHeight = 6,
    marginX = 20,
    marginY = 20,
  } = options;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const maxWidth = pageWidth - 2 * marginX;
  let yPosition = marginY;

  // Helper to add new page
  const checkPageBreak = (neededSpace = 10) => {
    if (yPosition + neededSpace > pageHeight - marginY) {
      pdf.addPage();
      yPosition = marginY;
      return true;
    }
    return false;
  };

  // Add title if provided
  if (title) {
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text(title, marginX, yPosition);
    yPosition += 10;
  }

  // Add metadata if provided
  if (Object.keys(metadata).length > 0) {
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    Object.entries(metadata).forEach(([key, value]) => {
      checkPageBreak(6);
      pdf.text(`${key}: ${value}`, marginX, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  // Add main content
  pdf.setFontSize(fontSize);
  pdf.setFont(undefined, 'normal');

  const lines = textContent.split('\n');
  lines.forEach((line) => {
    if (!line.trim()) {
      yPosition += lineHeight / 2;
      return;
    }

    const wrappedLines = pdf.splitTextToSize(line, maxWidth);
    wrappedLines.forEach((wrappedLine) => {
      checkPageBreak(lineHeight);
      pdf.text(wrappedLine, marginX, yPosition);
      yPosition += lineHeight;
    });
  });

  const blob = pdf.output('blob');
  downloadBlob(blob, `${filename}.pdf`);
}

/**
 * Export HTML content to PDF using html2canvas
 * (For styled previews like in ExportDialog)
 */
export async function exportHtmlToPDF(htmlElement, filename) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  // Temporarily reset zoom
  const origTransform = htmlElement.style.transform;
  htmlElement.style.transform = 'scale(1)';

  const canvas = await html2canvas(htmlElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  htmlElement.style.transform = origTransform;

  // A4 dimensions
  const pageW = 210;
  const pageH = 297;
  const marginX = 5;
  const marginY = 10;
  const contentW = pageW - 2 * marginX;
  const contentH = pageH - 2 * marginY;

  const imgW = contentW;
  const imgH = (canvas.height / canvas.width) * imgW;

  const pdf = new jsPDF('p', 'mm', 'a4');
  let yOffset = 0;

  while (yOffset < imgH) {
    if (yOffset > 0) pdf.addPage();

    const sliceH = Math.min(contentH, imgH - yOffset);
    const srcY = (yOffset / imgH) * canvas.height;
    const srcH = (sliceH / imgH) * canvas.height;

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = srcH;
    const ctx = sliceCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

    const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(sliceData, 'JPEG', marginX, marginY, contentW, sliceH);

    yOffset += contentH;
  }

  const blob = pdf.output('blob');
  downloadBlob(blob, `${filename}.pdf`);
}

/**
 * Export chat conversation to styled PDF
 * @param {Array} messages - Array of message objects {role, message, timestamp, modelUsed}
 * @param {string} filename - Output filename
 * @param {object} options - PDF options
 */
export async function exportChatToPDF(messages, filename, options = {}) {
  const {
    title = 'Chatverlauf',
    metadata = {},
  } = options;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Colors
  const userColor = { r: 33, g: 150, b: 243 }; // Blue
  const assistantColor = { r: 76, g: 175, b: 80 }; // Green
  const bgLightBlue = { r: 227, g: 242, b: 253 };
  const bgLightGreen = { r: 232, g: 245, b: 233 };

  // Helper to add new page
  const checkPageBreak = (neededSpace = 20) => {
    if (yPosition + neededSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Header - Title
  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(60, 60, 60);
  pdf.text(title, margin, yPosition);
  yPosition += 10;

  // Metadata
  if (Object.keys(metadata).length > 0) {
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(120, 120, 120);
    Object.entries(metadata).forEach(([key, value]) => {
      pdf.text(`${key}: ${value}`, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  // Divider line
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Process each message
  messages.forEach((msg, index) => {
    const isUser = msg.role === 'user';
    const roleLabel = isUser ? 'Sie' : 'AI Assistant';
    const color = isUser ? userColor : assistantColor;
    const bgColor = isUser ? bgLightBlue : bgLightGreen;

    checkPageBreak(40);

    // Message container background
    const messageStartY = yPosition;

    // Role badge
    pdf.setFillColor(color.r, color.g, color.b);
    pdf.roundedRect(margin, yPosition, 25, 6, 1, 1, 'F');
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(roleLabel, margin + 12.5, yPosition + 4, { align: 'center' });

    // Timestamp
    if (msg.timestamp) {
      const timestamp = new Date(msg.timestamp).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.setFontSize(7);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(120, 120, 120);
      pdf.text(timestamp, pageWidth - margin, yPosition + 4, { align: 'right' });
    }

    yPosition += 10;

    // Model info
    if (msg.modelUsed) {
      pdf.setFontSize(7);
      pdf.setFont(undefined, 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Modell: ${msg.modelUsed}`, margin + 2, yPosition);
      yPosition += 5;
    }

    // Message content with background
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(40, 40, 40);

    const contentLines = pdf.splitTextToSize(msg.message, maxWidth - 4);
    const contentHeight = contentLines.length * 5 + 6;

    // Draw background box
    pdf.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    pdf.roundedRect(margin, yPosition - 2, maxWidth, contentHeight, 2, 2, 'F');

    // Draw border
    pdf.setDrawColor(color.r, color.g, color.b);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, yPosition - 2, maxWidth, contentHeight, 2, 2, 'S');

    // Add text content
    contentLines.forEach((line) => {
      checkPageBreak(6);
      pdf.text(line, margin + 2, yPosition + 2);
      yPosition += 5;
    });

    yPosition += 10; // Space between messages

    // Light separator line
    if (index < messages.length - 1) {
      checkPageBreak(5);
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.1);
      pdf.line(margin + 10, yPosition, pageWidth - margin - 10, yPosition);
      yPosition += 8;
    }
  });

  const blob = pdf.output('blob');
  downloadBlob(blob, `${filename}.pdf`);
}
