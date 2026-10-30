import {
  WorkspaceEmail,
  WorkspaceCalendarEvent,
  WorkspaceTask,
} from "./workspace-service";

export interface LiveGmailData {
  unreadCount: number;
  thisMonthCount: number;
  importantCount: number;
  latestEmail: {
    id: string;
    sender: string;
    subject: string;
    snippet: string;
    receivedAt: string;
    priority: string;
  };
  emailsList: WorkspaceEmail[];
}

export interface LiveCalendarData {
  meetingsTodayCount: number;
  thisWeekHours: string;
  conflictsCount: number;
  nextMeeting: {
    id: string;
    title: string;
    time: string;
    location: string;
    conflictDetected: boolean;
  };
  eventsList: WorkspaceCalendarEvent[];
}

export interface LiveTasksData {
  activeTasksCount: number;
  dueTodayCount: number;
  overdueCount: number;
  topAction: {
    id: string;
    title: string;
    description: string;
    priority: string;
  };
  tasksList: WorkspaceTask[];
}

export interface LiveGoogleWorkspace {
  authError?: boolean;
  isDevBypass?: boolean;
  disabledApis?: string[];
  errorMessage?: string;
  gmail: LiveGmailData;
  calendar: LiveCalendarData;
  tasks: LiveTasksData;
}

/**
 * Clean and format sender string (e.g. "Sarah Lin <sarah@corp.com>" -> "Sarah Lin")
 */
function cleanSenderString(raw: string): string {
  if (!raw) return "Unknown Sender";
  const match = raw.match(/^"?([^"<]+)"?\s*(?:<.*>)?$/);
  if (match && match[1]?.trim()) {
    return match[1].trim();
  }
  return raw.replace(/<.*>/, "").replace(/"/g, "").trim() || raw;
}

function extractSenderEmail(raw: string): string {
  if (!raw) return "unknown@gmail.com";
  const match = raw.match(/<([^>]+)>/);
  if (match && match[1]?.trim()) {
    return match[1].trim();
  }
  return raw.includes("@") ? raw.trim() : "unknown@gmail.com";
}

/**
 * Format relative or clean time string from RFC 2822 or ISO date
 */
function formatEmailTime(rawDate: string): string {
  if (!rawDate) return "Recently";
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return "Recently";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

/**
 * Calculate duration between start and end ISO strings in hours
 */
function calculateEventDuration(startStr?: string, endStr?: string): number {
  if (!startStr || !endStr) return 0.5;
  try {
    const s = new Date(startStr).getTime();
    const e = new Date(endStr).getTime();
    const diff = (e - s) / (1000 * 60 * 60);
    return diff > 0 && diff < 24 ? parseFloat(diff.toFixed(2)) : 0.5;
  } catch {
    return 0.5;
  }
}

/**
 * Fetch Live Real Data from Gmail API (with Dev Mode fallback if API is disabled in Cloud Console)
 */
export async function fetchLiveGmail(accessToken: string): Promise<{ data: LiveGmailData; apiDisabled?: boolean }> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const unreadRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=10",
    { headers }
  );

  if (unreadRes.status === 401) {
    throw new Error("Gmail API authentication failed (401: Unauthorized)");
  }

  // If Gmail API is not yet enabled in Google Cloud Console project 651148810116
  if (unreadRes.status === 403) {
    const errText = await unreadRes.text();
    if (errText.includes("SERVICE_DISABLED") || errText.includes("has not been used in project")) {
      return {
        apiDisabled: true,
        data: {
          unreadCount: 7,
          thisMonthCount: 142,
          importantCount: 3,
          latestEmail: {
            id: "em_dev_01",
            sender: "Google Cloud Platform",
            subject: "OAuth Client & Vertex AI Endpoints Activated",
            snippet: "Your project credentials and OAuth scopes for Gmail and Calendar are now active.",
            receivedAt: "15m ago",
            priority: "high",
          },
          emailsList: [
            {
              id: "em_dev_01",
              sender: "Google Cloud Platform",
              senderEmail: "google-cloud-noreply@google.com",
              subject: "OAuth Client & Vertex AI Endpoints Activated",
              snippet: "Your project credentials and OAuth scopes for Gmail and Calendar are now active.",
              receivedAt: "15m ago",
              priority: "high",
              status: "unread",
              thisMonth: true,
            },
            {
              id: "em_dev_02",
              sender: "Firebase Security",
              senderEmail: "auth-noreply@firebaseapp.com",
              subject: "Google Workspace Scopes Granted for pact-18",
              snippet: "Sensitive scopes (gmail.modify, calendar, tasks) authorized for adityananda.dev@gmail.com.",
              receivedAt: "1h ago",
              priority: "high",
              status: "unread",
              thisMonth: true,
            },
            {
              id: "em_dev_03",
              sender: "GitHub Enterprise",
              senderEmail: "notifications@github.com",
              subject: "CI Pipeline Run #185 Complete - All tests passed",
              snippet: "Autonomous Agent verification suite executed cleanly in 12s.",
              receivedAt: "3h ago",
              priority: "normal",
              status: "unread",
              thisMonth: true,
            },
          ],
        },
      };
    }
    throw new Error(`Gmail API permission error (${unreadRes.status})`);
  }

  let unreadCount = 0;
  let unreadMessages: Array<{ id: string }> = [];

  if (unreadRes.ok) {
    const unreadData = await unreadRes.json();
    unreadCount = unreadData.resultSizeEstimate ?? (unreadData.messages?.length || 0);
    unreadMessages = unreadData.messages || [];
  }

  // Fetch INBOX label details for total counts
  const inboxRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX",
    { headers }
  );

  let thisMonthCount = unreadCount;
  if (inboxRes.ok) {
    const inboxData = await inboxRes.json();
    if (typeof inboxData.messagesTotal === "number") {
      thisMonthCount = inboxData.messagesTotal;
    }
    if (typeof inboxData.messagesUnread === "number" && unreadCount === 0) {
      unreadCount = inboxData.messagesUnread;
    }
  }

  // Fetch important unread count
  const importantRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:important%20is:unread&maxResults=10",
    { headers }
  );

  let importantCount = 0;
  if (importantRes.ok) {
    const importantData = await importantRes.json();
    importantCount = importantData.resultSizeEstimate ?? (importantData.messages?.length || 0);
  }

  // Fetch up to 25 recent messages from the inbox so all emails of this month appear in the UI
  const recentRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25",
    { headers }
  );

  const seenIds = new Set<string>();
  const allMessageIds: string[] = [];

  // Put unread messages first so they appear at the top of the inbox
  for (const m of unreadMessages) {
    if (m?.id && !seenIds.has(m.id)) {
      seenIds.add(m.id);
      allMessageIds.push(m.id);
    }
  }

  // Then add all recent messages from the inbox for this month
  if (recentRes.ok) {
    const recentData = await recentRes.json();
    for (const m of (recentData.messages || [])) {
      if (m?.id && !seenIds.has(m.id)) {
        seenIds.add(m.id);
        allMessageIds.push(m.id);
      }
    }
  }

  let latestEmail = {
    id: "none",
    sender: "No new emails",
    subject: "Inbox is clean",
    snippet: "All caught up with your messages.",
    receivedAt: "Just now",
    priority: "normal",
  };

  const emailsList: WorkspaceEmail[] = [];

  if (allMessageIds.length > 0) {
    // Fetch details for up to 25 emails concurrently in parallel
    const msgFetches = allMessageIds.slice(0, 25).map(async (msgId) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers }
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const headersList = detail.payload?.headers || [];
          const fromHeader =
            headersList.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
          const subjectHeader =
            headersList.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
          const dateHeader =
            headersList.find((h: any) => h.name.toLowerCase() === "date")?.value || "";

          const cleanSender = cleanSenderString(fromHeader);
          const senderEmail = extractSenderEmail(fromHeader);

          const isUnread = detail.labelIds?.includes("UNREAD") ?? false;
          const isImportant = detail.labelIds?.includes("IMPORTANT") ?? false;

          const emailObj: WorkspaceEmail = {
            id: msgId,
            sender: cleanSender,
            senderEmail,
            subject: subjectHeader,
            snippet: detail.snippet || "",
            receivedAt: formatEmailTime(dateHeader),
            priority: isImportant ? "urgent" : isUnread ? "high" : "normal",
            status: isUnread ? "unread" : "read",
            thisMonth: true,
          };

          return emailObj;
        }
      } catch {}
      return null;
    });

    const results = (await Promise.all(msgFetches)).filter(Boolean) as WorkspaceEmail[];
    if (results.length > 0) {
      emailsList.push(...results);
      latestEmail = {
        id: results[0].id,
        sender: results[0].sender,
        subject: results[0].subject,
        snippet: results[0].snippet,
        receivedAt: results[0].receivedAt,
        priority: results[0].priority,
      };
    }
  }

  return {
    apiDisabled: false,
    data: {
      unreadCount,
      thisMonthCount,
      importantCount,
      latestEmail,
      emailsList,
    },
  };
}

/**
 * Fetch Live Real Data from Google Calendar API (with Dev Mode fallback if API is disabled in Cloud Console)
 */
export async function fetchLiveCalendar(accessToken: string): Promise<{ data: LiveCalendarData; apiDisabled?: boolean }> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const now = new Date();

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  const todayRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      startOfDay
    )}&timeMax=${encodeURIComponent(endOfDay)}&singleEvents=true&orderBy=startTime`,
    { headers }
  );

  if (todayRes.status === 401) {
    throw new Error("Google Calendar API authentication failed (401: Unauthorized)");
  }

  // If Calendar API is not yet enabled in Google Cloud Console project 651148810116
  if (todayRes.status === 403) {
    const errText = await todayRes.text();
    if (errText.includes("SERVICE_DISABLED") || errText.includes("has not been used in project")) {
      return {
        apiDisabled: true,
        data: {
          meetingsTodayCount: 3,
          thisWeekHours: "14.5h",
          conflictsCount: 1,
          nextMeeting: {
            id: "evt_dev_01",
            title: "Architecture Strategy & Sprint Review",
            time: "11:30 AM • Google Meet",
            location: "Google Meet",
            conflictDetected: false,
          },
          eventsList: [
            {
              id: "evt_dev_01",
              title: "Architecture Strategy & Sprint Review",
              description: "Cross-system token synchronization and agent execution review.",
              startTime: "11:30 AM",
              endTime: "12:15 PM",
              location: "Google Meet",
              status: "confirmed",
              conflictDetected: false,
              isToday: true,
              hours: 0.75,
            },
            {
              id: "evt_dev_02",
              title: "Client Technical Debrief",
              description: "Requires clearance: Overlaps with protected Focus Block.",
              startTime: "2:00 PM",
              endTime: "3:00 PM",
              location: "Google Meet",
              status: "confirmed",
              conflictDetected: true,
              isToday: true,
              hours: 1,
            },
            {
              id: "evt_dev_03",
              title: "Protected Deep Work Focus Block",
              description: "Automated focus block protection.",
              startTime: "2:30 PM",
              endTime: "4:00 PM",
              location: "Quiet Focus",
              status: "confirmed",
              conflictDetected: true,
              isToday: true,
              hours: 1.5,
            },
          ],
        },
      };
    }
    throw new Error(`Google Calendar API permission error (${todayRes.status})`);
  }

  let todayEvents: any[] = [];
  if (todayRes.ok) {
    const data = await todayRes.json();
    todayEvents = data.items || [];
  }

  const upcomingRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      now.toISOString()
    )}&singleEvents=true&orderBy=startTime&maxResults=5`,
    { headers }
  );

  let nextMeeting = {
    id: "none",
    title: "No upcoming meetings",
    time: "Calendar Clear",
    location: "Google Meet",
    conflictDetected: false,
  };

  if (upcomingRes.ok) {
    const upcomingData = await upcomingRes.json();
    const items = upcomingData.items || [];
    if (items.length > 0) {
      const next = items[0];
      const start = next.start?.dateTime ? new Date(next.start.dateTime) : null;
      let timeStr = "Upcoming";
      if (start) {
        timeStr = start.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
      nextMeeting = {
        id: next.id,
        title: next.summary || "Upcoming Meeting",
        time: `${timeStr} • ${next.hangoutLink ? "Google Meet" : next.location || "Online"}`,
        location: next.hangoutLink ? "Google Meet" : next.location || "Online",
        conflictDetected: false,
      };
    }
  }

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const weekRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      startOfWeek.toISOString()
    )}&timeMax=${encodeURIComponent(endOfWeek.toISOString())}&singleEvents=true`,
    { headers }
  );

  let weeklyHoursTotal = 0;
  let conflictsCount = 0;

  if (weekRes.ok) {
    const weekData = await weekRes.json();
    const weekItems: any[] = weekData.items || [];

    for (const ev of weekItems) {
      if (ev.start?.dateTime && ev.end?.dateTime) {
        const start = new Date(ev.start.dateTime).getTime();
        const end = new Date(ev.end.dateTime).getTime();
        const durationHours = (end - start) / (1000 * 60 * 60);
        if (durationHours > 0 && durationHours < 24) {
          weeklyHoursTotal += durationHours;
        }
      }
    }

    const sorted = [...weekItems]
      .filter((e) => e.start?.dateTime && e.end?.dateTime)
      .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());

    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = new Date(sorted[i].end.dateTime).getTime();
      const nextStart = new Date(sorted[i + 1].start.dateTime).getTime();
      if (nextStart < currentEnd) {
        conflictsCount++;
      }
    }
  }

  const eventsList: WorkspaceCalendarEvent[] = todayEvents.map((ev: any) => ({
    id: ev.id,
    title: ev.summary || "(No Title)",
    description: ev.description || "",
    startTime: ev.start?.dateTime || ev.start?.date || "",
    endTime: ev.end?.dateTime || ev.end?.date || "",
    location: ev.location || (ev.hangoutLink ? "Google Meet" : "Online"),
    status: "confirmed" as const,
    conflictDetected: false,
    isToday: true,
    hours: calculateEventDuration(ev.start?.dateTime, ev.end?.dateTime),
  }));

  return {
    apiDisabled: false,
    data: {
      meetingsTodayCount: todayEvents.length,
      thisWeekHours: `${weeklyHoursTotal > 0 ? weeklyHoursTotal.toFixed(1) : "0"}h`,
      conflictsCount,
      nextMeeting,
      eventsList,
    },
  };
}

/**
 * Fetch Live Real Data from Google Tasks API (with Dev Mode fallback if API is disabled in Cloud Console)
 */
export async function fetchLiveTasks(accessToken: string): Promise<{ data: LiveTasksData; apiDisabled?: boolean }> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const listsRes = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
    headers,
  });

  if (listsRes.status === 401) {
    throw new Error("Google Tasks API authentication failed (401: Unauthorized)");
  }

  // If Tasks API is not yet enabled in Google Cloud Console project 651148810116
  if (listsRes.status === 403) {
    const errText = await listsRes.text();
    if (errText.includes("SERVICE_DISABLED") || errText.includes("has not been used in project")) {
      return {
        apiDisabled: true,
        data: {
          activeTasksCount: 5,
          dueTodayCount: 2,
          overdueCount: 0,
          topAction: {
            id: "tsk_dev_01",
            title: "Resolve Calendar Focus Block Overlap",
            description: "Approve AI clearance to move Client Technical Debrief to 3:30 PM",
            priority: "urgent",
          },
          tasksList: [
            {
              id: "tsk_dev_01",
              title: "Resolve Calendar Focus Block Overlap",
              description: "Approve AI clearance to move Client Technical Debrief to 3:30 PM",
              dueDate: "Today, 3:30 PM",
              priority: "urgent",
              status: "pending",
              isDueToday: true,
              isOverdue: false,
            },
            {
              id: "tsk_dev_02",
              title: "Verify OAuth token scopes and idempotency keys",
              description: "Ensure HMAC SHA-256 idempotency locks are respected on retries",
              dueDate: "Today, 6:00 PM",
              priority: "high",
              status: "pending",
              isDueToday: true,
              isOverdue: false,
            },
            {
              id: "tsk_dev_03",
              title: "Deploy production build to App Hosting / Vercel",
              description: "Execute next build verification and environment sanity checks",
              dueDate: "Tomorrow, 11:00 AM",
              priority: "medium",
              status: "pending",
              isDueToday: false,
              isOverdue: false,
            },
          ],
        },
      };
    }
    throw new Error(`Google Tasks API permission error (${listsRes.status})`);
  }

  let taskListId = "@default";
  if (listsRes.ok) {
    const listsData = await listsRes.json();
    if (listsData.items && listsData.items.length > 0) {
      taskListId = listsData.items[0].id;
    }
  }

  const tasksRes = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(
      taskListId
    )}/tasks?showCompleted=false&maxResults=30`,
    { headers }
  );

  let activeTasksCount = 0;
  let dueTodayCount = 0;
  let overdueCount = 0;
  let tasksList: WorkspaceTask[] = [];
  let topAction = {
    id: "none",
    title: "All tasks completed",
    description: "No pending actions in your Google Tasks queue",
    priority: "normal",
  };

  if (tasksRes.ok) {
    const tasksData = await tasksRes.json();
    const items: any[] = tasksData.items || [];
    activeTasksCount = items.length;

    const now = new Date();
    const todayYMD = now.toISOString().split("T")[0];

    items.forEach((t) => {
      if (t.due) {
        const dueYMD = t.due.split("T")[0];
        if (dueYMD === todayYMD) {
          dueTodayCount++;
        } else if (dueYMD < todayYMD) {
          overdueCount++;
        }
      }
    });

    tasksList = items.map((t) => {
      const isDueToday = t.due ? t.due.split("T")[0] === todayYMD : false;
      const isOverdue = t.due ? t.due.split("T")[0] < todayYMD : false;
      return {
        id: t.id,
        title: t.title || "(Untitled Task)",
        description: t.notes || "",
        dueDate: t.due ? new Date(t.due).toLocaleDateString() : "No deadline",
        priority: isDueToday ? ("urgent" as const) : ("high" as const),
        status: "pending" as const,
        isDueToday,
        isOverdue,
      };
    });

    if (items.length > 0) {
      topAction = {
        id: items[0].id,
        title: items[0].title || "Top Task",
        description: items[0].notes || "Google Tasks priority item",
        priority: "urgent",
      };
    }
  }

  return {
    apiDisabled: false,
    data: {
      activeTasksCount,
      dueTodayCount,
      overdueCount,
      topAction,
      tasksList,
    },
  };
}

/**
 * Orchestrated live workspace fetch across all 3 Google services
 */
export async function fetchAllGoogleWorkspace(
  accessToken: string
): Promise<LiveGoogleWorkspace> {
  try {
    const [gmailRes, calendarRes, tasksRes] = await Promise.all([
      fetchLiveGmail(accessToken),
      fetchLiveCalendar(accessToken),
      fetchLiveTasks(accessToken),
    ]);

    const disabledApis: string[] = [];
    if (gmailRes.apiDisabled) disabledApis.push("Gmail API");
    if (calendarRes.apiDisabled) disabledApis.push("Google Calendar API");
    if (tasksRes.apiDisabled) disabledApis.push("Google Tasks API");

    const isDevBypass = disabledApis.length > 0;

    return {
      authError: false,
      isDevBypass,
      disabledApis,
      gmail: gmailRes.data,
      calendar: calendarRes.data,
      tasks: tasksRes.data,
    };
  } catch (err: any) {
    const msg = err?.message || String(err);
    const isAuthErr =
      msg.includes("authentication failed") ||
      msg.includes("UNAUTHENTICATED") ||
      msg.includes("401");

    return {
      authError: isAuthErr,
      errorMessage: msg,
      gmail: {
        unreadCount: 0,
        thisMonthCount: 0,
        importantCount: 0,
        latestEmail: {
          id: "auth_needed",
          sender: "Google Workspace Required",
          subject: "Sign in to Google to stream your real emails",
          snippet: "Live Gmail authorization is required.",
          receivedAt: "Now",
          priority: "high",
        },
        emailsList: [],
      },
      calendar: {
        meetingsTodayCount: 0,
        thisWeekHours: "0h",
        conflictsCount: 0,
        nextMeeting: {
          id: "auth_needed",
          title: "Calendar Authorization Required",
          time: "Connect Google Account",
          location: "Google Meet",
          conflictDetected: false,
        },
        eventsList: [],
      },
      tasks: {
        activeTasksCount: 0,
        dueTodayCount: 0,
        overdueCount: 0,
        topAction: {
          id: "auth_needed",
          title: "Tasks Authorization Required",
          description: "Connect Google Account to stream your live tasks queue.",
          priority: "normal",
        },
        tasksList: [],
      },
    };
  }
}
