"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Region =
  | "North America"
  | "Europe"
  | "Middle East"
  | "South Asia"
  | "East Asia"
  | "Africa"
  | "Latin America";

interface QuizQuestion {
  headline: string;
  region: Region;
  why: string;
}

interface QuizSet {
  topic: string;
  questions: QuizQuestion[];
}

/* ------------------------------------------------------------------ */
/*  Quiz Data — 3 sets of 5 questions each                            */
/*  Each set covers ONE news topic with headlines from different       */
/*  regions showing regional framing differences                      */
/* ------------------------------------------------------------------ */

const QUIZ_SETS: QuizSet[] = [
  {
    topic: "Global Trade & Tariffs",
    questions: [
      {
        headline:
          "US Slaps Historic Tariffs on Chinese Goods to Protect American Jobs",
        region: "North America",
        why: "Frames tariffs as protecting domestic workers — a common US editorial angle that centers American economic interests.",
      },
      {
        headline:
          "Beijing Vows Retaliation as Washington Escalates Trade War",
        region: "East Asia",
        why: "Positions China as responding to aggression — East Asian media often frames trade disputes from Beijing's defensive posture.",
      },
      {
        headline:
          "Trade War Fallout Threatens Global Supply Chains, EU Caught in Crossfire",
        region: "Europe",
        why: "European outlets frequently frame US-China disputes through the lens of collateral damage to European economies.",
      },
      {
        headline:
          "Rising Tariffs Could Devastate Developing Nations' Export Markets",
        region: "Africa",
        why: "African media highlights how great-power trade wars disproportionately harm smaller economies that depend on exports.",
      },
      {
        headline:
          "India Sees Opening as US-China Trade Rift Deepens",
        region: "South Asia",
        why: "South Asian coverage often explores strategic opportunities for India and regional economies amid superpower rivalry.",
      },
    ],
  },
  {
    topic: "AI Regulation & Safety",
    questions: [
      {
        headline:
          "EU Passes World's Most Comprehensive AI Safety Law",
        region: "Europe",
        why: "European media celebrates the EU's regulatory leadership — framing strict rules as a global standard-setting achievement.",
      },
      {
        headline:
          "Overregulation Risks Killing America's AI Advantage, Industry Leaders Warn",
        region: "North America",
        why: "US coverage often centers the innovation-vs-regulation debate, amplifying Silicon Valley's concerns about competitive disadvantage.",
      },
      {
        headline:
          "AI Surveillance Tools Spread Across Middle East Without Oversight",
        region: "Middle East",
        why: "Regional outlets focus on how AI is deployed for surveillance — a pressing concern in the Middle East's political landscape.",
      },
      {
        headline:
          "China Unveils National AI Standards to Shape Global Norms",
        region: "East Asia",
        why: "East Asian coverage frames China's AI governance as strategic norm-setting, positioning it as a global technology leader.",
      },
      {
        headline:
          "AI-Powered Misinformation Campaigns Target Elections Across Latin America",
        region: "Latin America",
        why: "Latin American media highlights how AI threatens already-fragile democratic institutions in the region.",
      },
    ],
  },
  {
    topic: "Climate Change & Energy",
    questions: [
      {
        headline:
          "Small Island Nations Issue Desperate Plea as Sea Levels Hit Record High",
        region: "Africa",
        why: "African and island-nation media foregrounds existential climate threats — covering it as an urgent survival story, not a policy debate.",
      },
      {
        headline:
          "Gas Prices Surge as Green Transition Policies Squeeze Energy Supplies",
        region: "North America",
        why: "North American outlets often frame climate policy through consumer cost impact — gas prices are a perennial political flashpoint.",
      },
      {
        headline:
          "Gulf States Pivot to Renewables While Defending Oil Export Revenue",
        region: "Middle East",
        why: "Middle Eastern coverage navigates the tension between petro-state economies and the global push toward clean energy.",
      },
      {
        headline:
          "India's Coal Dependency Clashes with Climate Pledges at COP Summit",
        region: "South Asia",
        why: "South Asian media highlights the development-vs-climate dilemma — framing it as an equity issue for growing economies.",
      },
      {
        headline:
          "Amazon Deforestation Hits New Low After Landmark Enforcement Push",
        region: "Latin America",
        why: "Latin American coverage centers local environmental enforcement and the Amazon — the region's defining climate story.",
      },
    ],
  },
];

const REGIONS: Region[] = [
  "North America",
  "Europe",
  "Middle East",
  "South Asia",
  "East Asia",
  "Africa",
  "Latin America",
];

const REGION_EMOJI: Record<Region, string> = {
  "North America": "\u{1F1FA}\u{1F1F8}",
  Europe: "\u{1F1EA}\u{1F1FA}",
  "Middle East": "\u{1F1F8}\u{1F1E6}",
  "South Asia": "\u{1F1EE}\u{1F1F3}",
  "East Asia": "\u{1F1E8}\u{1F1F3}",
  Africa: "\u{1F1F3}\u{1F1EC}",
  "Latin America": "\u{1F1E7}\u{1F1F7}",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRandomSet(): QuizQuestion[] {
  const set = QUIZ_SETS[Math.floor(Math.random() * QUIZ_SETS.length)];
  return shuffleArray(set.questions);
}

function getScoreMessage(score: number): {
  title: string;
  desc: string;
} {
  if (score <= 1)
    return {
      title: "Media Rookie",
      desc: "Headlines tricked you — but that's the whole point. You now know how easily framing shapes perception.",
    };
  if (score <= 2)
    return {
      title: "Getting Warmer",
      desc: "You caught some regional cues, but media framing is subtle. Keep reading globally to sharpen your instincts.",
    };
  if (score <= 3)
    return {
      title: "Perspective Spotter",
      desc: "Solid instincts. You're picking up on how different regions frame the same events differently.",
    };
  if (score <= 4)
    return {
      title: "Global Reader",
      desc: "Impressive. You can read between the headlines and spot where a story comes from. Most people can't.",
    };
  return {
    title: "Framing Expert",
    desc: "Perfect score. You understand how media framing works across regions — a rare and valuable skill.",
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type Phase = "intro" | "quiz" | "result";

export function QuizClient() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<
    { selected: Region; correct: Region; isCorrect: boolean }[]
  >([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [startTime] = useState(() => Date.now());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startQuiz = useCallback(() => {
    setQuestions(getRandomSet());
    setCurrentQ(0);
    setScore(0);
    setAnswers([]);
    setSelectedRegion(null);
    setShowResult(false);
    setTransitioning(false);
    setCopied(false);
    setShareImageUrl(null);
    setPhase("quiz");
  }, []);

  const handleRegionClick = useCallback(
    (region: Region) => {
      if (selectedRegion || transitioning) return;
      const correct = questions[currentQ].region;
      const isCorrect = region === correct;
      setSelectedRegion(region);
      setShowResult(true);
      if (isCorrect) setScore((s) => s + 1);
      setAnswers((a) => [...a, { selected: region, correct, isCorrect }]);
    },
    [selectedRegion, transitioning, questions, currentQ],
  );

  const nextQuestion = useCallback(() => {
    if (currentQ >= 4) {
      setPhase("result");
      // Submit quiz data for analytics
      try {
        fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score,
            total: 5,
            answers: answers.map((a, i) => ({
              question_id: i,
              guessed_region: a.selected,
              correct_region: a.correct,
              correct: a.isCorrect,
            })),
            time_seconds: Math.round((Date.now() - startTime) / 1000),
            referrer: typeof document !== "undefined" ? document.referrer : null,
            shared: false,
          }),
        }).catch(() => {});
      } catch {}
      return;
    }
    setTransitioning(true);
    setTimeout(() => {
      setCurrentQ((q) => q + 1);
      setSelectedRegion(null);
      setShowResult(false);
      setTransitioning(false);
    }, 300);
  }, [currentQ]);

  // Generate share card on result phase
  useEffect(() => {
    if (phase !== "result" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 1200;
    const h = 630;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = "#0f0f0f";
    ctx.fillRect(0, 0, w, h);

    // Accent bar at top
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "#c8922a");
    grad.addColorStop(1, "#e6b35a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, 6);

    // Score circle
    const cx = w / 2;
    const cy = 230;
    const r = 90;

    // Circle background
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Circle progress
    const finalScore = score;
    const progress = finalScore / 5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.strokeStyle = "#c8922a";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.stroke();

    // Score text
    ctx.fillStyle = "#f0efec";
    ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${finalScore}/5`, cx, cy);

    // Title
    ctx.fillStyle = "#f0efec";
    ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
    ctx.fillText("Albis Perspective Check", cx, 380);

    // Subtitle
    ctx.fillStyle = "rgba(240,239,236,0.6)";
    ctx.font = "22px system-ui, -apple-system, sans-serif";
    ctx.fillText(
      "Can you tell where a headline comes from?",
      cx,
      425,
    );

    // URL
    ctx.fillStyle = "#c8922a";
    ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
    ctx.fillText("albis.news/quiz", cx, 560);

    // Logo text
    ctx.fillStyle = "rgba(240,239,236,0.3)";
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText("Albis", cx, 595);

    try {
      setShareImageUrl(canvas.toDataURL("image/png"));
    } catch {
      // Canvas tainted or not supported
    }
  }, [phase, score]);

  const shareText = `I scored ${score}/5 on the Albis Perspective Check \u{1F30D} Can you tell where a headline comes from? albis.news/quiz`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText("https://www.albis.news/quiz");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    if (!shareImageUrl) return;
    const a = document.createElement("a");
    a.href = shareImageUrl;
    a.download = "albis-perspective-check.png";
    a.click();
  };

  /* ---- Render ---------------------------------------------------- */

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-20 pb-28 md:pb-12">
      {/* ---- Intro ---- */}
      {phase === "intro" && (
        <div className="animate-fade-in-up text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c8922a]/30 bg-[#c8922a]/5 px-4 py-1.5 text-xs font-medium tracking-wide text-[#c8922a]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c8922a] animate-pulse-dot" />
            Interactive Quiz
          </div>

          <h1 className="mb-4 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Perspective Check
          </h1>

          <p className="mx-auto mb-3 max-w-lg font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-[#0f0f0f]/70 dark:text-[#f0efec]/60">
            The same news story reads completely differently depending on where
            you are in the world. Can you tell where a headline comes from?
          </p>

          <p className="mx-auto mb-10 max-w-md text-sm text-[#0f0f0f]/50 dark:text-[#f0efec]/40">
            5 real headlines. 7 regions. Test your media awareness.
          </p>

          {/* Region preview */}
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {REGIONS.map((r) => (
              <span
                key={r}
                className="rounded-full border border-black/[0.07] bg-white/50 px-3 py-1 text-xs font-medium text-[#0f0f0f]/60 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-[#f0efec]/50"
              >
                {REGION_EMOJI[r]} {r}
              </span>
            ))}
          </div>

          <button
            onClick={startQuiz}
            className="group relative inline-flex items-center gap-2 rounded-xl bg-[#0f0f0f] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#1a1a1a] hover:shadow-xl active:scale-[0.98] dark:bg-[#f0efec] dark:text-[#0f0f0f] dark:hover:bg-[#e5e4e0]"
          >
            Start the quiz
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          <p className="mt-6 text-xs text-[#0f0f0f]/35 dark:text-[#f0efec]/25">
            Takes about 2 minutes
          </p>
        </div>
      )}

      {/* ---- Quiz phase ---- */}
      {phase === "quiz" && questions.length > 0 && (
        <div
          className={`transition-opacity duration-300 ${transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
        >
          {/* Progress */}
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-xs tracking-wide text-[#0f0f0f]/50 dark:text-[#f0efec]/40">
              <span>
                Question {currentQ + 1} of 5
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-medium text-[#c8922a]">{score}</span>
                <span>correct</span>
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-[#c8922a] transition-all duration-500 ease-out"
                style={{ width: `${((currentQ + 1) / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Headline card */}
          <div className="mb-8 rounded-2xl border border-black/[0.07] bg-white/60 p-6 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#0f0f0f]/40 dark:text-[#f0efec]/30">
              Which region wrote this headline?
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold leading-snug sm:text-2xl md:text-[1.65rem]">
              &ldquo;{questions[currentQ].headline}&rdquo;
            </h2>
          </div>

          {/* Region buttons */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-3">
            {REGIONS.map((region) => {
              const isSelected = selectedRegion === region;
              const isCorrect = region === questions[currentQ].region;
              const isRevealed = showResult;

              let btnClass =
                "relative w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all sm:text-base ";

              if (!isRevealed) {
                btnClass +=
                  "border-black/[0.08] bg-white hover:border-black/20 hover:shadow-sm active:scale-[0.97] dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/20 cursor-pointer";
              } else if (isCorrect) {
                btnClass +=
                  "border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300";
              } else if (isSelected && !isCorrect) {
                btnClass +=
                  "border-red-400/40 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300";
              } else {
                btnClass +=
                  "border-black/[0.05] bg-white/50 opacity-50 dark:border-white/[0.04] dark:bg-white/[0.01]";
              }

              return (
                <button
                  key={region}
                  onClick={() => handleRegionClick(region)}
                  disabled={!!selectedRegion}
                  className={btnClass}
                >
                  <span className="mr-1.5">{REGION_EMOJI[region]}</span>
                  {region}
                  {isRevealed && isCorrect && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                  )}
                  {isRevealed && isSelected && !isCorrect && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Reveal explanation */}
          {showResult && (
            <div className="mt-6 animate-fade-in-up">
              <div
                className={`rounded-xl border p-5 ${
                  selectedRegion === questions[currentQ].region
                    ? "border-emerald-500/20 bg-emerald-50/50 dark:border-emerald-400/10 dark:bg-emerald-500/5"
                    : "border-red-400/20 bg-red-50/50 dark:border-red-400/10 dark:bg-red-500/5"
                }`}
              >
                <p className="mb-1 text-sm font-semibold">
                  {selectedRegion === questions[currentQ].region
                    ? "Correct!"
                    : `Not quite \u2014 this was ${questions[currentQ].region}`}
                </p>
                <p className="text-sm leading-relaxed text-[#0f0f0f]/70 dark:text-[#f0efec]/60">
                  {questions[currentQ].why}
                </p>
              </div>

              <button
                onClick={nextQuestion}
                className="mt-5 w-full rounded-xl bg-[#0f0f0f] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] active:scale-[0.98] dark:bg-[#f0efec] dark:text-[#0f0f0f] dark:hover:bg-[#e5e4e0]"
              >
                {currentQ >= 4 ? "See my results" : "Next headline"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---- Result phase ---- */}
      {phase === "result" && (
        <div className="animate-fade-in-up text-center">
          {/* Score card */}
          <div className="mx-auto mb-8 max-w-md rounded-2xl border border-black/[0.08] bg-white p-8 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
            <p className="mb-4 text-xs font-medium uppercase tracking-widest text-[#0f0f0f]/40 dark:text-[#f0efec]/35">
              Your Perspective Score
            </p>

            {/* Circular score */}
            <div className="relative mx-auto mb-6 h-36 w-36">
              <svg className="h-full w-full -rotate-90 transform">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="currentColor"
                  strokeWidth="7"
                  fill="none"
                  className="text-black/[0.06] dark:text-white/[0.06]"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  stroke="currentColor"
                  strokeWidth="7"
                  fill="none"
                  strokeDasharray={`${(score / 5) * 389.56} 389.56`}
                  className="text-[#c8922a] transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="font-[family-name:var(--font-playfair)] text-5xl font-bold tabular-nums">
                  {score}
                  <span className="text-2xl text-[#0f0f0f]/30 dark:text-[#f0efec]/25">
                    /5
                  </span>
                </p>
              </div>
            </div>

            <p className="mb-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold italic">
              {getScoreMessage(score).title}
            </p>
            <p className="text-sm leading-relaxed text-[#0f0f0f]/65 dark:text-[#f0efec]/55">
              {getScoreMessage(score).desc}
            </p>
          </div>

          {/* Answer recap */}
          <div className="mx-auto mb-8 max-w-md space-y-2 text-left">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#0f0f0f]/40 dark:text-[#f0efec]/35">
              Your answers
            </p>
            {answers.map((a, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm ${
                  a.isCorrect
                    ? "border-emerald-500/20 bg-emerald-50/30 dark:border-emerald-400/10 dark:bg-emerald-500/5"
                    : "border-red-400/20 bg-red-50/30 dark:border-red-400/10 dark:bg-red-500/5"
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="mt-0.5 flex-shrink-0 text-base">
                  {a.isCorrect ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug line-clamp-2">
                    &ldquo;{questions[i].headline}&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-[#0f0f0f]/50 dark:text-[#f0efec]/40">
                    {a.isCorrect
                      ? `${REGION_EMOJI[a.correct]} ${a.correct}`
                      : `You said ${REGION_EMOJI[a.selected]} ${a.selected} \u2014 it was ${REGION_EMOJI[a.correct]} ${a.correct}`}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Share section */}
          <div className="mb-8">
            <p className="mb-4 text-xs font-medium uppercase tracking-widest text-[#0f0f0f]/40 dark:text-[#f0efec]/35">
              Challenge your friends
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {/* Share on X */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { fetch("/api/quiz/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score, total: 5, shared: true, share_platform: "x" }) }).catch(() => {}); }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#c8922a]/30 bg-[#c8922a]/5 px-5 py-2.5 text-sm font-medium text-[#c8922a] transition hover:border-[#c8922a]/50 hover:bg-[#c8922a]/10 dark:border-[#c8922a]/40 dark:bg-[#c8922a]/10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share on X
              </a>

              {/* Copy link */}
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 rounded-xl border border-[#c8922a]/30 bg-[#c8922a]/5 px-5 py-2.5 text-sm font-medium text-[#c8922a] transition hover:border-[#c8922a]/50 hover:bg-[#c8922a]/10 dark:border-[#c8922a]/40 dark:bg-[#c8922a]/10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copied ? "Copied!" : "Copy link"}
              </button>

              {/* Download image */}
              {shareImageUrl && (
                <button
                  onClick={handleDownloadImage}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#c8922a]/30 bg-[#c8922a]/5 px-5 py-2.5 text-sm font-medium text-[#c8922a] transition hover:border-[#c8922a]/50 hover:bg-[#c8922a]/10 dark:border-[#c8922a]/40 dark:bg-[#c8922a]/10"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Save image
                </button>
              )}
            </div>
          </div>

          {/* Share card preview */}
          {shareImageUrl && (
            <div className="mx-auto mb-8 max-w-md overflow-hidden rounded-xl border border-black/[0.08] shadow-sm dark:border-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shareImageUrl}
                alt="Your Perspective Check result"
                className="w-full"
              />
            </div>
          )}

          {/* CTA */}
          <div className="mx-auto mb-6 max-w-md rounded-xl border border-[#c8922a]/20 bg-gradient-to-br from-[#c8922a]/5 to-[#c8922a]/10 p-6 dark:from-[#c8922a]/10 dark:to-[#c8922a]/15">
            <h3 className="mb-2 font-[family-name:var(--font-source-serif)] text-lg font-semibold">
              See how framing shapes the news every day
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-[#0f0f0f]/65 dark:text-[#f0efec]/55">
              Albis shows you how 7 world regions cover the same story differently. No spin, no algorithm — just the full picture.
            </p>
            <a
              href="/archive"
              className="inline-block rounded-xl bg-[#c8922a] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#b8842a] dark:text-[#0f0f0f]"
            >
              Try the daily briefing
            </a>
          </div>

          <button
            onClick={startQuiz}
            className="mt-2 text-sm text-[#0f0f0f]/40 underline-offset-2 hover:underline dark:text-[#f0efec]/30"
          >
            Play again
          </button>
        </div>
      )}

      {/* Hidden canvas for share card generation */}
      <canvas
        ref={canvasRef}
        className="fixed -left-[9999px] -top-[9999px]"
        aria-hidden="true"
      />
    </main>
  );
}
