import { NextResponse } from "next/server";
import {
  readWorkspace,
  updateSettings,
  approvePendingAction,
} from "@/lib/workspace-service";

export async function GET() {
  try {
    const workspace = readWorkspace();
    return NextResponse.json({
      success: true,
      ...workspace,
    });
  } catch (error: any) {
    console.error("Workspace overview GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch workspace overview", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, settings, actionId, idempotencyKey } = body;

    // Handle settings update (e.g. Call on mobile or AI mode switch)
    if (settings) {
      const updated = updateSettings(settings);
      return NextResponse.json({
        success: true,
        message: "Settings synchronized successfully",
        workspace: updated,
      });
    }

    // Handle action approval
    if (action === "approve" || actionId || idempotencyKey) {
      const result = approvePendingAction(actionId, idempotencyKey);
      const updated = readWorkspace();
      return NextResponse.json({
        success: true,
        message: "Action cleared and executed",
        result,
        workspace: updated,
      });
    }

    const current = readWorkspace();
    return NextResponse.json({
      success: true,
      workspace: current,
    });
  } catch (error: any) {
    console.error("Workspace overview POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process workspace request", details: error.message },
      { status: 500 }
    );
  }
}
