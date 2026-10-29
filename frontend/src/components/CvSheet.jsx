import { SHEET_LABELS } from "../i18n/sheetText.js";
import { initialsFor, splitEntries, splitList } from "../utils/cvModel.js";

export default function CvSheet({ draft }) {
  const labels = SHEET_LABELS[draft.language] || SHEET_LABELS.es;
  const contact = [draft.email, draft.phone, draft.location, draft.portfolio_url].filter(Boolean);
  const experience = splitEntries(draft.experience);
  const education = splitEntries(draft.education);
  const skills = splitList(draft.skills);
  const languages = splitList(draft.languages);

  return (
    <article className="cv-sheet">
      <div className="cv-sheet-body">
        <section className="cv-sheet-intro">
          <div className="cv-sheet-identity">
            <h2 className="cv-sheet-name">{draft.full_name || labels.namePlaceholder}</h2>
            {draft.headline && <p className="cv-sheet-position">{draft.headline}</p>}
            {contact.length > 0 && <p className="cv-sheet-contact">{contact.join("  ·  ")}</p>}
          </div>
          <span className="cv-sheet-photo">
            {draft.photo ? (
              <img src={draft.photo} alt={labels.photoAlt} />
            ) : (
              <span aria-hidden="true">{initialsFor(draft.full_name)}</span>
            )}
          </span>
        </section>

        {draft.summary && (
          <section className="cv-sheet-section">
            <h3>{labels.profile}</h3>
            <p>{draft.summary}</p>
          </section>
        )}

        {experience.length > 0 && (
          <section className="cv-sheet-section">
            <h3>{labels.experience}</h3>
            {experience.map((entry, index) => (
              <div className="cv-sheet-entry" key={`sheet-experience-${index}`}>
                <div className="cv-sheet-entry-head">
                  <strong>{entry.position || labels.position}</strong>
                  <span>{[entry.start_date, entry.end_date].filter(Boolean).join(" — ")}</span>
                </div>
                {entry.company && <span className="cv-sheet-entry-org">{entry.company}</span>}
                {entry.description && <p>{entry.description}</p>}
              </div>
            ))}
          </section>
        )}

        {education.length > 0 && (
          <section className="cv-sheet-section">
            <h3>{labels.education}</h3>
            {education.map((entry, index) => (
              <div className="cv-sheet-entry" key={`sheet-education-${index}`}>
                <div className="cv-sheet-entry-head">
                  <strong>{entry.degree || labels.degree}</strong>
                  <span>{[entry.start_date, entry.end_date].filter(Boolean).join(" — ")}</span>
                </div>
                {entry.institution && (
                  <span className="cv-sheet-entry-org">{entry.institution}</span>
                )}
                {entry.description && <p>{entry.description}</p>}
              </div>
            ))}
          </section>
        )}

        {skills.length > 0 && (
          <section className="cv-sheet-section">
            <h3>{labels.skills}</h3>
            <div className="cv-sheet-chips">
              {skills.map((skill, index) => (
                <span className="cv-sheet-chip" key={`skill-${index}`}>
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {languages.length > 0 && (
          <section className="cv-sheet-section">
            <h3>{labels.languages}</h3>
            <div className="cv-sheet-chips">
              {languages.map((language, index) => (
                <span className="cv-sheet-chip" key={`language-${index}`}>
                  {language}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
