import { Language, TranslationKey, translate } from "@/lib/i18n/translations";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

const DIFFICULTY_KEYS: Record<Difficulty, TranslationKey> = {
  BEGINNER: "masterClass.difficulty.BEGINNER",
  INTERMEDIATE: "masterClass.difficulty.INTERMEDIATE",
  ADVANCED: "masterClass.difficulty.ADVANCED"
};

const DIFFICULTY_CLASSES: Record<Difficulty, string> = {
  BEGINNER: "bg-yarn-sage-light text-yarn-charcoal",
  INTERMEDIATE: "bg-yarn-terracotta-light text-yarn-terracotta",
  ADVANCED: "bg-yarn-charcoal text-white"
};

export function LevelBadge({ difficulty, lang }: { difficulty: Difficulty; lang: Language }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_CLASSES[difficulty]}`}>
      {translate(lang, DIFFICULTY_KEYS[difficulty])}
    </span>
  );
}
