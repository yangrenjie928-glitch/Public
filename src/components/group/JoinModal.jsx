import { createPortal } from "react-dom";

function JoinModal({ open, onJoin, onCancel }) {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/55 p-4">
      <div className="animate-pop w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-black text-slate-900">👥 Присоединиться к мини-группе?</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Группа из 4–6 человек для быстрого обучения
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onJoin}
            className="flex-1 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-red px-4 py-3 text-sm font-black text-white transition hover:scale-[1.02] active:scale-95"
          >
            🚀 Присоединиться
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:scale-[1.02] active:scale-95"
          >
            ❌ Отмена
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default JoinModal;
