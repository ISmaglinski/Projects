import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PortraitPlaceholder,
  SiteFooter,
  SiteHeader,
} from "../components";
import { people, personOrder, type PersonKey } from "../site-data";

type AccentStyle = CSSProperties & { "--accent": string };

export function generateStaticParams() {
  return personOrder.map((person) => ({ person }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ person: string }>;
}): Promise<Metadata> {
  const { person: key } = await params;
  const person = people[key as PersonKey];

  if (!person) {
    return {};
  }

  return {
    title: `${person.firstName} Smaglinski | ${person.title}`,
    description: person.intro,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ person: string }>;
}) {
  const { person: key } = await params;
  const person = people[key as PersonKey];

  if (!person) {
    notFound();
  }

  const style = { "--accent": person.accent } as AccentStyle;
  const isPending = person.status === "pending";

  return (
    <div id="top" className="site-shell profile-site" style={style}>
      <a className="skip-link" href="#profile-content">
        Skip to content
      </a>
      <SiteHeader profile />

      <main id="profile-content">
        <section className="profile-hero" aria-labelledby="profile-name">
          <div className="profile-hero-grid" aria-hidden="true" />
          <div className="profile-breadcrumb">
            <Link href="/">SMAGLINSKI</Link>
            <span>/</span>
            <span>{person.firstName.toUpperCase()}</span>
          </div>

          <div className="profile-title-block">
            <span className="eyebrow">
              {person.number} · {person.familyRole} brother
            </span>
            <h1 id="profile-name">
              {person.firstName}
              <span>{person.lastName}</span>
            </h1>
            <p>{person.title}</p>
          </div>

          <div className="profile-stage">
            <aside className="profile-stage-note profile-stage-note--left">
              <span>Current direction</span>
              <strong>{person.cardLine}</strong>
              <i aria-hidden="true" />
            </aside>

            <div className="profile-portrait-wrap">
              <PortraitPlaceholder person={person} profile />
            </div>

            <aside className="profile-stage-note profile-stage-note--right">
              <span>{isPending ? "Profile status" : "In brief"}</span>
              <p>{person.intro}</p>
              <span className="profile-status">
                <i aria-hidden="true" />
                {isPending ? "Content pending" : "Resume integrated"}
              </span>
            </aside>
          </div>

          <div className="profile-facts">
            {person.facts.map((fact) => (
              <div key={fact.label}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="profile-about profile-section">
          <div className="profile-section-index">
            <span>01</span>
            <span>About</span>
          </div>
          <div className="profile-about-copy">
            <h2>{person.profileHeadline}</h2>
            {person.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        {isPending ? (
          <section className="profile-pending profile-section">
            <div className="profile-section-index">
              <span>02—05</span>
              <span>Next update</span>
            </div>
            <div>
              <h2>Ready for Isaac's details.</h2>
              <p>
                The structure is complete. Add his resume, two portraits, and a
                few project notes to turn every placeholder below into the full
                profile.
              </p>
              <div className="pending-modules">
                <article>
                  <span>01</span>
                  <h3>Experience</h3>
                  <p>Roles, responsibilities, and the work he is proud of.</p>
                </article>
                <article>
                  <span>02</span>
                  <h3>Selected work</h3>
                  <p>Projects, builds, and proof of what he can do.</p>
                </article>
                <article>
                  <span>03</span>
                  <h3>Skills + education</h3>
                  <p>Tools, strengths, credentials, and background.</p>
                </article>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="profile-experience profile-section">
              <div className="profile-section-index">
                <span>02</span>
                <span>Experience</span>
              </div>
              <div className="timeline">
                {person.experience.map((experience, index) => (
                  <article className="timeline-entry" key={experience.company}>
                    <div className="timeline-rail" aria-hidden="true">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <i />
                    </div>
                    <div className="timeline-heading">
                      <div>
                        <span>{experience.company}</span>
                        <h3>{experience.role}</h3>
                      </div>
                      <div className="timeline-meta">
                        <span>{experience.range}</span>
                        {experience.location ? (
                          <span>{experience.location}</span>
                        ) : null}
                      </div>
                    </div>
                    <p className="timeline-summary">{experience.summary}</p>
                    <ul>
                      {experience.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className="profile-work profile-section">
              <div className="profile-section-index">
                <span>03</span>
                <span>Selected work</span>
              </div>
              <div className="profile-projects">
                {person.projects.map((project, index) => (
                  <article key={project.title}>
                    <div className="profile-project-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <span className="profile-project-kicker">
                      {project.kicker}
                    </span>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className="tag-list" aria-label="Project tools">
                      {project.tools.map((tool) => (
                        <span key={tool}>{tool}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="profile-skills profile-section">
              <div className="profile-section-index">
                <span>04</span>
                <span>Capabilities</span>
              </div>
              <div className="skill-groups">
                {person.skillGroups.map((group) => (
                  <article key={group.label}>
                    <h3>{group.label}</h3>
                    <div>
                      {group.skills.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="profile-credentials profile-section">
              <div className="profile-section-index">
                <span>05</span>
                <span>Background</span>
              </div>
              <div className="credentials-grid">
                <div>
                  <span className="credential-heading">Education</span>
                  {person.education.map((education) => (
                    <article key={`${education.school}-${education.degree}`}>
                      <span>{education.range}</span>
                      <h3>{education.degree}</h3>
                      <strong>{education.school}</strong>
                      {education.detail ? <p>{education.detail}</p> : null}
                    </article>
                  ))}
                </div>
                <div>
                  <span className="credential-heading">Certifications</span>
                  <ol>
                    {person.certifications.map((certification, index) => (
                      <li key={certification}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <p>{certification}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>
          </>
        )}

        <section className="shared-callout">
          <span className="eyebrow">NOT JUST INDIVIDUAL WORK</span>
          <h2>See what the brothers build together.</h2>
          <p>
            AI compute, custom PCs, and a growing home lab — projects that sit
            at the intersection of software and the physical world.
          </p>
          <Link className="button button--light" href="/#together">
            Explore shared projects <span aria-hidden="true">↗</span>
          </Link>
        </section>

        {person.email || person.linkedIn ? (
          <section className="profile-contact">
            <div>
              <span className="eyebrow">START A CONVERSATION</span>
              <h2>Have a question or an opportunity?</h2>
            </div>
            <div className="contact-links">
              {person.email ? (
                <a href={`mailto:${person.email}`}>
                  <span>Email</span>
                  <strong>{person.email}</strong>
                  <i aria-hidden="true">↗</i>
                </a>
              ) : null}
              {person.linkedIn ? (
                <a href={person.linkedIn} target="_blank" rel="noreferrer">
                  <span>LinkedIn</span>
                  <strong>View profile</strong>
                  <i aria-hidden="true">↗</i>
                </a>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
