import { useMemo, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";

const rivals = [
  { id: "r1", name: "Nika", avatar: "🐯", level: 6, stake: 120 },
  { id: "r2", name: "Olga", avatar: "🦊", level: 8, stake: 180 },
  { id: "r3", name: "Alex", avatar: "🐼", level: 5, stake: 90 },
];

function PkArenaPage() {
  const [selectedRivalId, setSelectedRivalId] = useState(rivals[0].id);
  const [depositPool, setDepositPool] = useState(640);
  const [myDeposit, setMyDeposit] = useState(280);
  const [notice, setNotice] = useState("");

  const selectedRival = useMemo(
    () => rivals.find((rival) => rival.id === selectedRivalId) || rivals[0],
    [selectedRivalId],
  );

  const playMatch = () => {
    const didWin = Math.random() > 0.4;
    if (didWin) {
      const reward = Math.round(selectedRival.stake * 0.6);
      setMyDeposit((prev) => prev + reward);
      setDepositPool((prev) => Math.max(0, prev - reward));
      setNotice(`Победа в PK! +${reward}₽ к твоему депозиту.`);
      return;
    }
    const loss = Math.round(selectedRival.stake * 0.4);
    setMyDeposit((prev) => Math.max(0, prev - loss));
    setDepositPool((prev) => prev + loss);
    setNotice(`Поражение в PK. -${loss}₽ из депозита, попробуй реванш.`);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
        <h1 className="text-3xl font-black">⚔️ PK Арена</h1>
        <p className="mt-2 max-w-2xl font-semibold">
          Играй мини-матчи против других участников и зарабатывай депозит из общего пула.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-black">
          <span className="rounded-full bg-white/20 px-4 py-2">Общий пул: {depositPool}₽</span>
          <span className="rounded-full bg-white/20 px-4 py-2">Твой депозит: {myDeposit}₽</span>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="space-y-4">
          <h2 className="text-xl font-extrabold">Выбери соперника</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {rivals.map((rival) => (
              <button
                key={rival.id}
                type="button"
                onClick={() => setSelectedRivalId(rival.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  selectedRivalId === rival.id
                    ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className="text-2xl">{rival.avatar}</p>
                <p className="mt-1 font-black">{rival.name}</p>
                <p className="text-xs font-bold text-slate-600">Lv.{rival.level}</p>
                <p className="mt-1 text-xs font-black text-emerald-700">Ставка: {rival.stake}₽</p>
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="font-bold text-slate-700">Текущий матч:</p>
            <p className="mt-1 text-lg font-black text-slate-900">
              Ты vs {selectedRival.avatar} {selectedRival.name}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Победа приносит часть депозита соперника, поражение уменьшает твой депозит.
            </p>
          </div>

          <Button className="w-full" onClick={playMatch}>
            ▶️ Играть PK-раунд
          </Button>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-xl font-extrabold">Награды PK</h2>
          <p className="text-sm font-semibold text-slate-700">За серию побед открываются бусты депозита:</p>
          <ul className="space-y-2 text-sm font-bold text-slate-700">
            <li>• 3 победы: +80₽ бонус</li>
            <li>• 5 побед: +150₽ бонус</li>
            <li>• 10 побед: VIP-статус арены</li>
          </ul>
          {notice ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">{notice}</p> : null}
        </Card>
      </section>
    </div>
  );
}

export default PkArenaPage;
