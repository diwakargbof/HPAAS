// Shared upsell/demo body for every Inventory sub-page when the tenant
// hasn't purchased the module — shown instead of a raw 403, same convention
// as pricing/locked.tsx.

const DEMO_ROWS = [
  { name: "Kaju Katli", qty: 4, unit: "kg", daysLeft: 2, suggestedQty: 10, urgency: "high" },
  { name: "Motichoor Ladoo", qty: 18, unit: "kg", daysLeft: 9, suggestedQty: 6, urgency: "medium" },
  { name: "Fruit Cake", qty: 40, unit: "pcs", daysLeft: 25, suggestedQty: 0, urgency: "low" },
];

const URGENCY_BADGE: Record<string, string> = { high: "badge-rejected", medium: "badge-pending", low: "badge-sent" };

export default function InventoryLocked() {
  return (
    <>
      <div className="page-title">Inventory 🔒 — Demo</div>
      <div className="page-sub">Know how long your stock lasts and what to reorder, before you run out.</div>

      <div className="notice" style={{ marginBottom: 20 }}>
        This is a premium add-on, not enabled on your account yet — contact your HPAS admin to
        purchase and unlock it. Everything below is a preview using example data, not yours.
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">What you&apos;d see on Reorder Suggestions</div>
        <p className="muted" style={{ marginBottom: 14 }}>
          Inventory looks at your actual sales pace per item and estimates how many days of stock
          are left, then suggests how much to reorder and by when. Nothing reorders
          automatically — you review and act, with a manual override always available.
        </p>
        <div style={{ opacity: 0.55, pointerEvents: "none" }}>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">In stock</th>
                <th className="num">Days left</th>
                <th className="num">Suggested order</th>
                <th>Urgency</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ROWS.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td className="num">{r.qty} {r.unit}</td>
                  <td className="num">{r.daysLeft}</td>
                  <td className="num">{r.suggestedQty} {r.unit}</td>
                  <td>
                    <span className={`badge ${URGENCY_BADGE[r.urgency]}`}>{r.urgency}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
