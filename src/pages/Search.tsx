import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link, useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000`;

type Entry = {
  id: number;
  type: 'ban' | 'mute' | 'kick';
  player: string;
  reason: string;
  image_url?: string | null;
  created_at: string;
  issuer?: string;
  expires_at?: string | null;
  duration?: string | null;
  active?: boolean | null;
};

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState<string>(params.get('q') || '');
  const [bans, setBans] = useState<Entry[]>([]);
  const [mutes, setMutes] = useState<Entry[]>([]);
  const [kicks, setKicks] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  const toImageSrc = (u?: string | null) => {
    if (!u) return "";
    return u.startsWith("http") ? u : `${API}${u}`;
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [rb, rm, rk] = await Promise.all([
          fetch(`${API}/api/public/bans`).then(r => r.json()),
          fetch(`${API}/api/public/mutes`).then(r => r.json()),
          fetch(`${API}/api/public/kicks`).then(r => r.json()),
        ]);
        if (!Array.isArray(rb) || !Array.isArray(rm) || !Array.isArray(rk)) {
          throw new Error('Ma\'lumotni yuklashda xatolik');
        }
        setBans(rb.map((x: any) => ({ ...x, type: 'ban' })));
        setMutes(rm.map((x: any) => ({ ...x, type: 'mute' })));
        setKicks(rk.map((x: any) => ({ ...x, type: 'kick' })));
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Tarmoq xatosi");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q) setParams({ q });
    else setParams({});
  }, [query, setParams]);

  const filterByQuery = (list: Entry[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(e => e.player.toLowerCase().includes(q));
  };

  const bansFiltered = useMemo(() => filterByQuery(bans), [bans, query]);
  const mutesFiltered = useMemo(() => filterByQuery(mutes), [mutes, query]);
  const kicksFiltered = useMemo(() => filterByQuery(kicks), [kicks, query]);

  const formatRemaining = (expires_at?: string | null) => {
    if (!expires_at) return null;
    const ms = new Date(expires_at).getTime() - now;
    if (ms <= 0) return 'Tugadi';
    let s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    const parts: string[] = [];
    if (d) parts.push(`${d} kun`);
    if (h) parts.push(`${h} soat`);
    if (m) parts.push(`${m} daqiqa`);
    parts.push(`${s} sekund`);
    return parts.join(' ');
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="container mx-auto p-6 pt-24 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Qidiruv</h1>
          <Link to="/bytemc" className="text-sm text-crypto-purple hover:underline">Bosh sahifa</Link>
        </div>

        <div className="mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidirmoqchi bolgan nickizni yozing"
            className="w-full md:w-1/2 px-4 py-2 rounded border border-gray-700 bg-gray-900 text-white"
          />
          <p className="text-xs text-gray-400 mt-1">Ban, Mute va Kick ichidan izlaydi.</p>
        </div>

        {loading && <p>Yuklanmoqda...</p>}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-900/50 text-red-200 border border-red-800">
            Xatolik: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold mb-3">Banlar</h2>
              {bansFiltered.length === 0 ? (
                <p className="text-sm text-gray-400">Hech narsa topilmadi</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bansFiltered.map(e => (
                    <div key={`ban-${e.id}`} className="punish-card punish-ban rounded p-4 bg-card">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded text-white bg-red-600/90 text-[10px] tracking-wide">BAN</span>
                          <p className="font-semibold break-words">{e.player}</p>
                          {(() => {
                            const byExpire = e.expires_at ? (new Date(e.expires_at).getTime() > now) : true;
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
                          <div><span className="text-gray-500">Tugaydi:</span> {e.expires_at ? formatRemaining(e.expires_at) : 'Doimiy'}</div>
                        </div>
                      </div>
                      <p className="mt-2 break-words">Sabab: {e.reason}</p>
                      {e.image_url && (
                        <img src={toImageSrc(e.image_url)} alt="Dalil" className="mt-3 w-full max-h-64 object-cover rounded border border-gray-700" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Mutelar</h2>
              {mutesFiltered.length === 0 ? (
                <p className="text-sm text-gray-400">Hech narsa topilmadi</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mutesFiltered.map(e => (
                    <div key={`mute-${e.id}`} className="punish-card punish-mute rounded p-4 bg-card">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded text-white bg-yellow-600/90 text-[10px] tracking-wide">MUTE</span>
                          <p className="font-semibold break-words">{e.player}</p>
                        </div>
                        <div className="text-[11px] text-gray-400 text-right leading-4">
                          {e.issuer && (
                            <div><span className="text-gray-500">Kim tomonidan:</span> {e.issuer.toLowerCase() === 'console' ? 'Konsol' : e.issuer}</div>
                          )}
                          <div><span className="text-gray-500">Sana:</span> {new Date(e.created_at).toLocaleString()}</div>
                          <div><span className="text-gray-500">Tugaydi:</span> {e.expires_at ? formatRemaining(e.expires_at) : 'Doimiy'}</div>
                        </div>
                      </div>
                      <p className="mt-2 break-words">Sabab: {e.reason}</p>
                      {e.image_url && (
                        <img src={toImageSrc(e.image_url)} alt="Dalil" className="mt-3 w-full max-h-64 object-cover rounded border border-gray-700" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Kicklar</h2>
              {kicksFiltered.length === 0 ? (
                <p className="text-sm text-gray-400">Hech narsa topilmadi</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {kicksFiltered.map(e => (
                    <div key={`kick-${e.id}`} className="punish-card punish-kick rounded p-4 bg-card">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 rounded text-white bg-blue-600/90 text-[10px] tracking-wide">KICK</span>
                          <p className="font-semibold break-words">{e.player}</p>
                        </div>
                        <div className="text-[11px] text-gray-400 text-right leading-4">
                          {e.issuer && (
                            <div><span className="text-gray-500">Kim tomonidan:</span> {e.issuer.toLowerCase() === 'console' ? 'Konsol' : e.issuer}</div>
                          )}
                          <div><span className="text-gray-500">Sana:</span> {new Date(e.created_at).toLocaleString()}</div>
                          <div><span className="text-gray-500">Tugaydi:</span> —</div>
                        </div>
                      </div>
                      <p className="mt-2 break-words">Sabab: {e.reason}</p>
                      {e.image_url && (
                        <img src={toImageSrc(e.image_url)} alt="Dalil" className="mt-3 w-full max-h-64 object-cover rounded border border-gray-700" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}