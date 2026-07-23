// Shared upsell/teaser body for both Pricing sub-pages when the tenant
// hasn't purchased the module — shown instead of a raw 403.

export default function PricingLocked() {
  return (
    <>
      <div className="page-title">Pricing 🔒</div>
      <div className="page-sub">Turn your own sales history into smart, bounded price suggestions.</div>
      <div className="card">
        <div className="section-title">This is a premium add-on</div>
        <p className="muted" style={{ marginBottom: 14 }}>
          You&apos;re already using Personalization to bring customers back — AI Pricing goes one step
          further: it looks at what&apos;s actually selling (and what isn&apos;t) and suggests bounded,
          explainable price changes per item, so every item is priced right too. You stay in control —
          nothing changes until you apply a suggestion, and every change stays within limits you set.
        </p>
        <div className="notice" style={{ marginBottom: 0 }}>
          Not enabled on your account yet — contact your HPAS admin to turn it on.
        </div>
      </div>
    </>
  );
}
