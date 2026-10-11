import { useEffect, useState } from "react";
import api from "./api/axios";

export default function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    api.get("/health")
      .then((res) => setStatus(res.data.status))
      .catch(() => setStatus("server unreachable"));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white grid place-items-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">CivicEye AI</h1>
        <p className="mt-2 text-cyan-400">Server status: {status}</p>
      </div>
    </div>
  );
}