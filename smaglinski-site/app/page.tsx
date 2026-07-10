import type { Metadata } from "next";
import Link from "next/link";
import {
  PersonCard,
  SectionHeading,
  SharedProjectCard,
  SiteFooter,
  SiteHeader,
} from "./components";
import { people, personOrder, sharedProjects } from "./site-data";

export const metadata: Metadata = {
  title: "The Smaglinskis | Three Brothers Who Build",
  description:
    "The shared portfolio of Ian, Jacob, and Isaac Smaglinski — spanning data, AI, software, custom hardware, and infrastructure.",
};

export default function Home() {
  return (
    <div id="top" className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />

      <main id="main-content">
        <section className="home-hero" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-index">S / 001</span>
              <span>Family portfolio · Northeast Ohio</span>
            </div>
            <h1 id="hero-title">
              Three brothers.
              <span>One instinct:</span>
              <em>build.</em>
            </h1>
            <p className="hero-intro">
              A shared portfolio of data, software, AI, custom hardware, and the
              systems that bring it all together.
            </p>
            <div className="hero-actions">
              <Link className="button button--primary" href="#brothers">
                Meet the brothers <span aria-hidden="true">↓</span>
              </Link>
              <Link className="button button--ghost" href="#together">
                See what we build <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="hero-system" aria-label="Three Smaglinski brothers">
            <div className="hero-system-status">
              <span>
                <i aria-hidden="true" /> FAMILY SYSTEM
              </span>
              <span>3 / 3 ONLINE</span>
            </div>
            <div className="hero-three" aria-hidden="true">
              3
            </div>
            <div className="hero-nodes">
              {personOrder.map((key) => (
                <Link href={`/${key}`} key={key}>
                  <span>{people[key].number}</span>
                  <strong>{people[key].firstName}</strong>
                  <small>{people[key].cardLine}</small>
                  <b aria-hidden="true">↗</b>
                </Link>
              ))}
            </div>
            <div className="hero-system-footer">
              <span>DATA / AI / HARDWARE / INFRASTRUCTURE</span>
              <span>SMAGLINSKI.COM</span>
            </div>
          </div>

          <div className="hero-scroll" aria-hidden="true">
            <span>SCROLL TO EXPLORE</span>
            <i />
          </div>
        </section>

        <section className="brothers-section" id="brothers">
          <SectionHeading
            number="01"
            eyebrow="The brothers"
            title="Three paths. One name."
            description="Select a brother to explore his background, skills, and individual work. Portraits will drop straight into the finished card system when they are ready."
          />
          <div className="people-grid">
            {personOrder.map((key, index) => (
              <PersonCard person={people[key]} index={index} key={key} />
            ))}
          </div>
          <p className="portrait-note">
            <span aria-hidden="true">↳</span> Each card is already wired for a
            primary and hover portrait.
          </p>
        </section>

        <section className="together-section" id="together">
          <SectionHeading
            number="02"
            eyebrow="Built together"
            title="This is what the Smaglinskis are about."
            description="The systems, machines, and experiments that keep us learning — built with our own hands and documented as we go."
          />
          <div className="project-mosaic">
            {sharedProjects.map((project) => (
              <SharedProjectCard project={project} key={project.slug} />
            ))}
          </div>
        </section>

        <section className="values-section" id="values">
          <div className="values-intro">
            <div className="section-label">
              <span>03</span>
              <span>Operating principles</span>
            </div>
            <h2>Curiosity is only useful when you do something with it.</h2>
          </div>
          <div className="values-grid">
            <article>
              <span>01</span>
              <h3>Learn deeply.</h3>
              <p>
                Get past the surface. Understand the data, the code, the parts,
                and the system around them.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Build directly.</h3>
              <p>
                Turn the idea into something real: a dashboard, a model, a
                machine, or a working network.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Improve constantly.</h3>
              <p>
                Test it, question it, document it, and leave the next version
                better than the last.
              </p>
            </article>
          </div>
        </section>

        <section className="home-cta" aria-labelledby="home-cta-title">
          <div className="home-cta-code" aria-hidden="true">
            S / 3
          </div>
          <div>
            <span className="eyebrow">THE BUILD IS JUST GETTING STARTED</span>
            <h2 id="home-cta-title">Follow three stories as they grow.</h2>
          </div>
          <Link className="button button--light" href="#brothers">
            Choose a profile <span aria-hidden="true">↑</span>
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
