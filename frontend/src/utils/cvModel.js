import { DEFAULT_THEME, normalizeTheme } from "./themes.js";

const textOrEmpty = (value) => (value === null || value === undefined ? "" : String(value));

const normalizedEntry = (entry, fields) => {
  const source = entry || {};
  return Object.fromEntries(fields.map((field) => [field, textOrEmpty(source[field])]));
};

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
  title: textOrEmpty(cv.title),
  full_name: textOrEmpty(cv.full_name),
  headline: textOrEmpty(cv.headline),
  email: textOrEmpty(cv.email),
  phone: textOrEmpty(cv.phone),
  location: textOrEmpty(cv.location),
  portfolio_url: textOrEmpty(cv.portfolio_url),
  summary: textOrEmpty(cv.summary),
  photo: cv.photo || "",
  language: cv.language === "en" ? "en" : "es",
  theme: normalizeTheme(cv.theme),
  skills: Array.isArray(cv.skills) ? cv.skills.join(", ") : textOrEmpty(cv.skills),
  languages: Array.isArray(cv.languages) ? cv.languages.join(", ") : textOrEmpty(cv.languages),
  experience: (Array.isArray(cv.experience) ? cv.experience : []).map((entry) =>
    normalizedEntry(entry, ["position", "company", "start_date", "end_date", "description"]),
  ),
  education: (Array.isArray(cv.education) ? cv.education : []).map((entry) =>
    normalizedEntry(entry, ["degree", "institution", "start_date", "end_date", "description"]),
  ),
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
