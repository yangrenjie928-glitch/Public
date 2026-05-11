import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { PAYMENTS_ENABLED } from "../config/payments";

function CheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="space-y-2 bg-amber-50 p-6 text-center">
        <p className="text-4xl">⚠️</p>
        <h1 className="text-3xl font-black text-amber-700">
          {PAYMENTS_ENABLED ? "Оплата отменена" : "Оплата не используется"}
        </h1>
        <p className="font-bold text-slate-700">
          {PAYMENTS_ENABLED
            ? "Платеж не завершен."
            : "Онлайн-оплата сейчас отключена. Возвращайся в каталог."}
        </p>
      </Card>
      <Card className="space-y-3">
        <Link to="/learning" className="block">
          <Button className="w-full">В каталог курсов</Button>
        </Link>
      </Card>
    </div>
  );
}

export default CheckoutCancelPage;
