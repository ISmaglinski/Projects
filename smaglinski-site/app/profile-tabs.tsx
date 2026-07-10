"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { PortraitPlaceholder } from "./components";
import { people, personOrder, type Person } from "./site-data";
import { useHashTabs } from "./use-tabs";

const PROFILE_TABS = [
  { id: "overview", number: "01", label: "Overview" },
  { id: "experience", number: "02", label: "Experience" },
  { id: "work", number: "03", label: "Selected work" },
  { id: "background", number: "04", label: "Background" },
] as const;

const PROFILE_TAB_IDS = PROFILE_TABS.map((tab) => tab.id);
type ProfileTabId = (typeof PROFILE_TAB_IDS)[number];
type AccentStyle = CSSProperties & { "--accent": string };

function PendingPanel({
  number,
  title,
  copy,
}: {
  number: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="profile-empty-state">
      <span>{number} / CONTENT SLOT READY</span>
      <h2>{title}</h2>
      <p>{copy}</p>
      <div className="profile-empty-modules" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

export function ProfileTabs({ person }: { person: Person }) {
  const { activeTab, selectTab, onTabKeyDown } = useHashTabs<ProfileTabId>(
    PROFILE_TAB_IDS,
    "overview",
    `profile-${person.key}`,
  );
  const style = { "--accent": person.accent } as AccentStyle;
  const activeMeta =
    PROFILE_TABS.find((tab) => tab.id === activeTab) ?? PROFILE_TABS[0];
  const isPending = person.status === "pending";

  return (
    <div className="tabbed-profile" style={style}>
      <a className="skip-link" href={`#profile-panel-${activeTab}`}>
        Skip to active profile panel
      </a>

      <header className="interface-header profile-interface-header">
        <Link className="interface-brand" href="/#brothers" aria-label="Back to all brothers">
          <span className="interface-brand-mark" aria-hidden="true">
            S
          </span>
          <span>
            <strong>Smaglinski</strong>
            <small>{person.firstName}&apos;s portfolio</small>
          </span>
        </Link>

        <div className="interface-tabs profile-interface-tabs" role="tablist" aria-label={`${person.firstName} profile sections`}>
          {PROFILE_TABS.map((tab, index) => (
            <button
              key={tab.id}
              id={`profile-${person.key}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`profile-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => activeTab !== tab.id && selectTab(tab.id)}
              onKeyDown={(event) => onTabKeyDown(event, tab.id)}
            >
              <kbd>{index + 1}</kbd>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <nav className="sibling-switcher" aria-label="Switch brother profile">
          {personOrder.map((key) => (
            <Link
              key={key}
              href={`/${key}#overview`}
              className={key === person.key ? "is-current" : ""}
              aria-current={key === person.key ? "page" : undefined}
            >
              {people[key].firstName.slice(0, 1)}
              <span className="sr-only">{people[key].firstName}</span>
            </Link>
          ))}
        </nav>
      </header>

      <div className="interface-context profile-context">
        <span>
          <Link href="/#brothers">BROTHERS</Link> / {person.firstName.toUpperCase()}
        </span>
        <p>{activeMeta.number} · {activeMeta.label}</p>
        <span className="interface-hint">ARROWS TO MOVE · 1–4 TO SWITCH</span>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {person.firstName} {activeMeta.label} panel selected.
      </p>

      <main className="profile-panel-stack">
        <section
          id="profile-panel-overview"
          className="profile-tab-panel profile-tab-panel--overview"
          role="tabpanel"
          aria-labelledby={`profile-${person.key}-tab-overview`}
          tabIndex={0}
          hidden={activeTab !== "overview"}
        >
          <div className="profile-overview-layout">
            <div className="profile-identity-block">
              <span className="panel-kicker">
                {person.number} / {person.familyRole.toUpperCase()} BROTHER
              </span>
              <h1>
                {person.firstName}
                <span>{person.lastName}</span>
              </h1>
              <p className="profile-interface-title">{person.title}</p>
              <div className="profile-direction">
                <span>Current direction</span>
                <strong>{person.cardLine}</strong>
              </div>
            </div>

            <div className="profile-interface-portrait">
              <PortraitPlaceholder person={person} profile />
              <span className="portrait-corner portrait-corner--one" aria-hidden="true" />
              <span className="portrait-corner portrait-corner--two" aria-hidden="true" />
            </div>

            <div className="profile-overview-copy">
              <span className="panel-kicker">
                {isPending ? "PROFILE IN PROGRESS" : "RESUME INTEGRATED"}
              </span>
              <h2>{person.profileHeadline}</h2>
              <p>{person.intro}</p>
              <p className="profile-about-compact">{person.about[0]}</p>

              <dl className="profile-interface-facts">
                {person.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="profile-interface-actions">
                {person.email ? (
                  <a href={`mailto:${person.email}`}>Email <span aria-hidden="true">↗</span></a>
                ) : null}
                {person.linkedIn ? (
                  <a href={person.linkedIn} target="_blank" rel="noreferrer">
                    LinkedIn <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
                <Link href="/?project=ai-machine#builds">
                  Built together <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          id="profile-panel-experience"
          className="profile-tab-panel profile-tab-panel--scroll"
          role="tabpanel"
          aria-labelledby={`profile-${person.key}-tab-experience`}
          tabIndex={0}
          hidden={activeTab !== "experience"}
        >
          {person.experience.length ? (
            <div className="experience-tab-layout">
              <aside className="role-index">
                <span className="panel-kicker">ROLE INDEX</span>
                {person.experience.map((experience, index) => (
                  <button
                    key={experience.company}
                    type="button"
                    onClick={() =>
                      document
                        .getElementById(`role-${person.key}-${index}`)
                        ?.scrollIntoView({
                          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                            ? "auto"
                            : "smooth",
                          block: "start",
                        })
                    }
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{experience.company}</strong>
                    <small>{experience.range}</small>
                  </button>
                ))}
              </aside>

              <div className="experience-detail-stream">
                <div className="profile-panel-heading">
                  <span className="panel-kicker">{activeMeta.number} / EXPERIENCE</span>
                  <h2>Work that moved the system forward.</h2>
                </div>
                {person.experience.map((experience, index) => (
                  <article id={`role-${person.key}-${index}`} key={experience.company}>
                    <div className="experience-card-heading">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <small>{experience.company}</small>
                        <h3>{experience.role}</h3>
                      </div>
                      <div>
                        <span>{experience.range}</span>
                        {experience.location ? <span>{experience.location}</span> : null}
                      </div>
                    </div>
                    <p>{experience.summary}</p>
                    <ul>
                      {experience.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <PendingPanel
              number="02"
              title="Isaac's experience is the next input."
              copy="Add his resume or a simple role history and this panel will populate without changing the interface."
            />
          )}
        </section>

        <section
          id="profile-panel-work"
          className="profile-tab-panel profile-tab-panel--scroll profile-tab-panel--work"
          role="tabpanel"
          aria-labelledby={`profile-${person.key}-tab-work`}
          tabIndex={0}
          hidden={activeTab !== "work"}
        >
          {person.projects.length ? (
            <div className="profile-workspace">
              <div className="profile-panel-heading">
                <span className="panel-kicker">03 / SELECTED WORK</span>
                <h2>Proof, not promises.</h2>
                <p>Real coursework and team builds, written as concise case-study starting points.</p>
              </div>
              <div className="profile-work-grid">
                {person.projects.map((project, index) => (
                  <article key={project.title}>
                    <span className="profile-work-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <small>{project.kicker}</small>
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                      <div className="tag-list">
                        {project.tools.map((tool) => <span key={tool}>{tool}</span>)}
                      </div>
                      {project.sourceUrl ? (
                        <a
                          className="project-source-link"
                          href={project.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${project.title} source code on GitHub (opens in a new tab)`}
                        >
                          View on GitHub <span aria-hidden="true">↗</span>
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
              <Link className="shared-work-link" href="/?project=ai-machine#builds">
                <span>SHARED HARDWARE WORK</span>
                <strong>The AI Machine + three more builds</strong>
                <i aria-hidden="true">↗</i>
              </Link>
            </div>
          ) : (
            <PendingPanel
              number="03"
              title="Isaac's selected work will live here."
              copy="Project names, one-sentence summaries, and any photos or links are enough to complete this panel."
            />
          )}
        </section>

        <section
          id="profile-panel-background"
          className="profile-tab-panel profile-tab-panel--scroll"
          role="tabpanel"
          aria-labelledby={`profile-${person.key}-tab-background`}
          tabIndex={0}
          hidden={activeTab !== "background"}
        >
          {person.skillGroups.length || person.education.length ? (
            <div className="background-tab-layout">
              <div className="background-skills">
                <div className="profile-panel-heading">
                  <span className="panel-kicker">04 / CAPABILITIES</span>
                  <h2>The working toolkit.</h2>
                </div>
                {person.skillGroups.map((group) => (
                  <article key={group.label}>
                    <h3>{group.label}</h3>
                    <div>
                      {group.skills.map((skill) => <span key={skill}>{skill}</span>)}
                    </div>
                  </article>
                ))}
              </div>

              <div className="background-credentials">
                <section>
                  <span className="panel-kicker">EDUCATION</span>
                  {person.education.map((education) => (
                    <article key={`${education.school}-${education.degree}`}>
                      <span>{education.range}</span>
                      <h3>{education.degree}</h3>
                      <strong>{education.school}</strong>
                      {education.detail ? <p>{education.detail}</p> : null}
                    </article>
                  ))}
                </section>

                <section>
                  <span className="panel-kicker">CERTIFICATIONS</span>
                  {person.certifications.map((certification, index) => (
                    <div className="compact-cert" key={certification}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{certification}</p>
                    </div>
                  ))}
                </section>
              </div>
            </div>
          ) : (
            <PendingPanel
              number="04"
              title="Skills, education, and certifications are pending."
              copy="Isaac's resume will complete this panel while keeping the exact same visual structure as his brothers."
            />
          )}
        </section>
      </main>

      <footer className="interface-footer profile-interface-footer">
        <Link href="/#brothers">← ALL BROTHERS</Link>
        <span>{person.firstName.toUpperCase()} / {activeMeta.label.toUpperCase()}</span>
        <span>{isPending ? "PROFILE IN PROGRESS" : "PROFILE READY"}</span>
      </footer>
    </div>
  );
}
