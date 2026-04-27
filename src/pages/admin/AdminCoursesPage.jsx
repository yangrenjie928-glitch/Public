import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { listCourses, upsertCourse } from "../../services/adminService";

const emptyCourse = { title: "", subtitle: "", level: "A1", price: 0, status: "draft", sort_order: 0 };

function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyCourse);
  const [error, setError] = useState("");

  const load = async () => {
    const { data, error: fetchError } = await listCourses();
    if (fetchError) {
      setError(fetchError.message || "Не удалось загрузить курсы.");
      return;
    }
    setError("");
    setCourses(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      sort_order: Number(form.sort_order)
    };
    const { error: saveError } = await upsertCourse(payload);
    if (saveError) {
      setError(saveError.message || "Не удалось сохранить курс.");
      return;
    }
    setForm(emptyCourse);
    load();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-black">Добавить / изменить курс</h2>
        <form className="mt-4 space-y-3" onSubmit={submit}>
          <input className="w-full rounded-xl border px-3 py-2" placeholder="Название" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          <input className="w-full rounded-xl border px-3 py-2" placeholder="Подзаголовок" value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-xl border px-3 py-2" placeholder="Уровень" value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))} />
            <input className="rounded-xl border px-3 py-2" placeholder="Цена" type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="rounded-xl border px-3 py-2" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
            <input className="rounded-xl border px-3 py-2" placeholder="Порядок" type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} />
          </div>
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 font-black text-white">Сохранить курс</button>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-black">Курсы</h2>
        {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 font-bold text-rose-700">{error}</p> : null}
        <div className="mt-3 space-y-2">
          {courses.map((course) => (
            <div key={course.id} className="rounded-xl bg-slate-100 px-3 py-2">
              <p className="font-bold">{course.title}</p>
              <p className="text-sm text-slate-600">{course.level} · {course.status} · {course.price}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AdminCoursesPage;
