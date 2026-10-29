import { useEffect, useState } from "react";

const CONNECTION_META = {
  loading: { label: "Conectando…", className: "" },
  online: { label: "MySQL conectado", className: "" },
  local: { label: "Guardado local", className: "" },
  offline: { label: "Sin conexión", className: " is-offline" },
};

export default function WorkspaceShell({
  darkMode,
  setDarkMode,
  connection,
  storageLabel = "MySQL · creador_cv",
  pageEyebrow,
  pageTitle,
  pathParts = [],
  headingActions,
  languageFilter,
  onLanguageFilter,
  counts,
  onNew,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen]);

  const navigate = (id) => {
    onLanguageFilter(id);
    setSidebarOpen(false);
  };

  const connectionMeta = CONNECTION_META[connection] || CONNECTION_META.loading;
  const navItems = [
    { id: "all", label: "Todas las hojas", icon: "T", count: counts?.total ?? 0 },
    { id: "es", label: "Español", icon: "E", count: counts?.es ?? 0 },
    { id: "en", label: "Inglés", icon: "I", count: counts?.en ?? 0 },
  ];

  return (
    <main
      className={`app-shell workspace-shell ${darkMode ? "dark-mode" : ""} ${sidebarOpen ? "sidebar-open" : ""}`}
    >
      <header className="topbar">
        <div className="brand-mark">
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-controls="workspace-explorer"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            ☰ <span>Menú</span>
          </button>
          <span className="brand-icon">PLAN D</span>
          <div>
            <h1>Creador de CV</h1>
          </div>
        </div>
        <div className="profile">
          <span className="topbar-note">Portafolio personal</span>
          <button
            type="button"
            className="theme-button"
            title={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "Sol" : "Luna"}
          </button>
        </div>
      </header>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Cerrar menú lateral"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="workspace-grid">
        <aside className="explorer-panel" id="workspace-explorer">
          <div className="explorer-heading">
            <span>MI PORTAFOLIO</span>
            <button
              type="button"
              className="mobile-menu-close"
              aria-label="Cerrar menú lateral"
              onClick={() => setSidebarOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="tree-root">
            <div className="tree-row tree-root-row">
              <span className="tree-icon company-icon">C</span>
              <strong>Hojas de vida</strong>
            </div>
            <div className="tree-branch">
              <div className="book-heading">DOCUMENTOS</div>
              {navItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`tree-row ${(languageFilter || "all") === item.id ? "selected" : ""}`}
                  aria-current={(languageFilter || "all") === item.id ? "page" : undefined}
                  onClick={() => navigate(item.id)}
                >
                  <span className="tree-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  <small>{item.count}</small>
                </button>
              ))}
              <button type="button" className="new-cv-button" onClick={onNew}>
                + Nueva hoja de vida
              </button>
            </div>
          </div>
          <div className="workspace-sidebar-foot">
            <span className="status-dot" aria-hidden="true" />
            {storageLabel}
          </div>
        </aside>

        <section className="workspace-content">
          <section className="page-heading">
            <div>
              <span className="eyebrow">{pageEyebrow}</span>
              <h2>{pageTitle}</h2>
              <p className="path">
                {pathParts.map((part, index) => (
                  <span key={part}>
                    {index > 0 && <span className="path-separator">/</span>}
                    {part}
                  </span>
                ))}
              </p>
            </div>
            <div className="heading-actions">
              {headingActions}
              <span className={`status-pill${connectionMeta.className}`}>
                ● {connectionMeta.label}
              </span>
            </div>
          </section>
          {children}
        </section>
      </div>
    </main>
  );
}
