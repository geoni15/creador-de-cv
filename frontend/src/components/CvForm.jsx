import { useRef } from "react";
import { initialsFor } from "../utils/cvModel.js";

export default function CvForm({
  draft,
  isNew,
  saving,
  onChangeField,
  onUpdateEntry,
  onAddEntry,
  onRemoveEntry,
  onPhotoFile,
  onSubmit,
  onCancel,
}) {
  const photoInputRef = useRef(null);

  return (
    <form className="cv-form" onSubmit={onSubmit}>
      <fieldset className="cv-fieldset" disabled={saving}>
        <section className="cv-form-section">
          <div className="cv-form-section-heading">
            <h4>Identidad de la hoja</h4>
          </div>
          <div className="cv-photo-field">
            <span className="cv-photo-label">Foto</span>
            <div className="cv-photo-editor">
              <span className="cv-photo-preview">
                {draft.photo ? (
                  <img src={draft.photo} alt="Foto de la hoja de vida" />
                ) : (
                  <span aria-hidden="true">{initialsFor(draft.full_name)}</span>
                )}
              </span>
              <div className="cv-photo-actions">
                <input
                  ref={photoInputRef}
                  className="cv-photo-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) onPhotoFile(file);
                  }}
                  tabIndex={-1}
                />
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {draft.photo ? "Cambiar foto" : "Subir foto"}
                </button>
                {draft.photo && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => onChangeField("photo", "")}
                  >
                    Quitar foto
                  </button>
                )}
                <small className="cv-photo-hint">JPG, PNG o WebP. Se recorta en cuadrado.</small>
              </div>
            </div>
          </div>
          <div className="cv-field-grid">
            <label className="cv-field cv-field-wide">
              <span>Nombre completo</span>
              <input
                className="input"
                value={draft.full_name}
                onChange={(event) => onChangeField("full_name", event.target.value)}
                maxLength={160}
                autoComplete="name"
                placeholder="Tu nombre completo"
                required
              />
            </label>
            <label className="cv-field cv-field-wide">
              <span>Titular profesional</span>
              <input
                className="input"
                value={draft.headline}
                onChange={(event) => onChangeField("headline", event.target.value)}
                maxLength={160}
                autoComplete="organization-title"
                placeholder="Ej. Desarrollador web · React y Node"
              />
            </label>
            <label className="cv-field cv-field-wide">
              <span>Nombre de la versión</span>
              <input
                className="input"
                value={draft.title}
                onChange={(event) => onChangeField("title", event.target.value)}
                maxLength={120}
                placeholder="Ej. CV desarrollador web"
              />
              <small className="cv-hint">
                Solo organiza tus hojas en la lista; no aparece en el documento.
              </small>
            </label>
          </div>
        </section>

        <section className="cv-form-section">
          <div className="cv-form-section-heading">
            <h4>Contacto</h4>
          </div>
          <div className="cv-field-grid">
            <label className="cv-field">
              <span>Correo</span>
              <input
                className="input"
                type="email"
                value={draft.email}
                onChange={(event) => onChangeField("email", event.target.value)}
                maxLength={190}
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
              />
            </label>
            <label className="cv-field">
              <span>Teléfono</span>
              <input
                className="input"
                type="tel"
                value={draft.phone}
                onChange={(event) => onChangeField("phone", event.target.value)}
                maxLength={60}
                autoComplete="tel"
                placeholder="+1 809 000 0000"
              />
            </label>
            <label className="cv-field">
              <span>Ciudad / País</span>
              <input
                className="input"
                value={draft.location}
                onChange={(event) => onChangeField("location", event.target.value)}
                maxLength={160}
                autoComplete="address-level2"
                placeholder="Ciudad, país"
              />
            </label>
            <label className="cv-field">
              <span>Portafolio o LinkedIn</span>
              <input
                className="input"
                type="url"
                value={draft.portfolio_url}
                onChange={(event) => onChangeField("portfolio_url", event.target.value)}
                maxLength={255}
                autoComplete="url"
                placeholder="https://"
              />
            </label>
          </div>
        </section>

        <section className="cv-form-section">
          <div className="cv-form-section-heading">
            <h4>Perfil profesional</h4>
            <span className="cv-hint">{draft.summary.length}/2000</span>
          </div>
          <label className="cv-field">
            <textarea
              className="input"
              rows={4}
              value={draft.summary}
              onChange={(event) => onChangeField("summary", event.target.value)}
              maxLength={2000}
              placeholder="Describe tu perfil en pocas líneas"
            />
          </label>
        </section>

        <section className="cv-form-section">
          <div className="cv-form-section-heading">
            <h4>Experiencia laboral</h4>
            <button type="button" className="text-button" onClick={() => onAddEntry("experience")}>
              + Agregar experiencia
            </button>
          </div>
          {draft.experience.length === 0 ? (
            <p className="cv-empty">Sin experiencia registrada.</p>
          ) : (
            draft.experience.map((entry, index) => (
              <div className="cv-entry-card" key={`experience-${index}`}>
                <div className="cv-entry-heading">
                  <span className="eyebrow">Experiencia {index + 1}</span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => onRemoveEntry("experience", index)}
                  >
                    Quitar
                  </button>
                </div>
                <div className="cv-field-grid">
                  <label className="cv-field">
                    <span>Cargo</span>
                    <input
                      className="input"
                      value={entry.position}
                      onChange={(event) =>
                        onUpdateEntry("experience", index, "position", event.target.value)
                      }
                      maxLength={120}
                      autoComplete="organization-title"
                      placeholder="Cargo"
                    />
                  </label>
                  <label className="cv-field">
                    <span>Empresa</span>
                    <input
                      className="input"
                      value={entry.company}
                      onChange={(event) =>
                        onUpdateEntry("experience", index, "company", event.target.value)
                      }
                      maxLength={150}
                      autoComplete="organization"
                      placeholder="Empresa"
                    />
                  </label>
                  <label className="cv-field">
                    <span>Desde</span>
                    <input
                      className="input"
                      value={entry.start_date}
                      onChange={(event) =>
                        onUpdateEntry("experience", index, "start_date", event.target.value)
                      }
                      maxLength={20}
                      placeholder="2021"
                    />
                  </label>
                  <label className="cv-field">
                    <span>Hasta</span>
                    <input
                      className="input"
                      value={entry.end_date}
                      onChange={(event) =>
                        onUpdateEntry("experience", index, "end_date", event.target.value)
                      }
                      maxLength={20}
                      placeholder="Actualidad"
                    />
                  </label>
                  <label className="cv-field cv-field-wide">
                    <span>Descripción</span>
                    <textarea
                      className="input"
                      rows={3}
                      value={entry.description}
                      onChange={(event) =>
                        onUpdateEntry("experience", index, "description", event.target.value)
                      }
                      maxLength={600}
                      placeholder="Logros y responsabilidades principales"
                    />
                  </label>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="cv-form-section">
          <div className="cv-form-section-heading">
            <h4>Formación académica</h4>
            <button type="button" className="text-button" onClick={() => onAddEntry("education")}>
              + Agregar formación
            </button>
          </div>
          {draft.education.length === 0 ? (
            <p className="cv-empty">Sin formación registrada.</p>
          ) : (
            draft.education.map((entry, index) => (
              <div className="cv-entry-card" key={`education-${index}`}>
                <div className="cv-entry-heading">
                  <span className="eyebrow">Formación {index + 1}</span>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => onRemoveEntry("education", index)}
                  >
                    Quitar
                  </button>
                </div>
                <div className="cv-field-grid">
                  <label className="cv-field">
                    <span>Título</span>
                    <input
                      className="input"
                      value={entry.degree}
                      onChange={(event) =>
                        onUpdateEntry("education", index, "degree", event.target.value)
                      }
                      maxLength={120}
                      placeholder="Título"
                    />
                  </label>
                  <label className="cv-field">
                    <span>Institución</span>
                    <input
                      className="input"
                      value={entry.institution}
                      onChange={(event) =>
                        onUpdateEntry("education", index, "institution", event.target.value)
                      }
                      maxLength={150}
                      placeholder="Institución"
                    />
                  </label>
                  <label className="cv-field">
                    <span>Desde</span>
                    <input
                      className="input"
                      value={entry.start_date}
                      onChange={(event) =>
                        onUpdateEntry("education", index, "start_date", event.target.value)
                      }
                      maxLength={20}
                      placeholder="2016"
                    />
                  </label>
                  <label className="cv-field">
                    <span>Hasta</span>
                    <input
                      className="input"
                      value={entry.end_date}
                      onChange={(event) =>
                        onUpdateEntry("education", index, "end_date", event.target.value)
                      }
                      maxLength={20}
                      placeholder="2020"
                    />
                  </label>
                  <label className="cv-field cv-field-wide">
                    <span>Descripción</span>
                    <textarea
                      className="input"
                      rows={2}
                      value={entry.description}
                      onChange={(event) =>
                        onUpdateEntry("education", index, "description", event.target.value)
                      }
                      maxLength={400}
                      placeholder="Menciones, especialidad o logros"
                    />
                  </label>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="cv-form-section">
          <div className="cv-form-section-heading">
            <h4>Habilidades e idiomas</h4>
          </div>
          <div className="cv-field-grid">
            <label className="cv-field">
              <span>Habilidades</span>
              <input
                className="input"
                value={draft.skills}
                onChange={(event) => onChangeField("skills", event.target.value)}
                placeholder="React, Node.js, SQL"
              />
              <small className="cv-hint">Separa cada habilidad con una coma.</small>
            </label>
            <label className="cv-field">
              <span>Idiomas</span>
              <input
                className="input"
                value={draft.languages}
                onChange={(event) => onChangeField("languages", event.target.value)}
                placeholder="Español (nativo), Inglés (B2)"
              />
              <small className="cv-hint">Separa cada idioma con una coma.</small>
            </label>
          </div>
        </section>
      </fieldset>

      <div className="cv-form-actions">
        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? "Guardando…" : isNew ? "Crear hoja de vida" : "Guardar cambios"}
        </button>
        {isNew && (
          <button type="button" className="text-button" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
