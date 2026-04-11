// Types
export type Section = "Morning" | "Midday" | "AfterWork";
export type Language = "en" | "fr" | "es" | "pt" | "de" | "it";
export type ThemeName = "Dark Glass" | "Dark Matte" | "Light";

export type ThemeTokens = {
  bg: string;
  panel: string;
  column: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  blur: string;
};

export type Task = {
  id: string;
  title: string;
  section: Section;
  category?: string;
  done: boolean;
  comment?: string;
  createdAt: number;
  order?: number;
};

export type CalendarEvent = {
  id: string;
  dateKey: string;
  time: string;
  title: string;
  createdAt: number;
};

// Constants
export const SECTIONS: Section[] = ["Morning", "Midday", "AfterWork"];

export const THEMES: Record<ThemeName, ThemeTokens> = {
  "Dark Glass": {
    bg: "linear-gradient(160deg, #0c0f14 0%, #0a0c10 50%, #11151d 100%)",
    panel: "rgba(18, 22, 28, 0.72)",
    column: "rgba(18, 22, 28, 0.58)",
    card: "rgba(20, 24, 30, 0.75)",
    border: "1px solid rgba(255,255,255,0.08)",
    text: "rgba(245,245,245,0.95)",
    muted: "rgba(245,245,245,0.6)",
    blur: "blur(14px)",
  },
  "Dark Matte": {
    bg: "linear-gradient(160deg, #0f1116 0%, #0b0d12 100%)",
    panel: "#14171d",
    column: "#161a21",
    card: "#1a1f27",
    border: "1px solid rgba(255,255,255,0.06)",
    text: "rgba(245,245,245,0.95)",
    muted: "rgba(245,245,245,0.6)",
    blur: "none",
  },
  Light: {
    bg: "linear-gradient(160deg, #f3f4f7 0%, #e6e8ee 100%)",
    panel: "rgba(255,255,255,0.8)",
    column: "rgba(250,250,252,0.9)",
    card: "rgba(255,255,255,0.95)",
    border: "1px solid rgba(0,0,0,0.08)",
    text: "rgba(20,20,20,0.92)",
    muted: "rgba(20,20,20,0.6)",
    blur: "none",
  },
};

export const STORAGE_KEY = "journey_task_board_v1";
export const LANGUAGE_STORAGE_KEY = "journey_language_v1";
export const ALL_CATEGORIES = "__all__";

export const CODE_MAP_ENTRIES = [
  ["1", "A"],
  ["2", "Z"],
  ["3", "E"],
  ["4", "R"],
  ["5", "T"],
  ["6", "Y"],
  ["7", "U"],
  ["8", "I"],
  ["9", "O"],
  ["0", "P"],
  ["-", "Q"],
  ["/", "S"],
  [":", "D"],
  [";", "F"],
  ["(", "G"],
  [")", "H"],
  ["€", "J"],
  ["&", "K"],
  ["@", "L"],
  ['"', "M"],
  [".", "W"],
  [",", "X"],
  ["?", "C"],
  ["!", "V"],
  ["'", "B"],
  ["''", "N"],
] as const;

export const LETTER_TO_CODE = new Map<string, string>(
  CODE_MAP_ENTRIES.map(([code, letter]) => [letter, code])
);
export const CODE_TO_LETTER = new Map<string, string>(CODE_MAP_ENTRIES);

export const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: "en", label: "English" },
  { value: "fr", label: "Francais" },
  { value: "es", label: "Espanol" },
  { value: "pt", label: "Portugues" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
];

export const LOCALES: Record<Language, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-PT",
  de: "de-DE",
  it: "it-IT",
};

export const POINTS = {
  completedTask: 10,
  commentBonus: 5,
  completedDay: 20,
  streakPerDay: 1,
  streakCap: 60,
} as const;
