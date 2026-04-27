import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { listUsers, updateUser } from "../../services/adminService";

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsers = async (keyword = "") => {
    const { data, error: fetchError } = await listUsers(keyword);
    if (fetchError) {
      setError(fetchError.message || "Не удалось загрузить пользователей.");
      return;
    }
    setError("");
    setUsers(data ?? []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const patchUser = async (id, payload) => {
    const { data, error: updateError } = await updateUser(id, payload);
    if (updateError) {
      setError(updateError.message || "Не удалось обновить пользователя.");
      return;
    }
    setError("");
    setNotice("Пользователь обновлен.");
    setUsers((prev) => prev.map((item) => (item.id === id ? data : item)));
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по имени или email"
          className="w-full max-w-sm rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-fuchsia-500"
        />
        <button
          type="button"
          onClick={() => loadUsers(search)}
          className="rounded-xl bg-slate-900 px-4 py-2 font-black text-white"
        >
          Найти
        </button>
      </div>

      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 font-bold text-rose-700">{error}</p> : null}
      {notice ? <p className="rounded-xl bg-emerald-50 px-3 py-2 font-bold text-emerald-700">{notice}</p> : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Пользователь</th>
              <th className="py-2">Роль</th>
              <th className="py-2">Статус</th>
              <th className="py-2">Уровень</th>
              <th className="py-2">XP</th>
              <th className="py-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="py-2 font-semibold">{user.username || user.email}</td>
                <td className="py-2">{user.role || "user"}</td>
                <td className="py-2">{user.status || "active"}</td>
                <td className="py-2">{user.level ?? 0}</td>
                <td className="py-2">{user.exp ?? 0}</td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-blue-100 px-2 py-1 font-bold text-blue-700"
                      onClick={() => patchUser(user.id, { role: user.role === "admin" ? "user" : "admin" })}
                    >
                      Сменить роль
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-amber-100 px-2 py-1 font-bold text-amber-700"
                      onClick={() => patchUser(user.id, { exp: (user.exp ?? 0) + 50, level: Math.floor(((user.exp ?? 0) + 50) / 100) })}
                    >
                      +50 XP
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-rose-100 px-2 py-1 font-bold text-rose-700"
                      onClick={() => patchUser(user.id, { status: user.status === "blocked" ? "active" : "blocked" })}
                    >
                      Блок/разблок
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default AdminUsersPage;
