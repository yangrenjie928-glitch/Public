import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import { funnelSummary } from "../../services/adminService";

function AdminFunnelPage() {
  const [rows, setRows] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const { data, error: fetchError } = await funnelSummary(startDate, endDate);
    if (fetchError) {
      setError(fetchError.message || "Не удалось загрузить сводку воронки.");
      return;
    }
    setError("");
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const baseline = rows[0]?.users ?? 0;
  const withRate = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        rate: baseline > 0 ? `${Math.round((row.users / baseline) * 100)}%` : "0%"
      })),
    [rows, baseline]
  );

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-black">Панель воронки</h2>
        <input type="date" className="rounded-xl border px-3 py-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" className="rounded-xl border px-3 py-2" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button type="button" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-black text-white" onClick={load}>
          Обновить
        </button>
      </div>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 font-bold text-rose-700">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Этап</th>
              <th className="py-2">Пользователи</th>
              <th className="py-2">Конверсия</th>
            </tr>
          </thead>
          <tbody>
            {withRate.map((row) => (
              <tr key={row.step} className="border-b">
                <td className="py-2 font-semibold">{row.step}</td>
                <td className="py-2">{row.users}</td>
                <td className="py-2">{row.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default AdminFunnelPage;
