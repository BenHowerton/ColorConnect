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

// —————— Main App ——————
export default function ColorConnectPrototype() {
  const [query, setQuery] = useState("");
  const [greenOnly, setGreenOnly] = useState(true);
  const [newOnly, setNewOnly] = useState(false);
  const [people, setPeople] = useState<Resident[]>(MOCK_RESIDENTS);
  const [active, setActive] = useState<Resident | null>(null);
  const [myGreen, setMyGreen] = useState<boolean>(() => loadMyStatus());
  const [inviteOpen, setInviteOpen] = useState(false);

  const { threads, send, maybeAutoReply } = useMessageStore();

  useEffect(() => saveMyStatus(myGreen), [myGreen]);

  const openCount = useMemo(() => people.filter((p) => p.green).length, [people]);
  const newCount = useMemo(() => people.filter((p) => p.newResident).length, [people]);

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
      {/* Mobile app chrome */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-white/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-semibold">
              CC
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Radiance</div>
              <div className="font-semibold text-gray-900">ColorConnect</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            Live prototype
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-28 sm:pb-10">
        {/* Radiance brand hero */}
        <header className="overflow-hidden rounded-3xl border bg-white/90 shadow-sm backdrop-blur">
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
                    A calm, high-contrast directory that mirrors your wristband status. Tap a neighbor to send
                    a private note without sharing contact details.
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
        <div className="flex flex-col gap-3 bg-white/90 border rounded-3xl shadow-sm p-4 sm:p-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-[#f6fbf8] border border-[#d9eade] rounded-2xl px-3 py-2 shadow-inner">
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
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
              <label className="inline-flex items-center gap-2 select-none bg-[#eff7f2] px-3 py-2 rounded-2xl border text-sm whitespace-nowrap">
                <input type="checkbox" className="h-4 w-4" checked={greenOnly} onChange={(e) => setGreenOnly(e.target.checked)} />
                <span>Show only green</span>
              </label>
              <label className="inline-flex items-center gap-2 select-none bg-[#eff7f2] px-3 py-2 rounded-2xl border text-sm whitespace-nowrap">
                <input type="checkbox" className="h-4 w-4" checked={newOnly} onChange={(e) => setNewOnly(e.target.checked)} />
                <span>Show new residents</span>
              </label>
              <button
                onClick={() => setInviteOpen(true)}
                className="ml-auto sm:ml-0 px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow whitespace-nowrap"
              >
                Post activity invite
              </button>
            </div>
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
              className="text-left bg-white/90 border rounded-2xl p-3 hover:-translate-y-0.5 transition shadow-sm hover:shadow-lg backdrop-blur"
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

      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 sm:hidden">
        <div
          className="mx-auto max-w-6xl bg-white/95 backdrop-blur shadow-lg border-t flex justify-around py-2 text-xs text-gray-600"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
        >
          <button className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl hover:bg-gray-100">
            <span className="text-lg" aria-hidden>🏠</span>
            Home
          </button>
          <button className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl hover:bg-gray-100">
            <span className="text-lg" aria-hidden>📇</span>
            Directory
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <span className="text-lg" aria-hidden>➕</span>
            Invite
          </button>
          <button className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl hover:bg-gray-100">
            <span className="text-lg" aria-hidden>💬</span>
            Messages
          </button>
          <button className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl hover:bg-gray-100">
            <span className="text-lg" aria-hidden>⚙️</span>
            Settings
          </button>
        </div>
      </nav>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 py-6">
        Prototype only — messaging is simulated and no personal contact info is shared.
      </footer>
    </div>
  );
}
