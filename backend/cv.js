import { Router } from "express";
import { getPool } from "./db.js";

const router = Router();

const LANGUAGES = new Set(["es", "en"]);
const THEMES = new Set(["esmeralda", "oceano", "vino", "ambar", "grafito", "violeta"]);
const PHOTO_MAX_CHARS = 900000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value, maxLength) => {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const stringList = (value, limit, maxLength) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, limit);
};

const entryList = (value, fields, limit) => {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, limit)
    .map((item) => {
      const record = {};
      for (const [field, maxLength] of Object.entries(fields)) {
        record[field] = String(item?.[field] ?? "").trim().slice(0, maxLength);
      }
      return record;
    })
    .filter((record) => Object.values(record).some(Boolean));
};

const photoValue = (value) => {
  if (value === null || value === undefined) return { photo: null };
  const photo = String(value).trim();
  if (!photo) return { photo: null };
  if (photo.length > PHOTO_MAX_CHARS) return { error: "La foto es demasiado grande" };
  if (!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(photo)) {
    return { error: "La foto debe ser una imagen JPG, PNG o WebP" };
  }
  return { photo };
};

const completenessOf = (row) => {
  const checks = [
    row.full_name,
    row.headline,
    row.email,
    row.phone,
    row.location,
    row.portfolio_url,
    row.photo || row.has_photo,
    row.summary,
    asArray(row.experience).length,
    asArray(row.education).length,
    asArray(row.skills).length >= 3,
    asArray(row.languages).length,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
};

const LIST_COLUMNS = `id, title, full_name, headline, email, phone, location, portfolio_url, summary,
  language, theme, experience, education, skills, languages,
  (photo IS NOT NULL AND photo <> '') AS has_photo,
  created_at, updated_at`;

const listRow = (row) => ({
  id: row.id,
  title: row.title,
  full_name: row.full_name,
  headline: row.headline,
  email: row.email,
  location: row.location,
  language: row.language,
  theme: row.theme,
  completeness: completenessOf(row),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const detailRow = (row) => ({
  ...row,
  has_photo: Boolean(row.photo),
  experience: asArray(row.experience),
  education: asArray(row.education),
  skills: asArray(row.skills),
  languages: asArray(row.languages),
});

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const parsePayload = (body) => {
  const fullName = text(body.full_name, 160);
  if (!fullName || fullName.length < 2) return { error: "Indica tu nombre completo" };

  const email = text(body.email, 190);
  if (email && !EMAIL_RE.test(email)) return { error: "El correo no es válido" };

  const language = String(body.language ?? "es").trim().toLowerCase();
  if (!LANGUAGES.has(language)) return { error: "El idioma de la hoja no es válido" };

  const theme = String(body.theme ?? "esmeralda").trim().toLowerCase();
  if (!THEMES.has(theme)) return { error: "El color de la hoja no es válido" };

  const portfolioUrl = text(body.portfolio_url, 255);
  if (portfolioUrl && !/^https?:\/\//i.test(portfolioUrl)) {
    return { error: "El enlace debe iniciar con http:// o https://" };
  }

  const parsedPhoto = photoValue(body.photo);
  if (parsedPhoto.error) return { error: parsedPhoto.error };

  const title = text(body.title, 120) || `${fullName} · CV`.slice(0, 120);

  return {
    data: {
      title,
      fullName,
      headline: text(body.headline, 160),
      email,
      phone: text(body.phone, 60),
      location: text(body.location, 160),
      portfolioUrl,
      summary: text(body.summary, 2000),
      photo: parsedPhoto.photo,
      language,
      theme,
      experience: entryList(
        body.experience,
        { position: 120, company: 150, start_date: 20, end_date: 20, description: 600 },
        15,
      ),
      education: entryList(
        body.education,
        { degree: 120, institution: 150, start_date: 20, end_date: 20, description: 400 },
        10,
      ),
      skills: stringList(body.skills, 30, 60),
      languages: stringList(body.languages, 12, 60),
    },
  };
};

const columnValues = (data) => [
  data.title,
  data.fullName,
  data.headline,
  data.email,
  data.phone,
  data.location,
  data.portfolioUrl,
  data.summary,
  data.photo,
  data.language,
  data.theme,
  JSON.stringify(data.experience),
  JSON.stringify(data.education),
  JSON.stringify(data.skills),
  JSON.stringify(data.languages),
];

router.get("/summary", async (req, res) => {
  const [rows] = await getPool().query(`SELECT ${LIST_COLUMNS} FROM cvs ORDER BY updated_at DESC`);
  const now = Date.now();
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
  const languages = { es: 0, en: 0 };
  let completenessSum = 0;
  let recent = 0;
  for (const row of rows) {
    languages[row.language] = (languages[row.language] || 0) + 1;
    completenessSum += completenessOf(row);
    if (new Date(row.updated_at).getTime() >= monthAgo) recent += 1;
  }
  res.json({
    total: rows.length,
    recent,
    languages,
    averageCompleteness: rows.length ? Math.round(completenessSum / rows.length) : 0,
    lastUpdated: rows[0]?.updated_at ?? null,
  });
});

router.get("/cvs", async (req, res) => {
  const conditions = [];
  const params = [];
  const language = String(req.query.language || "").trim().toLowerCase();
  if (LANGUAGES.has(language)) {
    conditions.push("language = ?");
    params.push(language);
  }
  const search = String(req.query.search || "").trim().slice(0, 100);
  if (search) {
    const escaped = search.replace(/[\\%_]/g, (match) => `\\${match}`);
    const like = `%${escaped}%`;
    conditions.push(
      "(title LIKE ? OR full_name LIKE ? OR headline LIKE ? OR email LIKE ? OR location LIKE ?)",
    );
    params.push(like, like, like, like, like);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await getPool().query(
    `SELECT ${LIST_COLUMNS} FROM cvs ${where} ORDER BY updated_at DESC, id DESC LIMIT 300`,
    params,
  );
  res.json({ cvs: rows.map(listRow) });
});

router.get("/cvs/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "La hoja indicada no es válida" });
  const [rows] = await getPool().query("SELECT * FROM cvs WHERE id = ?", [id]);
  if (!rows.length) return res.status(404).json({ message: "La hoja no existe" });
  res.json({ cv: detailRow(rows[0]) });
});

router.post("/cvs", async (req, res) => {
  const parsed = parsePayload(req.body || {});
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const [result] = await getPool().query(
    `INSERT INTO cvs
      (title, full_name, headline, email, phone, location, portfolio_url, summary, photo, language, theme, experience, education, skills, languages)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    columnValues(parsed.data),
  );
  res.status(201).json({ id: result.insertId });
});

router.put("/cvs/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "La hoja indicada no es válida" });
  const parsed = parsePayload(req.body || {});
  if (parsed.error) return res.status(400).json({ message: parsed.error });
  const [result] = await getPool().query(
    `UPDATE cvs SET
      title = ?, full_name = ?, headline = ?, email = ?, phone = ?, location = ?,
      portfolio_url = ?, summary = ?, photo = ?, language = ?, theme = ?, experience = ?,
      education = ?, skills = ?, languages = ?
     WHERE id = ?`,
    [...columnValues(parsed.data), id],
  );
  if (!result.affectedRows) return res.status(404).json({ message: "La hoja no existe" });
  res.json({ id });
});

router.post("/cvs/:id/duplicate", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "La hoja indicada no es válida" });
  const [rows] = await getPool().query("SELECT * FROM cvs WHERE id = ?", [id]);
  if (!rows.length) return res.status(404).json({ message: "La hoja no existe" });
  const source = rows[0];
  const jsonValue = (value) =>
    value === null || value === undefined
      ? null
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  const [result] = await getPool().query(
    `INSERT INTO cvs
      (title, full_name, headline, email, phone, location, portfolio_url, summary, photo, language, theme, experience, education, skills, languages)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `${source.title} (copia)`.slice(0, 120),
      source.full_name,
      source.headline,
      source.email,
      source.phone,
      source.location,
      source.portfolio_url,
      source.summary,
      source.photo,
      source.language,
      source.theme,
      jsonValue(source.experience),
      jsonValue(source.education),
      jsonValue(source.skills),
      jsonValue(source.languages),
    ],
  );
  res.status(201).json({ id: result.insertId });
});

router.delete("/cvs/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "La hoja indicada no es válida" });
  const [result] = await getPool().query("DELETE FROM cvs WHERE id = ?", [id]);
  if (!result.affectedRows) return res.status(404).json({ message: "La hoja no existe" });
  res.json({ ok: true });
});

export default router;
