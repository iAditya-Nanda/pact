import { NextResponse } from "next/server";
import { approvePendingAction } from "@/lib/workspace-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { actionId, idempotencyKey } = body;

    const result = approvePendingAction(actionId, idempotencyKey);

    return NextResponse.json({
      success: true,
      message: "Action approved and dispatched to agentic execution engine.",
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to approve action", details: error.message },
      { status: 500 }
    );
  }
}
