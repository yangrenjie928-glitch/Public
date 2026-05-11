import { useEffect, useMemo, useRef, useState } from "react";

const quickReactions = ["👍", "🔥", "🎉", "😄"];
const INITIAL_VISIBLE_MESSAGES = 14;

function formatTime(date = new Date()) {
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function ChatPanel({ members, currentUser, messages, onSendMessage, sendingMessage }) {
  const scrollRef = useRef(null);
  const sendBurstTimerRef = useRef(null);
  const messageAppearTimerRef = useRef(null);
  const knownMessageIdsRef = useRef(new Set((messages || []).map((message) => message.id)));
  const [input, setInput] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_MESSAGES);
  const [sendBurst, setSendBurst] = useState(false);
  const [appearingMessageIds, setAppearingMessageIds] = useState(() => new Set());

  const memberMap = useMemo(
    () =>
      members.reduce((acc, member) => {
        acc[member.id] = member;
        return acc;
      }, {}),
    [members],
  );

  const visibleMessages = useMemo(
    () => messages.slice(Math.max(messages.length - visibleCount, 0)),
    [messages, visibleCount],
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [visibleMessages]);

  useEffect(() => {
    const knownIds = knownMessageIdsRef.current;
    const incomingMessages = (messages || []).filter((message) => message.id && !knownIds.has(message.id));
    if (!incomingMessages.length) return;

    // Mark all new ids as known immediately, but animate only those not flagged as replacement echoes.
    incomingMessages.forEach((message) => knownIds.add(message.id));
    const animateIds = incomingMessages.filter((message) => !message.skipAppear).map((message) => message.id);
    if (!animateIds.length) return;

    const incomingSet = new Set(animateIds);
    setAppearingMessageIds(incomingSet);

    if (messageAppearTimerRef.current) {
      clearTimeout(messageAppearTimerRef.current);
    }
    messageAppearTimerRef.current = window.setTimeout(() => {
      setAppearingMessageIds(new Set());
      messageAppearTimerRef.current = null;
    }, 520);
  }, [messages]);

  useEffect(
    () => () => {
      if (sendBurstTimerRef.current) {
        clearTimeout(sendBurstTimerRef.current);
      }
      if (messageAppearTimerRef.current) {
        clearTimeout(messageAppearTimerRef.current);
      }
    },
    [],
  );

  const sendTextMessage = (text) => {
    const payload = text.trim();
    if (!payload) return;
    setInput("");
    setVisibleCount((prev) => Math.max(prev, INITIAL_VISIBLE_MESSAGES + 1));
    setSendBurst(true);
    if (sendBurstTimerRef.current) {
      clearTimeout(sendBurstTimerRef.current);
    }
    sendBurstTimerRef.current = window.setTimeout(() => {
      setSendBurst(false);
      sendBurstTimerRef.current = null;
    }, 420);
    onSendMessage(payload);
  };

  return (
    <section className="card flex h-[560px] flex-col p-0">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">💬 Чат участников группы</h2>
          <button
            type="button"
            className="rounded-xl bg-brand-blue px-4 py-2 text-xs font-black text-white transition hover:scale-[1.02] active:scale-95"
          >
            👥 Пригласить друга
          </button>
        </div>
      </div>

      <div className="px-4 pt-3">
        {visibleCount < messages.length ? (
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => Math.min(messages.length, prev + 10))}
            className="w-full rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200"
          >
            Показать более ранние сообщения
          </button>
        ) : (
          <p className="text-center text-[11px] font-bold text-slate-400">Начало истории чата</p>
        )}
      </div>

      <div ref={scrollRef} className="mt-3 h-[300px] space-y-3 overflow-y-auto px-4 py-1">
        {visibleMessages.map((message) => {
          if (message.type === "system") {
            return (
              <div key={message.id} className="mx-auto max-w-md rounded-full bg-slate-100 px-4 py-2 text-center text-xs font-bold text-slate-600">
                {message.text}
              </div>
            );
          }

          const user = memberMap[message.userId];
          const isCurrent = message.userId === currentUser.id;

          return (
            <div key={message.id} className={`flex gap-2 ${isCurrent ? "justify-end" : "justify-start"}`}>
              {!isCurrent ? (
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-r from-brand-blue to-brand-red text-xs font-black text-white">
                  {user?.avatar ?? user?.name?.slice(0, 1) ?? "?"}
                </div>
              ) : null}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${isCurrent ? "bg-brand-blue text-white" : "bg-slate-100 text-slate-800"} ${
                  appearingMessageIds.has(message.id)
                    ? isCurrent
                      ? "chat-message-pop chat-message-pop--self"
                      : "chat-message-pop chat-message-pop--other"
                    : ""
                }`}
              >
                <p className="text-xs font-black">{user?.name || "Unknown"}</p>
                <p className="text-sm font-semibold">{message.text}</p>
                <p className={`mt-1 text-[10px] ${isCurrent ? "text-blue-100" : "text-slate-500"}`}>
                  {message.time || formatTime(new Date(message.createdAt || Date.now()))}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-200 px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {quickReactions.map((reaction) => (
            <button
              key={reaction}
              type="button"
              onClick={() => sendTextMessage(reaction)}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700 transition hover:bg-slate-200"
            >
              {reaction}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            sendTextMessage(input);
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Напиши сообщение..."
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold outline-none focus:border-brand-blue"
          />
          <button
            type="submit"
            disabled={sendingMessage}
            className={`chat-send-btn rounded-xl bg-gradient-to-r from-brand-red to-brand-blue px-4 py-2 text-sm font-black text-white transition hover:scale-[1.02] active:scale-95 ${
              sendBurst ? "chat-send-btn--burst" : ""
            }`}
          >
            <span className={`chat-send-icon inline-block ${sendBurst ? "chat-send-icon--burst" : ""}`}>📤</span> Отправить
          </button>
        </form>
      </div>
    </section>
  );
}

export default ChatPanel;
