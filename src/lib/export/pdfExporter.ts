import { QuestionPaper } from "@/types/paper";

/**
 * PDF / Print exporter.
 * Configures print stylesheet with @page dimensions, paper margins,
 * watermark overlays, and triggers browser print rendering.
 */
export function triggerPaperPrint(paper: QuestionPaper, printElementId = "paper-printable-area") {
  const element = document.getElementById(printElementId);
  if (!element) {
    window.print();
    return;
  }

  // Create temporary print style override for exact margins and paper size
  const styleId = "paper-print-style-override";
  let existingStyle = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!existingStyle) {
    existingStyle = document.createElement("style");
    existingStyle.id = styleId;
    document.head.appendChild(existingStyle);
  }

  const { paperSize, margins } = paper.styling;
  const sizeMap: Record<string, string> = {
    A4: "A4",
    A5: "A5",
    letter: "letter",
    legal: "legal",
  };

  existingStyle.innerHTML = `
    @media print {
      @page {
        size: ${sizeMap[paperSize] || "A4"} portrait;
        margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
      }
      body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        ${paper.styling.fontFamily === "Kruti Dev 010" ? "font-family: 'Kruti Dev 010', 'KrutiDev010', sans-serif !important;" : ""}
      }
      .no-print, nav, aside, header, footer, button, .editor-sidebar, .editor-inspector, .drag-handle {
        display: none !important;
      }
      #paper-printable-area {
        display: block !important;
        width: 100% !important;
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .paper-page {
        box-shadow: none !important;
        border: none !important;
        margin: 0 0 20px 0 !important;
        page-break-after: always;
        break-after: page;
        ${paper.styling.fontFamily === "Kruti Dev 010" ? "font-family: 'Kruti Dev 010', 'KrutiDev010', sans-serif !important;" : ""}
      }
      .question-block {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
  `;

  // Trigger print dialog
  setTimeout(() => {
    window.print();
  }, 150);
}
