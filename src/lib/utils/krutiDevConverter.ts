/**
 * Unicode Devanagari <-> Kruti Dev 010 Converter Utility.
 * Implements standard Remington mapping for Hindi exam paper authoring.
 */

// Mapping array for Unicode to Kruti Dev conversion
const UNICODE_TO_KRUTI_PAIRS: [string, string][] = [
  // Modified combinations
  ["क़", "क़"],
  ["ख़", "ख़"],
  ["ग़", "ग़"],
  ["ज़", "ज़"],
  ["ड़", "ड़"],
  ["ढ़", "ढ़"],
  ["फ़", "फ़"],

  // Matras with halants & conjuncts
  ["र्", "Z"], // Reph (as in धर्म -> /keZ)
  ["्र", "z"], // Rakar (as in प्रकाश -> izdk'k)
  ["्", ""],  // Halant handled in context

  // Vowels
  ["ॐ", "vksM+"],
  ["अं", "va"],
  ["अः", "v%"],
  ["औ", "vkS"],
  ["ओ", "vks"],
  ["आ", "vk"],
  ["अ", "v"],
  ["ई", "bZ"],
  ["इ", "b"],
  ["ऊ", "Å"],
  ["उ", "m"],
  ["ऋ", "_"],
  ["ऐ", "S"],
  ["ए", ","],

  // Consonants
  ["क", "d"],
  ["ख", "[k"],
  ["ग", "x"],
  ["घ", "?k"],
  ["ङ", "³"],
  ["च", "p"],
  ["छ", "N"],
  ["ज", "t"],
  ["झ", "Hk"],
  ["ञ", "¥"],
  ["ट", "V"],
  ["ठ", "B"],
  ["ड", "M"],
  ["ढ", "<"],
  ["ण", ".k"],
  ["त", "r"],
  ["थ", "Fk"],
  ["द", "n"],
  ["ध", "/k"],
  ["न", "u"],
  ["प", "i"],
  ["फ", "Q"],
  ["ब", "c"],
  ["भ", "Hk"],
  ["म", "e"],
  ["य", ";"],
  ["र", "j"],
  ["ल", "y"],
  ["व", "o"],
  ["श", "'k"],
  ["ष", "\"k"],
  ["स", "l"],
  ["ह", "g"],
  ["क्ष", "{k"],
  ["त्र", "=k"],
  ["ज्ञ", "K"],
  ["श्र", "J"],

  // Half letters (consonants followed by halant)
  ["क्", "D"],
  ["ख्", "["],
  ["ग्", "X"],
  ["घ्", "?"],
  ["च्", "P"],
  ["ज्", "T"],
  ["झ्", "÷"],
  ["ण्", "."],
  ["त्", "R"],
  ["थ्", "F"],
  ["ध्", "/"],
  ["न्", "U"],
  ["प्", "I"],
  ["फ्", "¶"],
  ["ब्", "C"],
  ["भ्", "H"],
  ["म्", "E"],
  ["य्", "Y"],
  ["ल्", "L"],
  ["व्", "O"],
  ["श्", "'"],
  ["ष्", "\""],
  ["स्", "L"],
  ["ह्र", "º"],
  ["ह्ल", "»"],
  ["ह्व", "¼"],

  // Matras
  ["ा", "k"],
  ["ी", "h"],
  ["ु", "q"],
  ["ू", "w"],
  ["ृ", "`"],
  ["े", "s"],
  ["ै", "S"],
  ["ो", "ks"],
  ["ौ", "kS"],
  ["ं", "a"],
  ["ँ", "¡"],
  ["ः", "%"],
  ["़", "+"],
  ["।", "A"], // Purna viram

  // Hindi digits
  ["०", "0"],
  ["१", "1"],
  ["२", "2"],
  ["३", "3"],
  ["४", "4"],
  ["५", "5"],
  ["६", "6"],
  ["७", "7"],
  ["८", "8"],
  ["९", "9"],
];

/**
 * Converts Unicode Devanagari text to Kruti Dev 010 layout
 */
export function unicodeToKrutiDev(text: string): string {
  if (!text) return "";

  let modified = text;

  // 1. Handle Chhoti 'i' (f) matra: in Unicode, matra 'ि' appears AFTER consonant,
  // but in Kruti Dev 010, 'f' appears BEFORE consonant cluster!
  // e.g., 'कि' -> 'fd', 'स्थि' -> 'flF'
  const chhotiIRegex = /([क-ह](?:्[क-ह])*)ि/g;
  modified = modified.replace(chhotiIRegex, "f$1");

  // 2. Handle Reph 'र्' appearing before consonant: in Kruti Dev it is typed as 'Z' after consonant and its matra
  const rephRegex = /र्([क-ह](?:्[क-ह])*(?:[ाीुूृेैोौं]*))/g;
  modified = modified.replace(rephRegex, "$1Z");

  // 3. Sequential replacement based on dictionary
  for (const [unicodeChar, krutiChar] of UNICODE_TO_KRUTI_PAIRS) {
    if (unicodeChar) {
      modified = modified.split(unicodeChar).join(krutiChar);
    }
  }

  return modified;
}

/**
 * Converts Kruti Dev 010 encoded text back to Unicode Devanagari
 */
export function krutiDevToUnicode(text: string): string {
  if (!text) return "";

  let modified = text;

  // Handle special Kruti Dev conjuncts
  const KRUTI_TO_UNICODE_PAIRS = [
    ...UNICODE_TO_KRUTI_PAIRS
      .filter(([u, k]) => k && k.length > 0 && u !== k)
      .sort((a, b) => b[1].length - a[1].length),
  ];

  for (const [unicodeChar, krutiChar] of KRUTI_TO_UNICODE_PAIRS) {
    modified = modified.split(krutiChar).join(unicodeChar);
  }

  // Restore chhoti 'i' (f) if inverted
  modified = modified.replace(/f([क-ह](?:्[क-ह])*)/g, "$1ि");
  // Restore reph (Z)
  modified = modified.replace(/([क-ह](?:्[क-ह])*(?:[ाीुूृेैोौं]*))Z/g, "र्$1");

  return modified;
}
