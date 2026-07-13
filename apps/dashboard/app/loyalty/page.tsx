"use client";

// The Counter — built for a tablet at the till. Type the customer's number
// and you instantly know who they are, what they love, what to suggest
// (with a line to say out loud), and their loyalty points. Award or redeem
// points and send a personal WhatsApp note from the same screen.

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "../../lib/api";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

interface CounterCard {
  profileId: string;
  name: string | null;
  phone: string;
  lastVisitDays: number | null;
  favoriteItem: string | null;
  loyalty: { balance: number; valueRupees: number };
  recommendations: Array<{
    item: string;
    category: string;
    price: number | null;
    reason: string;
    signal: string;
  }>;
  pitch: string;
  activeFestival: string | null;
}

interface LedgerEntry {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
}

interface DirectMsg {
  id: string;
  body: string;
  status: string;
  sentAt: string;
}

const SIGNAL_LABEL: Record<string, string> = {
  due_reorder: "their usual",
  pairs_with: "pairs well",
  category_new: "new for them",
  festival: "festive",
};

export default function CounterPage() {
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState<CounterCard | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [recentMessages, setRecentMessages] = useState<DirectMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [points, setPoints] = useState(50);
  const [pointsReason, setPointsReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newName, setNewName] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newItemQty, setNewItemQty] = useState<Record<string, number>>({});

  useEffect(() => {
    api<{ items: MenuItem[] }>("/menu")
      .then((r) => setMenuItems(r.items.filter((it) => it.available)))
      .catch(() => setMenuItems([]));
  }, []);

  const newSelectedItems = menuItems
    .filter((it) => (newItemQty[it.id] ?? 0) > 0)
    .map((it) => ({ name: it.name, category: it.category, qty: newItemQty[it.id], unitPrice: it.price }));
  const newSelectedTotal = newSelectedItems.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);

  async function lookup(refresh = false) {
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    setNotice("");
    setIsNewCustomer(false);
    if (!refresh) {
      setCard(null);
      setLedger([]);
      setRecentMessages([]);
    }
    try {
      const r = await api<{ card: CounterCard; ledger: LedgerEntry[]; recentMessages: DirectMsg[] }>(
        `/counter?phone=${encodeURIComponent(phone.trim())}${refresh ? "&refresh=1" : ""}`
      );
      setCard(r.card);
      setLedger(r.ledger);
      setRecentMessages(r.recentMessages);
    } catch (e) {
      if (e instanceof Error && (e as Error & { status?: number }).status === 404) {
        setIsNewCustomer(true);
        setNewName("");
        setNewItemQty({});
        setLoading(false);
        return;
      }
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function adjustPoints(sign: 1 | -1) {
    if (!card || !points) return;
    setBusy("points");
    setError("");
    try {
      const r = await api<{ balance: number }>("/loyalty/adjust", {
        method: "POST",
        body: JSON.stringify({
          profileId: card.profileId,
          points: sign * Math.abs(points),
          reason: pointsReason.trim() || (sign > 0 ? "Bonus at the counter" : "Redeemed at the counter"),
        }),
      });
      setCard({ ...card, loyalty: { ...card.loyalty, balance: r.balance } });
      setPointsReason("");
      setNotice(sign > 0 ? `Added ${Math.abs(points)} points.` : `Redeemed ${Math.abs(points)} points.`);
      lookup(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function sendMessage() {
    if (!card || !message.trim()) return;
    setBusy("message");
    setError("");
    try {
      await api("/direct-message", {
        method: "POST",
        body: JSON.stringify({ profileId: card.profileId, body: message.trim() }),
      });
      setNotice("Message sent.");
      setMessage("");
      lookup(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function createNewCustomer() {
    if (!newName.trim()) return;
    setBusy("new-customer");
    setError("");
    try {
      await api("/counter/new-customer", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim(), name: newName.trim(), items: newSelectedItems }),
      });
      setIsNewCustomer(false);
      setNotice(`Added ${newName.trim()} to your customers.`);
      lookup(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  return (
    <AppShell>
      <div className="page-title">At the Counter</div>
      <div className="page-sub">
        Type a customer&apos;s number when they walk up — know them instantly, suggest the right thing, reward them.
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form
          style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
          onSubmit={(e) => {
            e.preventDefault();
            lookup(false);
          }}
        >
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Customer phone, e.g. 98100 12345"
            style={{ maxWidth: 320 }}
          />
          <button className="btn btn-primary" disabled={loading || !phone.trim()} type="submit">
            {loading ? "Looking up…" : "Look up"}
          </button>
        </form>
        {error && <div className="error-text" style={{ marginTop: 10 }}>{error}</div>}
        {notice && <div className="good-text" style={{ marginTop: 10 }}>{notice}</div>}
      </div>

      {isNewCustomer && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">New customer — {phone.trim()}</div>
          <div className="muted" style={{ marginBottom: 14 }}>
            No one's bought from you with this number yet. Add their name (and today's order, if
            they're buying) to create their profile.
          </div>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Customer name"
            style={{ maxWidth: 280, marginBottom: 14 }}
          />
          {menuItems.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="muted" style={{ marginBottom: 6 }}>
                Today's order (optional — ₹{newSelectedTotal} so far)
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  maxHeight: 160,
                  overflowY: "auto",
                  border: "1px solid var(--border, #e2e2e2)",
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                {menuItems.map((it) => (
                  <div
                    key={it.id}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", border: "1px solid var(--border, #e2e2e2)", borderRadius: 6 }}
                  >
                    <span style={{ fontSize: "0.85rem" }}>
                      {it.name} <span className="muted">₹{it.price}</span>
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={newItemQty[it.id] ?? 0}
                      onChange={(e) =>
                        setNewItemQty((prev) => ({ ...prev, [it.id]: Math.max(0, Number(e.target.value)) }))
                      }
                      style={{ width: 50 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            className="btn btn-primary"
            disabled={busy === "new-customer" || !newName.trim()}
            onClick={createNewCustomer}
          >
            {busy === "new-customer" ? "Adding…" : "Add customer"}
          </button>
        </div>
      )}

      {card && (
        <>
          <div className="grid grid-2">
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div className="stat-label">Customer</div>
                  <div className="stat-value" style={{ fontSize: "1.6rem" }}>{card.name ?? "No name yet"}</div>
                  <div className="muted">{card.phone}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="stat-label">Points</div>
                  <div className="stat-value" style={{ fontSize: "1.6rem" }}>{card.loyalty.balance}</div>
                  <div className="muted">≈ ₹{card.loyalty.valueRupees}</div>
                </div>
              </div>
              <table style={{ marginTop: 10 }}>
                <tbody>
                  <tr>
                    <td className="muted">Last visit</td>
                    <td>{card.lastVisitDays === null ? "—" : `${card.lastVisitDays} days ago`}</td>
                  </tr>
                  <tr>
                    <td className="muted">Favorite</td>
                    <td>{card.favoriteItem ?? "—"}</td>
                  </tr>
                  {card.activeFestival && (
                    <tr>
                      <td className="muted">Coming up</td>
                      <td>{card.activeFestival}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="section-title">Suggest today</div>
              <div className="msg-preview" style={{ maxWidth: "none", fontStyle: "italic" }}>
                💬 {card.pitch}
              </div>
              {card.recommendations.length === 0 && (
                <div className="muted">Nothing specific — greet them and ask what they feel like today.</div>
              )}
              {card.recommendations.map((r) => (
                <div key={r.item} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                  <strong>{r.item}</strong>
                  {r.price !== null && <span className="muted">₹{r.price}</span>}
                  <span className="badge badge-type">{SIGNAL_LABEL[r.signal] ?? r.signal}</span>
                  <span className="muted" style={{ fontSize: "0.85rem" }}>{r.reason}</span>
                </div>
              ))}
              <button className="btn btn-ghost" style={{ marginTop: 12 }} disabled={loading} onClick={() => lookup(true)}>
                Refresh suggestions
              </button>
            </div>

            <div className="card">
              <div className="section-title">Points</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="number"
                  min={1}
                  value={points}
                  onChange={(e) => setPoints(Math.max(1, Number(e.target.value) || 1))}
                  style={{ width: 100 }}
                />
                <input
                  type="text"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  placeholder="Reason (optional)"
                  style={{ maxWidth: 220 }}
                />
                <button className="btn btn-primary" disabled={busy === "points"} onClick={() => adjustPoints(1)}>
                  Award
                </button>
                <button className="btn btn-ghost" disabled={busy === "points"} onClick={() => adjustPoints(-1)}>
                  Redeem
                </button>
              </div>
              <table style={{ marginTop: 14 }}>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Reason</th>
                    <th className="num">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan={3} className="muted">No points activity yet.</td>
                    </tr>
                  )}
                  {ledger.map((l) => (
                    <tr key={l.id}>
                      <td className="muted">{new Date(l.createdAt).toLocaleDateString()}</td>
                      <td>{l.reason}</td>
                      <td className="num" style={{ color: l.points >= 0 ? "var(--good)" : "var(--bad)" }}>
                        {l.points >= 0 ? `+${l.points}` : l.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="section-title">Send a personal note</div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`e.g. "Namaste! Your favorite ${card.favoriteItem ?? "sweets"} are fresh today — see you soon?"`}
              />
              <div style={{ marginTop: 10 }}>
                <button className="btn btn-primary" disabled={busy === "message" || !message.trim()} onClick={sendMessage}>
                  {busy === "message" ? "Sending…" : "Send WhatsApp"}
                </button>
              </div>
              {recentMessages.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="stat-label" style={{ marginBottom: 6 }}>Recent notes</div>
                  {recentMessages.map((m) => (
                    <div className="msg-preview" key={m.id}>
                      {m.body}
                      <div className="muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>
                        {new Date(m.sentAt).toLocaleString()} · {m.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
