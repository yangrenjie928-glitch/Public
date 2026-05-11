const AVATARS = ["😎", "🐼", "🐉", "🦉", "✨"];

export default function AvatarPicker({ value, onChange }) {
  return (
    <div className="rounded-3xl bg-gradient-to-r from-brand-yellow/20 via-orange-50 to-brand-blue/15 p-4 ring-2 ring-brand-yellow/50">
      <p className="mb-3 text-center text-sm font-black text-slate-700">Твоя эмодзи-ава 😎 🐼 🐉</p>
      <div className="flex flex-wrap justify-center gap-2">
        {AVATARS.map((emoji) => {
          const picked = value === emoji;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              className={`grid h-14 w-14 place-items-center rounded-2xl text-3xl shadow-md ring-4 transition hover:scale-110 active:scale-95 sm:h-16 sm:w-16 ${
                picked ? "scale-105 bg-white ring-brand-blue" : "bg-white/80 ring-transparent hover:ring-brand-yellow"
              }`}
              aria-label={`Аватар ${emoji}`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
