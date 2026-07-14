export function answerPortfolioQuestion(question: string): string {
  const normalized = question.toLowerCase();

  if (normalized.includes("rocky") || normalized.includes("canvas") || normalized.includes("api key")) {
    return "Rocky is a team-built, Canvas-inspired course platform for Kent State. It supports courses, rosters, groups, and controlled university LLM API keys. Ian contributed the account, help, and credits experiences plus the API-key generator.";
  }

  if (normalized.includes("github") && normalized.includes("ian")) {
    return "Ian's GitHub is https://github.com/ISmaglinski, where his public code and project repositories can be found.";
  }

  if (
    normalized.includes("rag") ||
    normalized.includes("knowledge platform") ||
    normalized.includes("document search")
  ) {
    return "Ian's Local RAG Knowledge Platform ingests PDF, DOCX, TXT, and Markdown files, creates embeddings, and returns source-grounded answers with filename, page, and chunk citations. It adds separate libraries, hybrid search, summaries, document management, statistics, and automated evaluations on a self-hosted Python, FastAPI, Qdrant, and Ollama stack.";
  }

  if (
    normalized.includes("sql writer") ||
    normalized.includes("t-sql") ||
    normalized.includes("214 tables")
  ) {
    return "Ian's Schema-Aware Local SQL Writer retrieves the relevant database structure before generating T-SQL, helping the local model choose tables, columns, relationships, joins, and filters. It has been tested against a 214-table schema and is available through a focused web interface and API.";
  }

  if (normalized.includes("jarvis") || normalized.includes("voice assistant")) {
    return "Ian's Local Jarvis prototype records and transcribes speech on Windows, sends the request to a model hosted on the Linux AI server, reads the response aloud, and can inspect remote GPU health over SSH.";
  }

  if (
    normalized.includes("copilot") ||
    normalized.includes("continue") ||
    normalized.includes("cline")
  ) {
    return "Ian's self-hosted coding assistant connects VS Code on Windows to coding models on the local Linux AI server. It can create and edit files, explain projects, troubleshoot errors, and scaffold React and Vite applications while keeping inference local.";
  }

  if (normalized.includes("ian")) {
    return "Ian is a Kent State computer science student building local AI infrastructure and practical software. His work includes a cited RAG knowledge platform, a schema-aware SQL Writer tested on 214 tables, a four-GPU AI server, local coding and voice assistants, Rocky, frontend products, data reporting, and automation.";
  }

  if (normalized.includes("jacob")) {
    return "Jacob is a data analyst whose work spans SQL, business intelligence, observability, healthcare analytics, predictive modeling, and applied AI.";
  }

  if (normalized.includes("isaac")) {
    return "Isaac is an operations leader and computer engineering student with experience in sales, inventory, department management, community programs, volunteer leadership, fundraising, and Excel-based analysis.";
  }

  if (
    normalized.includes("ai machine") ||
    normalized.includes("gpu") ||
    normalized.includes("3090") ||
    normalized.includes("vram")
  ) {
    return "The local AI machine uses four RTX 3090 GPUs for 96 GB of aggregate VRAM, paired with 128 GB of DDR4 system memory. The Built Together tab includes the machine and its NVIDIA-SMI load-test evidence.";
  }

  if (
    normalized.includes("build") ||
    normalized.includes("project") ||
    normalized.includes("together")
  ) {
    return "Together, the brothers build local AI systems, custom PCs, compact hardware, and home-lab infrastructure. Open Built Together to explore the current four-project collection.";
  }

  return "I’m a local preview that answers from this portfolio’s current content. Try asking about Ian's RAG platform, SQL Writer, Jarvis, coding copilot, Rocky, the AI machine, or what the brothers build together.";
}
