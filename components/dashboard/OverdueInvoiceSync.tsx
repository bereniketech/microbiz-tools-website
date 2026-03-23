"use client";

import { useEffect } from "react";

export function OverdueInvoiceSync() {
  useEffect(() => {
    void fetch("/api/invoices/overdue-sync", { method: "POST" });
  }, []);

  return null;
}
