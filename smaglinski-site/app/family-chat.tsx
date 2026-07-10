"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const starterMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hi — ask me about the brothers, Rocky, the AI machine, or what we build together.",
};

const suggestions = ["What is Rocky?", "Tell me about the AI machine"];

export function FamilyChat({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) {
      transcript.scrollTop = transcript.scrollHeight;
    }
  }, [messages, pending]);

  const askQuestion = async (nextQuestion: string) => {
    const trimmed = nextQuestion.trim();
    if (!trimmed || pending) {
      return;
    }

    setQuestion("");
    setError("");
    setPending(true);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", text: trimmed },
    ]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const payload = (await response.json()) as {
        reply?: string;
        error?: string;
      };

      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || "The preview assistant is unavailable.");
      }

      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", text: payload.reply! },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The preview assistant is unavailable.",
      );
    } finally {
      setPending(false);
    }
  };

  const submitQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void askQuestion(question);
  };

  return (
    <aside
      id="family-chat-panel"
      className={`family-chat-panel${open ? " is-open" : ""}`}
      aria-labelledby="family-chat-heading"
    >
      <header className="family-chat-header">
        <div>
          <span>Portfolio assistant</span>
          <h2 id="family-chat-heading">Ask about us</h2>
        </div>
        <button
          className="family-chat-close"
          type="button"
          onClick={onClose}
          aria-label="Close portfolio assistant"
        >
          ×
        </button>
      </header>

      <div
        className="family-chat-transcript"
        ref={transcriptRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((message) => (
          <p
            className={`family-chat-message family-chat-message--${message.role}`}
            key={message.id}
          >
            {message.text}
          </p>
        ))}
        {pending ? (
          <p className="family-chat-message family-chat-message--assistant">
            Looking through the portfolio…
          </p>
        ) : null}
      </div>

      <div className="family-chat-controls">
        <div className="family-chat-suggestions" aria-label="Suggested questions">
          {suggestions.map((suggestion) => (
            <button
              type="button"
              onClick={() => void askQuestion(suggestion)}
              disabled={pending}
              key={suggestion}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form onSubmit={submitQuestion}>
          <label className="sr-only" htmlFor="family-chat-question">
            Ask a question about the Smaglinskis
          </label>
          <input
            id="family-chat-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a question…"
            maxLength={180}
            autoComplete="off"
          />
          <button type="submit" disabled={pending || !question.trim()}>
            Send
          </button>
        </form>

        <p className="family-chat-preview-note">
          Local preview · custom model not connected yet
        </p>
        {error ? <p className="family-chat-error" role="alert">{error}</p> : null}
      </div>
    </aside>
  );
}
