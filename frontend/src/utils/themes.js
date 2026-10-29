export const CV_THEMES = [
  { id: "esmeralda", label: "Esmeralda", accent: "#00ad55", strong: "#19543c", secondary: "#163d35" },
  { id: "oceano", label: "Océano", accent: "#2f6fed", strong: "#1e3a8a", secondary: "#1e293b" },
  { id: "vino", label: "Vino", accent: "#c2263f", strong: "#7a1024", secondary: "#3a1a22" },
  { id: "ambar", label: "Ámbar", accent: "#d99a00", strong: "#6b4a00", secondary: "#3a3122" },
  { id: "grafito", label: "Grafito", accent: "#64748b", strong: "#1e293b", secondary: "#1f2937" },
  { id: "violeta", label: "Violeta", accent: "#7c3aed", strong: "#4c1d95", secondary: "#2e1a47" },
];

export const DEFAULT_THEME = "esmeralda";

export const normalizeTheme = (value) => {
  const id = String(value ?? "").trim().toLowerCase();
  return CV_THEMES.some((theme) => theme.id === id) ? id : DEFAULT_THEME;
};

export const themeById = (value) =>
  CV_THEMES.find((theme) => theme.id === normalizeTheme(value));
