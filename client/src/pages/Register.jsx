import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(name, email, password);
      navigate("/report");
    } catch (err) {
      setError(err.response?.data?.message || "Could not register");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 grid place-items-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-slate-800 p-6 rounded-xl space-y-4"
      >
        <h1 className="text-2xl font-bold text-white">Create your account</h1>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-2 rounded bg-slate-700 text-white outline-none"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 rounded bg-slate-700 text-white outline-none"
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full p-2 rounded bg-slate-700 text-white outline-none"
        />

        <button
          disabled={busy}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold p-2 rounded disabled:opacity-50"
        >
          {busy ? "Creating..." : "Register"}
        </button>

        <p className="text-slate-400 text-sm">
          Already registered?{" "}
          <Link to="/login" className="text-cyan-400">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}