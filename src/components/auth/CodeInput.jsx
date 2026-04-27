import { useEffect, useMemo, useRef } from "react";

function CodeInput({ length = 6, value, onChange, disabled = false, error }) {
  const refs = useRef([]);
  const chars = useMemo(() => {
    const arr = Array.from({ length }, (_, i) => value[i] || "");
    return arr;
  }, [value, length]);

  useEffect(() => {
    refs.current = refs.current.slice(0, length);
  }, [length]);

  const updateAt = (index, next) => {
    const arr = chars.slice();
    arr[index] = next;
    onChange(arr.join(""));
  };

  const handleInput = (index, raw) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    updateAt(index, digit);
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !chars[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    refs.current[focusIndex]?.focus();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-black text-slate-600">🔢 Код подтверждения</label>
      <div className="flex gap-2" onPaste={handlePaste}>
        {chars.map((ch, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={ch}
            disabled={disabled}
            onChange={(event) => handleInput(i, event.target.value)}
            onKeyDown={(event) => handleKeyDown(i, event)}
            inputMode="numeric"
            maxLength={1}
            className="h-12 w-12 rounded-xl border border-slate-300 text-center text-lg font-black outline-none focus:border-fuchsia-500 disabled:bg-slate-100"
          />
        ))}
      </div>
      {error ? <p className="text-sm font-black text-rose-600">{error}</p> : null}
    </div>
  );
}

export default CodeInput;
