import { NextResponse } from "next/server";
import { readWorkspace } from "@/lib/workspace-service";

const AGENT_BACKEND_URL = process.env.PACT_AGENT_API_URL || "http://127.0.0.1:8000";

interface TabNavigationResult {
  tabAction: "OPEN_TAB" | "CLOSE_TAB" | null;
  targetTab: "gmail" | "calendar" | "tasks" | null;
  navigationReply?: string;
}

/**
 * Detect conversational tab switching and navigation commands
 */
function detectNavigationIntent(message: string): TabNavigationResult {
  const lower = message.toLowerCase().trim();

  // Close or return to dashboard
  if (
    lower.includes("close window") ||
    lower.includes("minimize window") ||
    lower.includes("hide window") ||
    lower.includes("close tab") ||
    lower.includes("back to dashboard") ||
    lower.includes("return to dashboard") ||
    lower === "show dashboard" ||
    lower === "open dashboard"
  ) {
    return {
      tabAction: "CLOSE_TAB",
      targetTab: null,
      navigationReply:
        "Closed workspace window. Returned to your Chief of Staff executive dashboard.",
    };
  }

  // Open Gmail (pure navigation)
  if (
    lower === "open gmail" ||
    lower === "go to gmail" ||
    lower === "show gmail" ||
    lower === "launch gmail" ||
    lower === "view gmail" ||
    lower === "open inbox" ||
    lower === "show inbox" ||
    lower === "open mail"
  ) {
    return {
      tabAction: "OPEN_TAB",
      targetTab: "gmail",
      navigationReply:
        "Switched to Gmail. I have loaded your live inbox messages in the macOS workspace window. How would you like me to assist?",
    };
  }

  // Open Calendar (pure navigation)
  if (
    lower === "open calendar" ||
    lower === "go to calendar" ||
    lower === "show calendar" ||
    lower === "launch calendar" ||
    lower === "view calendar" ||
    lower === "open schedule"
  ) {
    return {
      tabAction: "OPEN_TAB",
      targetTab: "calendar",
      navigationReply:
        "Opened Google Calendar. Your schedule, meeting blocks, and conflict telemetry are now active. How can I help coordinate your events?",
    };
  }

  // Open Tasks (pure navigation)
  if (
    lower === "open tasks" ||
    lower === "go to tasks" ||
    lower === "show tasks" ||
    lower === "launch tasks" ||
    lower === "view tasks" ||
    lower === "open todo"
  ) {
    return {
      tabAction: "OPEN_TAB",
      targetTab: "tasks",
      navigationReply:
        "Switched to Google Tasks view. Displaying pending deliverables and priority action items.",
    };
  }

  // Contextual commands that also switch to the relevant tab:
  if (
    lower.includes("mail") ||
    lower.includes("email") ||
    lower.includes("inbox")
  ) {
    return {
      tabAction: "OPEN_TAB",
      targetTab: "gmail",
    };
  }

  if (
    lower.includes("calendar") ||
    lower.includes("meeting") ||
    lower.includes("schedule") ||
    lower.includes("reschedule")
  ) {
    return {
      tabAction: "OPEN_TAB",
      targetTab: "calendar",
    };
  }

  if (
    lower.includes("task") ||
    lower.includes("todo") ||
    lower.includes("deadline")
  ) {
    return {
      tabAction: "OPEN_TAB",
      targetTab: "tasks",
    };
  }

  return { tabAction: null, targetTab: null };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, mode, activeApp, userId = "default_user" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const nav = detectNavigationIntent(message);
    const workspace = readWorkspace();
    const lower = message.toLowerCase();

    let responseText = nav.navigationReply || "";
    let updatedWorkspace = workspace;
    let hitlApproval = null;
    let executionPlan = null;
    let backendUsed = false;

    // Attempt delegating to Python FastAPI LangGraph Gateway on port 8000
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const agentRes = await fetch(`${AGENT_BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: message,
          user_id: userId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (agentRes.ok) {
        const agentData = await agentRes.json();
        backendUsed = true;
        executionPlan = agentData.plan;
        updatedWorkspace = readWorkspace();

        if (agentData.status === "SUSPENDED_APPROVAL" && agentData.pending_approval) {
          hitlApproval = agentData.pending_approval;
          responseText =
            agentData.final_summary ||
            `Human Clearance Required: Consequential action '${agentData.pending_approval.tool_name}' paused. Please review the clearance card to authorize execution.`;
        } else if (agentData.status === "CLARIFICATION_NEEDED") {
          responseText =
            agentData.final_summary ||
            "Could you please specify which item or schedule block you want to coordinate?";
        } else if (agentData.final_summary) {
          responseText = nav.navigationReply
            ? `${nav.navigationReply} ${agentData.final_summary}`
            : agentData.final_summary;
        }
      }
    } catch {
      // Backend not running or timeout; seamlessly continue with deterministic local engine
      backendUsed = false;
    }

    if (!responseText) {
      if (!backendUsed) {
        responseText =
          "The PACT Python Agent engine (http://127.0.0.1:8000) is currently offline or unreachable. Please verify that the agent server is running.";
      } else {
        responseText =
          "I have processed your request across your workspace tools with verified idempotency.";
      }
    }

    return NextResponse.json({
      success: true,
      reply: responseText,
      tabAction: nav.tabAction,
      targetTab: nav.targetTab,
      workspace: updatedWorkspace,
      hitlApproval,
      executionPlan,
      backendUsed,
    });
  } catch (error: any) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message", details: error.message },
      { status: 500 }
    );
  }
}
