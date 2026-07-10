export type PersonKey = "ian" | "jacob" | "isaac";

export type Experience = {
  company: string;
  role: string;
  range: string;
  location?: string;
  summary: string;
  highlights: string[];
};

export type Project = {
  title: string;
  kicker: string;
  description: string;
  tools: string[];
};

export type Education = {
  school: string;
  degree: string;
  range: string;
  detail?: string;
};

export type Person = {
  key: PersonKey;
  number: string;
  firstName: string;
  lastName: string;
  familyRole: string;
  title: string;
  cardLine: string;
  accent: string;
  initials: string;
  status: "complete" | "pending";
  profileHeadline: string;
  intro: string;
  about: string[];
  facts: { label: string; value: string }[];
  experience: Experience[];
  projects: Project[];
  skillGroups: { label: string; skills: string[] }[];
  education: Education[];
  certifications: string[];
  email?: string;
  linkedIn?: string;
};

export const people: Record<PersonKey, Person> = {
  ian: {
    key: "ian",
    number: "01",
    firstName: "Ian",
    lastName: "Smaglinski",
    familyRole: "Youngest",
    title: "Computer Science Student",
    cardLine: "Data analytics · AI · systems",
    accent: "#42d7ff",
    initials: "IS",
    status: "complete",
    profileHeadline: "Learning the systems. Building the proof.",
    intro:
      "Ian is a computer science student turning coursework into practical data, analytics, and AI projects — with an eye toward the hardware that makes them run.",
    about: [
      "Ian studies computer science at Kent State University and works across the full path from raw data to a useful answer. His academic work includes building SQL Server datasets, shaping queries with CTEs and window functions, and translating those results into Power BI dashboards that can be presented and acted on.",
      "Beyond the dashboard, he uses Python, Pandas, and Plotly to study audience behavior, advertising impact, engagement, and demographic trends. He is especially interested in the meeting point between software, data, AI, and the physical systems behind them.",
    ],
    facts: [
      { label: "Based", value: "Northeast Ohio" },
      { label: "Focus", value: "Data + applied AI" },
      { label: "Education", value: "Kent State University" },
      { label: "Status", value: "Currently enrolled" },
    ],
    experience: [
      {
        company: "Kent State University",
        role: "Computer Science · Academic Projects",
        range: "March 2024 — Present",
        location: "Kent, Ohio",
        summary:
          "Hands-on analytics work spanning database design, reporting pipelines, visualization, and presentation.",
        highlights: [
          "Built and updated reporting datasets in SQL Server using stored procedures, CTEs, and window functions.",
          "Turned those datasets into Power BI dashboards focused on clear questions and actionable insights.",
          "Presented dashboard findings to groups with an emphasis on data-informed decision making.",
          "Used Python, Pandas, and Plotly to examine trends, advertising impact, engagement, and audience demographics.",
        ],
      },
    ],
    projects: [
      {
        kicker: "Data pipeline",
        title: "SQL to Power BI Analytics",
        description:
          "A reporting workflow that moves from SQL Server datasets and reusable query logic to a presentation-ready Power BI dashboard.",
        tools: ["SQL Server", "CTEs", "Window functions", "Power BI"],
      },
      {
        kicker: "Exploratory analysis",
        title: "Audience & Advertising Analysis",
        description:
          "Python analysis of public datasets to surface engagement patterns, advertising effects, demographic trends, and targeting opportunities.",
        tools: ["Python", "Pandas", "Plotly", "Data storytelling"],
      },
    ],
    skillGroups: [
      {
        label: "Data & BI",
        skills: [
          "SQL",
          "SQL Server",
          "Power BI",
          "Reporting",
          "Dashboarding",
        ],
      },
      {
        label: "Programming",
        skills: ["Python", "Pandas", "Plotly", "Java", "C++"],
      },
      {
        label: "Analysis",
        skills: [
          "Trend analysis",
          "Audience insights",
          "Data visualization",
          "Presenting findings",
        ],
      },
    ],
    education: [
      {
        school: "Kent State University",
        degree: "Bachelor's of Computer Science",
        range: "2022 — Currently enrolled",
        detail:
          "Coursework includes algorithms, statistics, calculus, database design, and discrete structures.",
      },
      {
        school: "Kent, Ohio",
        degree: "Associate's of Science",
        range: "2022 — 2025",
        detail:
          "Coursework includes Java, C++, calculus, and technical report writing.",
      },
    ],
    certifications: [
      "Querying Data Certification — Global Career Accelerator, June 2025",
      "Python and Data Certification — Global Career Accelerator, August 2025",
      "Intercultural Skills Certification — Global Career Accelerator, August 2025",
      "AI Professional Skills Certification — Global Career Accelerator, August 2025",
    ],
    email: "Smaglinski.Ian@gmail.com",
    linkedIn: "https://linkedin.com/in/ian-smaglinski",
  },
  jacob: {
    key: "jacob",
    number: "02",
    firstName: "Jacob",
    lastName: "Smaglinski",
    familyRole: "Middle",
    title: "Data Analyst",
    cardLine: "SQL · BI · applied AI",
    accent: "#7b8cff",
    initials: "JS",
    status: "complete",
    profileHeadline: "From messy systems to clear decisions.",
    intro:
      "Jacob is a data analyst working across data quality, business intelligence, observability, healthcare analytics, and applied machine learning.",
    about: [
      "Since 2018, Jacob has used SQL, Power BI, Tableau, Python, R, and JavaScript to investigate data issues, improve reporting, and translate technical findings into business decisions. His experience spans production data audits, executive dashboards, observability strategy, client advisory, and team enablement.",
      "His recent work brings applied AI and predictive modeling into that toolkit: experimenting with open-source LLMs and retrieval-augmented generation, developing retention-risk models, and modernizing complex SQL so the next person can understand and maintain it.",
    ],
    facts: [
      { label: "Based", value: "Northeast Ohio" },
      { label: "Focus", value: "Analytics + data quality" },
      { label: "Experience", value: "8+ years" },
      { label: "Current", value: "Healthcare data" },
    ],
    experience: [
      {
        company: "Lucet Health",
        role: "Data Informatics Analyst · Contractor",
        range: "May 2025 — Present",
        location: "Remote",
        summary:
          "Protecting the accuracy and stability of core healthcare product systems through data auditing, testing, and root-cause analysis.",
        highlights: [
          "Audits production data in SQL Server and develops test cases around core product systems.",
          "Investigates business-escalated anomalies and translates findings into actionable stakeholder guidance.",
          "Designs process flows and turns disparate workflows into usable technical documentation.",
          "Partners across teams to identify, deprecate, and purge obsolete database tables.",
        ],
      },
      {
        company: "Christian Healthcare Ministries",
        role: "Data Analyst",
        range: "March 2024 — May 2025",
        location: "Remote · North Canton, Ohio",
        summary:
          "Modernized reporting, developed predictive analytics, and tested practical uses for open-source language models.",
        highlights: [
          "Built and presented SQL-backed Power BI reporting for business units and executives.",
          "Created a vLLM and RAG proof of concept that explained authorizations and denials from a guidelines knowledge base.",
          "Refactored legacy stored procedures with CTEs and window functions to simplify logic and reduce runtime.",
          "Developed logistic regression and random forest models that produced a business-used retention risk score.",
        ],
      },
      {
        company: "Dynatrace",
        role: "Data Analyst",
        range: "March 2018 — March 2024",
        location: "Remote · Detroit, Michigan",
        summary:
          "Advised clients on observability, analytics, implementation, and the data stories behind better digital experiences.",
        highlights: [
          "Supported 8–10 concurrent clients through Dynatrace implementation and application onboarding.",
          "Served as a BI escalation point and subject-matter expert while mentoring new team members.",
          "Used Adobe Analytics and Google Analytics to turn experience data into actionable client changes.",
          "Created Python, R, and JavaScript tooling that extended reporting in Tableau and Power BI.",
        ],
      },
    ],
    projects: [
      {
        kicker: "Applied AI",
        title: "Healthcare Guidelines AI Assistant",
        description:
          "A retrieval-augmented language model prototype designed to explain authorizations and denials from an established guidelines knowledge base.",
        tools: ["vLLM", "RAG", "Open-source LLMs", "Knowledge retrieval"],
      },
      {
        kicker: "Predictive analytics",
        title: "Member Retention Risk Model",
        description:
          "Logistic regression and random forest models that helped explain member movement and produced a risk score used by the business.",
        tools: ["Logistic regression", "Random forest", "Feature analysis"],
      },
      {
        kicker: "Data engineering",
        title: "SQL Reporting Modernization",
        description:
          "A focused refactor of legacy stored procedures using modern SQL patterns to simplify maintenance and improve runtime.",
        tools: ["SQL Server", "Stored procedures", "CTEs", "Window functions"],
      },
    ],
    skillGroups: [
      {
        label: "Data systems",
        skills: [
          "SQL Server",
          "Stored procedures",
          "Data quality",
          "Root-cause analysis",
          "Testing",
        ],
      },
      {
        label: "Analytics",
        skills: [
          "Power BI",
          "Tableau",
          "Adobe Analytics",
          "Google Analytics",
          "Predictive modeling",
        ],
      },
      {
        label: "Code & AI",
        skills: [
          "Python",
          "R",
          "JavaScript",
          "vLLM",
          "Retrieval-augmented generation",
        ],
      },
      {
        label: "Leadership",
        skills: [
          "Client advisory",
          "Stakeholder presentations",
          "Mentoring",
          "Training",
          "Technical documentation",
        ],
      },
    ],
    education: [
      {
        school: "Kent State University",
        degree: "Bachelor's of Computer Science",
        range: "2018 — Currently enrolled",
        detail:
          "Coursework includes algorithms, statistics, calculus, database design, and discrete structures.",
      },
      {
        school: "Stark State College",
        degree: "Associate's of Computer Engineering",
        range: "2013 — 2016",
        detail:
          "Coursework includes Java, C++, calculus, and technical report writing.",
      },
    ],
    certifications: [
      "ITIL Foundation — AXELOS, December 2024",
      "Google Data Analytics — Coursera, July 2022",
      "Dynatrace Associate — Dynatrace, February 2019",
    ],
    email: "JSmaglinski@hotmail.com",
    linkedIn: "https://linkedin.com/in/jsmaglinski",
  },
  isaac: {
    key: "isaac",
    number: "03",
    firstName: "Isaac",
    lastName: "Smaglinski",
    familyRole: "Oldest",
    title: "Profile in progress",
    cardLine: "Story · work · details coming",
    accent: "#ff8a4c",
    initials: "IS",
    status: "pending",
    profileHeadline: "The next chapter is being assembled.",
    intro:
      "Isaac's page is ready for his portrait, background, resume, and the projects he wants to feature.",
    about: [
      "Isaac is the oldest of the three Smaglinski brothers. His full professional story is intentionally being held open until his resume and project details are available.",
      "The finished page structure is already here, so adding his experience, work, skills, and contact information later will not require a redesign.",
    ],
    facts: [
      { label: "Family role", value: "Oldest brother" },
      { label: "Portrait", value: "Coming soon" },
      { label: "Resume", value: "Coming soon" },
      { label: "Projects", value: "Being documented" },
    ],
    experience: [],
    projects: [],
    skillGroups: [],
    education: [],
    certifications: [],
  },
};

export const personOrder: PersonKey[] = ["ian", "jacob", "isaac"];

export const sharedProjects = [
  {
    number: "01",
    slug: "ai-machine",
    title: "The AI Machine",
    category: "Local AI compute",
    image: "/images/projects/ai-machine.png",
    alt: "Open-air multi-GPU computer built for local AI workloads",
    description:
      "An open-air, multi-GPU system assembled for hands-on AI experimentation and compute-intensive workloads.",
    note: "Build story and benchmarks coming soon",
    size: "feature",
    position: "58% 72%",
  },
  {
    number: "02",
    slug: "compact-pc",
    title: "Compact PC Prototype",
    category: "Small-form hardware",
    image: "/images/projects/compact-pc.jpg",
    alt: "Compact PC motherboard and cooler mounted above a small black chassis",
    description:
      "A compact build focused on fitting capable components into a tightly considered footprint.",
    note: "Parts list and design notes coming soon",
    size: "standard",
    position: "50% 48%",
  },
  {
    number: "03",
    slug: "custom-workstation",
    title: "Custom Workstation",
    category: "PC building",
    image: "/images/projects/custom-workstation.jpg",
    alt: "White custom PC with RGB cooling and a GeForce RTX graphics card",
    description:
      "A custom PC combining performance, cooling, cable management, and a clean finished presentation.",
    note: "Full specifications coming soon",
    size: "standard",
    position: "50% 44%",
  },
  {
    number: "04",
    slug: "home-lab",
    title: "Home Lab & Network Stack",
    category: "Infrastructure",
    image: "/images/projects/home-lab.jpg",
    alt: "Home lab rack with patch panel, firewall, network switch, and server",
    description:
      "A rack-based networking and server environment built for learning, experimentation, and self-hosted infrastructure.",
    note: "Network map and services coming soon",
    size: "wide",
    position: "50% 42%",
  },
] as const;
