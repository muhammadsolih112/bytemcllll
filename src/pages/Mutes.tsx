import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000`;

type Entry = {
  id: number;
  player: string;
  reason: string;
  image_url?: string | null;
  created_at: string;
  issuer?: string;
  expires_at?: string | null;
  duration?: string | null;
  active?: boolean | null;
};

export default function Mutes() {
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [query, setQuery] = useState<string>("");
  const [now, setNow] = useState<number>(() => Date.now());
  const toImageSrc = (u?: string | null) => {
    if (!u) return "";
    return u.startsWith("http") ? u : `${API}${u}`;
  };

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(e => e.player.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/public/mutes`);
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          setError((data && (data.error || data.details)) || "Ma'lumotni yuklashda xatolik");
          setItems([]);
        } else {
          setItems(data);
        }
      } catch (e: any) {
        setError(e?.message || "Tarmoq xatosi");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Tick every second to update countdowns and auto-hide expired mutes
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatRemaining = (expires_at?: string | null) => {
    if (!expires_at) return null;
    const ms = new Date(expires_at).getTime() - now;
    if (ms <= 0) return "Tugadi";
    let s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    const parts: string[] = [];
    if (d) parts.push(`${d} kun`);
    if (h) parts.push(`${h} soat`);
    if (m) parts.push(`${m} daqiqa`);
    parts.push(`${s} sekund`);
    return parts.join(" ");
  };

  // Show all mutes (including expired/unmuted) as history

  const displayReason = (entry: Entry) => {
    const raw = (entry.reason || "").trim();
    const isSababsiz = raw === "" || raw.toLowerCase() === "sababsiz";
    if (!isSababsiz) return entry.reason;
    const nowMs = Date.now();
    const byExpire = entry.expires_at ? (new Date(entry.expires_at).getTime() > nowMs) : true;
    const isActive = (typeof entry.active === 'boolean') ? (entry.active && byExpire) : byExpire;
    return isActive ? 'Faol' : 'Tugadi';
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="container mx-auto p-6 pt-24 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mute'lar ro'yxati</h1>
          <Link to="/bytemc" className="text-sm text-crypto-purple hover:underline">Bosh sahifa</Link>
        </div>
        <div className="mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O'yinchi qidirish"
            className="w-full md:w-1/2 px-4 py-2 rounded border border-gray-700 bg-gray-900 text-white"
          />
        </div>
        {loading && <p>Yuklanmoqda...</p>}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-900/50 text-red-200 border border-red-800">
            Xatolik: {error}
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((e) => (
            <div
              key={e.id}
              className="punish-card punish-mute rounded p-4 bg-card cursor-pointer transition"
              onClick={() => setSelected(e)}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded text-white bg-yellow-600/90 text-[10px] tracking-wide">MUTE</span>
                  <p className="font-semibold break-words">{e.player}</p>
                  {(() => {
                    const nowMs = Date.now();
                    const byExpire = e.expires_at ? (new Date(e.expires_at).getTime() > nowMs) : true;
                    const isActive = (((typeof e.active === 'boolean') ? e.active : true) && byExpire);
                    return (
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] tracking-wide border ${isActive ? 'bg-green-600/80 border-green-500 text-white' : 'bg-red-700/80 border-red-500 text-white'}`}>
                        {isActive ? 'Faol' : 'Tugadi'}
                      </span>
                    );
                  })()}
                </div>
                <div className="text-[11px] text-gray-400 text-right leading-4">
                  {e.issuer && (
                    <div><span className="text-gray-500">Kim tomonidan:</span> {e.issuer.toLowerCase() === 'console' ? 'Konsol' : e.issuer}</div>
                  )}
                  <div><span className="text-gray-500">Sana:</span> {new Date(e.created_at).toLocaleString()}</div>
                  <div>
                    <span className="text-gray-500">Tugaydi:</span> {e.expires_at ? formatRemaining(e.expires_at) : 'Doimiy'}
                  </div>
                </div>
              </div>
              <p className="mt-2 break-words">Sabab: {displayReason(e)}</p>
              {e.image_url && (
                <img
                  src={toImageSrc(e.image_url)}
                  alt="Dalil"
                  loading="lazy"
                  onError={(ev) => { ev.currentTarget.style.display = "none"; }}
                  className="mt-3 w-full max-h-64 object-cover rounded border border-gray-700"
                />
              )}
            </div>
          ))}
        </div>
        {selected && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-card rounded shadow-lg max-w-lg w-full p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded text-white bg-yellow-600/90 text-[10px] tracking-wide">MUTE</span>
                  <h3 className="text-lg font-semibold break-words">{selected.player}</h3>
                  {(() => {
                    const nowMs = Date.now();
                    const byExpire = selected.expires_at ? (new Date(selected.expires_at).getTime() > nowMs) : true;
                    const isActive = (((typeof selected.active === 'boolean') ? selected.active : true) && byExpire);
                    return (
                      <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] tracking-wide border ${isActive ? 'bg-green-600/80 border-green-500 text-white' : 'bg-red-700/80 border-red-500 text-white'}`}>
                        {isActive ? 'Faol' : 'Tugadi'}
                      </span>
                    );
                  })()}
                </div>
                <div className="text-[11px] text-gray-400 text-right leading-4">
                  {selected.issuer && (
                    <div><span className="text-gray-500">Kim tomonidan:</span> {selected.issuer.toLowerCase() === 'console' ? 'Konsol' : selected.issuer}</div>
                  )}
                  <div><span className="text-gray-500">Sana:</span> {new Date(selected.created_at).toLocaleString()}</div>
                  <div>
                    <span className="text-gray-500">Tugaydi:</span> {selected.expires_at ? formatRemaining(selected.expires_at) : 'Doimiy'}
                  </div>
                </div>
              </div>
              <p className="mt-2 break-words">Sabab: {displayReason(selected)}</p>
              {selected.image_url && (
                <img
                  src={toImageSrc(selected.image_url)}
                  alt="Dalil"
                  loading="lazy"
                  onError={(ev) => { ev.currentTarget.style.display = 'none'; }}
                  className="mt-3 w-full max-h-[60vh] object-contain rounded border border-gray-700"
                />
              )}
              <button className="mt-4 bg-blue-600 text-white px-3 py-2 rounded w-full" onClick={() => setSelected(null)}>Yopish</button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}