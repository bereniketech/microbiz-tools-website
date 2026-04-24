import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function rowsToCsv(rows: Record<string, unknown>[], headers: string[]): string {
  const escape = (v: unknown) => {
    const str = v == null ? "" : String(v);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };
  const headerRow = headers.join(",");
  const dataRows = rows.map((row) => headers.map((h) => escape(row[h])).join(","));
  return [headerRow, ...dataRows].join("\n");
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type");

  if (type !== "income" && type !== "clients") {
    return NextResponse.json({ error: "type must be income or clients" }, { status: 400 });
  }

  if (type === "income") {
    const { data: invoices } = await supabase
      .from("invoices")
      .select("invoice_number, total_amount, currency, status, due_date, created_at, clients(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const rows = (invoices ?? []).map((inv) => ({
      invoice_number: inv.invoice_number,
      client: Array.isArray(inv.clients) ? inv.clients[0]?.name : (inv.clients as { name?: string } | null)?.name ?? "",
      amount: inv.total_amount,
      currency: inv.currency,
      status: inv.status,
      due_date: inv.due_date ?? "",
      created_at: inv.created_at,
    }));

    const csv = rowsToCsv(rows, ["invoice_number", "client", "amount", "currency", "status", "due_date", "created_at"]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="income-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  // type === "clients"
  const { data: clients } = await supabase
    .from("clients")
    .select("name, email, company_name, total_revenue, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (clients ?? []).map((c) => ({
    name: c.name,
    email: c.email ?? "",
    company_name: c.company_name ?? "",
    total_revenue: c.total_revenue ?? 0,
    created_at: c.created_at,
  }));

  const csv = rowsToCsv(rows, ["name", "email", "company_name", "total_revenue", "created_at"]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="clients-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
