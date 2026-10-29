export const SHEET_LABELS = {
  es: {
    kicker: "Hoja de vida",
    profile: "Perfil",
    experience: "Experiencia laboral",
    education: "Formación académica",
    skills: "Habilidades",
    languages: "Idiomas",
    position: "Cargo",
    degree: "Título",
    footer: "Currículum vitae",
    photoAlt: "Foto de la hoja de vida",
    namePlaceholder: "Nombre completo",
  },
  en: {
    kicker: "Resume",
    profile: "Profile",
    experience: "Work experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    position: "Position",
    degree: "Degree",
    footer: "Curriculum vitae",
    photoAlt: "Photo",
    namePlaceholder: "Your name",
  },
};

export const sheetLocale = (language) => (language === "en" ? "en-US" : "es-DO");
