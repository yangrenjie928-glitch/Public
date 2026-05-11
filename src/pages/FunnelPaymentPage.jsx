import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { PAYMENTS_ENABLED } from "../config/payments";
import { useAuth } from "../context/AuthContext";
import { createSubscriptionCheckout } from "../services/checkoutApi";
import { resolveSubscriptionPlan } from "../services/subscriptionPlans";
import { trackFunnelStep } from "../services/funnelTracking";

function FunnelPaymentPage() {
  if (!PAYMENTS_ENABLED) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <Card className="space-y-3 bg-slate-100 p-6">
          <h1 className="text-2xl font-black text-slate-900">Оплата временно недоступна</h1>
          <p className="font-semibold text-slate-600">
            Онлайн-оплата отключена до оформления ИНН и подключения эквайринга. Курсы и регистрация работают как обычно — мы включим оплату позже.
          </p>
          <Link to="/learning">
            <Button className="w-full">В каталог курсов</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const planCode = searchParams.get("plan") || "course_monthly";
  const plan = useMemo(() => resolveSubscriptionPlan(planCode), [planCode]);

  useEffect(() => {
    trackFunnelStep("payment_open");
  }, []);

  const handlePay = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/checkout/success?plan=${encodeURIComponent(plan.code)}`;
      const result = await createSubscriptionCheckout({
        planCode: plan.code,
        returnUrl,
      });
      if (!result.checkoutUrl) {
        throw new Error("Не получили ссылку на оплату");
      }
      trackFunnelStep("payment_redirect", { plan: plan.code, paymentId: result.paymentId || null });
      window.location.assign(result.checkoutUrl);
    } catch (requestError) {
      setError(requestError.message || "Не удалось создать платеж");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card className="space-y-4 bg-gradient-to-r from-slate-800 to-slate-600 p-6 text-white">
        <h1 className="text-3xl font-black">Оплата курса 💳</h1>
        <p className="font-bold text-slate-100">Безопасная оплата через YooKassa</p>
      </Card>

      <Card className="space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-500">План</p>
          <p className="text-2xl font-black text-slate-900">{plan.title}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {plan.amount} {plan.currency} / {plan.periodLabel}
          </p>
        </div>
        {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}
        <Button className="w-full" size="lg" type="button" onClick={handlePay} disabled={submitting}>
          {submitting ? "Переходим к оплате..." : "💳 Перейти к оплате"}
        </Button>
      </Card>
    </div>
  );
}

export default FunnelPaymentPage;
