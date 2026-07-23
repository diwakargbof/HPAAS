"use client";

// Shared client-side accessor for Business Units — one fetch pattern used by
// every page that filters/tags by branch (Customers, Billing, Menu,
// Pricing Recommendations). `active` is the single gate every consumer
// should check before rendering branch UI: the feature can have units
// configured and still be switched off entirely via the master toggle.

import { useEffect, useState } from "react";
import { api } from "./api";

export interface BusinessUnit {
  id: string;
  name: string;
}

export function useBusinessUnits(): { units: BusinessUnit[]; enabled: boolean; active: boolean } {
  const [units, setUnits] = useState<BusinessUnit[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    api<{ enabled: boolean; units: BusinessUnit[] }>("/settings/business-units")
      .then((r) => {
        setUnits(r.units);
        setEnabled(r.enabled);
      })
      .catch(() => {
        setUnits([]);
        setEnabled(false);
      });
  }, []);

  return { units, enabled, active: enabled && units.length > 0 };
}
