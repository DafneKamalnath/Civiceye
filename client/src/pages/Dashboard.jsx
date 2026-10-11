import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-2xl font-bold">Authority dashboard</h1>
      <p className="text-slate-400">
        {user.name} ({user.role}
        {user.department ? `, ${user.department}` : ""})
      </p>
      <button onClick={logout} className="mt-4 bg-slate-700 px-3 py-1 rounded">
        Log out
      </button>
    </div>
  );
}