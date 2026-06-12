import { useState, useEffect, useCallback } from "react";

const GENDERS = ["Male", "Female", "Other"];
const DISCIPLINES = ["Runner", "Cyclist", "Multisport"];

const COACHES_BY_DISCIPLINE = {
  Runner: [
    { id: "r1", name: "James Mitchell" },
    { id: "r2", name: "Sarah O'Connor" },
    { id: "r3", name: "Viktor Petrov" },
    { id: "r4", name: "Ana García" },
  ],
  Cyclist: [
    { id: "c1", name: "Liam Henderson" },
    { id: "c2", name: "Marie Dubois" },
    { id: "c3", name: "Hans Müller" },
  ],
  Multisport: [
    { id: "m1", name: "David Chen" },
    { id: "m2", name: "Elsa Johansen" },
    { id: "m3", name: "Paolo Rossi" },
  ],
};

const EVENTS_BY_DISCIPLINE = {
  Runner: [
    { id: "re1", name: "London Marathon 2026" },
    { id: "re2", name: "Oxford Half Marathon" },
    { id: "re3", name: "Parkrun Series Summer" },
    { id: "re4", name: "Cross Country Nationals" },
    { id: "re5", name: "Track & Field Open" },
  ],
  Cyclist: [
    { id: "ce1", name: "Tour of Britain Stage" },
    { id: "ce2", name: "Cotswolds Sportive" },
    { id: "ce3", name: "Velodrome Cup" },
    { id: "ce4", name: "Hill Climb Championship" },
  ],
  Multisport: [
    { id: "me1", name: "Blenheim Triathlon" },
    { id: "me2", name: "Ironman 70.3 Staffordshire" },
    { id: "me3", name: "Aquathlon Series" },
    { id: "me4", name: "Duathlon National Champs" },
    { id: "me5", name: "SwimRun Cotswolds" },
  ],
};

const emptyAthlete = {
  id: "",
  firstName: "",
  lastName: "",
  age: "",
  gender: "",
  location: "",
  discipline: "",
  coach: "",
  events: [],
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function AthletesDB() {
  const [athletes, setAthletes] = useState([]);
  const [form, setForm] = useState({ ...emptyAthlete });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("lastName");
  const [sortDir, setSortDir] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("athletes-db-v2");
        if (res?.value) setAthletes(JSON.parse(res.value));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const save = useCallback(async (data) => {
    try { await window.storage.set("athletes-db-v2", JSON.stringify(data)); } catch {}
  }, []);

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    let updated;
    if (editing) {
      updated = athletes.map((a) => (a.id === editing ? { ...form, id: editing } : a));
    } else {
      updated = [...athletes, { ...form, id: generateId() }];
    }
    setAthletes(updated);
    save(updated);
    setForm({ ...emptyAthlete });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (athlete) => {
    setForm({ ...athlete });
    setEditing(athlete.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    const updated = athletes.filter((a) => a.id !== id);
    setAthletes(updated);
    save(updated);
  };

  const handleDisciplineChange = (disc) => {
    setForm((f) => ({ ...f, discipline: disc, coach: "", events: [] }));
  };

  const toggleEvent = (eventId) => {
    setForm((f) => {
      if (f.events.includes(eventId)) {
        return { ...f, events: f.events.filter((e) => e !== eventId) };
      }
      if (f.events.length >= 3) return f;
      return { ...f, events: [...f.events, eventId] };
    });
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(-sortDir);
    else { setSortKey(key); setSortDir(1); }
  };

  const filtered = athletes
    .filter((a) => {
      const q = search.toLowerCase();
      return (
        a.firstName.toLowerCase().includes(q) ||
        a.lastName.toLowerCase().includes(q) ||
        (a.location || "").toLowerCase().includes(q) ||
        (a.discipline || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let av = a[sortKey] || "";
      let bv = b[sortKey] || "";
      if (sortKey === "age") return (Number(av) - Number(bv)) * sortDir;
      return String(av).localeCompare(String(bv)) * sortDir;
    });

  const getCoachName = (discipline, coachId) => {
    const list = COACHES_BY_DISCIPLINE[discipline] || [];
    return list.find((c) => c.id === coachId)?.name || "—";
  };

  const getEventNames = (discipline, eventIds) => {
    const list = EVENTS_BY_DISCIPLINE[discipline] || [];
    return (eventIds || []).map((eid) => list.find((e) => e.id === eid)?.name).filter(Boolean);
  };

  const availableCoaches = COACHES_BY_DISCIPLINE[form.discipline] || [];
  const availableEvents = EVENTS_BY_DISCIPLINE[form.discipline] || [];

  if (loading) return <div style={S.loading}>Loading…</div>;

  return (
    <div style={S.root}>
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logo}>
            <span style={S.logoIcon}>🏃</span>
            <h1 style={S.title}>Athlete Database</h1>
          </div>
          <span style={S.statBadge}>{athletes.length} athlete{athletes.length !== 1 ? "s" : ""}</span>
        </div>
      </header>

      <main style={S.main}>
        <div style={S.toolbar}>
          <input
            type="text"
            placeholder="Search by name, location, discipline…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={S.searchInput}
          />
          <button
            onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ ...emptyAthlete }); }}
            style={showForm ? S.btnSec : S.btnPri}
          >
            {showForm ? "Cancel" : "+ Add Athlete"}
          </button>
        </div>

        {showForm && (
          <div style={S.formCard}>
            <h2 style={S.formTitle}>{editing ? "Edit Athlete" : "New Athlete"}</h2>
            <div style={S.formGrid}>
              {/* Row 1 */}
              <Field label="First name *">
                <input style={S.input} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </Field>
              <Field label="Last name *">
                <input style={S.input} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </Field>
              <Field label="Age">
                <input style={S.input} type="number" min="5" max="120" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </Field>
              <Field label="Gender">
                <select style={S.input} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="">—</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>

              {/* Row 2 */}
              <Field label="Location">
                <input style={S.input} placeholder="" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </Field>
              <Field label="Discipline">
                <select
                  style={S.input}
                  value={form.discipline}
                  onChange={(e) => handleDisciplineChange(e.target.value)}
                >
                  <option value="">—</option>
                  {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Coach">
                <select
                  style={S.input}
                  value={form.coach}
                  onChange={(e) => setForm({ ...form, coach: e.target.value })}
                  disabled={!form.discipline}
                >
                  <option value="">{ form.discipline ? "Select coach…" : "Choose discipline first" }</option>
                  {availableCoaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>

              {/* Events — full width */}
              <div style={{ ...S.fieldGroup, gridColumn: "1 / -1" }}>
                <span style={S.label}>
                  Events {form.discipline ? `(${form.events.length}/3)` : ""}
                </span>
                {!form.discipline ? (
                  <span style={S.hint}>Choose a discipline to see available events</span>
                ) : (
                  <div style={S.chipRow}>
                    {availableEvents.map((ev) => {
                      const selected = form.events.includes(ev.id);
                      const disabled = !selected && form.events.length >= 3;
                      return (
                        <button
                          key={ev.id}
                          onClick={() => toggleEvent(ev.id)}
                          disabled={disabled}
                          style={selected ? S.chipActive : disabled ? S.chipDisabled : S.chip}
                        >
                          {ev.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div style={S.formActions}>
              <button onClick={handleSubmit} style={S.btnPri}>
                {editing ? "Save Changes" : "Add Athlete"}
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={S.empty}>
            {athletes.length === 0 ? "No athletes yet — add your first one above." : "No athletes match your search."}
          </div>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {[
                    ["lastName", "Name"],
                    ["age", "Age"],
                    ["gender", "Gender"],
                    ["location", "Location"],
                    ["discipline", "Discipline"],
                    ["coach", "Coach"],
                  ].map(([key, label]) => (
                    <th key={key} style={S.th} onClick={() => handleSort(key)}>
                      {label} {sortKey === key ? (sortDir === 1 ? "↑" : "↓") : ""}
                    </th>
                  ))}
                  <th style={S.th}>Events</th>
                  <th style={{ ...S.th, width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} style={S.tr}>
                    <td style={S.td}><strong>{a.lastName}</strong>, {a.firstName}</td>
                    <td style={S.td}>{a.age}</td>
                    <td style={S.td}>{a.gender}</td>
                    <td style={S.td}>{a.location}</td>
                    <td style={S.td}>
                      {a.discipline && <span style={S.discBadge(a.discipline)}>{a.discipline}</span>}
                    </td>
                    <td style={S.td}>{getCoachName(a.discipline, a.coach)}</td>
                    <td style={S.td}>
                      <div style={S.chipRow}>
                        {getEventNames(a.discipline, a.events).map((name) => (
                          <span key={name} style={S.tag}>{name}</span>
                        ))}
                        {(!a.events || a.events.length === 0) && <span style={{ color: "#aaa" }}>—</span>}
                      </div>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => handleEdit(a)} style={S.btnSm}>Edit</button>
                        <button onClick={() => handleDelete(a.id)} style={S.btnSmDel}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={S.fieldGroup}>
      <span style={S.label}>{label}</span>
      {children}
    </label>
  );
}

const discColors = {
  Runner: { bg: "#e8f5e9", color: "#2e7d32" },
  Cyclist: { bg: "#e3f2fd", color: "#1565c0" },
  Multisport: { bg: "#fff3e0", color: "#e65100" },
};

const S = {
  root: { fontFamily: "'Inter',-apple-system,sans-serif", minHeight: "100vh", background: "#f6f7f9", color: "#1a1a2e" },
  loading: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#888" },
  header: { background: "linear-gradient(135deg,#1a1a2e,#16213e)", color: "#fff", padding: "20px 0" },
  headerInner: { maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: { fontSize: 28 },
  title: { margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" },
  statBadge: { background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 500 },
  main: { maxWidth: 1200, margin: "0 auto", padding: "24px 20px" },
  toolbar: { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none", background: "#fff" },
  btnPri: { background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  btnSec: { background: "#fff", color: "#1a1a2e", border: "1px solid #ccc", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  formCard: { background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  formTitle: { margin: "0 0 18px", fontSize: 18, fontWeight: 700 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.04em" },
  hint: { fontSize: 13, color: "#aaa", fontStyle: "italic" },
  input: { padding: "9px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, outline: "none", background: "#fafafa" },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: { padding: "5px 12px", borderRadius: 20, border: "1px solid #ccc", background: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500 },
  chipActive: { padding: "5px 12px", borderRadius: 20, border: "1px solid #1a1a2e", background: "#1a1a2e", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500 },
  chipDisabled: { padding: "5px 12px", borderRadius: 20, border: "1px solid #eee", background: "#f5f5f5", color: "#bbb", fontSize: 12, cursor: "not-allowed", fontWeight: 500 },
  formActions: { marginTop: 20, display: "flex", justifyContent: "flex-end" },
  tableWrap: { overflowX: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "12px 14px", borderBottom: "2px solid #eee", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#888", cursor: "pointer", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f0f0f0" },
  td: { padding: "10px 14px", verticalAlign: "middle" },
  tag: { display: "inline-block", padding: "2px 8px", borderRadius: 10, background: "#f0f0f5", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" },
  discBadge: (d) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700,
    background: (discColors[d] || discColors.Runner).bg,
    color: (discColors[d] || discColors.Runner).color,
  }),
  btnSm: { padding: "4px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 12, cursor: "pointer" },
  btnSmDel: { padding: "4px 8px", borderRadius: 6, border: "1px solid #f0c0c0", background: "#fff", color: "#c44", fontSize: 12, cursor: "pointer" },
  empty: { textAlign: "center", padding: 60, color: "#999", fontSize: 15, background: "#fff", borderRadius: 12 },
};
