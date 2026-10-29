import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WorkspaceShell from "./components/WorkspaceShell.jsx";
import CvForm from "./components/CvForm.jsx";
import CvSheet from "./components/CvSheet.jsx";
import { apiFetch, IS_LOCAL_MODE } from "./utils/api.js";
import { ToastStack } from "./utils/toast.jsx";
import { useToastQueue } from "./utils/useToastQueue.js";
import {
  completenessOf,
  emptyCv,
  splitEntries,
  splitList,
  toDraft,
} from "./utils/cvModel.js";
import { readPhotoFile } from "./utils/photo.js";

const FILTER_LABELS = {
  "": "Todas las hojas",
  es: "Hojas en español",
  en: "Hojas en inglés",
};

export default function App() {
  const { toasts, notify, dismiss } = useToastQueue();
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("creador_cv_dark_mode") === "true";
    } catch {
      return false;
    }
  });
  const [connection, setConnection] = useState("loading");
  const [summary, setSummary] = useState(null);
  const [cvs, setCvs] = useState([]);
  const [languageFilter, setLanguageFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState("form");
  const [saving, setSaving] = useState(false);

  const detailRequestRef = useRef(0);
  const listRequestRef = useRef(0);
  const initialSelectRef = useRef(false);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("es-DO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  const formatDate = useCallback(
    (value) => {
      if (!value) return "—";
      const date = new Date(value);
      if (Number.isNaN(date.valueOf())) return "—";
      return dateFormatter.format(date);
    },
    [dateFormatter],
  );

  useEffect(() => {
    try {
      localStorage.setItem("creador_cv_dark_mode", String(darkMode));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [darkMode]);

  const loadSummary = useCallback(async () => {
    try {
      const data = await apiFetch("/summary");
      setSummary(data);
      setConnection(IS_LOCAL_MODE ? "local" : "online");
      return data;
    } catch {
      setConnection("offline");
      return null;
    }
  }, []);

  const loadCvs = useCallback(async () => {
    const requestId = ++listRequestRef.current;
    setListLoading(true);
    try {
      const params = new URLSearchParams();
      if (languageFilter) params.set("language", languageFilter);
      if (searchTerm) params.set("search", searchTerm);
      const query = params.toString();
      const data = await apiFetch(`/cvs${query ? `?${query}` : ""}`);
      if (requestId !== listRequestRef.current) return null;
      const rows = data.cvs || [];
      setCvs(rows);
      setConnection(IS_LOCAL_MODE ? "local" : "online");
      return rows;
    } catch (error) {
      if (requestId === listRequestRef.current) {
        setConnection("offline");
        notify(error.message, "error");
      }
      return null;
    } finally {
      if (requestId === listRequestRef.current) setListLoading(false);
    }
  }, [languageFilter, searchTerm, notify]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadCvs();
  }, [loadCvs]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const selectCv = useCallback(
    async (id) => {
      const requestId = ++detailRequestRef.current;
      setSelectedId(id);
      setIsNew(false);
      setTab("form");
      setDetailLoading(true);
      try {
        const data = await apiFetch(`/cvs/${id}`);
        if (requestId !== detailRequestRef.current) return;
        setDraft(toDraft(data.cv));
      } catch (error) {
        if (requestId !== detailRequestRef.current) return;
        notify(error.message, "error");
        setDraft(null);
      } finally {
        if (requestId === detailRequestRef.current) setDetailLoading(false);
      }
    },
    [notify],
  );

  useEffect(() => {
    if (initialSelectRef.current || isNew || draft || detailLoading || listLoading) return;
    if (cvs.length === 0) return;
    initialSelectRef.current = true;
    selectCv(cvs[0].id);
  }, [cvs, draft, detailLoading, isNew, listLoading, selectCv]);

  const startNew = () => {
    detailRequestRef.current += 1;
    setSelectedId(null);
    setIsNew(true);
    setDraft(toDraft(emptyCv()));
    setTab("form");
    setDetailLoading(false);
  };

  const cancelNew = () => {
    setIsNew(false);
    setDraft(null);
    setSelectedId(null);
    setTab("form");
  };

  const updateField = (field, value) =>
    setDraft((current) => (current ? { ...current, [field]: value } : current));

  const updateEntry = (listName, index, field, value) =>
    setDraft((current) => {
      if (!current) return current;
      const list = current[listName].map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      );
      return { ...current, [listName]: list };
    });

  const addEntry = (listName) =>
    setDraft((current) => {
      if (!current) return current;
      const blank =
        listName === "experience"
          ? { position: "", company: "", start_date: "", end_date: "", description: "" }
          : { degree: "", institution: "", start_date: "", end_date: "", description: "" };
      return { ...current, [listName]: [...current[listName], blank] };
    });

  const removeEntry = (listName, index) =>
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        [listName]: current[listName].filter((_, entryIndex) => entryIndex !== index),
      };
    });

  const handlePhotoFile = async (file) => {
    try {
      const photo = await readPhotoFile(file);
      updateField("photo", photo);
      notify("Foto actualizada");
    } catch (error) {
      notify(error.message || "No se pudo cargar la foto", "error");
    }
  };

  const saveCv = async (event) => {
    event.preventDefault();
    if (!draft || saving) return;
    const payload = {
      title: draft.title,
      full_name: draft.full_name,
      headline: draft.headline,
      email: draft.email || null,
      phone: draft.phone || null,
      location: draft.location || null,
      portfolio_url: draft.portfolio_url || null,
      summary: draft.summary || null,
      photo: draft.photo || null,
      language: draft.language,
      experience: splitEntries(draft.experience),
      education: splitEntries(draft.education),
      skills: splitList(draft.skills),
      languages: splitList(draft.languages),
    };
    setSaving(true);
    try {
      if (isNew) {
        const data = await apiFetch("/cvs", { method: "POST", body: payload });
        notify("Hoja de vida creada");
        setIsNew(false);
        await loadSummary();
        await selectCv(data.id);
        await loadCvs();
      } else {
        await apiFetch(`/cvs/${draft.id}`, { method: "PUT", body: payload });
        notify("Cambios guardados");
        await loadSummary();
        await loadCvs();
      }
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const duplicateCv = async () => {
    if (!draft?.id) return;
    try {
      const data = await apiFetch(`/cvs/${draft.id}/duplicate`, { method: "POST" });
      notify("Copia creada");
      await loadSummary();
      await loadCvs();
      await selectCv(data.id);
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const removeCv = async () => {
    if (!draft?.id) return;
    if (!window.confirm("¿Eliminar esta hoja de vida? Esta acción no se puede deshacer.")) {
      return;
    }
    try {
      await apiFetch(`/cvs/${draft.id}`, { method: "DELETE" });
      notify("Hoja eliminada");
      detailRequestRef.current += 1;
      setDraft(null);
      setSelectedId(null);
      setIsNew(false);
      setTab("form");
      await loadSummary();
      const rows = await loadCvs();
      if (rows?.length) await selectCv(rows[0].id);
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const setSheetLanguage = (language) => {
    if (draft && draft.language !== language) updateField("language", language);
  };

  const handleLanguageFilter = (id) => {
    setLanguageFilter(id === "all" ? "" : id);
  };

  const completeness = useMemo(() => completenessOf(draft), [draft]);
  const filterLabel = FILTER_LABELS[languageFilter] || FILTER_LABELS[""];

  return (
    <WorkspaceShell
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      connection={connection}
      storageLabel={IS_LOCAL_MODE ? "Navegador · demo" : "MySQL · creador_cv"}
      pageEyebrow="Portafolio personal"
      pageTitle="Mis hojas de vida"
      pathParts={["Portafolio personal", "ES · EN", "A4"]}
      headingActions={
        <button type="button" className="primary-button" onClick={startNew}>
          Nueva hoja de vida
        </button>
      }
      languageFilter={languageFilter}
      onLanguageFilter={handleLanguageFilter}
      counts={{
        total: summary?.total ?? 0,
        es: summary?.languages?.es ?? 0,
        en: summary?.languages?.en ?? 0,
      }}
      onNew={startNew}
    >
      <div className="cv-stats">
        <article className="cv-stat">
          <span>Hojas de vida</span>
          <strong>{summary?.total ?? 0}</strong>
          <small>En tu portafolio</small>
        </article>
        <article className="cv-stat">
          <span>Actualizadas</span>
          <strong>{summary?.recent ?? 0}</strong>
          <small>Últimos 30 días</small>
        </article>
        <article className="cv-stat">
          <span>Completitud</span>
          <strong>{summary?.averageCompleteness ?? 0}%</strong>
          <small>Promedio del portafolio</small>
        </article>
        <article className="cv-stat">
          <span>Última edición</span>
          <strong className="cv-stat-date">{formatDate(summary?.lastUpdated)}</strong>
          <small>{IS_LOCAL_MODE ? "Guardado en el navegador" : "Guardado en MySQL"}</small>
        </article>
      </div>

      <div className="cv-workspace">
        <section className="panel cv-list-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Portafolio</span>
              <h3>{filterLabel}</h3>
            </div>
            <span className="muted">{cvs.length}</span>
          </div>
          <label className="cv-search">
            <span>Buscar hoja</span>
            <input
              className="input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, puesto o correo"
            />
          </label>
          <div className="cv-candidate-list">
            {listLoading ? (
              <p className="cv-empty">Cargando hojas…</p>
            ) : cvs.length === 0 ? (
              <p className="cv-empty">
                {searchTerm || languageFilter
                  ? "No hay hojas que coincidan con la búsqueda."
                  : "Aún no hay hojas de vida. Crea la primera."}
              </p>
            ) : (
              cvs.map((cv) => (
                <button
                  type="button"
                  key={cv.id}
                  className={`cv-candidate-row${selectedId === cv.id ? " selected" : ""}`}
                  onClick={() => selectCv(cv.id)}
                >
                  <span className="cv-candidate-main">
                    <strong>{cv.title}</strong>
                    <small>
                      {[cv.full_name, cv.headline].filter(Boolean).join(" · ") || "Sin datos"}
                    </small>
                  </span>
                  <span className="cv-lang-badge">{cv.language === "en" ? "EN" : "ES"}</span>
                  <small className="cv-candidate-date">
                    {cv.completeness} % · {formatDate(cv.updated_at)}
                  </small>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="panel cv-detail-panel">
          {detailLoading ? (
            <p className="cv-empty">Cargando…</p>
          ) : !draft ? (
            <div className="cv-empty-state">
              <span className="eyebrow">Hoja de vida</span>
              <h3>Selecciona una hoja</h3>
              <p className="muted">Elige una hoja de la lista o crea una nueva.</p>
            </div>
          ) : (
            <>
              <div className="cv-detail-heading">
                <div>
                  <span className="eyebrow">{isNew ? "Nueva hoja" : "Hoja de vida"}</span>
                  <h3>{draft.title || draft.full_name || "Hoja sin título"}</h3>
                  <p className="muted">
                    {[draft.full_name, draft.headline].filter(Boolean).join(" · ") ||
                      "Completa los datos para ver la hoja."}
                  </p>
                </div>
                <div className="cv-detail-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setTab(tab === "preview" ? "form" : "preview")}
                  >
                    {tab === "preview" ? "Editar ficha" : "Vista del CV"}
                  </button>
                  <button type="button" className="secondary-button" onClick={() => window.print()}>
                    Imprimir / PDF
                  </button>
                  {draft.id && (
                    <button type="button" className="text-button" onClick={duplicateCv}>
                      Duplicar
                    </button>
                  )}
                  {draft.id && (
                    <button
                      type="button"
                      className="text-button cv-delete-button"
                      onClick={removeCv}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

              <div className="cv-detail-toolbar">
                <div className="cv-lang-switch" role="group" aria-label="Idioma de la hoja">
                  <span className="cv-lang-switch-label">Idioma</span>
                  <button
                    type="button"
                    className={draft.language === "es" ? "is-active" : ""}
                    aria-pressed={draft.language === "es"}
                    onClick={() => setSheetLanguage("es")}
                  >
                    ES
                  </button>
                  <button
                    type="button"
                    className={draft.language === "en" ? "is-active" : ""}
                    aria-pressed={draft.language === "en"}
                    onClick={() => setSheetLanguage("en")}
                  >
                    EN
                  </button>
                </div>
                <span className="cv-completeness">
                  {isNew ? "Borrador nuevo" : `${completeness} % completa`}
                </span>
              </div>

              {tab === "preview" ? (
                <CvSheet draft={draft} />
              ) : (
                <CvForm
                  draft={draft}
                  isNew={isNew}
                  saving={saving}
                  onChangeField={updateField}
                  onUpdateEntry={updateEntry}
                  onAddEntry={addEntry}
                  onRemoveEntry={removeEntry}
                  onPhotoFile={handlePhotoFile}
                  onSubmit={saveCv}
                  onCancel={cancelNew}
                />
              )}
            </>
          )}
        </section>
      </div>

      {draft && (
        <div className="cv-print-area">
          <CvSheet draft={draft} />
        </div>
      )}

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </WorkspaceShell>
  );
}
