import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getNotificationsForUser,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeWorkflow,
} from "../lib/workflow-storage";

interface NotificationsPanelProps {
  userId: string | null;
}

export function NotificationsPanel({ userId }: NotificationsPanelProps) {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeWorkflow(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!userId) return null;

  void tick;
  const unread = getUnreadCount(userId);
  const notifications = getNotificationsForUser(userId).slice(0, 12);

  function handleOpen() {
    setOpen((v) => !v);
  }

  function handleNotificationClick(id: string) {
    markNotificationRead(id);
    setOpen(false);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative rounded-md bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label={`Notificaciones${unread > 0 ? `, ${unread} sin leer` : ""}`}
        aria-expanded={open}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-bank-gold px-1 text-[10px] font-bold text-bank-navy">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-bank-navy">Notificaciones</h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsRead(userId)}
                className="text-xs font-medium text-bank-navy hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              Sin notificaciones
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    to={`/contratos/${n.contractId}`}
                    onClick={() => handleNotificationClick(n.id)}
                    className={`block px-4 py-3 text-sm hover:bg-slate-50 ${
                      n.read ? "text-slate-600" : "bg-amber-50/50 font-medium text-slate-800"
                    }`}
                  >
                    <p>{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(n.createdAt).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <p className="border-t border-slate-100 px-4 py-2 text-center text-[10px] text-slate-400">
            Notificaciones simuladas — prototipo
          </p>
        </div>
      )}
    </div>
  );
}
