import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignLeft,
  CaseSensitive,
  Check,
  Clock,
  Copy,
  Eraser,
  Pilcrow,
  Space,
  WholeWord,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

const READING_WPM = 200;

type Stats = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingValue: string;
};

function analyze(text: string): Stats {
  const characters = [...text].length;
  const charactersNoSpaces = [...text.replace(/\s/g, "")].length;
  const trimmed = text.trim();

  const words = trimmed
    ? trimmed.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length
    : 0;

  const paragraphs = trimmed
    ? text.split(/\n+/).filter((block) => /[\p{L}\p{N}]/u.test(block)).length
    : 0;

  const sentences = trimmed
    ? trimmed
        .replace(/\s+/g, " ")
        .split(/[.!?…]+/u)
        .filter((chunk) => /[\p{L}\p{N}]/u.test(chunk)).length
    : 0;

  let readingValue = "0";
  if (words > 0) {
    const minutes = words / READING_WPM;
    readingValue = minutes < 1 ? "< 1" : String(Math.round(minutes));
  }

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    readingValue,
  };
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

type StatCard = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  emphasis?: boolean;
};

function Home() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const resetCopy = useRef<number | null>(null);
  const stats = useMemo(() => analyze(text), [text]);
  const empty = text.length === 0;

  useEffect(() => {
    return () => {
      if (resetCopy.current !== null) window.clearTimeout(resetCopy.current);
    };
  }, []);

  const cards: StatCard[] = [
    {
      label: "Words",
      value: formatCount(stats.words),
      detail: "in this text",
      icon: WholeWord,
      emphasis: true,
    },
    {
      label: "Characters",
      value: formatCount(stats.characters),
      detail: "with spaces",
      icon: CaseSensitive,
    },
    {
      label: "Characters",
      value: formatCount(stats.charactersNoSpaces),
      detail: "without spaces",
      icon: Space,
    },
    {
      label: "Sentences",
      value: formatCount(stats.sentences),
      detail: "split on . ! ?",
      icon: Pilcrow,
    },
    {
      label: "Paragraphs",
      value: formatCount(stats.paragraphs),
      detail: "split on new lines",
      icon: AlignLeft,
    },
    {
      label: "Reading time",
      value: stats.readingValue,
      detail: "min · 200 wpm",
      icon: Clock,
    },
  ];

  function markCopied() {
    setCopied(true);
    if (resetCopy.current !== null) window.clearTimeout(resetCopy.current);
    resetCopy.current = window.setTimeout(() => setCopied(false), 1800);
  }

  async function copyText() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      markCopied();
      return;
    } catch {
      const field = document.getElementById("draft");
      if (!(field instanceof HTMLTextAreaElement)) return;
      field.focus();
      field.select();
      if (document.execCommand("copy")) markCopied();
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8 pb-6 sm:px-6 sm:pt-12">
        <header className="flex items-center gap-4">
          <img
            src="/avatar.png"
            alt=""
            width={512}
            height={512}
            className="size-14 shrink-0 drop-shadow-md sm:size-16"
          />
          <div className="min-w-0">
            <h1 className="font-display text-4xl leading-tight font-medium tracking-tight text-fg sm:text-5xl">
              Free Word Counter
            </h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Count words, characters, sentences & more instantly
            </p>
            <p className="mt-2 text-sm font-semibold tracking-wide text-fg">Made by Aztec</p>
          </div>
        </header>

        <section aria-label="Text statistics" className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 lg:grid-cols-6">
          {cards.map((card) => (
            <article
              key={`${card.label}-${card.detail}`}
              className="panel min-w-0 rounded-2xl px-3.5 py-3.5 sm:px-4 sm:py-4"
            >
              <div className="flex items-center gap-1.5 text-muted">
                <card.icon className="size-4 shrink-0" aria-hidden="true" />
                <h2 className="truncate text-sm font-semibold">{card.label}</h2>
              </div>
              <p
                className={`stat-value mt-2 text-3xl font-semibold sm:text-4xl ${
                  card.emphasis ? "text-primary" : "text-fg"
                }`}
              >
                {card.value}
              </p>
              <p className="mt-1 truncate text-sm text-muted">{card.detail}</p>
            </article>
          ))}
        </section>

        <section className="editor-shell mt-4 rounded-2xl sm:mt-5" aria-label="Text editor">
          <label htmlFor="draft" className="sr-only">
            Text to analyze
          </label>
          <textarea
            id="draft"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setCopied(false);
            }}
            placeholder="Paste or start typing your text here…"
            spellCheck
            className="block min-h-64 w-full resize-y bg-transparent px-4 py-4 text-lg leading-relaxed text-fg outline-none placeholder:text-muted sm:min-h-80 sm:px-5 sm:py-5 lg:min-h-96"
          />
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-3 py-3 sm:px-4">
            <button
              type="button"
              onClick={() => {
                setText("");
                setCopied(false);
                document.getElementById("draft")?.focus();
              }}
              disabled={empty}
              className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-muted transition-colors duration-200 hover:bg-wash hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Eraser className="size-4" aria-hidden="true" />
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                void copyText();
              }}
              disabled={empty}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary transition-colors duration-200 hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </section>
      </main>

      <footer className="px-4 py-6 text-center text-sm text-muted">
        <p className="font-semibold text-fg">Made by Aztec</p>
        <p className="mt-1">Free forever • No signup required</p>
        <p className="mt-1">Your text stays in this browser. Nothing is uploaded.</p>
      </footer>
    </div>
  );
}
