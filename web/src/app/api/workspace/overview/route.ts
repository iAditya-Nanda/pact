import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  readWorkspace,
  updateSettings,
  approvePendingAction,
  writeWorkspace,
  addWorkspaceEmail,
} from "@/lib/workspace-service";
import { fetchAllGoogleWorkspace } from "@/lib/google-workspace";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, "");
    const queryToken = searchParams.get("token");

    let workspace = readWorkspace();

    // Retrieve access token from header, query param, or server session storage
    let token = bearerToken || queryToken;

    if (!token) {
      try {
        const usersPath = path.join(process.cwd(), ".data", "users.json");
        if (fs.existsSync(usersPath)) {
          const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
          const first = Object.values(users)[0] as any;
          if (first) {
            if (first.googleAccessToken) {
              token = first.googleAccessToken;
            }
            if (workspace?.user) {
              workspace.user = {
                id: first.id || workspace.user.id,
                email: first.email || workspace.user.email,
                fullName: first.fullName || workspace.user.fullName,
                avatarUrl: first.avatarUrl || workspace.user.avatarUrl,
                role: first.role || workspace.user.role,
                age: first.age || workspace.user.age,
                schedulePreference: first.schedulePreference || workspace.user.schedulePreference,
              };
            }
          }
        }
      } catch {}
    }

    let isLiveGoogleData = false;
    let isDevBypass = false;
    let disabledApis: string[] = [];
    let authError: string | null = null;

    if (token) {
      try {
        const liveData = await fetchAllGoogleWorkspace(token);

        if (liveData.authError) {
          isLiveGoogleData = false;
          authError = liveData.errorMessage || "Google access token expired or revoked.";
        } else {
          // Merge Live Real Gmail Metrics
          workspace.metrics.unreadEmails = liveData.gmail.unreadCount;
          workspace.metrics.emailsThisMonth = liveData.gmail.thisMonthCount;
          workspace.metrics.emailsImportant = liveData.gmail.importantCount;
          workspace.latestEmail = liveData.gmail.latestEmail;
          if (liveData.gmail.emailsList.length > 0) {
            workspace.emails = liveData.gmail.emailsList;
          }

          // Merge Live Real Google Calendar Metrics
          workspace.metrics.meetingsToday = liveData.calendar.meetingsTodayCount;
          workspace.metrics.thisWeekHours = liveData.calendar.thisWeekHours;
          workspace.metrics.conflicts = liveData.calendar.conflictsCount;
          workspace.nextMeeting = liveData.calendar.nextMeeting;
          if (liveData.calendar.eventsList.length > 0) {
            workspace.calendarEvents = liveData.calendar.eventsList;
          }

          // Merge Live Real Google Tasks Metrics
          workspace.metrics.activeTasks = liveData.tasks.activeTasksCount;
          workspace.metrics.dueToday = liveData.tasks.dueTodayCount;
          workspace.metrics.overdue = liveData.tasks.overdueCount;
          workspace.topAction = liveData.tasks.topAction;
          if (liveData.tasks.tasksList.length > 0) {
            workspace.tasks = liveData.tasks.tasksList;
          }

          isLiveGoogleData = true;
          isDevBypass = Boolean(liveData.isDevBypass);
          disabledApis = liveData.disabledApis || [];
          writeWorkspace(workspace);
        }
      } catch (liveErr: any) {
        console.warn("Live Google API sync attempt failed:", liveErr);
        authError = liveErr.message || "Failed to sync with Google APIs";
      }
    }

    return NextResponse.json({
      success: true,
      isLiveGoogleData,
      isDevBypass,
      disabledApis,
      requiresGoogleAuth: !token || !isLiveGoogleData,
      authError,
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
    const { action, settings, actionId, idempotencyKey, googleAccessToken } = body;

    // Handle token synchronization
    if (googleAccessToken) {
      try {
        const usersPath = path.join(process.cwd(), ".data", "users.json");
        if (fs.existsSync(usersPath)) {
          const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
          const firstKey = Object.keys(users)[0] || "usr_adityananda_dev";
          if (!users[firstKey]) users[firstKey] = {};
          users[firstKey].googleAccessToken = googleAccessToken;
          users[firstKey].updatedAt = new Date().toISOString();
          fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf-8");
        }
      } catch {}
    }

    // Handle settings update
    if (settings) {
      const updated = updateSettings(settings);
      return NextResponse.json({
        success: true,
        workspace: updated,
      });
    }

    // Handle email dispatch approval
    if (action === "send_email" && body.email) {
      const result = addWorkspaceEmail(body.email);
      return NextResponse.json({
        success: true,
        message: "Email dispatched successfully",
        workspace: result.workspace,
      });
    }

    // Handle human-in-the-loop action approval
    if (action === "approve") {
      const updated = approvePendingAction(
        actionId || "act_reschedule_client_debrief",
        idempotencyKey
      );
      return NextResponse.json({
        success: true,
        message: "Action executed with cryptographic idempotency.",
        workspace: updated,
      });
    }

    return NextResponse.json({
      success: true,
      workspace: readWorkspace(),
    });
  } catch (error: any) {
    console.error("Workspace overview POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process workspace mutation", details: error.message },
      { status: 500 }
    );
  }
}
