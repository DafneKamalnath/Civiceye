import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, Eye, PlusCircle, LayoutDashboard, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to={user?.role === "authority" ? "/dashboard" : "/report"} className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 group-hover:scale-105 transition-all">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">CivicEye</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">Civic Intelligence Platform</p>
          </div>
        </Link>

        {/* Center / Navigation Links */}
        <nav className="flex items-center gap-2">
          {user && (
            <>
              <Link
                to="/report"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                <span>Report Issue</span>
              </Link>

              {user.role === "authority" && (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  <span>Authority Dashboard</span>
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Right / User Profile & Logout */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-medium text-white">{user.name}</span>
              <span className="text-slate-500">•</span>
              <span className={`capitalize font-semibold ${user.role === "authority" ? "text-amber-400" : "text-emerald-400"}`}>
                {user.role}
              </span>
              {user.department && <span className="text-slate-400">({user.department})</span>}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition border border-transparent hover:border-red-500/30"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500 px-3.5 py-1.5 rounded-lg transition shadow-sm shadow-cyan-500/20"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
