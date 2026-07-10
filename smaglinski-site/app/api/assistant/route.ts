import { answerPortfolioQuestion } from "../../assistant-knowledge";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { question?: unknown }
    | null;
  const question = typeof body?.question === "string" ? body.question.trim() : "";

  if (!question) {
    return Response.json(
      { error: "Please enter a question." },
      { status: 400 },
    );
  }

  if (question.length > 180) {
    return Response.json(
      { error: "Please keep the question under 180 characters." },
      { status: 400 },
    );
  }

  // The browser can keep this same API contract when a custom model is added.
  // Only this server route should receive future model credentials.
  return Response.json({
    reply: answerPortfolioQuestion(question),
    mode: "local-preview",
  });
}
