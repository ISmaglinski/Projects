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
  sourceUrl?: string;
  image?: string;
  imageAlt?: string;
};

export type Education = {
  school: string;
  degree: string;
  range: string;
  detail?: string;
};

export type SharedProject = {
  number: string;
  slug: string;
  title: string;
  category: string;
  image: string;
  alt: string;
  description: string;
  note: string;
  size: "feature" | "standard" | "wide";
  position: string;
  specs?: { label: string; value: string }[];
  secondaryImage?: string;
  secondaryAlt?: string;
  evidenceCaption?: string;
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
  primaryPortrait?: string;
  hoverPortrait?: string;
  portraitAlt?: string;
  portraitPosition?: string;
  hoverPosition?: string;
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
  github?: string;
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
    accent: "#d75b58",
    initials: "IS",
    status: "complete",
    primaryPortrait: "/images/portraits/temporary-headshot.jpg",
    hoverPortrait: "/images/portraits/temporary-full-body.jpg",
    portraitAlt: "Temporary faceless portrait stand-in for Ian",
    portraitPosition: "50% 42%",
    hoverPosition: "50% 50%",
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
        kicker: "Local knowledge systems",
        title: "Local RAG Knowledge Platform",
        description:
          "A self-hosted document intelligence platform that ingests PDF, DOCX, TXT, and Markdown files, creates embeddings, and returns source-grounded answers with filename, page, and chunk citations. Separate libraries, hybrid search, summaries, document controls, system statistics, and automated evaluations keep the system useful and testable.",
        tools: [
          "Python",
          "FastAPI",
          "Qdrant",
          "Ollama",
          "Qwen3 embeddings",
          "Docker",
          "Linux",
          "REST APIs",
        ],
      },
      {
        kicker: "Schema-aware generative AI",
        title: "Schema-Aware Local SQL Writer",
        description:
          "A locally hosted assistant that retrieves database-schema context before translating plain-language requests into T-SQL. Tested against a 214-table schema, it identifies the right tables, columns, relationships, joins, and filters, then returns the result through a focused web interface and API.",
        tools: [
          "Python",
          "FastAPI",
          "T-SQL",
          "SQL Server",
          "vLLM",
          "GPT-OSS 120B",
          "RAG",
          "Vector search",
        ],
        image: "/images/projects/sql-writer.png",
        imageAlt:
          "Dark SQL Writer interface with a natural-language request field, generated SQL result, validation, tables used, and ticket reference panels",
      },
      {
        kicker: "Local AI infrastructure",
        title: "Multi-GPU Local AI Server",
        description:
          "A self-hosted Linux inference server built around four RTX 3090 GPUs, 96 GB of combined VRAM, and 128 GB of system memory. It runs large language and embedding models alongside the RAG platform, SQL Writer, Open WebUI, and network-accessible AI APIs.",
        tools: [
          "Ubuntu Server",
          "NVIDIA CUDA",
          "4 x RTX 3090",
          "Ollama",
          "vLLM",
          "Docker",
          "systemd",
          "Linux networking",
        ],
      },
      {
        kicker: "Team software engineering",
        title: "Rocky",
        description:
          "A team-built, Canvas-inspired course platform for enrollment, roster and group management, and controlled access to university LLM API keys. Ian contributed the account, help, and credits experiences plus the API key generator.",
        tools: [
          "SvelteKit",
          "TypeScript",
          "Flask",
          "MongoDB",
          "Course administration",
          "LLM API keys",
        ],
        sourceUrl:
          "https://github.com/Spring-2026-Software-Engineering/Rocky",
      },
      {
        kicker: "Local developer tooling",
        title: "Self-Hosted VS Code AI Copilot",
        description:
          "A private coding-assistant workflow that connects VS Code on Windows to models running on the Linux AI server. It can create and edit files, explain unfamiliar projects, troubleshoot errors, and scaffold React and Vite applications without sending the work to a hosted model.",
        tools: [
          "VS Code",
          "Continue",
          "Cline",
          "Ollama API",
          "qwen3-coder-next",
          "React",
          "Vite",
          "REST APIs",
        ],
      },
      {
        kicker: "Voice + remote systems",
        title: "Local Jarvis Voice Assistant",
        description:
          "A Windows voice-assistant prototype that records and transcribes speech locally, sends the request to a language model on the Linux server, and reads the response aloud. It can also check remote GPU health over SSH with NVIDIA-SMI.",
        tools: [
          "Python",
          "faster-whisper",
          "sounddevice",
          "pyttsx3",
          "Ollama",
          "Llama 3.3 70B",
          "SSH",
          "NVIDIA-SMI",
        ],
      },
      {
        kicker: "Generative frontend tooling",
        title: "Local AI Website Generator",
        description:
          "An AI-powered website-generation prototype that uses local coding models to produce React and Vite pages and reusable components. The project combines a generator interface, reusable templates, AI service modules, content-generation logic, and browser-based testing.",
        tools: [
          "React",
          "Vite",
          "JavaScript",
          "Tailwind CSS",
          "Ollama",
          "Local LLMs",
          "Playwright",
        ],
      },
      {
        kicker: "Recommendation experience",
        title: "GameReady PC Build Planner",
        description:
          "A responsive web app that recommends PC component combinations from a shopper's budget, preferred games, performance targets, and build tier, then explains pricing, expected results, and useful upgrade paths.",
        tools: [
          "React",
          "Vite",
          "JavaScript",
          "Tailwind CSS",
          "Recommendation logic",
          "Local JSON data",
        ],
      },
      {
        kicker: "Frontend modernization",
        title: "Business Website Recreation",
        description:
          "A recreation and modernization of an existing business website that preserves its important content, branding, maps, and sections while improving responsive behavior, contact-page structure, CAPTCHA planning, and overall project organization.",
        tools: [
          "HTML",
          "CSS",
          "JavaScript",
          "Responsive design",
          "CAPTCHA planning",
          "Frontend refactoring",
        ],
      },
      {
        kicker: "Windows automation",
        title: "PowerShell SQL File Organizer",
        description:
          "A PowerShell utility that recursively gathers SQL files from nested folders into one central directory. Duplicate names are preserved safely by adding the source folder and, when needed, a numeric suffix instead of overwriting work.",
        tools: [
          "PowerShell",
          "Windows",
          "File-system automation",
          "Recursive processing",
          "Duplicate-safe naming",
        ],
      },
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
    github: "https://github.com/ISmaglinski",
  },
  jacob: {
    key: "jacob",
    number: "02",
    firstName: "Jacob",
    lastName: "Smaglinski",
    familyRole: "Middle",
    title: "Data Analyst",
    cardLine: "SQL · BI · applied AI",
    accent: "#4f9469",
    initials: "JS",
    status: "complete",
    primaryPortrait: "/images/portraits/temporary-headshot.jpg",
    hoverPortrait: "/images/portraits/temporary-full-body.jpg",
    portraitAlt: "Temporary faceless portrait stand-in for Jacob",
    portraitPosition: "50% 42%",
    hoverPosition: "50% 50%",
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
    title: "Operations Leader & Engineering Student",
    cardLine: "Operations · leadership · data",
    accent: "#d9aa32",
    initials: "IZ",
    status: "complete",
    primaryPortrait: "/images/portraits/temporary-headshot.jpg",
    hoverPortrait: "/images/portraits/temporary-full-body.jpg",
    portraitAlt: "Temporary faceless portrait stand-in for Isaac",
    portraitPosition: "50% 42%",
    hoverPosition: "50% 50%",
    profileHeadline: "Leading teams. Learning systems. Building what comes next.",
    intro:
      "Isaac is an operations leader and computer engineering student whose work connects sales, inventory, people development, and data-informed decision making.",
    about: [
      "At Bridgestone, Isaac works across customer sales, store profitability, parts inventory, work orders, and point-of-sale operations. He helped his location reach the top sales position while keeping customer loyalty and satisfaction at the center of the work.",
      "His earlier leadership spans retail department management and more than seven years directing student programs. That work includes managing staff and volunteer teams, growing attendance, leading fundraising, coordinating community outreach, and analyzing operational data in Excel.",
    ],
    facts: [
      { label: "Based", value: "Akron, Ohio" },
      { label: "Focus", value: "Operations + people + data" },
      { label: "Education", value: "Stark State College" },
      { label: "Status", value: "Working + studying" },
    ],
    experience: [
      {
        company: "Bridgestone",
        role: "Tire Sales Manager",
        range: "June 2023 - Present",
        location: "Cleveland, Ohio",
        summary:
          "Customer-facing sales and store operations spanning product guidance, profitability, inventory, work orders, and retention.",
        highlights: [
          "Introduced tire products to customers to improve unit sales, store profit, satisfaction, loyalty, and retention.",
          "Worked with mechanics to keep parts stocked, create work and part orders, and prepare customer invoices and tickets through the point-of-sale system.",
          "Helped lead the location to the number-one sales position during his time on the sales team.",
        ],
      },
      {
        company: "Heartland Community Church",
        role: "Student Ministry Director",
        range: "January 2022 - June 2023",
        location: "Medina, Ohio",
        summary:
          "Built and managed programs serving more than 150 people from grade school through young adulthood.",
        highlights: [
          "Increased attendance by nearly 50% in the first year through newly created programming.",
          "Recruited, trained, and managed more than 40 volunteers while developing future leaders.",
          "Led fundraising that generated more than $10,000 to subsidize student mission-trip costs.",
          "Organized and analyzed operational data in Excel using Pivot Charts, VBA macros, VLOOKUP, INDEX/MATCH, and other formulas.",
        ],
      },
      {
        company: "Hartville Hardware",
        role: "Department Manager",
        range: "February 2021 - February 2022",
        location: "Hartville, Ohio",
        summary:
          "Managed a seven-person department responsible for more than $4 million in 2021 revenue.",
        highlights: [
          "Led, scheduled, and supported a team of seven adults across daily department operations.",
          "Maintained supplier relationships to secure products and keep inventory under control.",
        ],
      },
      {
        company: "RiverTree Lake Church",
        role: "Student Ministry Director",
        range: "January 2016 - February 2021",
        location: "Uniontown, Ohio",
        summary:
          "Directed weekly programs, community outreach, and volunteer development for middle- and high-school students.",
        highlights: [
          "Increased weekly attendance by more than 40% over the course of his tenure.",
          "Created a student journal to reinforce lessons and help participants work through ideas and relationships.",
          "Developed school-based outreach and tailored youth-group satellite programs.",
          "Recruited, trained, and managed more than 25 volunteers while developing future leaders.",
        ],
      },
    ],
    projects: [
      {
        kicker: "Sales operations",
        title: "Customer Sales & Store Workflow",
        description:
          "A customer-to-work-order process connecting product guidance, parts inventory, mechanic coordination, invoices, and retention-focused service.",
        tools: ["Sales", "POS", "Inventory", "Work orders", "Customer retention"],
      },
      {
        kicker: "Program leadership",
        title: "Community Program Growth",
        description:
          "Programming and volunteer systems that served more than 150 people, increased attendance by nearly 50%, and raised over $10,000 for participant costs.",
        tools: ["Program design", "Team leadership", "Fundraising", "Community outreach"],
      },
      {
        kicker: "Operational analytics",
        title: "Excel Reporting & Planning",
        description:
          "Operational tracking and analysis using Excel Pivot Charts, VBA macros, VLOOKUP, INDEX/MATCH, and reusable formulas.",
        tools: ["Excel", "Pivot Charts", "VBA", "VLOOKUP", "INDEX/MATCH"],
      },
    ],
    skillGroups: [
      {
        label: "Operations",
        skills: ["Sales", "Inventory", "POS systems", "Scheduling", "Supplier relationships"],
      },
      {
        label: "Data & engineering",
        skills: ["Excel", "VBA", "SQL", "R", "Java", "C++", "BI tools"],
      },
      {
        label: "Leadership",
        skills: ["Team management", "Volunteer development", "Program design", "Fundraising", "Community outreach"],
      },
    ],
    education: [
      {
        school: "Stark State College",
        degree: "Associate of Computer Engineering",
        range: "2024 - Currently attending",
        detail:
          "Coursework includes Java, C++, SQL, analytical geometry, calculus, and technical report writing.",
      },
      {
        school: "Malone University",
        degree: "Bachelor's degrees in Youth Ministry and Bible/Theology",
        range: "2014 - 2018",
        detail: "Completed in Canton, Ohio.",
      },
    ],
    certifications: [
      "Google Data Analytics Certificate - Coursera, June 2023",
    ],
    email: "IsaacSmagz@gmail.com",
  },
};

export const personOrder: PersonKey[] = ["ian", "jacob", "isaac"];

export const sharedProjects: SharedProject[] = [
  {
    number: "01",
    slug: "ai-machine",
    title: "The AI Machine",
    category: "Local AI compute",
    image: "/images/projects/ai-machine.jpg",
    alt: "Open-air multi-GPU computer built for local AI workloads",
    description:
      "A four-GPU local AI workstation built around four NVIDIA GeForce RTX 3090 cards, providing 96 GB of aggregate VRAM alongside 128 GB of DDR4 system memory.",
    note: "Four RTX 3090s validated under sustained compute load",
    size: "feature",
    position: "58% 72%",
    specs: [
      { label: "GPUs", value: "4 x RTX 3090" },
      { label: "Aggregate VRAM", value: "96 GB" },
      { label: "System memory", value: "128 GB DDR4" },
      { label: "Workload", value: "Local AI compute" },
    ],
    secondaryImage: "/images/projects/nvidia-smi.png",
    secondaryAlt:
      "NVIDIA-SMI output showing four RTX 3090 GPUs at 100 percent utilization and about 21.5 GiB used on each GPU",
    evidenceCaption:
      "All four RTX 3090s under sustained load: NVIDIA-SMI shows 100% GPU utilization and roughly 21.5 GiB in use per card.",
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
];
