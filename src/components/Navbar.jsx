import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authLogout } from "../services/authLogout";

const links = [
  { to: "/", label: "Главная" },
  { to: "/learning", label: "Обучение" },
  { to: "/events", label: "События" },
  { to: "/profile", label: "Профиль" },
];

function Navbar() {
  const { user, profile } = useAuth();
  const navLinks = profile?.role === "admin" ? [...links, { to: "/admin", label: "Админ" }] : links;
  const totalLoginDays = user ? Number(profile?.login_days ?? 0) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="container-main flex items-center justify-between py-4">
        <div className="flex items-center gap-2 text-xl font-black">
          <span className="select-none text-[1.45rem] leading-none drop-shadow-sm" role="img" aria-label="Облако">
            ☁️
          </span>
          <span>Китайское облако</span>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm font-extrabold transition ${
                  isActive
                    ? "bg-gradient-to-r from-brand-blue to-brand-red text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-full bg-gradient-to-r from-amber-300 to-brand-yellow px-3 py-1 text-xs font-black text-amber-900 md:block">
            Всего дней входа: {totalLoginDays} 🔥
          </div>
          {user ? (
            <button
              type="button"
              className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-black text-rose-700"
              onClick={() => authLogout()}
            >
              Выйти
            </button>
          ) : (
            <NavLink to="/login" className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-black text-white">
              Войти
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
