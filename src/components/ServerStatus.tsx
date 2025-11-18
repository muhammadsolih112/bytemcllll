import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

type Status = {
  host: string;
  port: number;
  onlinePlayers: number;
  maxPlayers: number;
  totalSeen: number;
};

export default function ServerStatus() {
  const [data, setData] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/server/status`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Status error");
        setData(json);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <div className="w-full bg-slate-900 text-white py-6">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Minecraft Server: bytemc.uz</h3>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        {data ? (
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-bold">Online: </span>
              {data.onlinePlayers}/{data.maxPlayers}
            </div>
            <div>
              <span className="font-bold">Umumiy kirganlar (taxminiy): </span>
              {data.totalSeen}
            </div>
          </div>
        ) : (
          <p>Holat yuklanmoqda...</p>
        )}
      </div>
    </div>
  );
}