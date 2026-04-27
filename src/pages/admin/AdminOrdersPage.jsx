import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { listOrders, updateOrder } from "../../services/adminService";

function AdminOrdersPage() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = async (selected = "") => {
    const { data, error: fetchError } = await listOrders(selected);
    if (fetchError) {
      setError(fetchError.message || "Не удалось загрузить заказы.");
      return;
    }
    setError("");
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const markPaid = async (id) => {
    const { error: updateError } = await updateOrder(id, { status: "paid", paid_at: new Date().toISOString() });
    if (updateError) {
      setError(updateError.message || "Не удалось обновить заказ.");
      return;
    }
    load(status);
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-black">Заказы</h2>
        <select className="rounded-xl border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Все</option>
          <option value="pending">ожидает</option>
          <option value="paid">оплачен</option>
          <option value="failed">ошибка</option>
        </select>
        <button type="button" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-black text-white" onClick={() => load(status)}>
          Применить
        </button>
      </div>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 font-bold text-rose-700">{error}</p> : null}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-100 px-3 py-2">
            <div>
              <p className="font-semibold">{row.order_no || row.id}</p>
              <p className="text-sm text-slate-600">{row.amount} {row.currency} · {row.status}</p>
            </div>
            {row.status !== "paid" ? (
              <button type="button" className="rounded-lg bg-emerald-100 px-3 py-1 font-bold text-emerald-700" onClick={() => markPaid(row.id)}>
                Отметить оплаченным
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default AdminOrdersPage;
