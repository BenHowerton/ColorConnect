import React, { useEffect, useMemo, useRef, useState } from "react";
import logo from "./assets/radiance-logo.svg";

// ColorConnect – Simple, demo‑ready web prototype for 55+ communities
// Core goals
//  • Instantly see who is open (green) with photo, short bio, and "New Resident" badge
//  • Tap a person to send a private in‑app message (mocked, persisted in localStorage)
//  • No personal contact info exposed
//  • Big, readable UI with plain language
//  • Zero backend required — perfect for demos & quick user testing

// —————— Utilities & types ——————
type Resident = {
  id: string;
  name: string;
  photo?: string;
  bio: string;
  newResident: boolean;
  green: boolean; // wristband status
};

type HealthSnapshot = {
  heartRate: number;
  spo2: number;
  steps: number;
  battery: number;
  lastSync: number;
  watchOnline: boolean;
};

type Message = { id: string; fromMe: boolean; text: string; ts: number };

type ThreadMap = Record<string, Message[]>;

const LS_THREADS = "cc_threads_v1";
const LS_MYSTATUS = "cc_mystatus_v1";

const loadThreads = (): ThreadMap => {
  try {
    const raw = localStorage.getItem(LS_THREADS);
    return raw ? (JSON.parse(raw) as ThreadMap) : {};
  } catch {
    return {};
  }
};

const saveThreads = (t: ThreadMap) => {
  try {
    localStorage.setItem(LS_THREADS, JSON.stringify(t));
  } catch {}
};

const loadMyStatus = () => {
  try {
    const raw = localStorage.getItem(LS_MYSTATUS);
    return raw ? JSON.parse(raw) === true : true; // default ON to encourage trials
  } catch {
    return true;
  }
};

const saveMyStatus = (on: boolean) => {
  try {
    localStorage.setItem(LS_MYSTATUS, JSON.stringify(on));
  } catch {}
};

const BRAND_COLORS = {
  primary: "#3F8A6B",
  glow: "#9DD7AB",
  deep: "#1F4D3A",
  mist: "#EFF7F2",
};

// Avatar helper (placeholder initial if missing)
const Avatar = ({ src, alt }: { src?: string; alt: string }) => (
  <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
    {src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    ) : (
      <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
        {alt.charAt(0)}
      </div>
    )}
  </div>
);

const StatusPill = ({ on }: { on: boolean }) => (
  <span
    className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs border select-none ${
      on
        ? "bg-green-100 text-green-800 border-green-200"
        : "bg-gray-100 text-gray-600 border-gray-200"
    }`}
  >
    <span className={`h-2.5 w-2.5 rounded-sm ${on ? "bg-green-500" : "bg-gray-300"}`} />
    {on ? "Open to connect" : "Not currently"}
  </span>
);

const NewBadge = () => (
  <span className="ml-2 text-[10px] uppercase tracking-wide font-semibold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
    New resident
  </span>
);

// —————— Mock directory data ——————
const MOCK_RESIDENTS: Resident[] = [
  { id: "1", name: "Cathy M.", bio: "Pickleball, gardening, morning walks.", newResident: true, green: true },
  { id: "2", name: "Ron H.", bio: "Chess club, woodworking, classic rock.", newResident: false, green: false },
  { id: "3", name: "Irene M.", bio: "Bible study, quilting, tea socials.", newResident: true, green: true },
  { id: "4", name: "Luis P.", bio: "Cycling, travel stories, coffee chats.", newResident: false, green: true },
  { id: "5", name: "Bev K.", bio: "Book club, birding, volunteer events.", newResident: false, green: false },
  { id: "6", name: "Samir A.", bio: "Photography, tech help, documentaries.", newResident: false, green: true },
  { id: "7", name: "Alice T.", bio: "Cards night, scrapbooking, baking.", newResident: true, green: false },
  { id: "8", name: "George W.", bio: "Fishing, handyman tips, history.", newResident: false, green: false },
  { id: "9", name: "Nina R.", bio: "Yoga, farmers market, piano.", newResident: false, green: true },
  { id: "10", name: "Harold J.", bio: "Model trains, trivia, BBQs.", newResident: false, green: false },
  { id: "11", name: "Pat S.", bio: "Walking group, cinema, puzzles.", newResident: true, green: true },
  { id: "12", name: "Kim F.", bio: "Art class, museums, brunch.", newResident: false, green: false },
];

const MOCK_HEALTH: Record<string, HealthSnapshot> = {
  "1": { heartRate: 68, spo2: 98, steps: 3200, battery: 82, lastSync: Date.now() - 2 * 60 * 1000, watchOnline: true },
  "2": { heartRate: 74, spo2: 97, steps: 2100, battery: 56, lastSync: Date.now() - 8 * 60 * 1000, watchOnline: true },
  "3": { heartRate: 63, spo2: 99, steps: 4500, battery: 91, lastSync: Date.now() - 1 * 60 * 1000, watchOnline: true },
  "4": { heartRate: 70, spo2: 98, steps: 5200, battery: 67, lastSync: Date.now() - 3 * 60 * 1000, watchOnline: true },
  "5": { heartRate: 82, spo2: 95, steps: 1200, battery: 44, lastSync: Date.now() - 30 * 60 * 1000, watchOnline: false },
  "6": { heartRate: 61, spo2: 99, steps: 6400, battery: 73, lastSync: Date.now() - 5 * 60 * 1000, watchOnline: true },
  "7": { heartRate: 77, spo2: 96, steps: 2800, battery: 59, lastSync: Date.now() - 7 * 60 * 1000, watchOnline: true },
  "8": { heartRate: 71, spo2: 98, steps: 1900, battery: 38, lastSync: Date.now() - 12 * 60 * 1000, watchOnline: false },
  "9": { heartRate: 65, spo2: 99, steps: 7200, battery: 84, lastSync: Date.now() - 90 * 1000, watchOnline: true },
  "10": { heartRate: 88, spo2: 95, steps: 900, battery: 33, lastSync: Date.now() - 40 * 60 * 1000, watchOnline: false },
  "11": { heartRate: 69, spo2: 98, steps: 5400, battery: 79, lastSync: Date.now() - 4 * 60 * 1000, watchOnline: true },
  "12": { heartRate: 72, spo2: 97, steps: 2500, battery: 62, lastSync: Date.now() - 6 * 60 * 1000, watchOnline: true },
};

// —————— Messaging hook (mock + persistence) ——————
function useMessageStore() {
  const [threads, setThreads] = useState<ThreadMap>(() => loadThreads());
  useEffect(() => saveThreads(threads), [threads]);

  const send = (residentId: string, text: string) => {
    const msg: Message = {
      id: Math.random().toString(36).slice(2),
      fromMe: true,
      text,
      ts: Date.now(),
    };
    setThreads((prev) => ({ ...prev, [residentId]: [...(prev[residentId] || []), msg] }));
  };

  // for demo: add auto‑reply once per thread
  const repliedRef = useRef<Record<string, boolean>>({});

  const maybeAutoReply = (residentId: string) => {
    if (repliedRef.current[residentId]) return;
    repliedRef.current[residentId] = true;
    setTimeout(() => {
      setThreads((prev) => ({
        ...prev,
        [residentId]: [
          ...(prev[residentId] || []),
          {
            id: Math.random().toString(36).slice(2),
            fromMe: false,
            text: "Thanks for reaching out! I'd love to connect.",
            ts: Date.now(),
          },
        ],
      }));
    }, 600);
  };

  return { threads, send, maybeAutoReply };
}

// —————— Profile Drawer ——————
function ProfileDrawer({
  person,
  onClose,
  thread,
  onSend,
  onQuickInvite,
}: {
  person: Resident | null;
  onClose: () => void;
  thread: Message[];
  onSend: (text: string) => void;
  onQuickInvite: () => void;
}) {
  const [text, setText] = useState("");
  if (!person) return null;

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={`Conversation with ${person.name}`}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[460px] bg-white shadow-2xl p-4 sm:p-6 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar alt={person.name} />
            <div>
              <div className="font-semibold text-lg">{person.name}</div>
              <div className="text-sm text-gray-500">{person.bio}</div>
              <div className="mt-2 flex items-center gap-2">
                <StatusPill on={person.green} />
                {person.newResident && <NewBadge />}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100"
            aria-label="Close messages"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 border-t" />

        <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
          {thread.length === 0 ? (
            <div className="text-sm text-gray-500">
              Start a private, in‑app conversation. Your phone number and email are never shared.
            </div>
          ) : (
            thread.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.fromMe ? "ml-auto bg-blue-100" : "bg-gray-100"}`}
              >
                {m.text}
                <div className="text-[10px] text-gray-500 mt-1">{new Date(m.ts).toLocaleTimeString()}</div>
              </div>
            ))
          )}
        </div>

        <div className="mt-2 flex gap-2 flex-wrap">
          <button
            onClick={() => onQuickInvite()}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-sm hover:bg-emerald-700"
          >
            Invite to coffee ☕
          </button>
          <button
            onClick={() => setText((t) => t + (t ? " " : "") + "Are you free for a walk this afternoon?")}
            className="px-3 py-1.5 rounded-xl bg-gray-200 text-sm hover:bg-gray-300"
          >
            Quick reply: Walk
          </button>
          <button
            onClick={() => setText((t) => t + (t ? " " : "") + "Would you like to join the game night tonight?")}
            className="px-3 py-1.5 rounded-xl bg-gray-200 text-sm hover:bg-gray-300"
          >
            Quick reply: Game night
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = text.trim();
            if (!val) return;
            onSend(val);
            setText("");
          }}
          className="mt-3 flex gap-2"
        >
          <label className="sr-only" htmlFor="msg">Message</label>
          <input
            id="msg"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message ${person.name}`}
            className="flex-1 border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button type="submit" className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// —————— Activity Invite Modal (demo only) ——————
function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("Coffee at the courtyard at 10:30am today. All are welcome!");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Create invite">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 top-[10%] mx-auto w-[min(560px,92%)] bg-white rounded-2xl p-4 sm:p-6 shadow-2xl">
        <h3 className="text-lg font-semibold">New Activity Invite</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="mt-3 w-full border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-emerald-300"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button
            onClick={() => { alert("Invite posted to community feed (demo)"); onClose(); }}
            className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Post Invite
          </button>
        </div>
      </div>
    </div>
  );
}

// —————— Admin dashboard (demo only) ——————
function AdminPanel({
  open,
  onClose,
  people,
  health,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  people: Resident[];
  health: Record<string, HealthSnapshot>;
  onRefresh: () => void;
}) {
  const [email, setEmail] = useState("admin@radiance.com");
  const [password, setPassword] = useState("connect123");
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);

  if (!open) return null;

  const onlineCount = Object.values(health).filter((h) => h.watchOnline).length;
  const batteryLow = Object.values(health).filter((h) => h.battery < 40).length;
  const greens = people.filter((p) => p.green).length;

  const authenticate = () => {
    if (email.trim().toLowerCase() === "admin@radiance.com" && password === "connect123") {
      setAuthed(true);
      setError("");
    } else {
      setError("Demo credentials are admin@radiance.com / connect123");
    }
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Admin portal">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full sm:w-[520px] bg-white shadow-2xl p-4 sm:p-6 overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase font-semibold text-gray-500">Admin portal</div>
            <h2 className="text-xl font-bold text-gray-900">Smart watch oversight</h2>
            <p className="text-sm text-gray-600 mt-1">
              Live vitals streamed from each Radiance wrist device. The green light shown on the watch is mirrored
              here so admins can see who is open to connect.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100" aria-label="Close admin panel">
            ✕
          </button>
        </div>

        {!authed ? (
          <div className="mt-4 space-y-3 bg-[#f6fbf8] border border-[#d9eade] rounded-2xl p-4">
            <div className="text-sm text-gray-700 font-semibold">Demo login</div>
            <label className="block text-sm text-gray-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border rounded-xl px-3 py-2"
              />
            </label>
            <label className="block text-sm text-gray-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border rounded-xl px-3 py-2"
              />
            </label>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Use the provided credentials to enter the admin demo.</div>
              <button
                onClick={authenticate}
                className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow"
              >
                Sign in
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border bg-[#eff7f2] p-3">
                <div className="text-xs text-gray-500 uppercase font-semibold">Watches online</div>
                <div className="text-2xl font-bold text-emerald-700">{onlineCount} / {people.length}</div>
                <p className="text-xs text-gray-600 mt-1">Green light confirms each online watch is ready to send vitals.</p>
              </div>
              <div className="rounded-2xl border bg-white p-3">
                <div className="text-xs text-gray-500 uppercase font-semibold">Open to connect</div>
                <div className="text-2xl font-bold text-emerald-700">{greens}</div>
                <p className="text-xs text-gray-600 mt-1">Matches the wristband's green indicator for quick oversight.</p>
              </div>
              <div className="rounded-2xl border bg-white p-3">
                <div className="text-xs text-gray-500 uppercase font-semibold">Battery warnings</div>
                <div className="text-2xl font-bold text-amber-600">{batteryLow}</div>
                <p className="text-xs text-gray-600 mt-1">Below 40% and worth reminding during rounds.</p>
              </div>
              <div className="rounded-2xl border bg-white p-3">
                <div className="text-xs text-gray-500 uppercase font-semibold">Last refresh</div>
                <div className="text-2xl font-bold text-gray-900">{new Date().toLocaleTimeString()}</div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <button
                    onClick={onRefresh}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-700"
                  >
                    Pull newest vitals
                  </button>
                  <span className="text-gray-500">Simulates the watch sync event.</span>
                </div>
              </div>
            </div>

            <div className="text-sm font-semibold text-gray-700">Resident watches</div>
            <div className="rounded-2xl border overflow-hidden">
              <div className="grid grid-cols-5 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-2">
                <div className="col-span-2">Resident</div>
                <div>Vitals</div>
                <div>Battery</div>
                <div>Last sync</div>
              </div>
              <div className="divide-y">
                {people.map((p) => {
                  const stats = health[p.id];
                  return (
                    <div key={p.id} className="grid grid-cols-5 items-center px-3 py-3 text-sm">
                      <div className="col-span-2 flex items-center gap-2 min-w-0">
                        <Avatar alt={p.name} />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{p.name}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <StatusPill on={p.green} />
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${
                              stats?.watchOnline ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"
                            }`}>
                              ⌚ {stats?.watchOnline ? "Watch online" : "Sync needed"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-700 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                          HR {stats?.heartRate} bpm
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                          SpO₂ {stats?.spo2}%
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-purple-500" />
                          Steps {stats?.steps.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-xs">
                        <div className={`font-semibold ${stats?.battery < 40 ? "text-amber-700" : "text-emerald-700"}`}>
                          {stats?.battery}%
                        </div>
                        <div className="text-gray-500">Battery</div>
                      </div>
                      <div className="text-xs text-gray-700">
                        <div>{formatSyncTime(stats?.lastSync)}</div>
                        <div className="text-gray-500">{stats?.watchOnline ? "Streaming" : "Awaiting contact"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const formatSyncTime = (ts?: number) => {
  if (!ts) return "No data";
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  return `${mins} mins ago`;
};

// —————— Main App ——————
export default function ColorConnectPrototype() {
  const [query, setQuery] = useState("");
  const [greenOnly, setGreenOnly] = useState(true);
  const [newOnly, setNewOnly] = useState(false);
  const [people, setPeople] = useState<Resident[]>(MOCK_RESIDENTS);
  const [active, setActive] = useState<Resident | null>(null);
  const [myGreen, setMyGreen] = useState<boolean>(() => loadMyStatus());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [health, setHealth] = useState<Record<string, HealthSnapshot>>(MOCK_HEALTH);
  const [adminOpen, setAdminOpen] = useState(false);

  const { threads, send, maybeAutoReply } = useMessageStore();

  useEffect(() => saveMyStatus(myGreen), [myGreen]);

  useEffect(() => {
    // The demo opens in admin view so teams can immediately try the portal and smart-watch sync experience.
    setAdminOpen(true);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setHealth((prev) => {
        const next = { ...prev };
        Object.entries(next).forEach(([id, h]) => {
          const drift = (val: number, delta: number, min: number, max: number) => {
            const change = Math.round((Math.random() * delta * 2 - delta) * 10) / 10;
            return Math.min(max, Math.max(min, val + change));
          };
          next[id] = {
            ...h,
            heartRate: drift(h.heartRate, 2, 58, 95),
            spo2: drift(h.spo2, 0.5, 94, 100),
            steps: h.steps + (h.watchOnline ? Math.floor(Math.random() * 120) : 0),
            battery: Math.max(5, h.battery - (h.watchOnline ? Math.random() * 0.8 : Math.random() * 0.3)),
            lastSync: h.watchOnline ? Date.now() : h.lastSync + 60000,
            watchOnline: h.battery > 8 ? h.watchOnline : false,
          };
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const openCount = useMemo(() => people.filter((p) => p.green).length, [people]);
  const newCount = useMemo(() => people.filter((p) => p.newResident).length, [people]);
  const refreshHealth = () =>
    setHealth((prev) => {
      const next = { ...prev };
      Object.entries(next).forEach(([id, h]) => {
        next[id] = {
          ...h,
          heartRate: Math.min(96, Math.max(58, Math.round(h.heartRate + (Math.random() * 6 - 3)))),
          spo2: Math.min(100, Math.max(95, Math.round(h.spo2 + (Math.random() * 2 - 1)))),
          steps: h.steps + (h.watchOnline ? Math.floor(Math.random() * 200) : 0),
          battery: Math.max(5, h.battery - Math.random() * 1.5),
          lastSync: Date.now(),
        };
      });
      return next;
    });

  // sorted: green first, then new residents, then name
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people
      .filter((p) => (greenOnly ? p.green : true))
      .filter((p) => (newOnly ? p.newResident : true))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) || p.bio.toLowerCase().includes(q) : true))
      .slice()
      .sort((a, b) => {
        if (a.green !== b.green) return a.green ? -1 : 1;
        if (a.newResident !== b.newResident) return a.newResident ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [people, query, greenOnly, newOnly]);

  // demo: toggle my wristband (simulates physical toggle)
  const toggleMyGreen = () => setMyGreen((v) => !v);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f2f8f3] to-[#e7f1eb] text-gray-900">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Radiance brand hero */}
        <header className="overflow-hidden rounded-3xl border bg-white/80 shadow-sm backdrop-blur">
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-[auto,1fr] items-center p-4 sm:p-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-white border shadow-inner flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="Radiance logo" className="h-full w-full object-contain" />
              </div>
              <div
                className="absolute inset-[-14px] rounded-full -z-10"
                style={{
                  background: "radial-gradient(circle at 40% 30%, rgba(157,215,171,0.45), transparent 55%)",
                }}
              />
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                <span
                  className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: BRAND_COLORS.mist, color: BRAND_COLORS.deep }}
                >
                  Powered by Radiance
                </span>
                <span className="text-gray-500 normal-case">Simple signals – powerful connections</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">ColorConnect</h1>
                  <p className="text-sm text-gray-600 max-w-2xl">
                    A calm, high-contrast directory that mirrors your wristband status and the green light on your
                    Radiance watch. Tap a neighbor to send a private note without sharing contact details.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 justify-end">
                  <div className="px-3 py-2 rounded-2xl border bg-white/70 shadow-sm">
                    <div className="text-[11px] uppercase font-semibold text-gray-500">My wristband</div>
                    <button
                      onClick={toggleMyGreen}
                      className={`mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition ${
                        myGreen
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-gray-100 border-gray-200 text-gray-600"
                      }`}
                      aria-pressed={myGreen}
                    >
                      <span
                        className={`inline-block h-3 w-3 rounded-sm ${myGreen ? "bg-emerald-500" : "bg-gray-400"}`}
                      />
                      {myGreen ? "Open to connect" : "Not right now"}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-2xl border bg-[#eff7f2] shadow-sm">
                    <div>
                      <div className="text-xs text-gray-500">Open now</div>
                      <div className="font-semibold text-lg" style={{ color: BRAND_COLORS.primary }}>
                        {openCount}
                      </div>
                    </div>
                    <div className="h-10 w-px bg-gray-200" aria-hidden />
                    <div>
                      <div className="text-xs text-gray-500">New neighbors</div>
                      <div className="font-semibold text-lg" style={{ color: BRAND_COLORS.deep }}>
                        {newCount}
                      </div>
                    </div>
                    <button
                      onClick={() => setAdminOpen(true)}
                      className="ml-auto px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow"
                    >
                      Admin login demo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t bg-gradient-to-r from-[#e8f5ed] via-white to-[#e0f0e7] px-4 sm:px-6 py-3 text-sm text-gray-700 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: BRAND_COLORS.mist }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BRAND_COLORS.primary }} />
              Quiet signal tech by Radiance
            </div>
            <span className="text-gray-600">Residents choose when to light up in green. No phone numbers required.</span>
          </div>
        </header>

        {/* Controls */}
        <div className="flex flex-col gap-3 bg-white/80 border rounded-3xl shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 flex items-center gap-2 bg-[#f6fbf8] border border-[#d9eade] rounded-2xl px-3 py-2 shadow-inner">
              <span aria-hidden>🔎</span>
              <label className="sr-only" htmlFor="search">Search by name or interests</label>
              <input
                id="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or interests"
                className="w-full bg-transparent outline-none"
              />
            </div>
            <label className="inline-flex items-center gap-2 select-none bg-[#eff7f2] px-3 py-2 rounded-2xl border text-sm">
              <input type="checkbox" className="h-4 w-4" checked={greenOnly} onChange={(e) => setGreenOnly(e.target.checked)} />
              <span>Show only green</span>
            </label>
            <label className="inline-flex items-center gap-2 select-none bg-[#eff7f2] px-3 py-2 rounded-2xl border text-sm">
              <input type="checkbox" className="h-4 w-4" checked={newOnly} onChange={(e) => setNewOnly(e.target.checked)} />
              <span>Show new residents</span>
            </label>
            <button
              onClick={() => setInviteOpen(true)}
              className="ml-auto px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow"
            >
              Post activity invite
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="px-2 py-1 rounded-full bg-[#eff7f2] border text-[11px] font-semibold">Comfortable typography</span>
            <span className="px-2 py-1 rounded-full bg-[#eff7f2] border text-[11px] font-semibold">Readable cards</span>
            <span className="px-2 py-1 rounded-full bg-[#eff7f2] border text-[11px] font-semibold">Private, local messaging</span>
          </div>
        </div>

        {/* Directory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActive(p);
                maybeAutoReply(p.id);
              }}
              className="text-left bg-white/90 border rounded-2xl p-3 hover:shadow-lg transition-shadow shadow-sm backdrop-blur"
              aria-label={`Open profile for ${p.name}`}
            >
              <div className="flex items-start gap-3">
                <Avatar alt={p.name} />
                <div className="min-w-0">
                  <div className="flex items-center flex-wrap gap-1">
                    <div className="font-semibold truncate mr-2 text-gray-900">{p.name}</div>
                    {p.newResident && <NewBadge />}
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-2">{p.bio}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusPill on={p.green} />
                    <span className="text-[11px] text-gray-500">Tap to chat</span>
                    <span className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ⌚ Watch synced
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 mt-10">No residents match your filters.</div>
        )}
      </div>

      {/* Panels */}
      <ProfileDrawer
        person={active}
        onClose={() => setActive(null)}
        thread={active ? (threads[active.id] || []) : []}
        onSend={(text) => active && send(active.id, text)}
        onQuickInvite={() => alert("Invite sent (demo)")}
      />

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} people={people} health={health} onRefresh={refreshHealth} />

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 py-6">
        Prototype only — messaging is simulated and no personal contact info is shared.
      </footer>
    </div>
  );
}
