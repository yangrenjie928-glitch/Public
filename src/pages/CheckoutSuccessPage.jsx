import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { PAYMENTS_ENABLED } from "../config/payments";
import { fetchMySubscriptionStatus } from "../services/checkoutApi";
import { resolveSubscriptionPlan } from "../services/subscriptionPlans";

function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const planCode = searchParams.get("plan") || "course_monthly";
  const plan = useMemo(() => resolveSubscriptionPlan(planCode), [planCode]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!PAYMENTS_ENABLED) {
      setLoading(false);
      return undefined;
    }
    let mounted = true;
    const load = async () => {
      try {
        const result = await fetchMySubscriptionStatus(plan.code);
        if (!mounted) return;
        setStatus(result.subscription || null);
      } catch (requestError) {
        if (!mounted) return;
        setError(requestError.message || "Не удалось проверить подписку");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [plan.code]);

  if (!PAYMENTS_ENABLED) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="space-y-3 bg-slate-100 p-6 text-center">
          <p className="text-4xl">🧾</p>
          <h1 className="text-2xl font-black text-slate-900">Страница оплаты не используется</h1>
          <p className="font-semibold text-slate-600">
            Оплата сейчас отключена. Перейди в каталог курсов.
          </p>
          <Link to="/learning" className="block">
            <Button className="w-full">В каталог курсов</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="space-y-2 bg-emerald-50 p-6 text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="text-3xl font-black text-emerald-700">Оплата принята</h1>
        <p className="font-bold text-slate-700">Подписка: {plan.title}</p>
      </Card>

      <Card className="space-y-4">
        {loading ? <p className="font-semibold text-slate-500">Проверяем статус подписки...</p> : null}
        {!loading && error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{error}</p> : null}
        {!loading && !error ? (
          <div className="space-y-2">
            <p className="font-bold text-slate-700">Статус: {status?.status || "pending"}</p>
            <p className="text-sm font-semibold text-slate-600">
              Действует до: {status?.current_period_end ? new Date(status.current_period_end).toLocaleString() : "ожидаем подтверждение"}
            </p>
          </div>
        ) : null}
        <Link to="/learning" className="block">
          <Button className="w-full">Перейти к курсам</Button>
        </Link>
      </Card>
    </div>
  );
}

export default CheckoutSuccessPage;
