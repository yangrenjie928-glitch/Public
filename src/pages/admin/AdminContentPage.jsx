import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { listQuestionBank, upsertQuestion } from "../../services/adminService";

const emptyQuestion = {
  question_text: "",
  category: "vocabulary",
  difficulty: "A1",
  type: "single",
  options: "[]",
  answer: "",
  enabled: true
};

function AdminContentPage() {
  const [rows, setRows] = useState([]);
  const [category, setCategory] = useState("");
  const [form, setForm] = useState(emptyQuestion);
  const [error, setError] = useState("");

  const load = async (selected = "") => {
    const { data, error: fetchError } = await listQuestionBank(selected);
    if (fetchError) {
      setError(fetchError.message || "Не удалось загрузить банк вопросов.");
      return;
    }
    setError("");
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    let parsedOptions = [];
    try {
      parsedOptions = JSON.parse(form.options || "[]");
      if (!Array.isArray(parsedOptions)) parsedOptions = [];
    } catch {
      setError("Варианты должны быть JSON-массивом.");
      return;
    }
    const { error: saveError } = await upsertQuestion({
      question_text: form.question_text,
      category: form.category,
      difficulty: form.difficulty,
      type: form.type,
      options: parsedOptions,
      answer: form.answer,
      enabled: form.enabled
    });
    if (saveError) {
      setError(saveError.message || "Не удалось сохранить вопрос.");
      return;
    }
    setForm(emptyQuestion);
    load(category);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-black">Редактор банка вопросов</h2>
        <form className="mt-4 space-y-3" onSubmit={submit}>
          <textarea className="w-full rounded-xl border px-3 py-2" rows={3} placeholder="Текст вопроса" value={form.question_text} onChange={(e) => setForm((p) => ({ ...p, question_text: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-xl border px-3 py-2" placeholder="Категория" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
            <input className="rounded-xl border px-3 py-2" placeholder="Сложность" value={form.difficulty} onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))} />
          </div>
          <input className="w-full rounded-xl border px-3 py-2" placeholder='JSON вариантов, напр. ["A","B"]' value={form.options} onChange={(e) => setForm((p) => ({ ...p, options: e.target.value }))} />
          <input className="w-full rounded-xl border px-3 py-2" placeholder="Ответ" value={form.answer} onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))} />
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 font-black text-white">Сохранить вопрос</button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black">Вопросы</h2>
          <input
            className="rounded-xl border px-3 py-2"
            placeholder="Фильтр категории"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button type="button" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-black text-white" onClick={() => load(category)}>
            Фильтр
          </button>
        </div>
        {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 font-bold text-rose-700">{error}</p> : null}
        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl bg-slate-100 px-3 py-2">
              <p className="font-semibold">{row.question_text}</p>
              <p className="text-sm text-slate-600">{row.category} · {row.difficulty} · {row.enabled ? "включен" : "выключен"}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AdminContentPage;
