import { NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import React from "react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 16, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#666", marginBottom: 24 },
  table: { display: "flex", flexDirection: "column" },
  headerRow: { flexDirection: "row", backgroundColor: "#f0f0f0", padding: "6 8", marginBottom: 2 },
  row: { flexDirection: "row", padding: "5 8", borderBottom: "1 solid #eee" },
  col1: { width: "25%" },
  col2: { width: "25%" },
  col3: { width: "15%", textAlign: "right" },
  col4: { width: "15%", textAlign: "center" },
  col5: { width: "20%", textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },
  total: { flexDirection: "row", padding: "8 8", marginTop: 8, borderTop: "2 solid #333" },
});

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: invoices } = await supabase
    .from("invoices")
    .select("invoice_number, total_amount, currency, status, due_date, clients(name)")
    .eq("user_id", user.id)
    .order("due_date", { ascending: false });

  const totalPaid = (invoices ?? [])
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + (i.total_amount ?? 0), 0);

  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const pdfDoc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.title }, "Income Report"),
      React.createElement(Text, { style: styles.subtitle }, `Generated on ${dateStr}`),
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.headerRow },
          React.createElement(Text, { style: [styles.col1, styles.bold] }, "Invoice #"),
          React.createElement(Text, { style: [styles.col2, styles.bold] }, "Client"),
          React.createElement(Text, { style: [styles.col3, styles.bold] }, "Amount"),
          React.createElement(Text, { style: [styles.col4, styles.bold] }, "Status"),
          React.createElement(Text, { style: [styles.col5, styles.bold] }, "Due Date")
        ),
        ...(invoices ?? []).map((inv, i) => {
          const clientName = Array.isArray(inv.clients)
            ? inv.clients[0]?.name ?? ""
            : (inv.clients as { name?: string } | null)?.name ?? "";
          return React.createElement(
            View,
            { key: String(i), style: styles.row },
            React.createElement(Text, { style: styles.col1 }, inv.invoice_number),
            React.createElement(Text, { style: styles.col2 }, clientName),
            React.createElement(Text, { style: styles.col3 }, `${inv.currency} ${inv.total_amount?.toFixed(2)}`),
            React.createElement(Text, { style: styles.col4 }, inv.status),
            React.createElement(Text, { style: styles.col5 }, inv.due_date ?? "—")
          );
        }),
        React.createElement(
          View,
          { style: styles.total },
          React.createElement(Text, { style: [styles.col1, styles.bold] }, "Total Paid"),
          React.createElement(Text, { style: styles.col2 }, ""),
          React.createElement(Text, { style: [styles.col3, styles.bold] }, `${totalPaid.toFixed(2)}`),
          React.createElement(Text, { style: styles.col4 }, ""),
          React.createElement(Text, { style: styles.col5 }, "")
        )
      )
    )
  );

  const buffer = await renderToBuffer(pdfDoc);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="income-report-${new Date().toISOString().split("T")[0]}.pdf"`,
    },
  });
}
