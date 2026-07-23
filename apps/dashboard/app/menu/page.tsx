"use client";

// The Menu — what the shop actually sells. Recommendations only ever
// suggest items on this list (and in stock), and campaign copy can talk
// about real new items. One tap imports it from your own sales history.

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { api, downloadFile } from "../../lib/api";
import { useBusinessUnits } from "../../lib/businessUnits";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  gstRate: number | null;
  hsnCode: string | null;
  businessUnitIds: string[];
  imageUrl: string | null;
  branchPrice: number | null;
}

export default function MenuPage() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const { units: businessUnits, active: businessUnitsActive } = useBusinessUnits();
  const [filterBusinessUnitId, setFilterBusinessUnitId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [newItemUnits, setNewItemUnits] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState<{
    name: string;
    category: string;
    price: string;
    gstRate: string;
    hsnCode: string;
    businessUnitIds: Set<string>;
  } | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filterBusinessUnitId) params.set("businessUnitId", filterBusinessUnitId);
    api<{ items: MenuItem[] }>(`/menu${params.toString() ? `?${params.toString()}` : ""}`)
      .then((r) => setItems(r.items))
      .catch((e) => setError(String(e.message ?? e)));
  }, [filterBusinessUnitId]);
  useEffect(load, [load]);

  function toggleSet(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy("add");
    setError("");
    try {
      await api("/menu", {
        method: "POST",
        body: JSON.stringify({
          name,
          category: category || "uncategorized",
          price: Number(price) || 0,
          gstRate: gstRate ? Number(gstRate) : null,
          hsnCode: hsnCode.trim() || null,
          businessUnitIds: [...newItemUnits],
        }),
      });
      setName("");
      setCategory("");
      setPrice("");
      setGstRate("");
      setHsnCode("");
      setNewItemUnits(new Set());
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

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      category: item.category,
      price: String(item.price),
      gstRate: item.gstRate !== null ? String(item.gstRate) : "",
      hsnCode: item.hsnCode ?? "",
      businessUnitIds: new Set(item.businessUnitIds),
    });
  }

  async function saveEdit(itemId: string) {
    if (!editForm) return;
    setBusy(itemId);
    setError("");
    try {
      await api(`/menu/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name,
          category: editForm.category,
          price: Number(editForm.price) || 0,
          gstRate: editForm.gstRate ? Number(editForm.gstRate) : null,
          hsnCode: editForm.hsnCode.trim() || null,
          businessUnitIds: [...editForm.businessUnitIds],
        }),
      });
      setEditingId("");
      setEditForm(null);
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

  async function uploadCsv(file: File) {
    setBusy("upload");
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api<{ rowsProcessed: number; errors: Array<{ rowNumber: number; reason: string }> }>(
        "/menu/import",
        { method: "POST", body: form }
      );
      setNotice(
        `Imported ${result.rowsProcessed} item${result.rowsProcessed === 1 ? "" : "s"}` +
          (result.errors.length > 0 ? ` — ${result.errors.length} row(s) skipped (see below).` : ".")
      );
      if (result.errors.length > 0) {
        setError(result.errors.map((e) => `Row ${e.rowNumber}: ${e.reason}`).join("; "));
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function printLabels() {
    router.push(`/menu/labels?ids=${[...selected].join(",")}`);
  }

  async function uploadImage(itemId: string, file: File) {
    setBusy(itemId);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await api<{ item: MenuItem }>(`/menu/${itemId}/image`, { method: "POST", body: form });
      setItems((list) => list?.map((i) => (i.id === itemId ? r.item : i)) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function removeImage(itemId: string) {
    setBusy(itemId);
    setError("");
    try {
      const r = await api<{ item: MenuItem }>(`/menu/${itemId}/image`, { method: "DELETE" });
      setItems((list) => list?.map((i) => (i.id === itemId ? r.item : i)) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function setBranchPrice(itemId: string, priceInput: string) {
    if (!filterBusinessUnitId) return;
    setBusy(itemId);
    setError("");
    try {
      const price = priceInput.trim() ? Number(priceInput) : null;
      await api(`/menu/${itemId}/branch-price`, {
        method: "PUT",
        body: JSON.stringify({ businessUnitId: filterBusinessUnitId, price }),
      });
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

  const unitName = (id: string) => businessUnits.find((u) => u.id === id)?.name ?? id;

  return (
    <AppShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="page-title">Master Data</div>
          <div className="page-sub">
            What you sell, with prices. Counter suggestions, campaigns, and pricing recommendations only ever
            reference items on this list.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-ghost" disabled={selected.size === 0} onClick={printLabels}>
            Print Labels{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
          <button className="btn btn-ghost" onClick={() => downloadFile("/menu/export.csv", "menu.csv")}>
            Download CSV
          </button>
          <button className="btn btn-ghost" disabled={busy === "upload"} onClick={() => fileRef.current?.click()}>
            {busy === "upload" ? "Uploading…" : "Upload CSV"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadCsv(f);
            }}
          />
        </div>
      </div>
      {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Add an item</div>
        <form style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: businessUnitsActive ? 10 : 0 }} onSubmit={addItem}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" style={{ maxWidth: 220 }} />
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (e.g. sweets)" style={{ maxWidth: 200 }} />
          <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price ₹" style={{ maxWidth: 120 }} />
          <input type="number" min={0} max={28} value={gstRate} onChange={(e) => setGstRate(e.target.value)} placeholder="GST %" style={{ maxWidth: 100 }} />
          <input type="text" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} placeholder="HSN code" style={{ maxWidth: 120 }} />
          <button className="btn btn-primary" disabled={busy === "add" || !name.trim()} type="submit">
            Add
          </button>
          <button className="btn btn-ghost" disabled={busy === "import"} type="button" onClick={importFromHistory}>
            {busy === "import" ? "Importing…" : "Import from sales history"}
          </button>
        </form>
        {businessUnitsActive && (
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span className="muted" style={{ fontSize: "0.85rem" }}>Sold at (blank = every branch):</span>
            {businessUnits.map((u) => (
              <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.85rem" }}>
                <input
                  type="checkbox"
                  checked={newItemUnits.has(u.id)}
                  onChange={() => setNewItemUnits(toggleSet(newItemUnits, u.id))}
                />
                {u.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {businessUnitsActive && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span className="muted" style={{ fontSize: "0.9rem" }}>Filter by branch:</span>
          <select value={filterBusinessUnitId} onChange={(e) => setFilterBusinessUnitId(e.target.value)} style={{ width: 200 }}>
            <option value="">All branches</option>
            {businessUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

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
                  <th></th>
                  <th></th>
                  <th>Item</th>
                  <th className="num">Price</th>
                  <th>GST</th>
                  {businessUnitsActive && <th>Branches</th>}
                  {businessUnitsActive && filterBusinessUnitId && <th className="num">Branch price</th>}
                  <th>In stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) =>
                  editingId === item.id && editForm ? (
                    <tr key={item.id}>
                      <td colSpan={businessUnitsActive ? (filterBusinessUnitId ? 9 : 8) : 7}>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", padding: "6px 0" }}>
                          <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ maxWidth: 200 }} />
                          <input type="text" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} style={{ maxWidth: 160 }} />
                          <input type="number" min={0} value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} placeholder="Price ₹" style={{ maxWidth: 100 }} />
                          <input type="number" min={0} max={28} value={editForm.gstRate} onChange={(e) => setEditForm({ ...editForm, gstRate: e.target.value })} placeholder="GST %" style={{ maxWidth: 90 }} />
                          <input type="text" value={editForm.hsnCode} onChange={(e) => setEditForm({ ...editForm, hsnCode: e.target.value })} placeholder="HSN" style={{ maxWidth: 110 }} />
                          {businessUnits.map((u) => (
                            <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.85rem" }}>
                              <input
                                type="checkbox"
                                checked={editForm.businessUnitIds.has(u.id)}
                                onChange={() => setEditForm({ ...editForm, businessUnitIds: toggleSet(editForm.businessUnitIds, u.id) })}
                              />
                              {u.name}
                            </label>
                          ))}
                          <label className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: "0.82rem", cursor: "pointer" }}>
                            {item.imageUrl ? "Replace photo" : "Add photo"}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadImage(item.id, f);
                              }}
                            />
                          </label>
                          {item.imageUrl && (
                            <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: "0.82rem" }} onClick={() => removeImage(item.id)}>
                              Remove photo
                            </button>
                          )}
                          <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: "0.82rem" }} disabled={busy === item.id} onClick={() => saveEdit(item.id)}>
                            Save
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: "4px 10px", fontSize: "0.82rem" }}
                            onClick={() => {
                              setEditingId("");
                              setEditForm(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.id} style={{ opacity: item.available ? 1 : 0.5 }}>
                      <td>
                        <input type="checkbox" checked={selected.has(item.id)} onChange={() => setSelected(toggleSet(selected, item.id))} />
                      </td>
                      <td>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 6 }} />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--bg)", border: "1px solid var(--line)" }} />
                        )}
                      </td>
                      <td>{item.name}</td>
                      <td className="num">₹{item.price}</td>
                      <td className="muted">
                        {item.gstRate !== null ? `${item.gstRate}%` : "—"}
                        {item.hsnCode ? ` · ${item.hsnCode}` : ""}
                      </td>
                      {businessUnitsActive && (
                        <td className="muted" style={{ fontSize: "0.85rem" }}>
                          {item.businessUnitIds.length === 0 ? "All" : item.businessUnitIds.map(unitName).join(", ")}
                        </td>
                      )}
                      {businessUnitsActive && filterBusinessUnitId && (
                        <td className="num">
                          <input
                            type="number"
                            min={0}
                            key={`${item.id}-${item.branchPrice}`}
                            defaultValue={item.branchPrice ?? ""}
                            placeholder={`₹${item.price}`}
                            disabled={busy === item.id}
                            onBlur={(e) => setBranchPrice(item.id, e.target.value)}
                            style={{ width: 90 }}
                          />
                        </td>
                      )}
                      <td>
                        <label className="toggle">
                          <input type="checkbox" checked={item.available} disabled={busy === item.id} onChange={() => toggle(item)} />
                          <span className="slider" />
                        </label>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 10px", fontSize: "0.82rem", marginRight: 6 }}
                          disabled={busy === item.id}
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </button>
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
                  )
                )}
              </tbody>
            </table>
          </div>
        ))
      )}
    </AppShell>
  );
}
