import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Get current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // Fallback if not authenticated yet
    const userId = user?.id;

    let profile = null;
    let preferences: any[] = [];
    let emails: any[] = [];
    let calendarEvents: any[] = [];
    let tasks: any[] = [];
    let pendingActions: any[] = [];
    let proactiveAlerts: any[] = [];

    if (userId) {
      // 2. Fetch User Profile
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      profile = profileData;

      // 3. Fetch User Preferences
      const { data: prefData } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId);
      preferences = prefData || [];

      // 4. Fetch Emails
      const { data: emailData } = await supabase
        .from("emails")
        .select("*")
        .eq("user_id", userId)
        .order("received_at", { ascending: false })
        .limit(10);
      emails = emailData || [];

      // 5. Fetch Calendar Events
      const { data: calData } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", userId)
        .order("start_time", { ascending: true })
        .limit(10);
      calendarEvents = calData || [];

      // 6. Fetch Tasks
      const { data: taskData } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("due_date", { ascending: true })
        .limit(10);
      tasks = taskData || [];

      // 7. Fetch Pending Actions (Awaiting Clearance)
      const { data: actionData } = await supabase
        .from("agent_actions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending_approval")
        .order("created_at", { ascending: false });
      pendingActions = actionData || [];

      // 8. Fetch Proactive Alerts
      const { data: alertData } = await supabase
        .from("proactive_alerts")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      proactiveAlerts = alertData || [];
    }

    // 9. Calculate derived real-time metrics
    const unreadEmailsCount = emails.filter((e) => e.status === "unread").length;
    const pendingTasksCount = tasks.filter((t) => t.status === "pending").length;
    const activeConflictsCount = proactiveAlerts.filter(
      (a) => a.alert_type === "scheduling_conflict"
    ).length;

    // Read from persistent server data store if available
    let storedUser = null;
    try {
      const usersPath = path.join(process.cwd(), ".data", "users.json");
      if (fs.existsSync(usersPath)) {
        const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
        const first = Object.values(users)[0] as any;
        if (first) {
          storedUser = {
            id: first.id,
            email: first.email,
            full_name: first.fullName,
            avatar_url: first.avatarUrl,
            role: first.role,
            age: first.age,
            schedule_preference: first.schedulePreference,
          };
        }
      }
    } catch {}

    return NextResponse.json({
      user: profile || storedUser || {
        id: "usr_adityananda_dev",
        email: user?.email || "adityananda.dev@gmail.com",
        full_name:
          user?.user_metadata?.full_name ||
          user?.user_metadata?.name ||
          "Aditya Nanda",
        avatar_url: user?.user_metadata?.avatar_url || "",
        role: "Lead Architect",
        age: 24,
        schedule_preference: "Avoid meetings before 10:00 AM",
      },
      metrics: {
        unreadEmails: unreadEmailsCount,
        pendingTasks: pendingTasksCount,
        activeConflicts: activeConflictsCount,
        pendingClearances: pendingActions.length,
      },
      emails,
      calendarEvents,
      tasks,
      pendingActions,
      proactiveAlerts,
      preferences,
    });
  } catch (error: any) {
    console.error("Workspace overview fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace overview", details: error.message },
      { status: 500 }
    );
  }
}
