import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { actionId, idempotencyKey } = body;

    if (!actionId && !idempotencyKey) {
      return NextResponse.json(
        { error: "actionId or idempotencyKey is required" },
        { status: 400 }
      );
    }

    if (user?.id) {
      const query = supabase
        .from("agent_actions")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (actionId) query.eq("id", actionId);
      if (idempotencyKey) query.eq("idempotency_key", idempotencyKey);

      const { data, error } = await query.select().single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: data,
        message: "Action approved and dispatched to agentic execution engine.",
      });
    }

    // Fallback response for offline development
    return NextResponse.json({
      success: true,
      message: "Action approved locally (offline demo).",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to approve action", details: error.message },
      { status: 500 }
    );
  }
}
