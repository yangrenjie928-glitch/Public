import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { listCourses, listEvents, listOrders, listUsers } from "../../services/adminService";

function StatCard({ label, value }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
    </Card>
  );
}

function AdminOverviewPage() {
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    events: 0,
    paidOrders: 0
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const [usersRes, coursesRes, eventsRes, ordersRes] = await Promise.all([listUsers(), listCourses(), listEvents(), listOrders("paid")]);
      const firstError = usersRes.error || coursesRes.error || eventsRes.error || ordersRes.error;
      if (firstError) {
        setError(firstError.message || "Не удалось загрузить обзор администратора.");
        return;
      }
      setStats({
        users: usersRes.data?.length ?? 0,
        courses: coursesRes.data?.length ?? 0,
        events: eventsRes.data?.length ?? 0,
        paidOrders: ordersRes.data?.length ?? 0
      });
    };
    load();
  }, []);

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 font-bold text-rose-700">{error}</p> : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Всего пользователей" value={stats.users} />
        <StatCard label="Курсы" value={stats.courses} />
        <StatCard label="События" value={stats.events} />
        <StatCard label="Оплаченные заказы" value={stats.paidOrders} />
      </section>
    </div>
  );
}

export default AdminOverviewPage;
