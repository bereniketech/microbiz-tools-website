import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user already has a workspace
  const { data: existingMembership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (membershipError && membershipError.code !== "PGRST116") {
    // PGRST116 = no rows found — expected for new users
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  if (existingMembership) {
    return NextResponse.json(
      { error: "Workspace already exists for this user" },
      { status: 400 }
    );
  }

  // Derive workspace slug from user email
  const emailPrefix = (user.email ?? user.id).split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
  const slug = `${emailPrefix}-${user.id.slice(0, 8)}`;

  // Create workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({
      name: emailPrefix,
      slug,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (workspaceError || !workspace) {
    return NextResponse.json(
      { error: workspaceError?.message ?? "Failed to create workspace" },
      { status: 500 }
    );
  }

  // Create owner membership
  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ workspace_id: workspace.id });
}
