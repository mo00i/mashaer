import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  MOODS,
  PARTIES,
  buildPool,
  type Mood,
  type MoodId,
  type Party,
  type PartyId,
} from "./data/phrases";
import stationery from "./assets/stationery.jpg";
import cardImg from "./assets/card.jpg";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

const ar = (n: number) => String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

type Step = "home" | "mood" | "phrase";

/* ————— أيقونات ————— */
const ArrowEnter = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
    <path d="M20 12H4M10 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ArrowBack = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
    <path d="M4 12h16M14 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Refresh = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M20 11a8 8 0 1 0-1.6 5.4" strokeLinecap="round" />
    <path d="M20 4.5V11h-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CopyIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
    <rect x="9" y="9" width="11" height="11" rx="1.5" />
    <path d="M15 5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15" />
  </svg>
);
const CheckIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
    <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Seal = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 44 44" className={className} aria-hidden>
    <circle cx="22" cy="22" r="20" fill="#c56a4e" />
    <circle cx="22" cy="22" r="15.5" fill="none" stroke="#f4efe6" strokeWidth="1" strokeDasharray="2 3" />
    <path
      d="M14 26c3.2-6.5 7-10 11.4-10.4 1.7-.15 3.1.5 4.1 1.9M14.5 18.5c2.6.2 4.7 1.6 6.3 4.2"
      fill="none"
      stroke="#f4efe6"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <circle cx="29.5" cy="27.5" r="1.6" fill="#f4efe6" />
  </svg>
);

/* ————— خلفية الورق والحبوب ————— */
function PaperSurface() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#f4efe6]/0 via-[#f4efe6]/0 to-[#e4dccb]/55" />
    </div>
  );
}

/* ————— الترويسة ————— */
function Brand() {
  return (
    <div className="flex items-center gap-3">
      <Seal className="h-9 w-9 shrink-0" />
      <div className="leading-none">
        <div className="font-display text-[26px] leading-none text-ink-deep">قَول</div>
        <div className="eyebrow mt-1.5 text-warm">عبارات تُقال في وقتها</div>
      </div>
    </div>
  );
}

/* ————— صفوف الفهرس ————— */
function IndexRow({
  item,
  onPick,
  onHover,
}: {
  item: Party | Mood;
  onPick: () => void;
  onHover?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      onMouseEnter={onHover}
      onFocus={onHover}
      className="group block w-full border-t border-ink/15 px-2 py-6 text-right transition-colors duration-300 hover:bg-ink/[0.04] sm:px-4 sm:py-7"
    >
      <div className="flex items-baseline gap-4 sm:gap-6">
        <span className="w-7 shrink-0 font-display text-lg leading-none text-clay-deep transition-transform duration-300 group-hover:-translate-y-0.5">
          {item.index}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[clamp(1.55rem,4vw,2.6rem)] leading-[1.4] text-ink-deep transition-transform duration-500 group-hover:-translate-x-1.5">
            {item.name}
          </span>
          <span className="mt-1 block text-[13px] leading-7 text-warm sm:text-sm">{item.desc}</span>
        </span>
        <ArrowEnter className="h-5 w-5 shrink-0 self-center text-ink/30 transition-all duration-300 group-hover:-translate-x-1.5 group-hover:text-clay-deep" />
      </div>
    </button>
  );
}

/* ————— الصفحة الأولى: الأطراف ————— */
function HomeScreen({ onPick }: { onPick: (id: PartyId) => void }) {
  const [hover, setHover] = useState<PartyId>(PARTIES[0].id);
  const active = PARTIES.find((p) => p.id === hover) ?? PARTIES[0];

  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 pb-24 pt-7 sm:px-8">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-ink/15 pb-6">
        <Brand />
        <div className="eyebrow text-left text-warm">
          ٦ أطراف · ٤ حالات
          <br />
          ٦٦ صياغة لا تتكرّر
        </div>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_330px] lg:gap-16">
        <div>
          <p className="eyebrow text-clay-deep">الصفحة الأولى</p>
          <h1 className="mt-3 font-display text-[clamp(2.3rem,6.4vw,4.5rem)] leading-[1.2] text-ink-deep">
            لمن تكتب اليوم؟
          </h1>
          <p className="mt-4 max-w-[48ch] text-[15px] leading-[2.05] text-ink/80">
            اختر الطرف، ثم حالتكما الآن، وستجد عبارةً مكتوبة لهذه اللحظة بالذات — اعتذاراً، أو تقارباً، أو
            اشتياقاً. وإن لم تعجبك الصياغة، اطلب غيرها ما شئت.
          </p>

          <div className="mt-7 overflow-hidden border border-ink/20 lg:hidden">
            <img
              src={stationery}
              alt="طقم مراسلات: ظرف مطوي وبطاقة بحبر أخضر وختم شمعي"
              className="h-44 w-full object-cover"
            />
          </div>

          <ol className="mt-10 border-b border-ink/15">
            {PARTIES.map((p) => (
              <li key={p.id}>
                <IndexRow item={p} onPick={() => onPick(p.id)} onHover={() => setHover(p.id)} />
              </li>
            ))}
          </ol>
        </div>

        <aside className="sticky top-8 hidden h-fit lg:block">
          <div className="relative overflow-hidden border border-ink/20 bg-ink-deep">
            <img src={stationery} alt="" className="h-[290px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#10302b] via-[#10302b]/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <div className="eyebrow text-paper/70">البطاقة المختارة</div>
                  <div className="mt-2 font-display text-[30px] leading-tight text-paper">{active.name}</div>
                  <div className="mt-1.5 text-[13px] leading-6 text-paper/75">{active.desc}</div>
              </motion.div>
            </div>
          </div>
          <p className="mt-5 border-r-2 border-clay/60 pr-4 text-[12.5px] leading-7 text-warm">
            كل عبارة تُكتب مرة واحدة فقط في جلستك، حتى تمرّ على كل صياغةٍ قبل أن تعيد أيًّا منها.
          </p>
        </aside>
      </div>
    </div>
  );
}

/* ————— الصفحة الثانية: الحالة ————— */
function MoodScreen({
  party,
  onPick,
  onBack,
}: {
  party: Party;
  onPick: (id: MoodId) => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[1160px] px-5 pb-24 pt-7 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-5 border-b border-ink/15 pb-6">
        <Brand />
        <button
          type="button"
          onClick={onBack}
          className="group flex items-center gap-2 text-sm text-ink transition-colors hover:text-clay-deep"
        >
          <ArrowBack className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          قائمة الأطراف
        </button>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_330px] lg:gap-16">
        <div>
          <p className="eyebrow text-clay-deep">الصفحة الثانية</p>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,5.6vw,3.9rem)] leading-[1.25] text-ink-deep">
            كيف حال قلبكما الآن؟
          </h1>
          <p className="mt-4 text-[15px] leading-[2] text-ink/80">
            اخترتَ: <span className="font-display text-[22px] text-ink">{party.name}</span> —{" "}
            <span className="text-warm">{party.desc}</span>
          </p>

          <ol className="mt-10 border-b border-ink/15">
            {MOODS.map((m) => (
              <li key={m.id}>
                <IndexRow item={m} onPick={() => onPick(m.id)} />
              </li>
            ))}
          </ol>
        </div>

        <aside className="sticky top-8 hidden h-fit lg:block">
          <div className="relative overflow-hidden border border-ink/20">
            <img src={cardImg} alt="" className="h-[330px] w-full object-cover" />
            <div className="absolute inset-0 bg-[#f4efe6]/25" />
          </div>
          <div className="mt-5 border-t border-ink/15 pt-5">
            <div className="eyebrow text-warm">الصفحة الثالثة</div>
            <div className="mt-2 font-display text-[26px] leading-snug text-ink-deep">العبارة المناسبة</div>
            <p className="mt-2 text-[13px] leading-7 text-warm">
              تُكتب بحبرٍ واحد، وتتبدّل بضغطة على الختم الطيني.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ————— الصفحة الثالثة: العبارة ————— */
function PhraseScreen({
  party,
  mood,
  phrase,
  count,
  recent,
  copied,
  onGenerate,
  onCopy,
  onPickRecent,
  onChangeMood,
  onChangeParty,
}: {
  party: Party;
  mood: Mood;
  phrase: string;
  count: number;
  recent: string[];
  copied: "idle" | "ok" | "fail";
  onGenerate: () => void;
  onCopy: () => void;
  onPickRecent: (p: string) => void;
  onChangeMood: () => void;
  onChangeParty: () => void;
}) {
  const rm = useReducedMotion();
  const anim = rm
    ? { initial: false as const, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: 16, filter: "blur(10px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -12, filter: "blur(10px)" },
      };

  return (
    <div className="relative mx-auto w-full max-w-[1160px] px-5 pb-24 pt-7 sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[34%] lg:block"
        style={{
          WebkitMaskImage: "linear-gradient(to left, transparent, #000 55%)",
          maskImage: "linear-gradient(to left, transparent, #000 55%)",
        }}
      >
        <img src={cardImg} alt="" className="h-full w-full object-cover opacity-45" />
      </div>

      <header className="relative flex flex-wrap items-center justify-between gap-5 border-b border-ink/15 pb-6">
        <Brand />
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <button
            type="button"
            onClick={onChangeMood}
            className="group flex items-center gap-2 text-ink transition-colors hover:text-clay-deep"
          >
            <ArrowBack className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            تغيير الحالة
          </button>
          <button
            type="button"
            onClick={onChangeParty}
            className="group flex items-center gap-2 text-ink transition-colors hover:text-clay-deep"
          >
            <ArrowBack className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            طرف آخر
          </button>
        </div>
      </header>

      <div className="relative mt-11 grid gap-10 lg:grid-cols-[1fr_300px] lg:gap-14">
        {/* البطاقة */}
        <div className="relative border border-ink/25 bg-[#faf7f1]/85 p-6 shadow-[0_26px_60px_-46px_rgba(16,48,43,0.95)] sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-4">
            <div className="eyebrow text-ink/80">
              {party.name}
              <span className="mx-2 text-clay-deep">◆</span>
              {mood.name}
            </div>
            <div className="eyebrow text-warm">العبارة {ar(count)}</div>
          </div>

          <AnimatePresence mode="wait">
            <motion.blockquote
              key={phrase}
              {...anim}
              transition={{ duration: rm ? 0 : 0.45, ease: EASE }}
              exit={{ opacity: 0, y: -12, filter: "blur(10px)", transition: { duration: rm ? 0 : 0.22 } }}
              className="mt-8"
            >
              <p className="font-display text-[clamp(1.7rem,4.4vw,3.15rem)] leading-[1.85] text-ink-deep">
                {phrase}
              </p>
            </motion.blockquote>
          </AnimatePresence>

          <svg viewBox="0 0 260 12" className="mt-8 h-3 w-[210px] text-clay-deep/70" aria-hidden>
            <path
              d="M2 8C40 2 62 10 96 6s54-6 84-1 46 6 78 1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <p className="mt-7 max-w-[52ch] text-[13px] leading-7 text-warm">
            اضغط «عبارة جديدة» لتصل إليك صياغةٌ أخرى لنفس الحالة؛ لن تتكرّر حتى تمرّ على كل ما في البنك —{" "}
            {ar(11)} صياغة لهذه الحالة.
          </p>
        </div>

        {/* الرفّ الجانبي */}
        <div className="lg:pt-2">
          <button
            type="button"
            onClick={onGenerate}
            className="group relative flex h-[140px] w-[140px] flex-col items-center justify-center gap-2 rounded-full bg-clay-deep text-paper shadow-[0_14px_0_-8px_rgba(120,58,38,0.65),0_30px_45px_-32px_rgba(16,48,43,0.9)] transition-all duration-300 hover:bg-[#87422c] active:translate-y-1 sm:h-[150px] sm:w-[150px]"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-2 rounded-full border border-dashed border-paper/40"
            />
            <Refresh className="h-6 w-6 transition-transform duration-700 group-hover:rotate-[220deg]" />
            <span className="text-[14px] font-semibold">عبارة جديدة</span>
            <span className="text-[11px] text-paper">بلا حدود</span>
          </button>

          <button
            type="button"
            onClick={onCopy}
            className="mt-5 flex w-full items-center justify-center gap-2 border border-ink/30 bg-paper/60 px-4 py-3.5 text-sm font-medium text-ink transition-colors duration-300 hover:border-clay hover:text-clay-deep"
          >
            {copied === "ok" ? (
              <>
                <CheckIcon className="h-4 w-4 text-clay-deep" /> نُسخت العبارة
              </>
            ) : copied === "fail" ? (
              "حدّد العبارة وانسخها"
            ) : (
              <>
                <CopyIcon className="h-4 w-4" /> نسخ العبارة
              </>
            )}
          </button>

          <div className="mt-7 border-t border-ink/15 pt-5">
            <div className="eyebrow text-warm">في هذه الجلسة</div>
            <div className="mt-2 flex items-baseline gap-2">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={count}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: rm ? 0 : 0.3, ease: EASE }}
                  className="font-display text-[34px] leading-none text-ink-deep"
                >
                  {ar(count)}
                </motion.span>
              </AnimatePresence>
              <span className="font-sans text-[12.5px] font-normal text-warm">عبارة مكتوبة</span>
            </div>
          </div>

          {recent.length > 0 && (
            <div className="mt-7 border-t border-ink/15 pt-5">
              <div className="eyebrow text-warm">عباراتٌ سبقتك</div>
              <ul className="mt-3 space-y-2.5">
                {recent.map((r, i) => (
                  <li key={`${r}-${i}`}>
                    <button
                      type="button"
                      onClick={() => onPickRecent(r)}
                      className="line-clamp-2 w-full text-right text-[12.5px] leading-6 text-warm transition-colors hover:text-ink"
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <footer className="relative mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-ink/15 pt-6 text-[12.5px] text-warm">
        <span>
          قَول · {party.name} — {mood.name}
        </span>
        <button type="button" onClick={onChangeParty} className="transition-colors hover:text-clay-deep">
          ابدأ من جديد ←
        </button>
      </footer>
    </div>
  );
}

/* ————— التطبيق ————— */
export default function App() {
  const [step, setStep] = useState<Step>("home");
  const [partyId, setPartyId] = useState<PartyId>("father");
  const [moodId, setMoodId] = useState<MoodId>("reconciled");
  const [phrase, setPhrase] = useState<string>("");
  const [count, setCount] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  const decks = useRef<Record<string, string[]>>({});
  const lasts = useRef<Record<string, string>>({});
  const phraseRef = useRef<string>("");

  const party = PARTIES.find((p) => p.id === partyId) ?? PARTIES[0];
  const mood = MOODS.find((m) => m.id === moodId) ?? MOODS[0];

  const nextFrom = useCallback((pid: PartyId, mid: MoodId) => {
    const key = `${pid}:${mid}`;
    const pool = buildPool(pid, mid);
    let queue = decks.current[key];
    if (!queue || queue.length === 0) {
      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const last = lasts.current[key];
      if (last && shuffled.length > 1 && shuffled[0] === last) {
        [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
      }
      queue = shuffled;
      decks.current[key] = queue;
    }
    const value = queue.shift() as string;
    lasts.current[key] = value;
    return value;
  }, []);

  const pushPhrase = useCallback((next: string) => {
    const prev = phraseRef.current;
    if (prev && prev !== next) setRecent((r) => [prev, ...r].slice(0, 4));
    phraseRef.current = next;
    setPhrase(next);
    setCount((c) => c + 1);
    setCopied("idle");
  }, []);

  const generate = useCallback(() => {
    pushPhrase(nextFrom(partyId, moodId));
  }, [nextFrom, pushPhrase, partyId, moodId]);

  const startPhrase = useCallback(
    (pid: PartyId, mid: MoodId) => {
      setPartyId(pid);
      setMoodId(mid);
      pushPhrase(nextFrom(pid, mid));
      setRecent([]);
      setStep("phrase");
    },
    [nextFrom, pushPhrase]
  );

  const pickRecent = useCallback((p: string) => {
    const prev = phraseRef.current;
    phraseRef.current = p;
    setPhrase(p);
    setRecent((r) => [prev, ...r.filter((x) => x !== p && x !== prev)].slice(0, 4));
    setCopied("idle");
  }, []);

  const copy = useCallback(async () => {
    if (!phrase) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(phrase);
        setCopied("ok");
      } else {
        setCopied("fail");
      }
    } catch {
      setCopied("fail");
    }
    window.setTimeout(() => setCopied("idle"), 2200);
  }, [phrase]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);

  const rm = useReducedMotion();
  const screenAnim = rm
    ? { initial: false as const, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
      };

  return (
    <div className="relative min-h-screen">
      <PaperSurface />

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.main
            key={step}
            {...screenAnim}
            transition={{ duration: rm ? 0 : 0.4, ease: EASE }}
          >
            {step === "home" && (
              <HomeScreen
                onPick={(id) => {
                  setPartyId(id);
                  setStep("mood");
                }}
              />
            )}
            {step === "mood" && (
              <MoodScreen party={party} onPick={(id) => startPhrase(partyId, id)} onBack={() => setStep("home")} />
            )}
            {step === "phrase" && (
              <PhraseScreen
                party={party}
                mood={mood}
                phrase={phrase}
                count={count}
                recent={recent}
                copied={copied}
                onGenerate={generate}
                onCopy={copy}
                onPickRecent={pickRecent}
                onChangeMood={() => setStep("mood")}
                onChangeParty={() => setStep("home")}
              />
            )}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
