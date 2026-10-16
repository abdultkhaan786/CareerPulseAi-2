import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type Tone = "success" | "error" | "info";
interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: Tone;
}
type Push = (t: { title: string; description?: string; tone?: Tone }) => void;

const ToastContext = createContext<Push>(() => {});
let seq = 0;

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const ACCENT = { success: "text-signal-bright", error: "text-[#F4707C]", info: "text-[#8C98F5]" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);

  const push = useCallback<Push>(
    ({ title, description, tone = "success" }) => {
      const id = ++seq;
      setToasts(t => [...t.slice(-3), { id, title, description, tone }]);
      setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3800);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:w-[360px]"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map(t => {
          const Icon = ICONS[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full animate-rise items-start gap-3 rounded-xl border border-white/10 bg-night px-4 py-3 text-white shadow-lift"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ACCENT[t.tone]}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{t.title}</p>
                {t.description && <p className="mt-0.5 text-sm text-night-ink">{t.description}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="-mr-1 rounded p-1 text-night-ink hover:bg-white/10 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
