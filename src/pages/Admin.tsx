import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000`;

type Entry = {
  id: number;
  type: "ban" | "mute" | "kick";
  player: string;
  reason: string;
  image_url?: string | null;
  created_at: string;
  issuer?: string;
};

export default function Admin() {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const [loggedUser, setLoggedUser] = useState<string>("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toImageSrc = (u?: string | null) => {
    if (!u) return "";
    return u.startsWith("http") ? u : `${API}${u}`;
  };

  const fetchEntries = async () => {
    try {
      setError(null);
      const [rb, rm, rk] = await Promise.all([
        fetch(`${API}/api/public/bans`),
        fetch(`${API}/api/public/mutes`),
        fetch(`${API}/api/public/kicks`),
      ]);
      const [bans, mutes, kicks] = await Promise.all([rb.json(), rm.json(), rk.json()]);
      if (!rb.ok || !Array.isArray(bans)) throw new Error((bans && (bans.error || bans.details)) || "Banlar yuklanmadi");
      if (!rm.ok || !Array.isArray(mutes)) throw new Error((mutes && (mutes.error || mutes.details)) || "Mutelar yuklanmadi");
      if (!rk.ok || !Array.isArray(kicks)) throw new Error((kicks && (kicks.error || kicks.details)) || "Kicklar yuklanmadi");
      setEntries([...bans, ...mutes, ...kicks].sort((a: Entry, b: Entry) => (a.created_at < b.created_at ? 1 : -1)));
    } catch (e: any) {
      setEntries([]);
      const msg = String(e?.message || e);
      if (msg.toLowerCase().includes("failed to fetch")) {
        setError(`API ga ulanib bo'lmadi: ${API}. Backend ishga tushganmi? Firewall port 4000 ni bloklamaganmi?`);
      } else {
        setError(msg);
      }
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setToken(data.token);
      setRole(String(data.role || ""));
      setLoggedUser(String(data.username || username));
    } catch (err: any) {
      const msg = String(err?.message || err);
      // Provide clearer guidance for common network/CORS issues
      if (msg.toLowerCase().includes("failed to fetch")) {
        setError(`API ga ulanib bo'lmadi: ${API}. Backend ishga tushganmi? Windows Firewall port 4000 ni bloklamaganmi?`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitProof = async (e: Entry, form: HTMLFormElement) => {
    const fd = new FormData(form);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/proof/${e.type}/${e.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Proof upload failed");
      await fetchEntries();
      form.reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitEntry = async (type: "ban" | "mute" | "kick", form: HTMLFormElement) => {
    const fd = new FormData(form);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/admin/${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      await fetchEntries();
      form.reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/entry/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await fetchEntries();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <Navbar />
        <div className="container mx-auto max-w-xl p-6 pt-24 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <Link to="/bytemc" className="text-sm text-crypto-purple hover:underline">Bosh sahifa</Link>
          </div>
          <form onSubmit={login} className="space-y-4">
            <input className="w-full border border-gray-300 bg-white text-black placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-2 focus:ring-crypto-purple" placeholder="Login" value={username} onChange={e => setUsername(e.target.value)} />
            <input className="w-full border border-gray-300 bg-white text-black placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-2 focus:ring-crypto-purple" type="password" placeholder="Parol" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
              Kirish
            </button>
            {error && <p className="text-red-500">{error}</p>}
          </form>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="container mx-auto p-6 pt-24 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <Link to="/bytemc" className="text-sm text-crypto-purple hover:underline">Bosh sahifa</Link>
            <button className="text-sm underline" onClick={() => { setToken(null);} }>Chiqish</button>
          </div>
        </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Role-based forms */}
      <div className="grid md:grid-cols-3 gap-8">
        {(role === "moderator" || role === "admin") && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Ban qo'shish</h2>
            <form onSubmit={(e) => { e.preventDefault(); submitEntry("ban", e.currentTarget); }} className="space-y-3">
              <input name="player" className="w-full border border-gray-300 bg-white text-black placeholder-gray-500 p-2 rounded" placeholder="O'yinchi" />
              <input name="reason" className="w-full border border-gray-300 bg-white text-black placeholder-gray-500 p-2 rounded" placeholder="Sabab" />
              <input name="image" type="file" className="w-full border border-gray-300 bg-white text-black p-2 rounded" accept="image/*" />
              <button className="bg-red-600 text-white px-4 py-2 rounded" disabled={loading}>Ban qo'shish</button>
            </form>
          </div>
        )}

        {(role === "helper" || role === "moderator" || role === "admin") && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Mute qo'shish</h2>
            <form onSubmit={(e) => { e.preventDefault(); submitEntry("mute", e.currentTarget); }} className="space-y-3">
              <input name="player" className="w-full border border-gray-300 bg-white text-black placeholder-gray-500 p-2 rounded" placeholder="O'yinchi" />
              <input name="reason" className="w-full border border-gray-300 bg-white text-black placeholder-gray-500 p-2 rounded" placeholder="Sabab" />
              <input name="image" type="file" className="w-full border border-gray-300 bg-white text-black p-2 rounded" accept="image/*" />
              <button className="bg-yellow-600 text-white px-4 py-2 rounded" disabled={loading}>Mute qo'shish</button>
            </form>
          </div>
        )}

        {(role === "moderator" || role === "admin") && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Kick qo'shish</h2>
            <form onSubmit={(e) => { e.preventDefault(); submitEntry("kick", e.currentTarget); }} className="space-y-3">
              <input name="player" className="w-full border border-gray-300 bg-white text-black placeholder-gray-500 p-2 rounded" placeholder="O'yinchi" />
              <input name="reason" className="w-full border border-gray-300 bg-white text-black placeholder-gray-500 p-2 rounded" placeholder="Sabab" />
              <input name="image" type="file" className="w-full border border-gray-300 bg-white text-black p-2 rounded" accept="image/*" />
              <button className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>Kick qo'shish</button>
            </form>
          </div>
        )}
      </div>

        <h2 className="text-xl font-semibold mt-8 mb-2">So'ngi yozuvlar</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((e) => (
            <div key={e.id} className="border rounded p-4 flex items-start gap-4 bg-card animate-fade-in shadow-sm">
              <span className={`px-2 py-1 rounded text-white text-xs ${e.type === 'ban' ? 'bg-red-600' : e.type === 'mute' ? 'bg-yellow-600' : 'bg-blue-600'}`}>{e.type.toUpperCase()}</span>
              <div className="flex-1">
                <p className="font-semibold break-words">{e.player}</p>
                <p className="text-xs text-gray-500 break-words">{new Date(e.created_at).toLocaleString()} — {e.reason}</p>
                {e.issuer && <p className="text-xs text-gray-400 mt-1">Kim tomonidan: {e.issuer}</p>}
                {e.image_url && (
                  <img
                    src={toImageSrc(e.image_url)}
                    alt="Dalil"
                    loading="lazy"
                    onError={(ev) => { ev.currentTarget.style.display = 'none'; }}
                    className="mt-3 w-full max-h-40 object-cover rounded border border-gray-700"
                  />
                )}
                {(
                  role === 'admin' ||
                  role === 'moderator' ||
                  (role === 'helper' && e.type === 'mute')
                ) && (
                  <form onSubmit={(ev) => { ev.preventDefault(); submitProof(e, ev.currentTarget); }} className="mt-3 flex items-center gap-2">
                    <input name="image" type="file" accept="image/*" className="text-sm" />
                    <button className="text-sm bg-crypto-purple text-white px-2 py-1 rounded" disabled={loading}>Dalil qo'shish</button>
                  </form>
                )}
              </div>
              {role === 'admin' && (
                <button className="text-sm text-red-600" onClick={() => del(e.id)}>O'chirish</button>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}