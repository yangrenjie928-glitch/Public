import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { trackFunnelStep } from "../services/funnelTracking";

function FunnelGroupSuccessPage() {
  const navigate = useNavigate();
  useEffect(() => {
    trackFunnelStep("group_success");
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="space-y-4 bg-gradient-to-r from-emerald-500 to-green-500 p-8 text-center text-white">
        <p className="text-4xl">🎉</p>
        <h1 className="text-3xl font-black sm:text-4xl">Ты в группе!</h1>
        <p className="text-lg font-bold">👉 Теперь пройди пробный урок</p>
        <Button variant="ghost" size="lg" type="button" onClick={() => navigate("/funnel/trial-lesson")}>
          🚀 Начать урок
        </Button>
      </Card>

      <Card className="text-center">
        <p className="text-sm font-bold text-slate-500">Путь прогресса</p>
        <p className="mt-1 text-lg font-black">Event → Group ✅ → Trial → Engagement → Offer</p>
      </Card>
    </div>
  );
}

export default FunnelGroupSuccessPage;
