import { useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import { trackFunnelStep } from "../services/funnelTracking";

function FunnelPaymentPage() {
  const [name, setName] = useState("");
  const [card, setCard] = useState("");
  const [paid, setPaid] = useState(false);
  useEffect(() => {
    trackFunnelStep("payment_open");
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card className="space-y-4 bg-gradient-to-r from-slate-800 to-slate-600 p-6 text-white">
        <h1 className="text-3xl font-black">Оплата курса 💳</h1>
        <p className="font-bold text-slate-100">Тестовый платежный экран (mock)</p>
      </Card>

      <Card className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-600">Имя на карте</span>
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-fuchsia-500"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="IVAN IVANOV"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-600">Номер карты</span>
          <input
            className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-fuchsia-500"
            value={card}
            onChange={(event) => setCard(event.target.value)}
            placeholder="0000 0000 0000 0000"
          />
        </label>
        <Button
          className="w-full"
          size="lg"
          type="button"
          onClick={() => {
            trackFunnelStep("payment_success");
            setPaid(true);
          }}
          disabled={!name || !card}
        >
          💳 Оплатить
        </Button>
      </Card>

      {paid ? (
        <Card className="animate-pop bg-emerald-50 text-center">
          <p className="text-3xl">🎉</p>
          <p className="text-xl font-black text-emerald-700">Оплата принята!</p>
          <p className="font-bold text-slate-700">Добро пожаловать в основной курс 🚀</p>
        </Card>
      ) : null}
    </div>
  );
}

export default FunnelPaymentPage;
