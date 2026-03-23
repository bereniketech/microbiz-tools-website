import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface SearchItem {
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ clients: [], proposals: [], invoices: [] });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pattern = `%${query}%`;

  const [{ data: clientsData, error: clientsError }, { data: proposalsData, error: proposalsError }, { data: invoicesData, error: invoicesError }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name, email, company_name")
        .eq("user_id", user.id)
        .ilike("name", pattern)
        .limit(5),
      supabase
        .from("proposals")
        .select("id, title, status")
        .eq("user_id", user.id)
        .ilike("title", pattern)
        .limit(5),
      supabase
        .from("invoices")
        .select("id, invoice_number, status")
        .eq("user_id", user.id)
        .ilike("invoice_number", pattern)
        .limit(5),
    ]);

  if (clientsError || proposalsError || invoicesError) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  const clients: SearchItem[] = (clientsData ?? []).map((client) => ({
    id: client.id,
    title: client.name,
    subtitle: client.company_name ?? client.email,
    href: `/clients/${client.id}`,
  }));

  const proposals: SearchItem[] = (proposalsData ?? []).map((proposal) => ({
    id: proposal.id,
    title: proposal.title,
    subtitle: proposal.status,
    href: `/proposals/${proposal.id}`,
  }));

  const invoices: SearchItem[] = (invoicesData ?? []).map((invoice) => ({
    id: invoice.id,
    title: invoice.invoice_number,
    subtitle: invoice.status,
    href: "/invoices",
  }));

  return NextResponse.json({ clients, proposals, invoices });
}
