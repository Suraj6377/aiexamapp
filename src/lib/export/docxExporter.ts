import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import { QuestionPaper } from "@/types/paper";

/**
 * Generates a real Microsoft Word (.docx) document from a QuestionPaper object.
 */
export async function generateDocxBlob(paper: QuestionPaper, includeAnswerKey = false): Promise<Blob> {
  const children: any[] = [];
  const baseFont = paper.styling?.fontFamily === "Kruti Dev 010" ? "Kruti Dev 010" : (paper.styling?.fontFamily || "Calibri");

  // 1. Institution Header
  if (paper.header.institutionName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: paper.header.institutionName.toUpperCase(),
            bold: true,
            size: 32, // 16pt
            font: baseFont,
          }),
        ],
      })
    );
  }

  // Exam Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
      children: [
        new TextRun({
          text: paper.header.examName || paper.title,
          bold: true,
          size: 26, // 13pt
          font: baseFont,
        }),
      ],
    })
  );

  // Meta row: Class & Subject (Left), Duration & Max Marks (Right)
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Class: ", bold: true }),
                  new TextRun({ text: paper.header.className || paper.className }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Subject: ", bold: true }),
                  new TextRun({ text: paper.header.subject || paper.subject }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "Time Allowed: ", bold: true }),
                  new TextRun({ text: `${paper.header.durationMinutes || 180} Minutes` }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "Maximum Marks: ", bold: true }),
                  new TextRun({ text: `${paper.header.totalMarks || 100}` }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  children.push(metaTable);

  // General Instructions
  if (paper.header.generalInstructions && paper.header.generalInstructions.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: "General Instructions:", bold: true, size: 22 })],
      })
    );

    paper.header.generalInstructions.forEach((inst, idx) => {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 360 },
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true }),
            new TextRun({ text: inst }),
          ],
        })
      );
    });
  }

  // Divider
  children.push(
    new Paragraph({
      spacing: { before: 100, after: 200 },
      border: { bottom: { color: "666666", space: 1, style: BorderStyle.SINGLE, size: 6 } },
      children: [],
    })
  );

  // 2. Sections and Questions
  let questionCounter = 1;

  paper.sections.forEach((section) => {
    // Section Title
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 80 },
        children: [
          new TextRun({
            text: section.title.toUpperCase(),
            bold: true,
            size: 24,
          }),
        ],
      })
    );

    // Section instructions
    if (section.instructions) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [
            new TextRun({
              text: `(${section.instructions})`,
              italics: true,
              size: 20,
              color: "444444",
            }),
          ],
        })
      );
    }

    // Section Questions
    section.questions.forEach((q) => {
      const qNum = q.number || questionCounter++;

      // Question row with marks on the right
      const qTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 90, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    spacing: { before: 120, after: 60 },
                    children: [
                      new TextRun({ text: `Q${qNum}. `, bold: true, font: baseFont }),
                      new TextRun({ text: q.question, font: baseFont }),
                    ],
                  }),
                  ...((q.hindiQuestion || q.hindiText)
                    ? [
                        new Paragraph({
                          spacing: { after: 60 },
                          indent: { left: 360 },
                          children: [new TextRun({ text: (q.hindiQuestion || q.hindiText)!, italics: true, color: "333333", font: baseFont })],
                        }),
                      ]
                    : []),
                ],
              }),
              new TableCell({
                width: { size: 10, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    spacing: { before: 120 },
                    children: [new TextRun({ text: `[${q.marks}]`, bold: true })],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      children.push(qTable);

      // MCQ Options if present
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt) => {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              indent: { left: 720 },
              children: [
                new TextRun({ text: `(${opt.label}) `, bold: true }),
                new TextRun({ text: opt.text }),
                ...(opt.hindiText ? [new TextRun({ text: `  /  ${opt.hindiText}`, italics: true })] : []),
              ],
            })
          );
        });
      }
    });
  });

  // 3. Optional Answer Key Appendix
  if (includeAnswerKey || paper.includeAnswerKey) {
    children.push(
      new Paragraph({
        pageBreakBefore: true,
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 150 },
        children: [
          new TextRun({
            text: "ANSWER KEY & MARKING SCHEME",
            bold: true,
            size: 28,
            color: "003366",
          }),
        ],
      })
    );

    let akCounter = 1;
    paper.sections.forEach((sec) => {
      children.push(
        new Paragraph({
          spacing: { before: 180, after: 80 },
          children: [new TextRun({ text: sec.title, bold: true, size: 22 })],
        })
      );

      sec.questions.forEach((q) => {
        const qNum = q.number || akCounter++;
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            indent: { left: 360 },
            children: [
              new TextRun({ text: `Q${qNum} [${q.marks}M]: `, bold: true }),
              new TextRun({ text: q.answer || "Answer as per standard guidelines." }),
              ...(q.explanation ? [new TextRun({ text: ` (Note: ${q.explanation})`, italics: true, color: "555555" })] : []),
            ],
          })
        );
      });
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
