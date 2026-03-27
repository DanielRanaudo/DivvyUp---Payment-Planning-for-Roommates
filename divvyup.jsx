import { useState, useEffect, useMemo } from "react";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";

function uid() { return Math.random().toString(36).substr(2, 9); }
function groupCode() { return Math.random().toString(36).substr(2, 6).toUpperCase(); }
function getInitials(n) { return n.slice(0, 2).toUpperCase(); }

const GRADIENTS = [
  "linear-gradient(135deg, #5856D6, #AF52DE)",
  "linear-gradient(135deg, #FF9500, #FF2D55)",
  "linear-gradient(135deg, #34C759, #30D158)",
  "linear-gradient(135deg, #007AFF, #5AC8FA)",
  "linear-gradient(135deg, #FF2D55, #FF6482)",
  "linear-gradient(135deg, #00C7BE, #34C759)",
  "linear-gradient(135deg, #FF9500, #FFCC00)",
  "linear-gradient(135deg, #5856D6, #007AFF)",
  "linear-gradient(135deg, #AF52DE, #FF2D55)",
  "linear-gradient(135deg, #30D158, #5AC8FA)",
  "linear-gradient(135deg, #FF6482, #FF9500)",
  "linear-gradient(135deg, #5AC8FA, #AF52DE)",
];

function Avatar({ name, index, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: GRADIENTS[index % GRADIENTS.length], color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 600, flexShrink: 0,
      letterSpacing: "-0.02em",
    }}>{getInitials(name)}</div>
  );
}

/* ─── Settlement algorithms ─── */
function calcSmartSettlements(members, charges, payments) {
  const bal = {};
  members.forEach(m => bal[m.id] = 0);
  charges.forEach(c => {
    Object.entries(c.splits).forEach(([mid, amt]) => { bal[mid] = (bal[mid] || 0) - amt; });
    if (c.paidBy) bal[c.paidBy] = (bal[c.paidBy] || 0) + c.amount;
  });
  (payments || []).filter(p => p.status === "confirmed").forEach(p => {
    bal[p.fromId] = (bal[p.fromId] || 0) + p.amount;
    bal[p.toId] = (bal[p.toId] || 0) - p.amount;
  });
  const debtors = [], creditors = [];
  members.forEach(m => {
    const b = Math.round((bal[m.id] || 0) * 100) / 100;
    if (b < -0.01) debtors.push({ id: m.id, name: m.name, amount: -b });
    else if (b > 0.01) creditors.push({ id: m.id, name: m.name, amount: b });
  });
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);
  const settlements = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].amount, creditors[j].amount);
    if (amt > 0.01) settlements.push({ fromId: debtors[i].id, fromName: debtors[i].name, toId: creditors[j].id, toName: creditors[j].name, amount: Math.round(amt * 100) / 100 });
    debtors[i].amount -= amt; creditors[j].amount -= amt;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }
  return settlements;
}

function calcSimpleSettlements(members, charges, payments) {
  const memberMap = {};
  members.forEach(m => memberMap[m.id] = m);
  const pairDebt = {};
  charges.forEach(c => {
    if (!c.paidBy) return;
    Object.entries(c.splits).forEach(([mid, amt]) => {
      if (mid === c.paidBy) return;
      const key = `${mid}->${c.paidBy}`;
      pairDebt[key] = (pairDebt[key] || 0) + amt;
    });
  });
  (payments || []).filter(p => p.status === "confirmed").forEach(p => {
    const key = `${p.fromId}->${p.toId}`;
    pairDebt[key] = (pairDebt[key] || 0) - p.amount;
  });
  const netted = {};
  Object.entries(pairDebt).forEach(([key, amt]) => {
    const [from, to] = key.split("->");
    const reverseKey = `${to}->${from}`;
    if (netted[reverseKey] !== undefined) return;
    const reverse = pairDebt[reverseKey] || 0;
    const net = Math.round((amt - reverse) * 100) / 100;
    if (net > 0.01) netted[key] = net;
    else if (net < -0.01) netted[reverseKey] = -net;
  });
  const settlements = [];
  Object.entries(netted).forEach(([key, amt]) => {
    const [fromId, toId] = key.split("->");
    if (amt > 0.01 && memberMap[fromId] && memberMap[toId])
      settlements.push({ fromId, fromName: memberMap[fromId].name, toId, toName: memberMap[toId].name, amount: amt });
  });
  settlements.sort((a, b) => b.amount - a.amount);
  return settlements;
}

function calcSettlements(members, charges, payments, smart) {
  return smart ? calcSmartSettlements(members, charges, payments) : calcSimpleSettlements(members, charges, payments);
}

/* ─── Apple-style tokens ─── */
const T = {
  bg: "#f5f5f7",
  card: "rgba(255,255,255,0.8)",
  cardSolid: "#ffffff",
  border: "rgba(0,0,0,0.06)",
  text: "#1d1d1f",
  secondary: "#86868b",
  tertiary: "#aeaeb2",
  blue: "#007AFF",
  green: "#34C759",
  red: "#FF3B30",
  orange: "#FF9500",
  purple: "#AF52DE",
  radius: 16,
  radiusSm: 12,
  shadow: "0 2px 12px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.08)",
  shadowLg: "0 8px 30px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)",
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
};

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: T.radiusSm,
  border: "none", fontFamily: T.font, fontSize: 15, outline: "none",
  background: T.bg, boxSizing: "border-box", color: T.text,
  transition: "box-shadow 0.2s",
};
const labelStyle = {
  display: "block", fontSize: 13, fontWeight: 500, color: T.secondary,
  marginBottom: 6,
};
const cardStyle = {
  background: T.cardSolid, borderRadius: T.radius, padding: "18px 20px",
  boxShadow: T.shadow,
};
const secTitle = { fontSize: 20, fontWeight: 600, color: T.text, margin: "0 0 16px 0", letterSpacing: "-0.02em" };

/* ─── Welcome ─── */
function WelcomeScreen({ onStart, onJoin }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "90vh", padding: 32, textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: "linear-gradient(135deg, #007AFF, #5856D6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20, boxShadow: "0 8px 24px rgba(0,122,255,0.3)",
      }}>
        <span style={{ fontSize: 28, color: "#fff", fontWeight: 700, fontFamily: T.font }}>÷</span>
      </div>
      <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 6, color: T.text }}>divvyup</div>
      <p style={{ fontSize: 17, color: T.secondary, marginBottom: 44, maxWidth: 260, lineHeight: 1.5 }}>
        Split expenses with your roommates, effortlessly.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
        <button onClick={onStart} style={{
          padding: "14px 24px", borderRadius: T.radius, border: "none",
          background: "#007AFF", color: "#fff", fontFamily: T.font,
          fontSize: 17, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,122,255,0.3)", transition: "transform 0.15s, box-shadow 0.15s",
        }}
          onMouseDown={e => e.target.style.transform = "scale(0.97)"}
          onMouseUp={e => e.target.style.transform = "scale(1)"}
        >Start a Group</button>
        <button onClick={onJoin} style={{
          padding: "14px 24px", borderRadius: T.radius,
          border: "none", background: "rgba(0,122,255,0.1)", color: "#007AFF",
          fontFamily: T.font, fontSize: 17, fontWeight: 600, cursor: "pointer",
          transition: "transform 0.15s",
        }}
          onMouseDown={e => e.target.style.transform = "scale(0.97)"}
          onMouseUp={e => e.target.style.transform = "scale(1)"}
        >Join a Group</button>
      </div>
    </div>
  );
}

/* ─── Create Group ─── */
function CreateGroupScreen({ onBack, onCreate }) {
  const [name, setName] = useState("");
  const [venmo, setVenmo] = useState("");
  const [groupName, setGroupName] = useState("");
  const canSubmit = name.trim() && groupName.trim();
  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "48px 24px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: T.blue, cursor: "pointer", fontSize: 15, fontWeight: 500, marginBottom: 24, padding: 0, fontFamily: T.font }}>‹ Back</button>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.03em", color: T.text }}>Start a Group</h2>
      <p style={{ fontSize: 15, color: T.secondary, marginBottom: 32, lineHeight: 1.5 }}>You'll be the treasurer — managing rent, utilities, and approving expenses.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div><label style={labelStyle}>Group Name</label><input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder='e.g. "4200 Walnut St"' style={inputStyle} /></div>
        <div><label style={labelStyle}>Your Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Daniel" style={inputStyle} /></div>
        <div><label style={labelStyle}>Venmo / Zelle</label><input value={venmo} onChange={e => setVenmo(e.target.value)} placeholder="@danielv (optional)" style={inputStyle} /></div>
        <button onClick={() => canSubmit && onCreate(groupName.trim(), name.trim(), venmo.trim())} style={{
          padding: "14px 24px", borderRadius: T.radius, border: "none",
          background: canSubmit ? "#007AFF" : "#c7c7cc", color: "#fff", fontFamily: T.font,
          fontSize: 17, fontWeight: 600, cursor: canSubmit ? "pointer" : "default",
          marginTop: 8, transition: "background 0.2s",
          boxShadow: canSubmit ? "0 4px 16px rgba(0,122,255,0.3)" : "none",
        }}>Create Group</button>
      </div>
    </div>
  );
}

/* ─── Join Group ─── */
function JoinGroupScreen({ onBack, onJoin, groups }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [venmo, setVenmo] = useState("");
  const [error, setError] = useState("");
  const canSubmit = code.trim().length === 6 && name.trim();
  const handleJoin = () => {
    const g = groups.find(g => g.code === code.trim().toUpperCase());
    if (!g) { setError("Group not found"); return; }
    if (g.members.find(m => m.name.toLowerCase() === name.trim().toLowerCase())) { setError("Name already taken"); return; }
    onJoin(g.id, name.trim(), venmo.trim());
  };
  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "48px 24px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: T.blue, cursor: "pointer", fontSize: 15, fontWeight: 500, marginBottom: 24, padding: 0, fontFamily: T.font }}>‹ Back</button>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.03em" }}>Join a Group</h2>
      <p style={{ fontSize: 15, color: T.secondary, marginBottom: 32, lineHeight: 1.5 }}>Enter the invite code from your treasurer.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div><label style={labelStyle}>Invite Code</label><input value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError(""); }} placeholder="ABC123" maxLength={6} style={{ ...inputStyle, fontFamily: T.mono, letterSpacing: "0.2em", fontSize: 22, textAlign: "center", fontWeight: 600 }} /></div>
        <div><label style={labelStyle}>Your Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} /></div>
        <div><label style={labelStyle}>Venmo / Zelle</label><input value={venmo} onChange={e => setVenmo(e.target.value)} placeholder="@yourhandle (optional)" style={inputStyle} /></div>
        {error && <div style={{ color: T.red, fontSize: 14, fontWeight: 500 }}>{error}</div>}
        <button onClick={() => canSubmit && handleJoin()} style={{
          padding: "14px 24px", borderRadius: T.radius, border: "none",
          background: canSubmit ? "#007AFF" : "#c7c7cc", color: "#fff", fontFamily: T.font,
          fontSize: 17, fontWeight: 600, cursor: canSubmit ? "pointer" : "default",
          marginTop: 8, boxShadow: canSubmit ? "0 4px 16px rgba(0,122,255,0.3)" : "none",
        }}>Join Group</button>
      </div>
    </div>
  );
}

/* ─── Tab Bar ─── */
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 4, padding: "4px", marginBottom: 24,
      background: "rgba(0,0,0,0.04)", borderRadius: 12,
      position: "sticky", top: 8, zIndex: 10,
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, padding: "8px 6px", border: "none",
          background: active === t.id ? T.cardSolid : "transparent",
          fontFamily: T.font, fontSize: 13, fontWeight: 500,
          color: active === t.id ? T.text : T.secondary,
          borderRadius: 8, cursor: "pointer",
          boxShadow: active === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
          transition: "all 0.2s", whiteSpace: "nowrap", position: "relative",
        }}>
          {t.label}
          {t.badge ? <span style={{
            position: "absolute", top: 2, right: 6,
            width: 8, height: 8, borderRadius: 4,
            background: T.red,
          }} /> : null}
        </button>
      ))}
    </div>
  );
}

/* ─── Notification Banner ─── */
function NotificationBanner({ notifications, onAction, group }) {
  if (notifications.length === 0) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      {notifications.map(n => {
        const fromMember = group.members.find(m => m.id === n.fromId);
        const fromIdx = fromMember ? group.members.indexOf(fromMember) : 0;
        return (
          <div key={n.id} style={{
            ...cardStyle, padding: "16px 18px", marginBottom: 8,
            background: "linear-gradient(135deg, rgba(255,149,0,0.08), rgba(255,45,85,0.06))",
            border: "1px solid rgba(255,149,0,0.15)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={n.fromName} index={fromIdx} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>
                  {n.fromName} paid you
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 600, color: T.green, marginTop: 2 }}>
                  ${n.amount.toFixed(2)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => onAction(n.id, "confirmed")} style={{
                flex: 1, padding: "10px 0", borderRadius: T.radiusSm, border: "none",
                background: T.green, color: "#fff", fontFamily: T.font,
                fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}>Confirm</button>
              <button onClick={() => onAction(n.id, "rejected")} style={{
                flex: 1, padding: "10px 0", borderRadius: T.radiusSm, border: "none",
                background: "rgba(0,0,0,0.05)", color: T.secondary, fontFamily: T.font,
                fontSize: 15, fontWeight: 600, cursor: "pointer",
              }}>Deny</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Dashboard ─── */
function DashboardTab({ group, currentUser, allCharges, setGroup, setTab }) {
  const settlements = calcSettlements(group.members, allCharges, group.payments, group.smartSettle);
  const totalMonthly = allCharges.filter(c => c.recurring).reduce((s, c) => s + c.amount, 0);
  const myNotifications = (group.payments || []).filter(p => p.toId === currentUser.id && p.status === "pending");
  const handlePaymentAction = (paymentId, status) => {
    setGroup(prev => ({ ...prev, payments: prev.payments.map(p => p.id === paymentId ? { ...p, status } : p) }));
  };

  const iOwe = settlements.filter(s => s.fromId === currentUser.id);
  const owedToMe = settlements.filter(s => s.toId === currentUser.id);
  const totalIOwe = iOwe.reduce((s, x) => s + x.amount, 0);
  const totalOwedToMe = owedToMe.reduce((s, x) => s + x.amount, 0);
  const netBalance = totalOwedToMe - totalIOwe;

  return (
    <div>
      <NotificationBanner notifications={myNotifications} onAction={handlePaymentAction} group={group} />

      {/* Hero balance */}
      <div style={{
        ...cardStyle, padding: "28px 24px", marginBottom: 16, textAlign: "center",
        background: netBalance >= 0
          ? "linear-gradient(135deg, rgba(52,199,89,0.08), rgba(0,122,255,0.06))"
          : "linear-gradient(135deg, rgba(255,59,48,0.08), rgba(255,149,0,0.06))",
        border: `1px solid ${netBalance >= 0 ? "rgba(52,199,89,0.15)" : "rgba(255,59,48,0.15)"}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.secondary, marginBottom: 4 }}>Your Balance</div>
        <div style={{
          fontFamily: T.mono, fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em",
          color: netBalance > 0.01 ? T.green : netBalance < -0.01 ? T.red : T.secondary,
        }}>
          {netBalance > 0 ? "+" : netBalance < 0 ? "−" : ""}${Math.abs(netBalance).toFixed(2)}
        </div>
        <div style={{ fontSize: 14, color: T.secondary, marginTop: 4 }}>
          {netBalance > 0.01 ? "You're owed money" : netBalance < -0.01 ? "You owe money" : "All settled up"}
        </div>
        {netBalance < -0.01 && (
          <button onClick={() => setTab("settle")} style={{
            marginTop: 14, background: T.blue, color: "#fff", border: "none",
            borderRadius: 20, padding: "8px 20px", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font,
            boxShadow: "0 4px 12px rgba(0,122,255,0.3)",
          }}>Settle Up</button>
        )}
      </div>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.secondary }}>You Owe</div>
          <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: totalIOwe > 0 ? T.red : T.tertiary, marginTop: 4 }}>${totalIOwe.toFixed(2)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.secondary }}>Owed to You</div>
          <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: totalOwedToMe > 0 ? T.green : T.tertiary, marginTop: 4 }}>${totalOwedToMe.toFixed(2)}</div>
        </div>
      </div>

      {/* People you owe */}
      {iOwe.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.secondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>You Owe</h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            {iOwe.map((s, i) => {
              const toM = group.members.find(m => m.id === s.toId);
              const toIdx = toM ? group.members.indexOf(toM) : 0;
              const existing = (group.payments || []).find(p => p.fromId === s.fromId && p.toId === s.toId && (p.status === "pending" || p.status === "confirmed"));
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                  borderBottom: i < iOwe.length - 1 ? `1px solid ${T.border}` : "none",
                }}>
                  <Avatar name={s.toName} index={toIdx} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{s.toName}</div>
                    {toM?.venmo && <div style={{ fontSize: 13, color: T.tertiary }}>{toM.venmo}</div>}
                    {existing?.status === "pending" && <div style={{ fontSize: 12, color: T.orange, fontWeight: 500, marginTop: 2 }}>Waiting for confirmation</div>}
                    {existing?.status === "confirmed" && <div style={{ fontSize: 12, color: T.green, fontWeight: 500, marginTop: 2 }}>Confirmed ✓</div>}
                  </div>
                  <div style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 17, color: T.red }}>${s.amount.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Owed to you */}
      {owedToMe.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.secondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Owed to You</h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            {owedToMe.map((s, i) => {
              const fromM = group.members.find(m => m.id === s.fromId);
              const fromIdx = fromM ? group.members.indexOf(fromM) : 0;
              const existing = (group.payments || []).find(p => p.fromId === s.fromId && p.toId === s.toId && (p.status === "pending" || p.status === "confirmed"));
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                  borderBottom: i < owedToMe.length - 1 ? `1px solid ${T.border}` : "none",
                }}>
                  <Avatar name={s.fromName} index={fromIdx} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{s.fromName}</div>
                    {existing?.status === "pending" && <div style={{ fontSize: 12, color: T.orange, fontWeight: 500, marginTop: 2 }}>Says they paid</div>}
                    {existing?.status === "confirmed" && <div style={{ fontSize: 12, color: T.green, fontWeight: 500, marginTop: 2 }}>Confirmed ✓</div>}
                  </div>
                  <div style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 17, color: T.green }}>${s.amount.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {iOwe.length === 0 && owedToMe.length === 0 && myNotifications.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: T.tertiary, fontSize: 15 }}>All settled up ✨</div>
      )}

      {totalMonthly > 0 && (
        <div style={{ ...cardStyle, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.secondary }}>Monthly Recurring</div>
          <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, marginTop: 4 }}>${totalMonthly.toFixed(2)}</div>
        </div>
      )}

      {allCharges.length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.secondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Recent</h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            {allCharges.slice(-5).reverse().map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: i < Math.min(allCharges.length, 5) - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.type === "rent" ? "rgba(255,149,0,0.1)" : c.type === "utility" ? "rgba(0,122,255,0.1)" : "rgba(88,86,214,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
                  {c.type === "rent" ? "🏠" : c.type === "utility" ? "⚡" : "🛒"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{c.description}{c.recurring && <span style={{ marginLeft: 6, fontSize: 11, color: T.blue, fontWeight: 600 }}>Monthly</span>}</div>
                  <div style={{ fontSize: 12, color: T.tertiary }}>{c.type === "expense" ? `by ${c.submittedByName}` : "Treasurer"}</div>
                </div>
                <div style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 14 }}>${c.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Rent ─── */
function RentTab({ group, setGroup }) {
  const [amount, setAmount] = useState(group.rent?.amount || "");
  const [splitType, setSplitType] = useState(group.rent?.splitType || "equal");
  const [recurring, setRecurring] = useState(group.rent?.recurring ?? true);
  const [percentages, setPercentages] = useState(group.rent?.percentages || {});
  const [customs, setCustoms] = useState(group.rent?.customs || {});
  const [saved, setSaved] = useState(false);
  const amt = parseFloat(amount) || 0;
  const pctTotal = Object.values(percentages).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const customTotal = Object.values(customs).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  const handleSave = () => {
    if (!amt) return;
    let splits = {};
    if (splitType === "equal") { const share = amt / group.members.length; group.members.forEach(m => splits[m.id] = Math.round(share * 100) / 100); }
    else if (splitType === "percentage") { group.members.forEach(m => splits[m.id] = Math.round(amt * (parseFloat(percentages[m.id]) || 0) / 100 * 100) / 100); }
    else { group.members.forEach(m => splits[m.id] = Math.round((parseFloat(customs[m.id]) || 0) * 100) / 100); }
    setGroup(prev => ({ ...prev, rent: { amount: amt, splitType, recurring, percentages, customs, splits, id: prev.rent?.id || uid() } }));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h2 style={secTitle}>Rent</h2>
      <p style={{ fontSize: 15, color: T.secondary, marginTop: -12, marginBottom: 24 }}>Set the household rent and how it's divided.</p>

      <div style={cardStyle}>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Total Monthly Rent</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{ ...inputStyle, fontFamily: T.mono, fontSize: 28, fontWeight: 700, textAlign: "center", padding: "16px 14px" }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Split Method</label>
          <div style={{ display: "flex", gap: 4, background: T.bg, borderRadius: 10, padding: 3 }}>
            {[["equal", "Even"], ["percentage", "By %"], ["custom", "Custom"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setSplitType(val)} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                background: splitType === val ? T.cardSolid : "transparent",
                color: splitType === val ? T.text : T.secondary,
                fontFamily: T.font, fontSize: 14, fontWeight: 500, cursor: "pointer",
                boxShadow: splitType === val ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s",
              }}>{lbl}</button>
            ))}
          </div>
        </div>

        {splitType === "equal" && amt > 0 && (
          <div style={{ textAlign: "center", padding: "16px 0", marginBottom: 8, background: T.bg, borderRadius: T.radiusSm }}>
            <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 700 }}>${(amt / group.members.length).toFixed(2)}</div>
            <div style={{ fontSize: 13, color: T.secondary, marginTop: 4 }}>per person · {group.members.length} roommates</div>
          </div>
        )}

        {splitType === "percentage" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
            {group.members.map((m, i) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={m.name} index={i} size={28} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{m.name}</span>
                <input type="number" value={percentages[m.id] || ""} onChange={e => setPercentages(p => ({ ...p, [m.id]: e.target.value }))} placeholder="0" style={{ ...inputStyle, width: 64, textAlign: "right", padding: "8px 10px" }} />
                <span style={{ fontSize: 14, color: T.secondary, width: 16 }}>%</span>
                {amt > 0 && <span style={{ fontFamily: T.mono, fontSize: 13, color: T.tertiary, width: 70, textAlign: "right" }}>${(amt * (parseFloat(percentages[m.id]) || 0) / 100).toFixed(2)}</span>}
              </div>
            ))}
            <div style={{ fontSize: 13, color: Math.abs(pctTotal - 100) < 0.01 ? T.green : T.red, fontWeight: 500, marginTop: 4 }}>
              Total: {pctTotal.toFixed(1)}%{Math.abs(pctTotal - 100) >= 0.01 ? " — must equal 100%" : " ✓"}
            </div>
          </div>
        )}

        {splitType === "custom" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
            {group.members.map((m, i) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={m.name} index={i} size={28} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{m.name}</span>
                <span style={{ fontSize: 14, color: T.secondary }}>$</span>
                <input type="number" value={customs[m.id] || ""} onChange={e => setCustoms(p => ({ ...p, [m.id]: e.target.value }))} placeholder="0" style={{ ...inputStyle, width: 90, textAlign: "right", padding: "8px 10px" }} />
              </div>
            ))}
            <div style={{ fontSize: 13, color: amt > 0 && Math.abs(customTotal - amt) < 0.01 ? T.green : T.red, fontWeight: 500, marginTop: 4 }}>
              Total: ${customTotal.toFixed(2)} / ${amt.toFixed(2)}{amt > 0 && Math.abs(customTotal - amt) >= 0.01 ? " — doesn't match" : " ✓"}
            </div>
          </div>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, fontWeight: 500, color: T.text, margin: "16px 0" }}>
          <div onClick={() => setRecurring(!recurring)} style={{
            width: 28, height: 28, borderRadius: 7, border: "none", cursor: "pointer",
            background: recurring ? T.blue : T.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s", flexShrink: 0,
          }}>
            {recurring && <span style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>✓</span>}
          </div>
          Recurring monthly
        </label>

        <button onClick={handleSave} style={{
          width: "100%", padding: "14px 0", borderRadius: T.radius, border: "none",
          background: saved ? T.green : amt > 0 ? T.blue : "#c7c7cc", color: "#fff",
          fontFamily: T.font, fontSize: 17, fontWeight: 600, cursor: amt > 0 ? "pointer" : "default",
          transition: "background 0.3s",
          boxShadow: amt > 0 ? "0 4px 16px rgba(0,122,255,0.3)" : "none",
        }}>{saved ? "Saved ✓" : "Save Rent"}</button>
      </div>
    </div>
  );
}

/* ─── Utilities ─── */
function UtilitiesTab({ group, setGroup }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(true);

  const addUtility = () => {
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    const splits = {}; const share = amt / group.members.length;
    group.members.forEach(m => splits[m.id] = Math.round(share * 100) / 100);
    setGroup(prev => ({ ...prev, utilities: [...prev.utilities, { id: uid(), name: name.trim(), amount: amt, recurring, splits, date: new Date().toISOString() }] }));
    setName(""); setAmount(""); setRecurring(true); setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ ...secTitle, marginBottom: 4 }}>Utilities</h2>
          <p style={{ fontSize: 14, color: T.secondary, margin: 0 }}>Split evenly among all members</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: "8px 16px", borderRadius: 20, border: "none",
          background: showForm ? T.bg : T.blue, color: showForm ? T.text : "#fff",
          fontFamily: T.font, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>{showForm ? "Cancel" : "+ Add"}</button>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Electric" style={inputStyle} /></div>
            <div><label style={labelStyle}>Amount</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={inputStyle} /></div>
          </div>
          {amount && parseFloat(amount) > 0 && <div style={{ fontSize: 13, color: T.secondary, marginBottom: 12 }}>${(parseFloat(amount) / group.members.length).toFixed(2)} per person</div>}
          <button onClick={addUtility} style={{ width: "100%", padding: "12px 0", borderRadius: T.radiusSm, border: "none", background: (name.trim() && amount) ? T.blue : "#c7c7cc", color: "#fff", fontFamily: T.font, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Add Utility</button>
        </div>
      )}

      {group.utilities.length === 0 && !showForm && <div style={{ textAlign: "center", padding: 48, color: T.tertiary, fontSize: 15 }}>No utilities yet</div>}

      {group.utilities.length > 0 && (
        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          {group.utilities.map((u, i) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i < group.utilities.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,122,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>⚡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{u.name}{u.recurring && <span style={{ marginLeft: 6, fontSize: 11, color: T.blue, fontWeight: 600 }}>Monthly</span>}</div>
                <div style={{ fontSize: 13, color: T.tertiary }}>${(u.amount / group.members.length).toFixed(2)} per person</div>
              </div>
              <div style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 15 }}>${u.amount.toFixed(2)}</div>
              <button onClick={() => setGroup(prev => ({ ...prev, utilities: prev.utilities.filter(x => x.id !== u.id) }))} style={{ background: "none", border: "none", color: T.tertiary, cursor: "pointer", fontSize: 18, padding: "0 4px" }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Expenses ─── */
function ExpensesTab({ group, setGroup, currentUser, isTreasurer }) {
  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const pending = group.expenses.filter(e => e.status === "pending");
  const approved = group.expenses.filter(e => e.status === "approved");

  const submitExpense = () => {
    const amt = parseFloat(amount);
    if (!desc.trim() || isNaN(amt) || amt <= 0) return;
    setGroup(prev => ({ ...prev, expenses: [...prev.expenses, { id: uid(), description: desc.trim(), amount: amt, submittedBy: currentUser.id, submittedByName: currentUser.name, status: "pending", date: new Date().toISOString() }] }));
    setDesc(""); setAmount(""); setShowForm(false);
  };

  const approveExpense = (id) => {
    setGroup(prev => ({ ...prev, expenses: prev.expenses.map(e => {
      if (e.id !== id) return e;
      const splits = {}; const share = e.amount / prev.members.length;
      prev.members.forEach(m => splits[m.id] = Math.round(share * 100) / 100);
      return { ...e, status: "approved", splits };
    }) }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ ...secTitle, marginBottom: 4 }}>Expenses</h2>
          <p style={{ fontSize: 14, color: T.secondary, margin: 0 }}>Requires treasurer approval</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: "8px 16px", borderRadius: 20, border: "none",
          background: showForm ? T.bg : T.blue, color: showForm ? T.text : "#fff",
          fontFamily: T.font, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>{showForm ? "Cancel" : "+ Submit"}</button>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><label style={labelStyle}>Description</label><input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Toilet paper, etc." style={inputStyle} /></div>
            <div><label style={labelStyle}>Amount</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={inputStyle} /></div>
          </div>
          <button onClick={submitExpense} style={{ width: "100%", padding: "12px 0", borderRadius: T.radiusSm, border: "none", background: (desc.trim() && amount) ? T.blue : "#c7c7cc", color: "#fff", fontFamily: T.font, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Submit for Approval</button>
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.orange, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Pending · {pending.length}</h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            {pending.map((e, i) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i < pending.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,149,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🛒</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{e.description}</div>
                  <div style={{ fontSize: 12, color: T.tertiary }}>by {e.submittedByName}</div>
                </div>
                <div style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 14 }}>${e.amount.toFixed(2)}</div>
                {isTreasurer && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => approveExpense(e.id)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: T.green, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</button>
                    <button onClick={() => setGroup(prev => ({ ...prev, expenses: prev.expenses.map(x => x.id === e.id ? { ...x, status: "denied" } : x) }))} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: T.bg, color: T.secondary, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✗</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {approved.length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.green, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Approved</h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            {[...approved].reverse().map((e, i) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: i < approved.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(88,86,214,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🛒</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{e.description}</div>
                  <div style={{ fontSize: 12, color: T.tertiary }}>by {e.submittedByName} · ${(e.amount / group.members.length).toFixed(2)}/person</div>
                </div>
                <div style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 14 }}>${e.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && approved.length === 0 && !showForm && <div style={{ textAlign: "center", padding: 48, color: T.tertiary, fontSize: 15 }}>No expenses yet</div>}
    </div>
  );
}

/* ─── Settle ─── */
function SettleTab({ group, setGroup, allCharges, currentUser }) {
  const settlements = calcSettlements(group.members, allCharges, group.payments, group.smartSettle);
  const memberById = {}; group.members.forEach(m => memberById[m.id] = m);
  const payments = group.payments || [];
  const getPaymentStatus = (fromId, toId) => payments.find(p => p.fromId === fromId && p.toId === toId && (p.status === "pending" || p.status === "confirmed")) || null;
  const markAsPaid = (fromId, fromName, toId, toName, amount) => {
    setGroup(prev => ({ ...prev, payments: [...(prev.payments || []), { id: uid(), fromId, fromName, toId, toName, amount, status: "pending", date: new Date().toISOString() }] }));
  };

  const myDebts = settlements.filter(s => s.fromId === currentUser.id);
  const owedToMe = settlements.filter(s => s.toId === currentUser.id);
  const otherSettlements = settlements.filter(s => s.fromId !== currentUser.id && s.toId !== currentUser.id);

  const renderSettlement = (s, i, showAction) => {
    const toM = memberById[s.toId]; const fromM = memberById[s.fromId];
    const existing = getPaymentStatus(s.fromId, s.toId);
    return (
      <div key={`${s.fromId}-${s.toId}-${i}`} style={{ padding: "16px 18px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={s.fromName} index={group.members.indexOf(fromM)} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15 }}>
              <span style={{ fontWeight: 600 }}>{s.fromName}{s.fromId === currentUser.id ? " (you)" : ""}</span>
              <span style={{ color: T.tertiary }}> → </span>
              <span style={{ fontWeight: 600 }}>{s.toName}{s.toId === currentUser.id ? " (you)" : ""}</span>
            </div>
            {toM?.venmo && <div style={{ fontSize: 13, color: T.tertiary, marginTop: 2 }}>{toM.venmo}</div>}
          </div>
          <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 17, color: existing?.status === "confirmed" ? T.green : T.red }}>
            ${s.amount.toFixed(2)}
          </div>
        </div>
        {existing?.status === "confirmed" && <div style={{ fontSize: 13, color: T.green, fontWeight: 500, marginTop: 8, marginLeft: 48 }}>✓ Confirmed</div>}
        {existing?.status === "pending" && <div style={{ fontSize: 13, color: T.orange, fontWeight: 500, marginTop: 8, marginLeft: 48 }}>Waiting for {s.toName} to confirm</div>}
        {!existing && showAction && s.fromId === currentUser.id && (
          <div style={{ marginTop: 10, marginLeft: 48 }}>
            <button onClick={() => markAsPaid(s.fromId, s.fromName, s.toId, s.toName, s.amount)} style={{
              padding: "8px 20px", borderRadius: 20, border: "none",
              background: T.blue, color: "#fff", fontFamily: T.font,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,122,255,0.25)",
            }}>I Paid This</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 style={secTitle}>Settle Up</h2>
      <p style={{ fontSize: 15, color: T.secondary, marginTop: -12, marginBottom: 24 }}>Pay who you owe, then mark it paid.</p>
      {settlements.length === 0 && <div style={{ textAlign: "center", padding: 48, color: T.tertiary, fontSize: 15 }}>All settled up ✨</div>}

      {myDebts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.red, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>You Owe</h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>{myDebts.map((s, i) => renderSettlement(s, i, true))}</div>
        </div>
      )}
      {owedToMe.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.green, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Owed to You</h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>{owedToMe.map((s, i) => renderSettlement(s, i, false))}</div>
        </div>
      )}
      {otherSettlements.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.tertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Others</h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>{otherSettlements.map((s, i) => renderSettlement(s, i, false))}</div>
        </div>
      )}

      {payments.filter(p => p.status === "confirmed" || p.status === "rejected").length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.tertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>History</h3>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            {payments.filter(p => p.status === "confirmed" || p.status === "rejected").reverse().map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 16 }}>{p.status === "confirmed" ? "✅" : "❌"}</span>
                <div style={{ flex: 1, fontSize: 14 }}><span style={{ fontWeight: 600 }}>{p.fromName}</span><span style={{ color: T.tertiary }}> → </span><span style={{ fontWeight: 600 }}>{p.toName}</span></div>
                <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 600 }}>${p.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Members ─── */
function MembersTab({ group, setGroup, currentUser, isTreasurer }) {
  const [copied, setCopied] = useState(false);
  const [confirmKick, setConfirmKick] = useState(null);
  const copyCode = () => { navigator.clipboard?.writeText(group.code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const kickMember = (id) => { setGroup(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id), expenses: prev.expenses.filter(e => e.submittedBy !== id) })); setConfirmKick(null); };

  return (
    <div>
      <h2 style={secTitle}>Members</h2>

      <div style={{ ...cardStyle, marginBottom: 24, textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.secondary, marginBottom: 8 }}>Invite Code</div>
        <div style={{ fontFamily: T.mono, fontSize: 32, fontWeight: 700, letterSpacing: "0.2em", color: T.text }}>{group.code}</div>
        <button onClick={copyCode} style={{
          marginTop: 12, padding: "8px 20px", borderRadius: 20, border: "none",
          background: copied ? T.green : T.bg, color: copied ? "#fff" : T.text,
          fontFamily: T.font, fontSize: 14, fontWeight: 500, cursor: "pointer",
          transition: "all 0.2s",
        }}>{copied ? "Copied!" : "Copy Code"}</button>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        {group.members.map((m, i) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i < group.members.length - 1 ? `1px solid ${T.border}` : "none", background: confirmKick === m.id ? "rgba(255,59,48,0.04)" : "transparent" }}>
            <Avatar name={m.name} index={i} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {m.name}
                {m.isTreasurer && <span style={{ marginLeft: 6, fontSize: 11, color: T.orange, fontWeight: 600 }}>Treasurer</span>}
                {m.id === currentUser.id && <span style={{ marginLeft: 6, fontSize: 11, color: T.purple, fontWeight: 600 }}>You</span>}
              </div>
              {m.venmo && <div style={{ fontSize: 13, color: T.tertiary }}>{m.venmo}</div>}
            </div>
            {isTreasurer && !m.isTreasurer && m.id !== currentUser.id && (
              confirmKick === m.id ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button onClick={() => kickMember(m.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: T.red, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Remove</button>
                  <button onClick={() => setConfirmKick(null)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: T.bg, color: T.secondary, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmKick(m.id)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 500, color: T.tertiary, cursor: "pointer" }}>Remove</button>
              )
            )}
          </div>
        ))}
      </div>

      {isTreasurer && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.secondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Settings</h3>
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "start", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Smart Balance</div>
                <div style={{ fontSize: 14, color: T.secondary, lineHeight: 1.6 }}>
                  {group.smartSettle
                    ? "Debts are optimized across the group to minimize total payments. Fewer Venmo requests, less hassle for everyone."
                    : "Each expense creates a direct debt to whoever paid. Easier to trace where each charge comes from."
                  }
                </div>
                {!group.smartSettle && (
                  <div style={{ fontSize: 13, color: T.blue, marginTop: 8, fontWeight: 500 }}>
                    Turning this on can reduce {group.members.length * 2}+ payments down to {group.members.length - 1} or fewer
                  </div>
                )}
              </div>
              <button onClick={() => setGroup(prev => ({ ...prev, smartSettle: !prev.smartSettle }))} style={{
                width: 52, height: 32, borderRadius: 16, border: "none", cursor: "pointer",
                background: group.smartSettle ? T.green : "rgba(0,0,0,0.1)",
                position: "relative", transition: "background 0.3s", flexShrink: 0, marginTop: 2,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 13, background: "#fff",
                  position: "absolute", top: 3,
                  left: group.smartSettle ? 23 : 3,
                  transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── User Switcher ─── */
function UserSwitcher({ group, currentUser, setCurrentUser }) {
  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      background: "rgba(30,30,30,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      color: "#fff", borderRadius: 14, padding: "10px 16px",
      display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 500,
      zIndex: 100, boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
    }}>
      <span style={{ color: "rgba(255,255,255,0.5)" }}>Viewing as</span>
      <select value={currentUser.id} onChange={e => setCurrentUser(group.members.find(m => m.id === e.target.value))} style={{
        background: "rgba(255,255,255,0.12)", color: "#fff", border: "none", borderRadius: 8,
        padding: "5px 10px", fontFamily: T.font, fontSize: 13, fontWeight: 600,
      }}>
        {group.members.map(m => <option key={m.id} value={m.id}>{m.name}{m.isTreasurer ? " (Treasurer)" : ""}</option>)}
      </select>
    </div>
  );
}

/* ─── Main ─── */
export default function DivvyUp() {
  const [screen, setScreen] = useState("welcome");
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState("dashboard");

  const group = groups.find(g => g.id === activeGroupId);
  const isTreasurer = currentUser?.isTreasurer || false;

  const setGroup = (updater) => {
    setGroups(prev => prev.map(g => g.id === activeGroupId ? (typeof updater === "function" ? updater(g) : updater) : g));
  };

  const handleCreate = (groupName, userName, venmo) => {
    const user = { id: uid(), name: userName, venmo, isTreasurer: true };
    const demoMembers = [
      { id: uid(), name: "Alex", venmo: "@alex-v", isTreasurer: false },
      { id: uid(), name: "Jordan", venmo: "@jordanp", isTreasurer: false },
      { id: uid(), name: "Sam", venmo: "@samwise", isTreasurer: false },
      { id: uid(), name: "Riley", venmo: "", isTreasurer: false },
      { id: uid(), name: "Casey", venmo: "@caseyg", isTreasurer: false },
      { id: uid(), name: "Morgan", venmo: "", isTreasurer: false },
      { id: uid(), name: "Taylor", venmo: "@taylork", isTreasurer: false },
      { id: uid(), name: "Jamie", venmo: "@jamiej", isTreasurer: false },
      { id: uid(), name: "Quinn", venmo: "@quinnr", isTreasurer: false },
    ];
    const g = { id: uid(), name: groupName, code: groupCode(), members: [user, ...demoMembers], rent: null, utilities: [], expenses: [], payments: [], smartSettle: false };
    setGroups(prev => [...prev, g]); setActiveGroupId(g.id); setCurrentUser(user); setScreen("app");
  };

  const handleJoin = (groupId, userName, venmo) => {
    const user = { id: uid(), name: userName, venmo, isTreasurer: false };
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: [...g.members, user] } : g));
    setActiveGroupId(groupId); setCurrentUser(user); setScreen("app");
  };

  const allCharges = useMemo(() => {
    if (!group) return [];
    const charges = [];
    const treasurer = group.members.find(m => m.isTreasurer);
    const treasurerId = treasurer?.id;
    if (group.rent?.splits) charges.push({ id: group.rent.id, type: "rent", description: "Rent", amount: group.rent.amount, splits: group.rent.splits, recurring: group.rent.recurring, paidBy: treasurerId });
    group.utilities.forEach(u => charges.push({ id: u.id, type: "utility", description: u.name, amount: u.amount, splits: u.splits, recurring: u.recurring, paidBy: treasurerId }));
    group.expenses.filter(e => e.status === "approved").forEach(e => charges.push({ id: e.id, type: "expense", description: e.description, amount: e.amount, splits: e.splits, submittedByName: e.submittedByName, paidBy: e.submittedBy, recurring: false }));
    return charges;
  }, [group]);

  const pendingExpenses = group?.expenses.filter(e => e.status === "pending").length || 0;
  const pendingPayments = currentUser ? (group?.payments || []).filter(p => p.toId === currentUser.id && p.status === "pending").length : 0;

  const treasurerTabs = [
    { id: "dashboard", label: "Home", badge: pendingPayments || null },
    { id: "rent", label: "Rent" },
    { id: "utilities", label: "Bills" },
    { id: "expenses", label: "Expenses", badge: pendingExpenses || null },
    { id: "settle", label: "Settle" },
    { id: "members", label: "Group" },
  ];
  const memberTabs = [
    { id: "dashboard", label: "Home", badge: pendingPayments || null },
    { id: "expenses", label: "Expenses", badge: pendingExpenses || null },
    { id: "settle", label: "Settle" },
    { id: "members", label: "Group" },
  ];

  return (
    <>
      <link href={FONT_URL} rel="stylesheet" />
      <div style={{ fontFamily: T.font, color: T.text, background: T.bg, minHeight: "100vh" }}>
        {screen === "welcome" && <WelcomeScreen onStart={() => setScreen("create")} onJoin={() => setScreen("join")} />}
        {screen === "create" && <CreateGroupScreen onBack={() => setScreen("welcome")} onCreate={handleCreate} />}
        {screen === "join" && <JoinGroupScreen onBack={() => setScreen("welcome")} onJoin={handleJoin} groups={groups} />}

        {screen === "app" && group && currentUser && (
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "12px 20px", paddingBottom: 80 }}>
            <div style={{ padding: "12px 0 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>divvyup</h1>
                <div style={{ fontSize: 13, color: T.tertiary, fontWeight: 500, marginTop: 1 }}>{group.name}</div>
              </div>
              <button onClick={() => { setScreen("welcome"); setActiveGroupId(null); setCurrentUser(null); setTab("dashboard"); }} style={{
                background: T.bg, border: "none", borderRadius: 20,
                padding: "7px 14px", fontSize: 13, color: T.secondary, cursor: "pointer", fontWeight: 500, fontFamily: T.font,
              }}>Leave</button>
            </div>

            <TabBar tabs={isTreasurer ? treasurerTabs : memberTabs} active={tab} onChange={setTab} />

            {tab === "dashboard" && <DashboardTab group={group} currentUser={currentUser} allCharges={allCharges} setGroup={setGroup} setTab={setTab} />}
            {tab === "rent" && isTreasurer && <RentTab group={group} setGroup={setGroup} />}
            {tab === "utilities" && isTreasurer && <UtilitiesTab group={group} setGroup={setGroup} />}
            {tab === "expenses" && <ExpensesTab group={group} setGroup={setGroup} currentUser={currentUser} isTreasurer={isTreasurer} />}
            {tab === "settle" && <SettleTab group={group} setGroup={setGroup} allCharges={allCharges} currentUser={currentUser} />}
            {tab === "members" && <MembersTab group={group} setGroup={setGroup} currentUser={currentUser} isTreasurer={isTreasurer} />}

            <UserSwitcher group={group} currentUser={currentUser} setCurrentUser={setCurrentUser} />
          </div>
        )}
      </div>
    </>
  );
}
