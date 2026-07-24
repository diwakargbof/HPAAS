"use client";

// Inventory > Items — a stock-augmented view of the existing menu catalog
// (no separate item list), but a full editor in its own right: add a new
// item, edit every column (name/category/price/tags/unit/qty/reorder point/
// lead time) inline, upload a stock-count file in whatever format you have
// (CSV/TSV/JSON/Excel), and see at a glance which items need attention via
// row color coding from the reorder engine's urgency.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import AppShell from "../../components/AppShell";
import { api, downloadFile } from "../../lib/api";
import InventoryLocked from "./locked";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  tags: string[];
  trackStock: boolean;
  currentQty: number;
  unit: string;
  reorderPoint: number | null;
  leadTimeDays: number | null;
  lastRestockedAt: string | null;
}

interface ReorderSuggestion {
  menuItemId: string;
  urgency: "low" | "medium" | "high";
  daysOfStockLeft: number | null;
}

const TAG_PRESETS = ["Ordered", "Will Order", "Flagged", "Backordered"];

const URGENCY_ROW_STYLE: Record<string, CSSProperties> = {
  high: { background: "rgba(198, 40, 40, 0.08)", borderLeft: "3px solid var(--bad)" },
  medium: { background: "rgba(160, 90, 0, 0.08)", borderLeft: "3px solid #a05a00" },
  low: { background: "rgba(46, 125, 50, 0.06)", borderLeft: "3px solid var(--good)" },
};

const URGENCY_BADGE: Record<string, string> = { high: "badge-rejected", medium: "badge-pending", low: "badge-sent" };

interface DraftItem {
  name: string;
  category: string;
  price: string;
  unit: string;
  qty: string;
  reorderPoint: string;
  leadTimeDays: string;
  tags: string[];
  tagInput: string;
}

function toDraft(item: InventoryItem): DraftItem {
  return {
    name: item.name,
    category: item.category,
    price: String(item.price),
    unit: item.unit,
    qty: String(item.currentQty),
    reorderPoint: item.reorderPoint === null ? "" : String(item.reorderPoint),
    leadTimeDays: item.leadTimeDays === null ? "" : String(item.leadTimeDays),
    tags: [...item.tags],
    tagInput: "",
  };
}

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryItem[] | null>(null);
  const [urgencyByItem, setUrgencyByItem] = useState<Record<string, ReorderSuggestion>>({});
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState<DraftItem | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<DraftItem>(toDraft({
    id: "", name: "", category: "", price: 0, tags: [], trackStock: true, currentQty: 0,
    unit: "unit", reorderPoint: null, leadTimeDays: null, lastRestockedAt: null,
  }));

  function load() {
    api<{ items: InventoryItem[] }>("/inventory/items")
      .then((r) => setItems(r.items))
      .catch((e: Error & { status?: number }) => {
        if (e.status === 403) setLocked(true);
        else setError(String(e.message ?? e));
      });
    api<{ suggestions: ReorderSuggestion[] }>("/inventory/reorder-suggestions")
      .then((r) => setUrgencyByItem(Object.fromEntries(r.suggestions.map((s) => [s.menuItemId, s]))))
      .catch(() => {});
  }

  useEffect(load, []);

  async function toggleTrackStock(item: InventoryItem) {
    setBusy(item.id);
    try {
      await api(`/inventory/items/${item.id}`, { method: "PATCH", body: JSON.stringify({ trackStock: !item.trackStock }) });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function quickAdjust(item: InventoryItem, delta: number) {
    setBusy(item.id);
    try {
      await api(`/inventory/items/${item.id}/adjust`, {
        method: "POST",
        body: JSON.stringify({ delta, reason: delta > 0 ? "Quick adjust +1" : "Quick adjust -1" }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  function startEdit(item: InventoryItem) {
    setEditingId(item.id);
    setDraft(toDraft(item));
  }

  function cancelEdit() {
    setEditingId("");
    setDraft(null);
  }

  function addDraftTag(target: DraftItem, setTarget: (d: DraftItem) => void, tag: string) {
    const t = tag.trim();
    if (!t || target.tags.includes(t)) return;
    setTarget({ ...target, tags: [...target.tags, t], tagInput: "" });
  }

  function removeDraftTag(target: DraftItem, setTarget: (d: DraftItem) => void, tag: string) {
    setTarget({ ...target, tags: target.tags.filter((t) => t !== tag) });
  }

  async function saveEdit(item: InventoryItem) {
    if (!draft) return;
    setBusy(item.id);
    setError("");
    try {
      await api(`/inventory/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: draft.name.trim() || item.name,
          category: draft.category.trim() || item.category,
          price: Math.max(0, Number(draft.price) || 0),
          unit: draft.unit.trim() || "unit",
          reorderPoint: draft.reorderPoint.trim() === "" ? null : Math.max(0, Number(draft.reorderPoint)),
          leadTimeDays: draft.leadTimeDays.trim() === "" ? null : Math.max(0, Math.round(Number(draft.leadTimeDays))),
          tags: draft.tags,
        }),
      });
      const qty = Math.max(0, Number(draft.qty) || 0);
      if (qty !== item.currentQty) {
        await api(`/inventory/items/${item.id}/set-quantity`, {
          method: "POST",
          body: JSON.stringify({ qty, reason: "Manual quantity edit" }),
        });
      }
      cancelEdit();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function addItem() {
    if (!addDraft.name.trim()) return;
    setBusy("add");
    setError("");
    try {
      await api("/inventory/items", {
        method: "POST",
        body: JSON.stringify({
          name: addDraft.name.trim(),
          category: addDraft.category.trim() || "uncategorized",
          price: Math.max(0, Number(addDraft.price) || 0),
          unit: addDraft.unit.trim() || "unit",
          initialQty: Math.max(0, Number(addDraft.qty) || 0),
          reorderPoint: addDraft.reorderPoint.trim() === "" ? null : Math.max(0, Number(addDraft.reorderPoint)),
          leadTimeDays: addDraft.leadTimeDays.trim() === "" ? null : Math.max(0, Math.round(Number(addDraft.leadTimeDays))),
          tags: addDraft.tags,
        }),
      });
      setAddDraft(toDraft({
        id: "", name: "", category: "", price: 0, tags: [], trackStock: true, currentQty: 0,
        unit: "unit", reorderPoint: null, leadTimeDays: null, lastRestockedAt: null,
      }));
      setAddOpen(false);
      setNotice(`Added "${addDraft.name.trim()}" and started tracking its stock.`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api<{ rowsProcessed: number; itemsCreated: number; errors: Array<{ rowNumber: number; reason: string }> }>(
        "/inventory/items/import",
        { method: "POST", body: form }
      );
      setNotice(
        `Processed ${result.rowsProcessed} row${result.rowsProcessed === 1 ? "" : "s"}` +
          (result.itemsCreated > 0 ? `, created ${result.itemsCreated} new item${result.itemsCreated === 1 ? "" : "s"}` : "") +
          (result.errors.length > 0 ? ` — ${result.errors.length} row(s) skipped (see below).` : ".")
      );
      if (result.errors.length > 0) {
        setError(result.errors.map((e) => `Row ${e.rowNumber}: ${e.reason}`).join("; "));
      }
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (locked) {
    return (
      <AppShell>
        <InventoryLocked />
      </AppShell>
    );
  }

  const filtered = (items ?? []).filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.tags.some((t) => t.toLowerCase().includes(q));
  });

  return (
    <AppShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="page-title">Inventory Items</div>
          <div className="page-sub">
            Add items, edit every field inline, and tag order/stock status — rows are colored by how
            urgently they need reordering.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={() => downloadFile("/inventory/items/export.csv", "inventory-stock-count.csv")}>
            Download CSV
          </button>
          <button className="btn btn-ghost" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? "Uploading…" : "Upload file (CSV/Excel/JSON)"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,.json,.xlsx,.xls"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
            }}
          />
          <button className="btn btn-primary" onClick={() => setAddOpen((o) => !o)}>
            {addOpen ? "Cancel" : "+ Add Item"}
          </button>
        </div>
      </div>
      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      {addOpen && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title">Add an item</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <input placeholder="Item name" value={addDraft.name} onChange={(e) => setAddDraft({ ...addDraft, name: e.target.value })} style={{ maxWidth: 200 }} />
            <input placeholder="Category" value={addDraft.category} onChange={(e) => setAddDraft({ ...addDraft, category: e.target.value })} style={{ maxWidth: 160 }} />
            <input type="number" min={0} placeholder="Price ₹" value={addDraft.price} onChange={(e) => setAddDraft({ ...addDraft, price: e.target.value })} style={{ maxWidth: 100 }} />
            <input placeholder="Unit (kg, pcs...)" value={addDraft.unit} onChange={(e) => setAddDraft({ ...addDraft, unit: e.target.value })} style={{ maxWidth: 120 }} />
            <input type="number" min={0} placeholder="Initial qty" value={addDraft.qty} onChange={(e) => setAddDraft({ ...addDraft, qty: e.target.value })} style={{ maxWidth: 110 }} />
            <input type="number" min={0} placeholder="Reorder point (auto)" value={addDraft.reorderPoint} onChange={(e) => setAddDraft({ ...addDraft, reorderPoint: e.target.value })} style={{ maxWidth: 150 }} />
            <input type="number" min={0} placeholder="Lead time days" value={addDraft.leadTimeDays} onChange={(e) => setAddDraft({ ...addDraft, leadTimeDays: e.target.value })} style={{ maxWidth: 130 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span className="muted" style={{ fontSize: "0.85rem" }}>Tags:</span>
            {addDraft.tags.map((t) => (
              <span key={t} className="badge badge-type" style={{ cursor: "pointer" }} onClick={() => removeDraftTag(addDraft, setAddDraft, t)}>
                {t} ×
              </span>
            ))}
            {TAG_PRESETS.filter((p) => !addDraft.tags.includes(p)).map((p) => (
              <button key={p} className="btn btn-ghost" style={{ padding: "2px 10px", fontSize: "0.8rem" }} type="button" onClick={() => addDraftTag(addDraft, setAddDraft, p)}>
                + {p}
              </button>
            ))}
            <input
              placeholder="custom tag…"
              value={addDraft.tagInput}
              onChange={(e) => setAddDraft({ ...addDraft, tagInput: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addDraftTag(addDraft, setAddDraft, addDraft.tagInput);
                }
              }}
              style={{ width: 120 }}
            />
          </div>
          <button className="btn btn-primary" disabled={busy === "add" || !addDraft.name.trim()} onClick={addItem}>
            {busy === "add" ? "Adding…" : "Add item"}
          </button>
        </div>
      )}

      <input
        placeholder="Search by name or tag…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: 280, marginBottom: 16 }}
      />

      {!items ? (
        <div className="muted">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="muted">No items match.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th className="num">Price</th>
                <th>Tags</th>
                <th>Track stock</th>
                <th className="num">Qty</th>
                <th>Unit</th>
                <th className="num">Reorder point</th>
                <th className="num">Lead time</th>
                <th>Status</th>
                <th>Last restocked</th>
                <th className="sticky-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const editing = editingId === item.id;
                const urgency = urgencyByItem[item.id]?.urgency;
                const rowStyle = item.trackStock && urgency ? URGENCY_ROW_STYLE[urgency] : undefined;
                const d = editing ? draft! : null;

                return (
                  <tr key={item.id} style={rowStyle}>
                    <td>{editing ? <input value={d!.name} onChange={(e) => setDraft({ ...d!, name: e.target.value })} style={{ width: 140 }} /> : item.name}</td>
                    <td>{editing ? <input value={d!.category} onChange={(e) => setDraft({ ...d!, category: e.target.value })} style={{ width: 110 }} /> : <span className="muted">{item.category}</span>}</td>
                    <td className="num">
                      {editing ? (
                        <input type="number" min={0} value={d!.price} onChange={(e) => setDraft({ ...d!, price: e.target.value })} style={{ width: 80 }} />
                      ) : (
                        `₹${item.price}`
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", maxWidth: 220 }}>
                          {d!.tags.map((t) => (
                            <span key={t} className="badge badge-type" style={{ cursor: "pointer" }} onClick={() => removeDraftTag(d!, setDraft, t)}>
                              {t} ×
                            </span>
                          ))}
                          {TAG_PRESETS.filter((p) => !d!.tags.includes(p)).map((p) => (
                            <button key={p} className="btn btn-ghost" style={{ padding: "1px 6px", fontSize: "0.75rem" }} type="button" onClick={() => addDraftTag(d!, setDraft, p)}>
                              +{p}
                            </button>
                          ))}
                          <input
                            placeholder="custom…"
                            value={d!.tagInput}
                            onChange={(e) => setDraft({ ...d!, tagInput: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addDraftTag(d!, setDraft, d!.tagInput);
                              }
                            }}
                            style={{ width: 80, fontSize: "0.8rem" }}
                          />
                        </div>
                      ) : item.tags.length === 0 ? (
                        <span className="muted">—</span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {item.tags.map((t) => (
                            <span key={t} className="badge badge-type">{t}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <label className="toggle">
                        <input type="checkbox" checked={item.trackStock} disabled={busy === item.id} onChange={() => toggleTrackStock(item)} />
                        <span className="slider" />
                      </label>
                    </td>
                    <td className="num">
                      {editing ? (
                        <input type="number" min={0} value={d!.qty} onChange={(e) => setDraft({ ...d!, qty: e.target.value })} style={{ width: 80 }} />
                      ) : item.trackStock ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost" style={{ padding: "2px 8px" }} disabled={busy === item.id} onClick={() => quickAdjust(item, -1)}>−</button>
                          {item.currentQty}
                          <button className="btn btn-ghost" style={{ padding: "2px 8px" }} disabled={busy === item.id} onClick={() => quickAdjust(item, 1)}>+</button>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>{editing ? <input value={d!.unit} onChange={(e) => setDraft({ ...d!, unit: e.target.value })} style={{ width: 70 }} /> : item.unit}</td>
                    <td className="num">
                      {editing ? (
                        <input type="number" min={0} placeholder="auto" value={d!.reorderPoint} onChange={(e) => setDraft({ ...d!, reorderPoint: e.target.value })} style={{ width: 80 }} />
                      ) : (
                        item.reorderPoint ?? <span className="muted">auto</span>
                      )}
                    </td>
                    <td className="num">
                      {editing ? (
                        <input type="number" min={0} placeholder="default" value={d!.leadTimeDays} onChange={(e) => setDraft({ ...d!, leadTimeDays: e.target.value })} style={{ width: 80 }} />
                      ) : (
                        item.leadTimeDays ?? <span className="muted">default</span>
                      )}
                    </td>
                    <td>
                      {item.trackStock && urgency ? (
                        <span className={`badge ${URGENCY_BADGE[urgency]}`}>{urgency}</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="muted">{item.lastRestockedAt ? new Date(item.lastRestockedAt).toLocaleDateString() : "—"}</td>
                    <td className="sticky-actions-col" style={rowStyle}>
                      {editing ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-primary"
                            style={{ height: 32, padding: "0 14px", fontSize: "0.85rem" }}
                            disabled={busy === item.id}
                            onClick={() => saveEdit(item)}
                          >
                            {busy === item.id ? "Saving…" : "Done"}
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ height: 32, padding: "0 14px", fontSize: "0.85rem" }}
                            disabled={busy === item.id}
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-ghost"
                          style={{ height: 32, padding: "0 14px", fontSize: "0.85rem" }}
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
