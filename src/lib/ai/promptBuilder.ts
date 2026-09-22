import { PaperGenerationConfig } from "@/types/paper";

export function buildSystemPrompt(config: PaperGenerationConfig): string {
  const isStrict = config.advancedOptions.strictSourceOnly;
  const allowExternal = config.advancedOptions.allowExternalKnowledge;

  let knowledgePolicy = "";
  if (isStrict && !allowExternal) {
    knowledgePolicy = `
CRITICAL GROUNDING RULES:
1. STRICT SOURCE-ONLY MODE IS ENABLED.
2. Every single question, option, answer, and explanation MUST BE STRICTLY GROUNDED in the provided SOURCE DOCUMENT CHUNKS.
3. DO NOT invent facts, data, laws, or examples not explicitly stated or directly inferred from the provided material.
4. If a selected topic has limited facts in the source text, formulate conceptual questions directly testing the stated facts rather than bringing outside syllabus.
`;
  } else if (allowExternal) {
    knowledgePolicy = `
KNOWLEDGE POLICY:
1. Primary emphasis must remain on the provided SOURCE DOCUMENT CHUNKS and topics.
2. You MAY supplement standard curriculum knowledge and standard examination formats where appropriate.
`;
  } else {
    knowledgePolicy = `
KNOWLEDGE POLICY:
1. Questions must prioritize and test concepts present in the provided SOURCE DOCUMENT.
2. Do not introduce irrelevant extraneous trivia.
`;
  }

  let languagePolicy = "";
  if (config.language === "hindi") {
    languagePolicy = `
LANGUAGE REQUIREMENT:
The question paper must be entirely in HINDI (Devanagari script). Provide question text, options, instructions, and explanations in fluent, grammatically accurate academic Hindi.
`;
  } else if (config.language === "bilingual") {
    languagePolicy = `
LANGUAGE REQUIREMENT:
The question paper is BILINGUAL (English and Hindi).
For each question:
- Provide "question" in English.
- Provide "hindiQuestion" in Hindi (Devanagari script).
- For MCQ options, provide "text" in English and "hindiText" in Hindi.
- For sections, provide "title" in English and "hindiTitle" in Hindi.
`;
  } else {
    languagePolicy = `
LANGUAGE REQUIREMENT:
The question paper must be in ENGLISH.
`;
  }

  return `You are an expert Academic Question Paper Setter and Curriculum Specialist.
Your task is to generate an authentic, examination-board grade Question Paper in strict, valid JSON format.

${knowledgePolicy}
${languagePolicy}

ADVANCED INSTRUCTIONS:
- Avoid duplicate questions or repetitive phrasing: ${config.advancedOptions.avoidDuplicates}
- Balance difficulty across Easy, Medium, and Hard: ${config.advancedOptions.balanceDifficulty}
- Balance chapter coverage evenly: ${config.advancedOptions.balanceChapterCoverage}
- Generate comprehensive answer keys and marking guidance: ${config.advancedOptions.generateAnswerKey}
- Generate clear explanations: ${config.advancedOptions.generateExplanations}

FORMAT SPECIFICATION:
You must respond with ONLY a single valid JSON object adhering strictly to this schema:
{
  "paperTitle": string,
  "subject": string,
  "class": string,
  "durationMinutes": number,
  "totalMarks": number,
  "generalInstructions": string[],
  "sections": [
    {
      "id": string,
      "title": string,
      "hindiTitle": string (optional),
      "instructions": string,
      "hindiInstructions": string (optional),
      "marksPerQuestion": number,
      "questions": [
        {
          "id": string,
          "number": number,
          "question": string,
          "hindiQuestion": string (optional),
          "type": "mcq" | "true_false" | "fill_in_blanks" | "very_short_answer" | "short_answer" | "long_answer" | "numerical" | "case_study" | "assertion_reason" | "match_the_following",
          "marks": number,
          "difficulty": "easy" | "medium" | "hard",
          "topic": string,
          "chapter": string,
          "options": [{"id": "opt_a", "label": "A", "text": "...", "hindiText": "..."}],
          "answer": string,
          "explanation": string
        }
      ]
    }
  ]
}

DO NOT include markdown backticks or explanations outside the JSON. Return only the raw JSON.`;
}

export function buildUserPrompt(config: PaperGenerationConfig, sourceText: string): string {
  const selectedChaptersText = config.selectedChapters.length > 0
    ? config.selectedChapters.map((c) => `- Chapter: ${c.chapterName}\n  Topics: ${c.topics.join(", ")}`).join("\n")
    : "All detected topics in the source text.";

  const questionTypesText = config.questionTypes.join(", ");

  return `Generate a question paper with the following exact parameters:

EXAMINATION SPECIFICATIONS:
- Subject: ${config.subject}
- Class / Grade: ${config.className}
- Exam Type: ${config.examType}
- Target Total Marks: ${config.totalMarks}
- Target Question Count: ${config.questionCount}
- Duration: ${config.durationMinutes} minutes
- Difficulty Distribution: ${config.difficulty}
- Allowed Question Types: ${questionTypesText}

SELECTED CHAPTERS & TOPICS TO COVER:
${selectedChaptersText}

${config.customInstructions ? `USER CUSTOM INSTRUCTIONS:\n${config.customInstructions}\n` : ""}

SOURCE DOCUMENT EXCERPTS (Grounded Content):
==================================================
${sourceText ? sourceText.slice(0, 15000) : "No source text provided. Use standard curriculum principles."}
==================================================

Please construct the sections logically (e.g. Section A: Objective/MCQ, Section B: Short Answer, Section C: Long Answer), ensure section marks sum up to exactly ${config.totalMarks} marks, and return only the structured JSON.`;
}
