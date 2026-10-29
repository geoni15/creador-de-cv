const STORE_KEY = "creador_cv_demo_cvs";
const PHOTO_MAX_CHARS = 900000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value, maxLength) => {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
};

const asArray = (value) => (Array.isArray(value) ? value : []);

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

const completenessOf = (row) => {
  const checks = [
    row.full_name,
    row.headline,
    row.email,
    row.phone,
    row.location,
    row.portfolio_url,
    row.photo,
    row.summary,
    asArray(row.experience).length,
    asArray(row.education).length,
    asArray(row.skills).length >= 3,
    asArray(row.languages).length,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
};

const readRows = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeRows = (rows) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(rows));
  } catch {
    throw new Error("El almacenamiento del navegador está lleno");
  }
};

const parsePayload = (body) => {
  const fullName = text(body.full_name, 160);
  if (!fullName || fullName.length < 2) throw new Error("Indica tu nombre completo");

  const email = text(body.email, 190);
  if (email && !EMAIL_RE.test(email)) throw new Error("El correo no es válido");

  const language = String(body.language ?? "es").trim().toLowerCase();
  if (language !== "es" && language !== "en") {
    throw new Error("El idioma de la hoja no es válido");
  }

  const portfolioUrl = text(body.portfolio_url, 255);
  if (portfolioUrl && !/^https?:\/\//i.test(portfolioUrl)) {
    throw new Error("El enlace debe iniciar con http:// o https://");
  }

  let photo = null;
  if (body.photo !== null && body.photo !== undefined) {
    const candidate = String(body.photo).trim();
    if (candidate) {
      if (candidate.length > PHOTO_MAX_CHARS) throw new Error("La foto es demasiado grande");
      if (!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(candidate)) {
        throw new Error("La foto debe ser una imagen JPG, PNG o WebP");
      }
      photo = candidate;
    }
  }

  return {
    title: text(body.title, 120) || `${fullName} · CV`.slice(0, 120),
    full_name: fullName,
    headline: text(body.headline, 160),
    email,
    phone: text(body.phone, 60),
    location: text(body.location, 160),
    portfolio_url: portfolioUrl,
    summary: text(body.summary, 2000),
    photo,
    language,
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
  };
};

const listRow = (row) => ({
  id: row.id,
  title: row.title,
  full_name: row.full_name,
  headline: row.headline,
  email: row.email,
  location: row.location,
  language: row.language,
  completeness: completenessOf(row),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const summaryOf = (rows) => {
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const languages = { es: 0, en: 0 };
  let completenessSum = 0;
  let recent = 0;
  for (const row of rows) {
    languages[row.language] = (languages[row.language] || 0) + 1;
    completenessSum += completenessOf(row);
    if (new Date(row.updated_at).getTime() >= monthAgo) recent += 1;
  }
  return {
    total: rows.length,
    recent,
    languages,
    averageCompleteness: rows.length ? Math.round(completenessSum / rows.length) : 0,
    lastUpdated: rows.length ? rows[0].updated_at : null,
  };
};

const findRow = (rows, id) => rows.find((row) => row.id === id) || null;

export async function localFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const [pathname, queryString = ""] = path.split("?");
  const query = new URLSearchParams(queryString);
  const body = options.body || {};
  const segments = pathname.split("/").filter(Boolean);
  const rows = readRows().sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  if (segments[0] === "summary" && method === "GET") {
    return summaryOf(rows);
  }

  if (segments[0] === "cvs" && segments.length === 1) {
    if (method === "GET") {
      const language = query.get("language");
      const search = String(query.get("search") || "").trim().toLowerCase();
      const filtered = rows
        .filter((row) => (language ? row.language === language : true))
        .filter((row) =>
          search
            ? ["title", "full_name", "headline", "email", "location"].some((field) =>
                String(row[field] || "").toLowerCase().includes(search),
              )
            : true,
        )
        .slice(0, 300);
      return { cvs: filtered.map(listRow) };
    }
    if (method === "POST") {
      const data = parsePayload(body);
      const now = new Date().toISOString();
      const id = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
      const row = { id, ...data, created_at: now, updated_at: now };
      writeRows([row, ...readRows()]);
      return { id };
    }
  }

  if (segments[0] === "cvs" && segments.length >= 2) {
    const id = Number(segments[1]);
    if (!Number.isInteger(id) || id <= 0) throw new Error("La hoja indicada no es válida");
    const row = findRow(rows, id);

    if (segments.length === 2 && method === "GET") {
      if (!row) throw new Error("La hoja no existe");
      return { cv: { ...row } };
    }
    if (segments.length === 2 && method === "PUT") {
      if (!row) throw new Error("La hoja no existe");
      const data = parsePayload(body);
      const updated = { ...row, ...data, updated_at: new Date().toISOString() };
      writeRows(readRows().map((item) => (item.id === id ? updated : item)));
      return { id };
    }
    if (segments.length === 2 && method === "DELETE") {
      if (!row) throw new Error("La hoja no existe");
      writeRows(readRows().filter((item) => item.id !== id));
      return { ok: true };
    }
    if (segments.length === 3 && segments[2] === "duplicate" && method === "POST") {
      if (!row) throw new Error("La hoja no existe");
      const now = new Date().toISOString();
      const newId = rows.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      const { id: _sourceId, created_at: _createdAt, ...rest } = row;
      const copy = {
        ...rest,
        id: newId,
        title: `${row.title} (copia)`.slice(0, 120),
        created_at: now,
        updated_at: now,
      };
      writeRows([copy, ...readRows()]);
      return { id: newId };
    }
  }

  throw new Error("Solicitud no válida");
}
