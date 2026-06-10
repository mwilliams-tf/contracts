import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { FictitiousDataBadge } from "./components/FictitiousDataBadge";
import { Board } from "./clm/Board";
import { ContractDetail } from "./clm/ContractDetail";
import { ContractRepository } from "./clm/ContractRepository";
import { RequestForm } from "./clm/RequestForm";
import { ChatView } from "./chat/ChatView";
import { useCorpus } from "./lib/useCorpus";
import { getActiveUserId, setActiveUserId, userAccessDescription, userRoleLabel } from "./lib/session";
import { NotificationsPanel } from "./components/NotificationsPanel";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-white/20 text-white"
      : "text-slate-200 hover:bg-white/10 hover:text-white"
  }`;

export default function App() {
  const corpus = useCorpus();
  const [userId, setUserId] = useState(getActiveUserId);
  const user = userId ? corpus.users.find((u) => u.id === userId) : null;

  useEffect(() => {
    if (!getActiveUserId() && corpus.users.length > 0) {
      const defaultUser = corpus.users.find((u) => u.role === "abogada") ?? corpus.users[0];
      setActiveUserId(defaultUser.id);
      setUserId(defaultUser.id);
    }
  }, []);

  function handleUserChange(id: string) {
    setActiveUserId(id);
    setUserId(id);
  }

  return (
    <div className="min-h-screen">
      <header className="bg-bank-navy text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/" className="shrink-0 text-lg font-bold tracking-tight">
            CLM + Chat IA
          </Link>
          <nav className="flex shrink-0 items-center gap-1">
            <NavLink to="/" end className={navClass}>
              Tablero
            </NavLink>
            {user?.role === "abogada" && (
              <NavLink to="/chat" className={navClass}>
                Chat IA
              </NavLink>
            )}
            <NavLink to="/solicitud" className={navClass}>
              Solicitud
            </NavLink>
          </nav>
          <div className="min-w-0 flex-1" aria-hidden="true" />
          <FictitiousDataBadge />
          <NotificationsPanel userId={userId} />
          <label htmlFor="user-select" className="sr-only">
            Usuaria activa
          </label>
          <select
            id="user-select"
            value={userId ?? ""}
            onChange={(e) => handleUserChange(e.target.value)}
            className="w-44 shrink-0 rounded-md border border-white/20 bg-white px-2 py-1.5 text-sm text-slate-900 focus:ring-2 focus:ring-bank-gold lg:w-56"
          >
            {corpus.users
              .filter((u) => u.role !== "proveedor")
              .map((u) => (
              <option key={u.id} value={u.id} className="text-slate-900">
                {u.name} ({userRoleLabel(u)})
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {user && (
          <p className="mb-4 text-xs text-slate-500">
            Sesión simulada: {user.name} ·{" "}
            {userAccessDescription(user)}
          </p>
        )}
        <Routes>
          <Route path="/" element={<Board />} />
          <Route path="/contratos/:id" element={<ContractDetail />} />
          <Route path="/contratos/:id/repositorio" element={<ContractRepository />} />
          <Route path="/chat/*" element={<ChatView key={userId ?? "none"} userId={userId} />} />
          <Route path="/solicitud" element={<RequestForm />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        Prototipo para demostración — área Legales · Integraciones reales pendientes (IT)
      </footer>
    </div>
  );
}
