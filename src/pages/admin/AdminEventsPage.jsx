import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { listEvents, upsertEvent } from "../../services/adminService";

const emptyEvent = { title: "", subtitle: "", status: "draft", start_at: "", end_at: "" };

function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyEvent);
  const [error, setError] = useState("");

  const load = async () => {
    const { data, error: fetchError } = await listEvents();
    if (fetchError) {
      setError(fetchError.message || "Не удалось загрузить события.");
      return;
    }
    setError("");
    setEvents(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      start_at: form.start_at || null,
      end_at: form.end_at || null
    };
    const { error: saveError } = await upsertEvent(payload);
    if (saveError) {
      setError(saveError.message || "Не удалось сохранить событие.");
      return;
    }
    setForm(emptyEvent);
    load();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-black">Добавить / изменить событие</h2>
        <form className="mt-4 space-y-3" onSubmit={submit}>
          <input className="w-full rounded-xl border px-3 py-2" placeholder="Название" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <input className="w-full rounded-xl border px-3 py-2" placeholder="Подзаголовок" value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} />
          <select className="w-full rounded-xl border px-3 py-2" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="closed">closed</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-xl border px-3 py-2" type="datetime-local" value={form.start_at} onChange={(e) => setForm((p) => ({ ...p, start_at: e.target.value }))} />
            <input className="rounded-xl border px-3 py-2" type="datetime-local" value={form.end_at} onChange={(e) => setForm((p) => ({ ...p, end_at: e.target.value }))} />
          </div>
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 font-black text-white">Сохранить событие</button>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-black">События</h2>
        {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 font-bold text-rose-700">{error}</p> : null}
        <div className="mt-3 space-y-2">
          {events.map((item) => (
            <div key={item.id} className="rounded-xl bg-slate-100 px-3 py-2">
              <p className="font-bold">{item.title}</p>
              <p className="text-sm text-slate-600">{item.status} · {item.start_at ? new Date(item.start_at).toLocaleString() : "Нет даты"}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AdminEventsPage;
