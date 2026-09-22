import { jsonrepair } from "jsonrepair";

/**
 * Resilient JSON extractor and repair utility.
 * Cleans markdown code fences, fixes trailing commas, unescaped characters,
 * truncated endings, and parses into typed objects.
 */
export function extractAndRepairJSON<T = any>(rawText: string): T {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty or non-string response received from AI");
  }

  // 1. Strip markdown code fences if present
  let cleaned = rawText.trim();
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = jsonBlockRegex.exec(cleaned);
  if (match && match[1]) {
    cleaned = match[1].trim();
  } else {
    // Look for first '{' and last '}'
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  // 2. Try native JSON.parse first
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    // Proceed to repair
  }

  // 3. Try jsonrepair package
  try {
    const repaired = jsonrepair(cleaned);
    return JSON.parse(repaired) as T;
  } catch (err2) {
    // Proceed to manual heuristics
  }

  // 4. Manual heuristic cleanups:
  try {
    let heuristicText = cleaned
      // Remove comments
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // Remove trailing commas before } or ]
      .replace(/,\s*([\]}])/g, "$1")
      // Fix missing closing braces/brackets by balancing
      .trim();

    // Check balance of braces
    const openBraces = (heuristicText.match(/{/g) || []).length;
    const closeBraces = (heuristicText.match(/}/g) || []).length;
    const openBrackets = (heuristicText.match(/\[/g) || []).length;
    const closeBrackets = (heuristicText.match(/\]/g) || []).length;

    for (let i = 0; i < openBrackets - closeBrackets; i++) heuristicText += "]";
    for (let i = 0; i < openBraces - closeBraces; i++) heuristicText += "}";

    const repairedHeuristic = jsonrepair(heuristicText);
    return JSON.parse(repairedHeuristic) as T;
  } catch (err3) {
    console.error("JSON Repair failed. Original text preview:", cleaned.slice(0, 300));
    throw new Error(`Failed to parse AI output into valid JSON: ${(err3 as Error).message}`);
  }
}
