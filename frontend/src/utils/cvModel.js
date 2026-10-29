import { DEFAULT_THEME, normalizeTheme } from "./themes.js";

export const emptyCv = () => ({
  id: null,
  title: "",
  full_name: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  portfolio_url: "",
  summary: "",
  photo: "",
  language: "es",
  theme: DEFAULT_THEME,
  skills: "",
  languages: "",
  experience: [],
  education: [],
});

export const toDraft = (cv = {}) => ({
  ...emptyCv(),
  ...cv,
  id: cv.id ?? null,
  photo: cv.photo || "",
  language: cv.language === "en" ? "en" : "es",
  theme: normalizeTheme(cv.theme),
  skills: Array.isArray(cv.skills) ? cv.skills.join(", ") : cv.skills || "",
  languages: Array.isArray(cv.languages) ? cv.languages.join(", ") : cv.languages || "",
  experience: (Array.isArray(cv.experience) ? cv.experience : []).map((entry) => ({
    position: "",
    company: "",
    start_date: "",
    end_date: "",
    description: "",
    ...entry,
  })),
  education: (Array.isArray(cv.education) ? cv.education : []).map((entry) => ({
    degree: "",
    institution: "",
    start_date: "",
    end_date: "",
    description: "",
    ...entry,
  })),
});

export const splitList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const splitEntries = (entries) =>
  (Array.isArray(entries) ? entries : []).filter((entry) =>
    Object.values(entry || {}).some((value) => String(value || "").trim()),
  );

export const initialsFor = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CV";

export const completenessOf = (draft) => {
  if (!draft) return 0;
  const checks = [
    draft.full_name,
    draft.headline,
    draft.email,
    draft.phone,
    draft.location,
    draft.portfolio_url,
    draft.photo,
    draft.summary,
    splitEntries(draft.experience).length,
    splitEntries(draft.education).length,
    splitList(draft.skills).length >= 3,
    splitList(draft.languages).length,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};
