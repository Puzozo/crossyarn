/**
 * Ukrainian → Latin transliteration (official DSTU 3971:2003).
 * Used to create a searchable ASCII representation of Cyrillic titles.
 */

const MAP: Record<string, string> = {
  "а": "a", "б": "b", "в": "v", "г": "h", "ґ": "g",
  "д": "d", "е": "e", "є": "ye", "ж": "zh",
  "з": "z", "и": "y", "і": "i", "ї": "yi",
  "й": "y", "к": "k", "л": "l", "м": "m",
  "н": "n", "о": "o", "п": "p", "р": "r",
  "с": "s", "т": "t", "у": "u", "ф": "f",
  "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh",
  "щ": "shch", "ь": "", "ю": "yu", "я": "ya",
  "А": "A", "Б": "B", "В": "V", "Г": "H", "Ґ": "G",
  "Д": "D", "Е": "E", "Є": "Ye", "Ж": "Zh",
  "З": "Z", "И": "Y", "І": "I", "Ї": "Yi",
  "Й": "Y", "К": "K", "Л": "L", "М": "M",
  "Н": "N", "О": "O", "П": "P", "Р": "R",
  "С": "S", "Т": "T", "У": "U", "Ф": "F",
  "Х": "Kh", "Ц": "Ts", "Ч": "Ch", "Ш": "Sh",
  "Щ": "Shch", "Ь": "", "Ю": "Yu", "Я": "Ya",
};

/**
 * Transliterate a Cyrillic (Ukrainian) string to ASCII Latin.
 * Characters not in the map are passed through unchanged.
 */
export function translit(text: string): string {
  return text.split("").map((ch) => MAP[ch] ?? ch).join("");
}
