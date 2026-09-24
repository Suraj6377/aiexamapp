import { PaperGenerationConfig } from "@/types/paper";

export function buildSystemPrompt(config: PaperGenerationConfig): string {
  const adv = config.advancedOptions || {
    strictSourceOnly: true,
    allowExternalKnowledge: false,
    avoidDuplicates: true,
    balanceDifficulty: true,
    balanceChapterCoverage: true,
    generateAnswerKey: true,
    generateExplanations: true,
  };

  const isStrict = adv.strictSourceOnly;
  const allowExternal = adv.allowExternalKnowledge;

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

  return `You are an expert Academic Question Paper Setter, CBSE/ICSE Board Examiner, and Senior Curriculum Specialist.
Your task is to generate an authentic, error-free, examination-board grade Question Paper in strict, valid JSON format.

${knowledgePolicy}
${languagePolicy}

PEDAGOGICAL & ACCURACY REQUIREMENTS:
1. RIGOROUS ACCURACY: Every scientific formula, mathematical calculation, historical date, definition, and concept must be 100% factually and analytically accurate.
2. COGNITIVE LEVEL DISTRIBUTION (Bloom's Taxonomy):
   - 20% Knowledge & Recall (Definitions, direct laws, terminology)
   - 40% Conceptual Understanding & Explanation (Why, how, differences)
   - 30% Application & Numerical Problems (Formulas, real scenarios, step-by-step solving)
   - 10% Analytical & Evaluation (Higher Order Thinking / H.O.T.S.)
3. MULTIPLE CHOICE (MCQ) EXCELLENCE:
   - Provide exactly 4 plausible options labeled (A), (B), (C), and (D).
   - Ensure ONE unambiguously correct answer.
   - Craft smart, realistic distractors representing common student misconceptions. Strictly avoid trivial "All of the above" or "None of these" unless required.
4. HINDI & BILINGUAL ACCURACY:
   - Use standard NCERT/State Board Devanagari academic vocabulary (e.g., 'विद्युत अपघटन', 'मोल प्रभाज', 'ओम का नियम', 'प्रकाश संश्लेषण', 'समाकलन').
   - For bilingual mode, both English and Hindi versions must match the concept and option order identically.
5. MATHEMATICAL & NUMERICAL COMPLETENESS:
   - State all given values and physical constants clearly (e.g., g = 9.8 m/s², R = 8.314 J/mol·K).
   - Provide step-by-step marking in the 'explanation' field.
6. EXACT MARKS & STRUCTURE:
   - The sum of marks of all questions MUST EQUAL EXACTLY the Target Total Marks (${config.totalMarks}).
   - Number questions sequentially across sections: 1, 2, 3... without skipping or resetting.

ADVANCED INSTRUCTIONS:
- Avoid duplicate questions or repetitive phrasing: ${adv.avoidDuplicates ?? true}
- Balance difficulty across Easy, Medium, and Hard: ${adv.balanceDifficulty ?? true}
- Balance chapter coverage evenly: ${adv.balanceChapterCoverage ?? true}
- Generate comprehensive answer keys and marking guidance: ${adv.generateAnswerKey ?? true}
- Generate clear explanations: ${adv.generateExplanations ?? true}

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
  const selectedChaptersText = (config.selectedChapters && config.selectedChapters.length > 0)
    ? config.selectedChapters.map((c) => `- Chapter: ${c.chapterName}\n  Topics: ${c.topics?.join(", ") || "Key Concepts"}`).join("\n")
    : "All detected syllabus topics in the provided source text.";

  const questionTypesText = (config.questionTypes && config.questionTypes.length > 0)
    ? config.questionTypes.join(", ")
    : "MCQ, Short Answer, Long Answer";

  return `Generate an examination-board quality question paper adhering to these specifications:

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
${sourceText ? sourceText.slice(0, 16000) : "No source text provided. Use standard NCERT/CBSE curriculum."}
==================================================

CONSTRUCTION RULES:
1. Divide questions logically into sections (e.g. Section A: 1-mark MCQs/Objective, Section B: 2/3-mark Short Answer, Section C: 5-mark Long Answer/Numericals).
2. The total sum of marks of all questions across all sections MUST equal exactly ${config.totalMarks} marks.
3. Every question must be distinct and non-overlapping. Return ONLY the valid JSON object.`;
}
