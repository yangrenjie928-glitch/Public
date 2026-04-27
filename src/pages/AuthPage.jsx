import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import CodeInput from "../components/auth/CodeInput";
import PhoneInput from "../components/auth/PhoneInput";

const countryDialMap = {
  RU: "+7",
  KZ: "+7",
  BY: "+375",
};

const avatarOptions = ["😎", "🐼", "🐉", "🤓", "🦊"];

const formatPhoneKey = (countryCode, phone) => {
  const digits = phone.replace(/\D/g, "");
  return `${countryCode}:${digits}`;
};

const validatePhone = (countryCode, phone) => {
  const digits = phone.replace(/\D/g, "");
  if (countryCode === "BY") return digits.length === 12 && digits.startsWith("375");
  return digits.length === 11 && digits.startsWith("7");
};

const normalizeWithCountry = (countryCode, phone) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("7") || digits.startsWith("375")) return `+${digits}`;
  const dial = countryDialMap[countryCode].replace("+", "");
  return `+${dial}${digits}`;
};

function AuthPage() {
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState("RU");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [codeValue, setCodeValue] = useState("");
  const [codeError, setCodeError] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [notice, setNotice] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("😎");

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendTimer]);

  const resendBlocked = attempts >= 3;
  const canSend = !isSending && resendTimer === 0 && !resendBlocked;
  const canSubmitCode = codeValue.length >= 4;

  const sendCode = () => {
    const normalized = normalizeWithCountry(countryCode, phone);
    if (!validatePhone(countryCode, normalized)) {
      setPhoneError("❌ Неверный номер");
      return;
    }
    setPhoneError("");
    setCodeError("");
    setIsSending(true);
    setNotice("Отправляем SMS...");

    window.setTimeout(() => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setGeneratedCode(code);
      setAttempts((prev) => prev + 1);
      setResendTimer(60);
      setIsSending(false);
      setNotice(`Код отправлен ✅ (demo: ${code})`);
    }, 900);
  };

  const finishAuth = (user) => {
    localStorage.setItem("authSession", JSON.stringify(user));
    sessionStorage.setItem("welcomeAfterAuth", "1");
    navigate("/profile");
  };

  const verifyCode = () => {
    if (!generatedCode) {
      setCodeError("Сначала получи код 📩");
      return;
    }
    if (codeValue !== generatedCode) {
      setCodeError("❌ Неверный код");
      return;
    }

    setCodeError("");
    const userKey = formatPhoneKey(countryCode, normalizeWithCountry(countryCode, phone));
    const rawUsers = localStorage.getItem("mockUsers");
    const users = rawUsers ? JSON.parse(rawUsers) : {};
    const existing = users[userKey];

    if (existing) {
      setNotice("🎉 Добро пожаловать!");
      window.setTimeout(() => finishAuth(existing), 600);
      return;
    }
    setShowSetup(true);
    setNotice("Новый аккаунт! Заполни профиль 👇");
  };

  const createAccount = () => {
    if (!username.trim()) return;
    const normalizedPhone = normalizeWithCountry(countryCode, phone);
    const userKey = formatPhoneKey(countryCode, normalizedPhone);
    const user = { username: username.trim(), avatar, phone: normalizedPhone };
    const rawUsers = localStorage.getItem("mockUsers");
    const users = rawUsers ? JSON.parse(rawUsers) : {};
    users[userKey] = user;
    localStorage.setItem("mockUsers", JSON.stringify(users));
    setNotice("🎉 Добро пожаловать!");
    window.setTimeout(() => finishAuth(user), 600);
  };

  const autoFillCode = () => {
    if (!generatedCode) return;
    setCodeValue(generatedCode);
  };

  const authTitle = useMemo(() => (showSetup ? "Создание профиля 🎮" : "Вход по SMS 🚀"), [showSetup]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card className="space-y-5 bg-gradient-to-r from-fuchsia-500 to-pink-500 p-6 text-white">
        <h1 className="text-3xl font-black">{authTitle}</h1>
        <p className="font-bold">Быстрый вход без пароля. Просто, как в игре 😎</p>
      </Card>

      <Card className="space-y-5">
        <PhoneInput
          countryCode={countryCode}
          onCountryChange={setCountryCode}
          phone={phone}
          onPhoneChange={setPhone}
          error={phoneError}
        />

        <CodeInput length={6} value={codeValue} onChange={setCodeValue} error={codeError} />

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" type="button" onClick={sendCode} disabled={!canSend}>
            {isSending
              ? "Отправляем..."
              : resendTimer > 0
                ? `Отправить снова через ${resendTimer}с`
                : "📩 Получить код"}
          </Button>
          <Button variant="primary" type="button" onClick={verifyCode} disabled={!canSubmitCode}>
            🚀 Войти / Зарегистрироваться
          </Button>
          <Button variant="ghost" type="button">
            Войти через VK
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black transition hover:scale-105 active:scale-[0.97]"
            onClick={autoFillCode}
          >
            Автозаполнить код ✨
          </button>
          {resendBlocked ? <p className="text-sm font-black text-rose-600">Лимит отправок достигнут</p> : null}
        </div>

        {notice ? <p className="text-sm font-black text-emerald-600">{notice}</p> : null}
      </Card>

      {showSetup ? (
        <Card className="space-y-4">
          <h2 className="text-xl font-black">Новый пользователь 👋</h2>
          <label className="block">
            <span className="mb-1 block text-sm font-black text-slate-600">Имя пользователя</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Ivan"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 font-bold outline-none focus:border-fuchsia-500"
            />
          </label>
          <div>
            <p className="mb-2 text-sm font-black text-slate-600">Выбери аватар</p>
            <div className="flex flex-wrap gap-2">
              {avatarOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`grid h-12 w-12 place-items-center rounded-full text-2xl transition hover:scale-110 ${
                    avatar === item ? "bg-fuchsia-500 text-white" : "bg-slate-100"
                  }`}
                  onClick={() => setAvatar(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <Button type="button" onClick={createAccount} disabled={!username.trim()}>
            Создать аккаунт
          </Button>
        </Card>
      ) : null}
    </div>
  );
}

export default AuthPage;
