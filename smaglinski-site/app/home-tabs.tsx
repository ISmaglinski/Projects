"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PersonCard } from "./components";
import { FamilyChat } from "./family-chat";
import { people, personOrder, sharedProjects } from "./site-data";
import { useHashTabs } from "./use-tabs";

const HOME_TABS = [
  {
    id: "brothers",
    number: "01",
    label: "Brothers",
    description: "Ian, Jacob, and Isaac",
  },
  {
    id: "builds",
    number: "02",
    label: "Built together",
    description: "AI, hardware, and infrastructure",
  },
] as const;

const HOME_TAB_IDS = HOME_TABS.map((tab) => tab.id);
type HomeTabId = (typeof HOME_TAB_IDS)[number];

export function HomeTabs() {
  const { activeTab, selectTab, onTabKeyDown } = useHashTabs<HomeTabId>(
    HOME_TAB_IDS,
    "brothers",
    "home",
  );
  const [selectedSlug, setSelectedSlug] = useState(sharedProjects[0].slug);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const readProject = () => {
      const candidate = new URL(window.location.href).searchParams.get("project");
      if (candidate && sharedProjects.some((project) => project.slug === candidate)) {
        setSelectedSlug(candidate);
      }
    };

    const initialRead = window.requestAnimationFrame(readProject);
    window.addEventListener("popstate", readProject);
    return () => {
      window.cancelAnimationFrame(initialRead);
      window.removeEventListener("popstate", readProject);
    };
  }, []);

  const selectedProject = useMemo(
    () =>
      sharedProjects.find((project) => project.slug === selectedSlug) ??
      sharedProjects[0],
    [selectedSlug],
  );

  const activeMeta =
    HOME_TABS.find((tab) => tab.id === activeTab) ?? HOME_TABS[0];

  const updateProjectUrl = (slug: string, addHistory: boolean) => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("project", slug);
    nextUrl.hash = "builds";
    window.history[addHistory ? "pushState" : "replaceState"](
      { tab: "builds", project: slug },
      "",
      nextUrl,
    );
  };

  const chooseProject = (slug: string) => {
    setSelectedSlug(slug);
    setChatOpen(false);

    if (activeTab !== "builds") {
      selectTab("builds");
      updateProjectUrl(slug, false);
    } else {
      updateProjectUrl(slug, true);
    }

    window.requestAnimationFrame(() => {
      document.getElementById("selected-project-heading")?.focus();
    });
  };

  const chooseHomeTab = (id: HomeTabId) => {
    if (id === activeTab) {
      return;
    }

    selectTab(id);
    setChatOpen(false);
    if (id === "brothers") {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete("project");
      nextUrl.hash = "brothers";
      window.history.replaceState({ tab: "brothers" }, "", nextUrl);
    }
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (chatOpen) {
        setChatOpen(false);
      } else if (activeTab === "builds") {
        chooseHomeTab("brothers");
        document.getElementById("home-tab-brothers")?.focus();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  });

  return (
    <div className="tabbed-home">
      <a className="skip-link" href={`#home-panel-${activeTab}`}>
        Skip to active panel
      </a>

      <header className="interface-header">
        <Link className="interface-brand" href="/#brothers" aria-label="Smaglinski home">
          <span className="interface-brand-mark" aria-hidden="true">
            S
          </span>
          <span>
            <strong>Smaglinski</strong>
            <small>IAN · JACOB · ISAAC</small>
          </span>
        </Link>

        <div className="interface-tabs" role="tablist" aria-label="Main sections">
          {HOME_TABS.map((tab, index) => (
            <button
              key={tab.id}
              id={`home-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`home-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => chooseHomeTab(tab.id)}
              onKeyDown={(event) => onTabKeyDown(event, tab.id)}
            >
              <kbd>{index + 1}</kbd>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <button
          className="home-chat-launcher"
          type="button"
          onClick={() => setChatOpen(true)}
          aria-expanded={chatOpen}
          aria-controls="family-chat-panel"
        >
          <span aria-hidden="true">●</span> Ask us
        </button>
      </header>

      <div className="interface-context">
        <span>{activeMeta.number} / {activeMeta.label.toUpperCase()}</span>
        <p>{activeMeta.description}</p>
        <span className="interface-hint">ARROWS TO MOVE · 1–2 TO SWITCH</span>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {activeMeta.label} panel selected.
      </p>

      <main className="home-panel-stack">
        <section
          id="home-panel-brothers"
          className="home-tab-panel home-tab-panel--brothers"
          role="tabpanel"
          aria-labelledby="home-tab-brothers"
          tabIndex={0}
          hidden={activeTab !== "brothers"}
        >
          <div className="brother-stage">
            <div className="brother-card-grid" aria-label="The Smaglinski brothers">
              {personOrder.map((key, index) => (
                <PersonCard person={people[key]} index={index} key={key} />
              ))}
            </div>

            <FamilyChat open={chatOpen} onClose={() => setChatOpen(false)} />

            <button
              className="home-build-cta"
              type="button"
              onClick={() => chooseProject(sharedProjects[0].slug)}
            >
              <span className="home-build-cta-image">
                <Image
                  src={sharedProjects[0].image}
                  alt=""
                  fill
                  sizes="(min-width: 112rem) 20vw, 220px"
                  style={{ objectPosition: sharedProjects[0].position }}
                />
              </span>
              <span className="home-build-cta-copy">
                <small>Built together</small>
                <strong>See more from the brothers</strong>
                <p>Machines, data tools, and home-lab projects we build together.</p>
                <span>Explore four projects →</span>
              </span>
            </button>

            {chatOpen ? (
              <button
                className="family-chat-backdrop"
                type="button"
                aria-label="Close portfolio assistant"
                onClick={() => setChatOpen(false)}
              />
            ) : null}
          </div>

          <div className="brother-panel-caption">
            <p>
              <strong>Three brothers.</strong> Data, AI, hardware, and infrastructure.
            </p>
            <span>Select a card for the full profile</span>
          </div>
        </section>

        <section
          id="home-panel-builds"
          className="home-tab-panel home-tab-panel--builds"
          role="tabpanel"
          aria-labelledby="home-tab-builds"
          tabIndex={0}
          hidden={activeTab !== "builds"}
        >
          <div className="project-workspace">
            <article className="selected-project-card">
              <div className="selected-project-photo">
                <Image
                  src={selectedProject.image}
                  alt={selectedProject.alt}
                  fill
                  priority={activeTab === "builds"}
                  sizes="(max-width: 900px) 100vw, 48vw"
                  style={{ objectPosition: selectedProject.position }}
                />
                <div className="selected-project-photo-meta">
                  <span>Built together</span>
                  <span>{selectedProject.category}</span>
                </div>
              </div>

              <div className="selected-project-info">
                <span className="panel-kicker">BUILT TOGETHER / {selectedProject.number}</span>
                <h1 id="selected-project-heading" tabIndex={-1}>
                  {selectedProject.title}
                </h1>
                <p>{selectedProject.description}</p>

                {selectedProject.specs ? (
                  <dl className="machine-specs">
                    {selectedProject.specs.map((spec) => (
                      <div key={spec.label}>
                        <dt>{spec.label}</dt>
                        <dd>{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="project-details-pending">
                    <span className="status-dot" aria-hidden="true" />
                    {selectedProject.note}
                  </div>
                )}

                {selectedProject.secondaryImage ? (
                  <figure className="evidence-card">
                    <div>
                      <Image
                        src={selectedProject.secondaryImage}
                        alt={selectedProject.secondaryAlt ?? ""}
                        fill
                        sizes="(max-width: 900px) 92vw, 35vw"
                      />
                    </div>
                    <figcaption>
                      <span>NVIDIA-SMI / LOAD TEST</span>
                      <p>{selectedProject.evidenceCaption}</p>
                    </figcaption>
                  </figure>
                ) : null}
              </div>
            </article>

            <aside className="project-selector" aria-label="Choose a shared project">
              <div className="project-selector-heading">
                <span>More projects</span>
                <strong>{Number(selectedProject.number)} of 4</strong>
              </div>
              {sharedProjects.map((project) => (
                <button
                  key={project.slug}
                  type="button"
                  className={project.slug === selectedProject.slug ? "is-selected" : ""}
                  aria-pressed={project.slug === selectedProject.slug}
                  onClick={() => chooseProject(project.slug)}
                >
                  <span className="project-selector-thumb">
                    <Image
                      src={project.image}
                      alt=""
                      fill
                      sizes="150px"
                      style={{ objectPosition: project.position }}
                    />
                  </span>
                  <span>
                    <small>{project.number} · {project.category}</small>
                    <strong>{project.title}</strong>
                  </span>
                  <i aria-hidden="true">+</i>
                </button>
              ))}
              <button
                className="back-to-brothers"
                type="button"
                onClick={() => chooseHomeTab("brothers")}
              >
                <span aria-hidden="true">←</span> Back to brothers
              </button>
            </aside>
          </div>
        </section>
      </main>

      <footer className="interface-footer">
        <span>SMAGLINSKI.COM</span>
        <span>PORTRAITS + MORE BUILD DATA COMING NEXT</span>
        <span>{activeTab === "brothers" ? "3 PROFILES" : "4 SHARED BUILDS"}</span>
      </footer>
    </div>
  );
}
