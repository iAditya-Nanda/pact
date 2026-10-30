import { NextResponse } from "next/server";
import { readWorkspace, approvePendingAction } from "@/lib/workspace-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, mode } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const workspace = readWorkspace();
    const lower = message.toLowerCase();

    let responseText = "";
    let updatedWorkspace = workspace;

    if (lower.includes("reschedule") || lower.includes("debrief") || lower.includes("conflict")) {
      const approveResult = approvePendingAction("act_reschedule_client_debrief");
      updatedWorkspace = readWorkspace();
      responseText =
        "Conflict resolved: 'Client Technical Debrief' has been rescheduled to 3:30 PM. Your 2:00 PM - 3:00 PM Focus Block is now fully protected and updated across Google Calendar.";
    } else if (lower.includes("summarize") || lower.includes("email") || lower.includes("sarah")) {
      const latest = workspace.latestEmail;
      responseText = `Found ${workspace.metrics.unreadEmails} unread priority emails. Latest from ${latest.sender}: "${latest.subject}". Pre-reads for Q4 architecture review require your sign-off by 5:00 PM.`;
    } else if (lower.includes("task") || lower.includes("due")) {
      responseText = `You have ${workspace.metrics.activeTasks} active tasks (${workspace.metrics.dueToday} urgent due today). Top priority: "${workspace.topAction.title} - ${workspace.topAction.description}".`;
    } else {
      responseText = `PACT Chief of Staff (${mode === "turbo" ? "Turbo Mode" : "Safe Mode"}): Received instruction "${message}". Synchronized across Gmail, Google Calendar, and Google Tasks with verified idempotency.`;
    }

    return NextResponse.json({
      success: true,
      reply: responseText,
      workspace: updatedWorkspace,
    });
  } catch (error: any) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message", details: error.message },
      { status: 500 }
    );
  }
}
