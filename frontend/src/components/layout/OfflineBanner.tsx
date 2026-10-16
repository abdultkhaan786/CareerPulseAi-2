import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  if (online) return null;
  return (
    <div role="status" className="sticky top-0 z-[55] flex items-center justify-center gap-2 bg-ember px-4 py-2 text-sm font-medium text-white">
      <WifiOff className="h-4 w-4" aria-hidden />
      You're offline. Showing the last data loaded; changes can't be saved until you reconnect.
    </div>
  );
}
