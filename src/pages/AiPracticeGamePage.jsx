import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";

const quickReplies = ["你好", "我叫...", "谢谢", "再见"];

function resolveOpenAiChatCompletionsUrl() {
  const provider = import.meta.env.VITE_OPENAI_PROVIDER?.trim().toLowerCase();
  // OpenAI API блокирует ряд стран; OpenRouter — частый обход (см. .env.example).
  if (provider === "openrouter") {
    return "/openrouter-api/api/v1/chat/completions";
  }
  const custom = import.meta.env.VITE_OPENAI_BASE_URL?.trim();
  if (custom) {
    const c = custom.replace(/\/$/, "");
    if (c.includes("/chat/completions")) {
      return c;
    }
    if (c.endsWith("/v1")) {
      return `${c}/chat/completions`;
    }
    return `${c}/v1/chat/completions`;
  }
  return "/openai-api/v1/chat/completions";
}

const CHAT_COMPLETIONS_URL = resolveOpenAiChatCompletionsUrl();

function buildChatRequestHeaders(apiKey) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (CHAT_COMPLETIONS_URL.includes("openrouter")) {
    headers["HTTP-Referer"] =
      import.meta.env.VITE_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173");
    headers["X-Title"] = "MandarinPlay";
  }
  return headers;
}

function isOpenAiGeoBlockError(message) {
  const s = String(message || "");
  // Текст OpenAI, избегаем ложных срабатываний на "not supported" в других ошибках
  return /country,\s*region.*not supported|unsupported_country|unsupported_country_code/i.test(
    s,
  );
}

function isPlaceholderApiKey(key) {
  if (!key || typeof key !== "string") {
    return true;
  }
  const k = key.trim();
  if (k.length < 8) {
    return true;
  }
  if (/your_(openai_)?api_key|placeholder|xxx/i.test(k)) {
    return true;
  }
  return false;
}

function AiPracticeGamePage() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Привет! Я AI-тренер китайского 🎮 Напиши первую фразу: 你好" },
  ]);
  const [input, setInput] = useState("");
  const [floatingXp, setFloatingXp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const sentCount = useMemo(() => messages.filter((m) => m.role === "user").length, [messages]);
  const rawApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const apiKey = isPlaceholderApiKey(rawApiKey) ? "" : String(rawApiKey).trim();
  const isOpenRouter =
    import.meta.env.VITE_OPENAI_PROVIDER?.trim().toLowerCase() === "openrouter";
  const model =
    import.meta.env.VITE_OPENAI_MODEL?.trim() ||
    (isOpenRouter ? "openai/gpt-4o-mini" : "gpt-4o-mini");

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const buildPrompt = (userText) => [
    {
      role: "system",
      content:
        "Ты дружелюбный AI-тренер китайского для русскоязычного пользователя. Отвечай коротко (2-4 предложения), исправляй ошибки мягко, добавляй пиньинь и перевод. Тон: игровой и поддерживающий.",
    },
    ...messages
      .filter((msg) => msg.role === "user" || msg.role === "ai")
      .map((msg) => ({
        role: msg.role === "ai" ? "assistant" : "user",
        content: msg.text,
      })),
    { role: "user", content: userText },
  ];

  const sendMessage = async (rawText) => {
    const text = rawText.trim();
    if (!text || isLoading) return;

    setErrorText("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setFloatingXp("+20 XP ⚡");
    window.setTimeout(() => setFloatingXp(""), 900);

    if (!apiKey) {
      setErrorText("Добавь корректный VITE_OPENAI_API_KEY в .env.local и перезапусти dev-сервер.");
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Нужен API-ключ OpenAI. Создай .env.local с VITE_OPENAI_API_KEY=... и сделай перезапуск (npm run dev) 🔑",
        },
      ]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: buildChatRequestHeaders(apiKey),
        body: JSON.stringify({
          model,
          messages: buildPrompt(text),
          temperature: 0.7,
        }),
      });

      const raw = await response.text();
      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const j = JSON.parse(raw);
          if (j?.error?.message) {
            detail = j.error.message;
          }
        } catch {
          if (raw) {
            detail = raw.slice(0, 200);
          }
        }
        if (!isOpenRouter && isOpenAiGeoBlockError(detail)) {
          setErrorText(
            "OpenAI API недоступен из твоего региона. Подключи OpenRouter: в .env.local — VITE_OPENAI_PROVIDER=openrouter и VITE_OPENAI_API_KEY=ключ с openrouter.ai, затем перезапусти npm run dev.",
          );
          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              text: "OpenAI в этом проекте по умолчанию идёт на api.openai.com — в ряде стран запросы блокируются. Варианты: 1) .env.local: VITE_OPENAI_PROVIDER=openrouter, VITE_OPENAI_API_KEY=твой ключ с openrouter.ai, перезапуск dev. 2) Свой прокси/VPS (VITE_OPENAI_BASE_URL) в поддерживаемой юрисдикции.",
            },
          ]);
        } else {
          setErrorText(`OpenAI: ${detail}`);
          setMessages((prev) => [
            ...prev,
            {
              role: "ai",
              text: "Ответ API с ошибкой. Проверь баланс, ключ и сеть. Для продакшена может понадобиться VITE_OPENAI_BASE_URL на свой прокси.",
            },
          ]);
        }
        return;
      }

      const data = JSON.parse(raw);
      const aiText = data?.choices?.[0]?.message?.content?.trim() || "Я рядом! Попробуй еще одну фразу ✨";
      setMessages((prev) => [...prev, { role: "ai", text: aiText }]);
    } catch (error) {
      const msg = error?.message || String(error);
      setErrorText(
        /Failed to fetch|NetworkError|Load failed|fetch/i.test(msg)
          ? "Сеть или CORS: запусти проект через npm run dev (есть прокси /openai-api). Для file:// / статики — подключи бэкенд-прокси (VITE_OPENAI_BASE_URL)."
          : `Не удалось вызвать API: ${msg}`,
      );
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Упс, временный сбой AI 😢 Попробуй еще раз или открой консоль (F12) — там деталь ошибки." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorText("Голосовой ввод не поддерживается в этом браузере.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setErrorText("");
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ");
      setInput(transcript.trim());
    };

    recognition.onerror = () => {
      setErrorText("Не удалось распознать речь. Попробуй еще раз.");
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {floatingXp ? (
        <div className="fixed right-6 top-24 z-50 animate-pop rounded-2xl bg-emerald-500 px-4 py-2 text-lg font-black text-white shadow-2xl">
          {floatingXp}
        </div>
      ) : null}

      <Card className="space-y-3 bg-gradient-to-r from-indigo-500 to-fuchsia-500 p-6 text-white">
        <h1 className="text-3xl font-black">AI-игра: разговорный китайский 🎮</h1>
        <p className="font-bold">Общайся с AI, учи фразы и получай XP. Это как мини-игра 🔥</p>
        <p className="rounded-xl bg-white/20 px-4 py-2 text-sm font-black">Сообщений отправлено: {sentCount}</p>
      </Card>

      <Card className="space-y-4">
        <div className="max-h-[380px] space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-bold ${
                  msg.role === "user" ? "bg-fuchsia-500 text-white" : "bg-white text-slate-700 shadow"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {quickReplies.map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black transition hover:scale-105 active:scale-[0.97]"
              onClick={() => sendMessage(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`rounded-2xl px-4 py-3 text-sm font-black transition hover:scale-105 active:scale-[0.97] ${
              isListening ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {isListening ? "🎙️ Говорю..." : "🎤 Сказать"}
          </button>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendMessage(input);
            }}
            placeholder="Напиши фразу по-китайски..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-fuchsia-500"
          />
          <Button type="button" onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}>
            {isLoading ? "AI думает..." : "Отправить"}
          </Button>
        </div>
        {errorText ? <p className="text-sm font-black text-rose-600">{errorText}</p> : null}
      </Card>
    </div>
  );
}

export default AiPracticeGamePage;
