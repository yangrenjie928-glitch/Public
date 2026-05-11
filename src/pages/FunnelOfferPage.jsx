import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { PAYMENTS_ENABLED } from "../config/payments";
import { trackFunnelStep } from "../services/funnelTracking";

function FunnelOfferPage() {
  const navigate = useNavigate();
  useEffect(() => {
    trackFunnelStep("offer_open");
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="space-y-4 bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-7 text-white">
        <h1 className="text-3xl font-black">🚀 Продолжи обучение</h1>
        <ul className="space-y-1 font-bold">
          <li>• 30 дней обучения</li>
          <li>• Разговорный китайский</li>
          <li>• Быстрый результат</li>
        </ul>
        <div className="rounded-2xl bg-white/15 p-4">
          <p className="text-sm font-bold text-white/80">Старая цена</p>
          <p className="text-2xl font-black line-through">2990₽</p>
          <p className="mt-1 text-sm font-bold text-yellow-100">Новая цена</p>
          <p className="text-4xl font-black text-yellow-200">990₽</p>
        </div>
      </Card>

      <Card className="border-2 border-amber-300 bg-amber-50">
        <p className="text-lg font-black text-amber-700">⏳ Скидка действует 24 часа</p>
        <p className="font-black text-amber-700">🔥 Только для участников</p>
      </Card>

      {PAYMENTS_ENABLED ? (
        <Button
          className="w-full"
          size="lg"
          type="button"
          onClick={() => {
            trackFunnelStep("payment_open");
            navigate("/funnel/payment?plan=course_monthly");
          }}
        >
          🎓 Купить сейчас
        </Button>
      ) : (
        <div className="space-y-2">
          <Button className="w-full" size="lg" type="button" disabled>
            Оплата временно недоступна
          </Button>
          <p className="text-center text-sm font-semibold text-slate-500">
            После ИНН и подключения эквайринга кнопку снова включим.
          </p>
        </div>
      )}
    </div>
  );
}

export default FunnelOfferPage;
