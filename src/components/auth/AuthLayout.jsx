import { Link } from "react-router-dom";

const floats = [
  { emoji: "🇨🇳", className: "left-[8%] top-[12%] text-3xl sm:text-4xl", delay: "0s" },
  { emoji: "📚", className: "left-[72%] top-[18%] text-2xl sm:text-3xl", delay: "0.5s" },
  { emoji: "🎮", className: "left-[15%] top-[62%] text-3xl sm:text-4xl", delay: "1s" },
  { emoji: "✨", className: "left-[80%] top-[56%] text-2xl", delay: "1.5s" },
  { emoji: "🐼", className: "left-[45%] top-[8%] text-4xl sm:text-5xl", delay: "0.3s" },
];

function ParticleField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      {[...Array(18)].map((_, i) => (
        <span
          key={String(i)}
          className="absolute h-2 w-2 rounded-full bg-brand-yellow/50 blur-[1px]"
          style={{
            left: `${(i * 17) % 100}%`,
            top: `${(i * 29) % 100}%`,
            animation: `particle-drift ${4 + (i % 5)}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function AuthLayout({ children, footerHint, footerLinkTo = "/login", footerLinkLabel = "", footerPrefix = "" }) {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full px-4 py-8 sm:py-12">
      <div className="relative z-[1] mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-12">
        <aside className="relative flex min-h-[220px] flex-1 flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-red/95 via-orange-400/90 to-brand-blue p-8 text-white shadow-2xl ring-4 ring-white/40 lg:min-h-[520px]">
          <ParticleField />
          <div className="pointer-events-none relative z-[1]">
            <div className="mb-6 inline-flex rounded-2xl bg-white/15 px-4 py-2 text-sm font-black shadow-lg backdrop-blur">
              ✨ +50 XP за вход сегодня
            </div>
            <h2 className="text-3xl font-black leading-tight sm:text-4xl">
              Привет! <span className="inline-block animate-float">👋</span>
            </h2>
            <p className="mt-4 max-w-sm text-base font-bold text-white/90">
              Ты почти внутри — остался один маленький шаг до квеста по китайскому языку.
            </p>
          </div>

          <div className="relative z-[1] mt-10 flex justify-center lg:mt-0">
            <div className="relative h-52 w-full max-w-sm sm:h-56">
              <div className="absolute inset-x-10 bottom-6 h-28 rounded-[2rem] bg-slate-900/10 blur-xl" aria-hidden />
              <div className="relative grid h-full place-items-center rounded-[2rem] border-4 border-white/25 bg-white/10 p-8 shadow-inner backdrop-blur-md">
                <div className="text-center font-black drop-shadow-lg">
                  <span className="block text-[3.75rem] leading-none sm:text-[5rem]">☁️</span>
                  <span className="mt-4 block rounded-full bg-brand-yellow px-4 py-1.5 text-sm text-amber-950 shadow-lg">
                    Квест: первый диалог 🇨🇳
                  </span>
                </div>
              </div>
              {floats.map(({ emoji, className, delay }) => (
                <span
                  key={emoji + className}
                  className={`pointer-events-none absolute animate-float drop-shadow-[0_4px_8px_rgba(0,0,0,.2)] ${className}`}
                  style={{ animationDelay: delay }}
                  aria-hidden
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>
          <p className="relative z-[1] mt-8 text-xs font-semibold text-white/75">
            Обучение в стиле мобильного приложения 📱 Ярко. Быстро. Весело.
          </p>
        </aside>

        <main className="relative z-[2] flex w-full flex-1 flex-col items-center lg:justify-center">
          <div className="w-full max-w-md">{children}</div>
          {(footerHint || footerLinkLabel) && (
            <div className="mt-10 w-full max-w-md text-center text-sm font-bold text-slate-600">
              {footerPrefix}{" "}
              {footerLinkLabel ? (
                <Link className="text-brand-blue underline decoration-2 underline-offset-4 hover:text-brand-red" to={footerLinkTo}>
                  {footerLinkLabel}
                </Link>
              ) : null}{" "}
              {footerHint}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
