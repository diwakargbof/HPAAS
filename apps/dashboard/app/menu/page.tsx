"use client";

// The Menu — what the shop actually sells. Recommendations only ever
// suggest items on this list (and in stock), and campaign copy can talk
// about real new items. One tap imports it from your own sales history.

import { useCallback, useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { api } from "../../lib/api";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");

  const load = useCallback(() => {
    api<{ items: MenuItem[] }>("/menu")
      .then((r) => setItems(r.items))
      .catch((e) => setError(String(e.message ?? e)));
  }, []);
  useEffect(load, [load]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy("add");
    setError("");
    try {
      await api("/menu", {
        method: "POST",
        body: JSON.stringify({ name, category: category || "uncategorized", price: Number(price) || 0 }),
      });
      setName("");
      setCategory("");
      setPrice("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function toggle(item: MenuItem) {
    setBusy(item.id);
    try {
      await api(`/menu/${item.id}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ available: !item.available }),
      });
      setItems((list) => list?.map((i) => (i.id === item.id ? { ...i, available: !i.available } : i)) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function remove(item: MenuItem) {
    setBusy(item.id);
    try {
      await api(`/menu/${item.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function importFromHistory() {
    setBusy("import");
    setError("");
    setNotice("");
    try {
      const r = await api<{ imported: number; skipped: number }>("/menu/import-from-history", {
        method: "POST",
      });
      setNotice(
        r.imported > 0
          ? `Imported ${r.imported} items from your sales history${r.skipped ? ` (${r.skipped} already on the menu)` : ""}.`
          : "Everything you've ever sold is already on the menu."
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  const grouped = new Map<string, MenuItem[]>();
  for (const item of items ?? []) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }

  return (
    <AppShell>
      <div className="page-title">Menu</div>
      <div className="page-sub">
        What you sell, with prices. Counter suggestions and campaigns only ever mention items that are on this
        list and in stock.
      </div>
      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Add an item</div>
        <form style={{ display: "flex", gap: 10, flexWrap: "wrap" }} onSubmit={addItem}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" style={{ maxWidth: 220 }} />
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (e.g. sweets)" style={{ maxWidth: 200 }} />
          <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price ₹" style={{ maxWidth: 120 }} />
          <button className="btn btn-primary" disabled={busy === "add" || !name.trim()} type="submit">
            Add
          </button>
          <button className="btn btn-ghost" disabled={busy === "import"} type="button" onClick={importFromHistory}>
            {busy === "import" ? "Importing…" : "Import from sales history"}
          </button>
        </form>
      </div>

      {!items ? (
        <div className="muted">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card">
          <span className="muted">
            No items yet — add them above, or use &quot;Import from sales history&quot; to build the menu from what
            you&apos;ve already sold.
          </span>
        </div>
      ) : (
        [...grouped.entries()].map(([cat, list]) => (
          <div className="card" key={cat} style={{ marginBottom: 14 }}>
            <div className="section-title" style={{ textTransform: "capitalize" }}>{cat}</div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num">Price</th>
                  <th>In stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr key={item.id} style={{ opacity: item.available ? 1 : 0.5 }}>
                    <td>{item.name}</td>
                    <td className="num">₹{item.price}</td>
                    <td>
                      <label className="toggle">
                        <input type="checkbox" checked={item.available} disabled={busy === item.id} onChange={() => toggle(item)} />
                        <span className="slider" />
                      </label>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn btn-danger"
                        style={{ padding: "4px 10px", fontSize: "0.82rem" }}
                        disabled={busy === item.id}
                        onClick={() => remove(item)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </AppShell>
  );
}
