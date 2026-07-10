import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Person } from "./site-data";
import { people, personOrder } from "./site-data";

type AccentStyle = CSSProperties & {
  "--accent": string;
  "--card-index"?: number;
};

export function SiteHeader({ profile = false }: { profile?: boolean }) {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Smaglinski home">
        <span className="wordmark-mark" aria-hidden="true">
          S
        </span>
        <span className="wordmark-copy">
          <strong>SMAGLINSKI</strong>
          <small>IAN / JACOB / ISAAC</small>
        </span>
      </Link>

      <nav className="site-nav" aria-label="Primary navigation">
        <Link href="/#brothers">Brothers</Link>
        <Link href="/#together">Built together</Link>
        <Link href="/#values">What drives us</Link>
      </nav>

      <Link className="header-action" href={profile ? "/#brothers" : "/#together"}>
        <span className="status-dot" aria-hidden="true" />
        {profile ? "All profiles" : "View our work"}
      </Link>
    </header>
  );
}

export function PortraitPlaceholder({
  person,
  profile = false,
}: {
  person: Person;
  profile?: boolean;
}) {
  const style = { "--accent": person.accent } as AccentStyle;
  const hasPortraits = Boolean(person.primaryPortrait && person.hoverPortrait);

  return (
    <div
      className={`portrait-system${profile ? " portrait-system--profile" : ""}${
        hasPortraits ? " has-portrait-photos" : ""
      }`}
      style={style}
    >
      {hasPortraits ? (
        <>
          <div className="portrait-layer portrait-layer--primary portrait-photo-layer">
            <Image
              src={person.primaryPortrait!}
              alt={person.portraitAlt ?? `${person.firstName} Smaglinski portrait placeholder`}
              fill
              loading="eager"
              sizes={profile ? "(max-width: 680px) 256px, 28vw" : "(max-width: 680px) 76vw, 32vw"}
              style={{ objectPosition: person.portraitPosition ?? "50% 50%" }}
            />
          </div>
          {!profile ? (
            <div className="portrait-layer portrait-layer--alternate portrait-photo-layer" aria-hidden="true">
              <Image
                src={person.hoverPortrait!}
                alt=""
                fill
                loading="eager"
                sizes="(max-width: 680px) 76vw, 32vw"
                style={{ objectPosition: person.hoverPosition ?? "50% 50%" }}
              />
            </div>
          ) : null}
          <span className="temporary-portrait-label">Temporary portrait</span>
        </>
      ) : (
        <>
          <div className="portrait-layer portrait-layer--primary" aria-hidden="true">
            <span className="portrait-initials">{person.initials}</span>
          </div>
          <div className="portrait-layer portrait-layer--alternate" aria-hidden="true">
            <span className="portrait-outline-name">{person.firstName}</span>
          </div>
        </>
      )}
    </div>
  );
}

export function PersonCard({ person, index }: { person: Person; index: number }) {
  const style = {
    "--accent": person.accent,
    "--card-index": index,
  } as AccentStyle;

  return (
    <Link
      className={`person-card person-card--${person.key}`}
      href={`/${person.key}`}
      style={style}
      aria-label={`${person.firstName} Smaglinski, ${person.title}. View profile.`}
    >
      <PortraitPlaceholder person={person} />
      <span className="person-card-scrim" aria-hidden="true" />
      <span className="person-card-topline">
        <span>{person.number}</span>
        <span>{person.familyRole}</span>
      </span>
      <span className="person-card-copy">
        <span className="person-card-status">
          {person.status === "complete" ? "Profile ready" : "In progress"}
        </span>
        <strong>{person.firstName}</strong>
        <span className="person-card-role">{person.title}</span>
        <span className="person-card-discipline">{person.cardLine}</span>
        <span className="person-card-link">
          View profile <span aria-hidden="true">↗</span>
        </span>
      </span>
      <span className="person-card-hover-copy" aria-hidden="true">
        <strong>{person.firstName}</strong>
      </span>
    </Link>
  );
}

export function SectionHeading({
  number,
  eyebrow,
  title,
  description,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <div className="section-label">
        <span>{number}</span>
        <span>{eyebrow}</span>
      </div>
      <div className="section-heading-copy">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </div>
  );
}

type SharedProject = {
  number: string;
  slug: string;
  title: string;
  category: string;
  image: string;
  alt: string;
  description: string;
  note: string;
  size: string;
  position: string;
};

export function SharedProjectCard({ project }: { project: SharedProject }) {
  return (
    <article
      className={`shared-project shared-project--${project.size}`}
      id={project.slug}
    >
      <div className="shared-project-image">
        <Image
          src={project.image}
          alt={project.alt}
          fill
          sizes={
            project.size === "feature"
              ? "(max-width: 760px) 100vw, 66vw"
              : "(max-width: 760px) 100vw, 40vw"
          }
          style={{ objectPosition: project.position }}
        />
        <span className="shared-project-shade" aria-hidden="true" />
        <span className="project-number">{project.number}</span>
        <span className="project-category">{project.category}</span>
      </div>
      <div className="shared-project-copy">
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <span className="project-note">
          <span className="status-dot" aria-hidden="true" />
          {project.note}
        </span>
      </div>
    </article>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-primary">
        <div>
          <span className="footer-kicker">SMAGLINSKI.COM</span>
          <p>Built together. Updated individually.</p>
        </div>
        <div className="footer-links" aria-label="Profile links">
          {personOrder.map((key) => (
            <Link key={key} href={`/${key}`}>
              {people[key].firstName} <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="footer-meta">
        <span>© 2026 The Smaglinskis</span>
        <span>More portraits, projects, and stories coming soon.</span>
        <Link href="#top">Back to top ↑</Link>
      </div>
    </footer>
  );
}
