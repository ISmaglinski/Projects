export function answerPortfolioQuestion(question: string): string {
  const normalized = question.toLowerCase();

  if (normalized.includes("rocky") || normalized.includes("canvas") || normalized.includes("api key")) {
    return "Rocky is a team-built, Canvas-inspired course platform for Kent State. It supports courses, rosters, groups, and controlled university LLM API keys. Ian contributed the account, help, and credits experiences plus the API-key generator.";
  }

  if (normalized.includes("ian")) {
    return "Ian is a Kent State computer science student working across data analytics, AI, and software systems. His portfolio includes Rocky, SQL-to-Power-BI reporting, and Python audience analysis.";
  }

  if (normalized.includes("jacob")) {
    return "Jacob is a data analyst whose work spans SQL, business intelligence, observability, healthcare analytics, predictive modeling, and applied AI.";
  }

  if (normalized.includes("isaac")) {
    return "Isaac is the oldest brother. His full portfolio is still being assembled, so the site currently keeps his profile as a clearly labeled preview.";
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

  return "I’m a local preview that answers from this portfolio’s current content. Try asking about Ian, Jacob, Rocky, the AI machine, or what the brothers build together.";
}
