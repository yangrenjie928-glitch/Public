import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/admin", label: "Обзор", end: true },
  { to: "/admin/users", label: "Пользователи" },
  { to: "/admin/courses", label: "Курсы" },
  { to: "/admin/events", label: "События" },
  { to: "/admin/content", label: "Контент" },
  { to: "/admin/orders", label: "Заказы" },
  { to: "/admin/funnel", label: "Воронка" }
];

function AdminLayout() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
        <p className="text-sm font-bold text-white/80">Панель администратора</p>
        <h1 className="mt-1 text-3xl font-black">Центр управления</h1>
      </section>

      <nav className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-soft">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 text-sm font-extrabold transition ${
                isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}

export default AdminLayout;
