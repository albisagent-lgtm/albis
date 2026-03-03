"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const questions = [
  {
    q: "How many countries' news sources do you read regularly?",
    a: ["0–1", "2–3", "4–6", "7+"],
  },
  {
    q: "When you see a headline, how often do you check how other countries covered it?",
    a: ["Never", "Rarely", "Sometimes", "Always"],
  },
  {
    q: "How many different news apps or sites do you check daily?",
    a: ["1", "2–3", "4–5", "6+"],
  },
  {
    q: "Can you name a news source from outside your continent?",
    a: ["No", "Maybe one", "A few", "Several"],
  },
  {
    q: "When a major event happens, do you notice the words different outlets use to describe it?",
    a: ["Never", "Sometimes", "Often", "Always"],
  },
  {
    q: "How often do you read news in a language other than your primary one (or translated from another region)?",
    a: ["Never", "Rarely", "Monthly", "Weekly+"],
  },
  {
    q: "Do you know what stories are trending in countries other than your own right now?",
    a: ["No idea", "Vaguely", "Some", "Yes, several"],
  },
  {
    q: "When you disagree with a news take, do you seek out the opposing perspective?",
    a: ["Never", "Rarely", "Sometimes", "Always"],
  },
  {
    q: "How aware are you of how algorithms shape what news you see?",
    a: ["Not at all", "Somewhat", "Very", "I actively counteract it"],
  },
  {
    q: "How would you describe your current news consumption?",
    a: [
      "Mostly one source",
      "A few similar sources",
      "Diverse domestic sources",
      "Truly global mix",
    ],
  },
];

const SCORES = [0, 3, 7, 10] as const;

function getBracket(score: number) {
  if (score <= 25)
    return {
      name: "Echo Chamber",
      desc: "You're seeing one slice of reality. Most of us start here — the good news is, small changes make a big difference.",
    };
  if (score <= 50)
    return {
      name: "Domestic Lens",
      desc: "You're informed, but through one country's perspective. Adding even one international source would shift what you see.",
    };
  if (score <= 75)
    return {
      name: "Expanding View",
      desc: "You're ahead of most people. Keep going — the patterns between sources is where the real insight lives.",
    };
  return {
    name: "Global Thinker",
    desc: "You see what most people miss. Your information diet gives you a genuine edge in understanding the world.",
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type Phase = "quiz" | "email" | "result";

export function QuizClient() {
  const [answers, setAnswers] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("quiz");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [mountTime] = useState(Date.now);

  const currentQ = answers.length;
  const totalScore = answers.reduce((s, i) => s + SCORES[i], 0);

  const pickAnswer = useCallback(
    (idx: number) => {
      const next = [...answers, idx];
      setAnswers(next);
      if (next.length === questions.length) {
        setPhase("email");
      }
    },
    [answers],
  );

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    if (!email.trim()) {
      setEmailError("Please enter your email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source: "quiz",
          _t: mountTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await res.json();
      if (!res.ok && data.message) {
        setEmailError(data.message);
        setSubmitting(false);
        return;
      }
    } catch {
      // still show results even if subscribe fails
    }
    setSubmitting(false);
    setPhase("result");
  };

  const skipEmail = () => setPhase("result");

  const getShareText = () => {
    if (totalScore <= 25) {
      return "I'm living in an echo chamber. 🫣 How healthy is YOUR news diet? albis.news/quiz";
    } else if (totalScore <= 50) {
      return `My news diet needs work. Only scored ${totalScore}/100. Think you'd do better? albis.news/quiz`;
    } else if (totalScore <= 75) {
      return `Scored ${totalScore}/100 on my information diet — not bad but room to grow. Can you beat me? albis.news/quiz`;
    }
    return `Scored ${totalScore}/100 — my news diet is healthier than most. 💪 How's yours? albis.news/quiz`;
  };

  const shareText = getShareText();

  const restart = () => {
    setAnswers([]);
    setPhase("quiz");
    setEmail("");
    setEmailError("");
  };

  // Save quiz results when shown
  useEffect(() => {
    if (phase === "result") {
      const bracket = getBracket(totalScore);
      fetch("/api/quiz-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: totalScore,
          bracket: bracket.name,
          answers,
          email: email || null,
        }),
      }).catch(() => {
        // Fail silently if endpoint doesn't exist yet
      });
    }
  }, [phase, totalScore, answers, email]);

  /* ---- Render ---------------------------------------------------- */

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-20">
      {/* Progress bar */}
      {phase === "quiz" && (
        <div className="mb-10">
          <div className="mb-2 flex items-center justify-between text-xs tracking-wide text-[#0f0f0f]/50 dark:text-[#f0efec]/40">
            <span>Question {currentQ + 1} of {questions.length}</span>
            <span>{Math.round((currentQ / questions.length) * 100)}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[#0f0f0f] transition-all duration-500 ease-out dark:bg-[#f0efec]"
              style={{ width: `${(currentQ / questions.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ---- Quiz phase ---- */}
      {phase === "quiz" && (
        <div key={currentQ} className="animate-fade-in">
          <h2 className="mb-8 font-[family-name:var(--font-source-serif)] text-2xl font-medium leading-snug sm:text-3xl">
            {questions[currentQ].q}
          </h2>
          <div className="grid gap-3">
            {questions[currentQ].a.map((label, idx) => (
              <button
                key={idx}
                onClick={() => pickAnswer(idx)}
                className="group w-full rounded-xl border border-black/[0.08] bg-white px-6 py-4 text-left text-base font-medium transition-all hover:border-black/20 hover:shadow-sm active:scale-[0.98] dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/20 sm:text-lg"
              >
                <span className="mr-3 inline-block w-6 text-center text-sm text-[#0f0f0f]/30 dark:text-[#f0efec]/30">
                  {String.fromCharCode(65 + idx)}
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---- Email phase ---- */}
      {phase === "email" && (
        <div className="animate-fade-in text-center">
          <h2 className="mb-3 font-[family-name:var(--font-source-serif)] text-2xl font-medium sm:text-3xl">
            Your score is ready
          </h2>
          <p className="mb-8 text-[#0f0f0f]/60 dark:text-[#f0efec]/50">
            Enter your email to get your detailed results and personalised tips.
          </p>
          <form onSubmit={submitEmail} className="mx-auto max-w-sm">
            {/* honeypot */}
            <input
              type="text"
              name="website"
              className="absolute -left-[9999px] opacity-0"
              tabIndex={-1}
              autoComplete="off"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-black/[0.1] bg-white px-5 py-3.5 text-base outline-none transition focus:border-black/30 dark:border-white/[0.1] dark:bg-white/[0.04] dark:focus:border-white/30"
            />
            {emailError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {emailError}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-xl bg-[#0f0f0f] px-6 py-3.5 text-base font-medium text-white transition hover:bg-[#0f0f0f]/85 disabled:opacity-50 dark:bg-[#f0efec] dark:text-[#0f0f0f] dark:hover:bg-[#f0efec]/85"
            >
              {submitting ? "Submitting..." : "See my results"}
            </button>
          </form>
          <button
            onClick={skipEmail}
            className="mt-4 text-sm text-[#0f0f0f]/40 underline-offset-2 hover:underline dark:text-[#f0efec]/30"
          >
            Skip, just show my score
          </button>
        </div>
      )}

      {/* ---- Result phase ---- */}
      {phase === "result" && (
        <div className="animate-fade-in text-center">
          {/* Score card with circular progress */}
          <div className="mx-auto mb-8 max-w-md rounded-2xl border border-black/[0.08] bg-white p-8 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-[#0f0f0f]/40 dark:text-[#f0efec]/35">
              Your Information Diet Score
            </p>
            
            {/* Circular score indicator */}
            <div className="relative mx-auto mb-6 h-32 w-32">
              <svg className="h-full w-full -rotate-90 transform">
                {/* Background circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-black/[0.08] dark:text-white/[0.08]"
                />
                {/* Progress circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(totalScore / 100) * 351.86} 351.86`}
                  className="text-[#C9A35F] transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="font-[family-name:var(--font-playfair)] text-4xl font-bold tabular-nums">
                  {totalScore}
                </p>
              </div>
            </div>

            <p className="mb-3 font-[family-name:var(--font-source-serif)] text-2xl font-semibold italic">
              {getBracket(totalScore).name}
            </p>
            <p className="text-base leading-relaxed text-[#0f0f0f]/70 dark:text-[#f0efec]/60">
              {getBracket(totalScore).desc}
            </p>
          </div>

          {/* Share buttons */}
          <div className="mb-10">
            <p className="mb-4 text-sm font-medium text-[#0f0f0f]/50 dark:text-[#f0efec]/40">
              Share your result
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-[#C9A35F]/30 bg-[#C9A35F]/5 px-5 py-2.5 text-sm font-medium text-[#C9A35F] transition hover:border-[#C9A35F]/50 hover:bg-[#C9A35F]/10 dark:border-[#C9A35F]/40 dark:bg-[#C9A35F]/10 dark:hover:border-[#C9A35F]/60"
              >
                Share on X
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-[#C9A35F]/30 bg-[#C9A35F]/5 px-5 py-2.5 text-sm font-medium text-[#C9A35F] transition hover:border-[#C9A35F]/50 hover:bg-[#C9A35F]/10 dark:border-[#C9A35F]/40 dark:bg-[#C9A35F]/10 dark:hover:border-[#C9A35F]/60"
              >
                Share on WhatsApp
              </a>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText("https://albis.news/quiz");
                  // Could add a toast notification here
                }}
                className="rounded-xl border border-[#C9A35F]/30 bg-[#C9A35F]/5 px-5 py-2.5 text-sm font-medium text-[#C9A35F] transition hover:border-[#C9A35F]/50 hover:bg-[#C9A35F]/10 dark:border-[#C9A35F]/40 dark:bg-[#C9A35F]/10 dark:hover:border-[#C9A35F]/60"
              >
                Copy link
              </button>
            </div>
          </div>

          {/* Want to improve? */}
          {totalScore < 76 && (
            <div className="mx-auto mb-8 max-w-md rounded-xl border border-[#C9A35F]/20 bg-gradient-to-br from-[#C9A35F]/5 to-[#C9A35F]/10 p-6 dark:from-[#C9A35F]/10 dark:to-[#C9A35F]/15">
              <h3 className="mb-2 font-[family-name:var(--font-source-serif)] text-lg font-semibold">
                Want to improve your score?
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-[#0f0f0f]/70 dark:text-[#f0efec]/60">
                Get the daily briefing and watch your information diet transform. Every morning, see how the world's media covers the same stories differently.
              </p>
              <Link
                href="/briefing"
                className="inline-block rounded-xl bg-[#C9A35F] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#C9A35F]/90 dark:text-[#0f0f0f]"
              >
                Try the briefing
              </Link>
            </div>
          )}

          {/* High score CTA */}
          {totalScore >= 76 && (
            <div className="mx-auto mb-8 max-w-md rounded-xl border border-black/[0.08] bg-[#0f0f0f]/[0.02] p-6 dark:border-white/[0.08] dark:bg-white/[0.02]">
              <h3 className="mb-2 font-[family-name:var(--font-source-serif)] text-lg font-semibold">
                You're ahead of the curve
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-[#0f0f0f]/70 dark:text-[#f0efec]/60">
                Keep that edge sharp. The Albis briefing delivers the global perspectives you're already seeking — in one clean email every morning.
              </p>
              <Link
                href="/briefing"
                className="inline-block rounded-xl bg-[#0f0f0f] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#0f0f0f]/85 dark:bg-[#f0efec] dark:text-[#0f0f0f] dark:hover:bg-[#f0efec]/85"
              >
                Try the briefing
              </Link>
            </div>
          )}

          <button
            onClick={restart}
            className="mt-6 text-sm text-[#0f0f0f]/40 underline-offset-2 hover:underline dark:text-[#f0efec]/30"
          >
            Take the quiz again
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </main>
  );
}
