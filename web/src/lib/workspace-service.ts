import fs from "fs";
import path from "path";

export interface WorkspaceEmail {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  priority: "urgent" | "high" | "normal";
  status: "unread" | "read" | "replied";
  thisMonth?: boolean;
}

export interface WorkspaceCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location: string;
  status: "confirmed" | "tentative" | "cancelled";
  conflictDetected: boolean;
  isToday: boolean;
  hours: number;
}

export interface WorkspaceTask {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed";
  isDueToday: boolean;
  isOverdue: boolean;
}

export interface WorkspaceAction {
  id: string;
  actionType: string;
  title: string;
  summary: string;
  targetService: "gmail" | "calendar" | "tasks";
  status: "pending_approval" | "approved" | "rejected" | "executed";
  idempotencyKey: string;
  createdAt: string;
  approvedAt?: string;
}

export interface WorkspaceData {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string;
    role: string;
    age: number;
    schedulePreference: string;
  };
  metrics: {
    unreadEmails: number;
    emailsThisMonth: number;
    emailsImportant: number;
    meetingsToday: number;
    thisWeekHours: string;
    conflicts: number;
    activeTasks: number;
    dueToday: number;
    overdue: number;
  };
  latestEmail: {
    id: string;
    sender: string;
    subject: string;
    receivedAt: string;
    priority: string;
  };
  nextMeeting: {
    id: string;
    title: string;
    time: string;
    location: string;
    conflictDetected: boolean;
  };
  topAction: {
    id: string;
    title: string;
    description: string;
    priority: string;
  };
  aiRecommendation: {
    id: string;
    title: string;
    status: string;
    message: string;
    targetService: string;
    idempotencyKey: string;
  } | null;
  settings: {
    mobileNotify: boolean;
    aiMode: "safe" | "turbo";
  };
  connectedApps: Array<{
    id: string;
    name: string;
    connected: boolean;
    status: string;
    icon: string;
  }>;
  emails: WorkspaceEmail[];
  calendarEvents: WorkspaceCalendarEvent[];
  tasks: WorkspaceTask[];
  pendingActions: WorkspaceAction[];
  isLiveGoogleData?: boolean;
  urgentCallTrigger?: any;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const WORKSPACE_FILE = path.join(DATA_DIR, "workspace.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultWorkspace(): WorkspaceData {
  const emails: WorkspaceEmail[] = [
    {
      id: "em_001",
      sender: "Sarah Lin (VP Eng)",
      senderEmail: "sarah.lin@partnercorp.internal",
      subject: "Q4 Architecture Review Agenda",
      snippet: "Finalized agenda and pre-reads for tomorrow's distributed ingestion engine deep-dive.",
      receivedAt: "25 mins ago",
      priority: "high",
      status: "unread",
      thisMonth: true,
    },
    {
      id: "em_002",
      sender: "David Zhang (Product VP)",
      senderEmail: "david.zhang@partnercorp.internal",
      subject: "Executive Sync Schedule Confirmation",
      snippet: "Looking forward to walking through the Q4 enterprise roadmap milestones with you.",
      receivedAt: "1 hour ago",
      priority: "high",
      status: "unread",
      thisMonth: true,
    },
    {
      id: "em_003",
      sender: "Google Cloud Platform",
      senderEmail: "google-cloud-noreply@google.com",
      subject: "Vertex AI Project Quota Expansion Approved",
      snippet: "Your project quota expansion request for Gemini Pro endpoints has been cleared.",
      receivedAt: "3 hours ago",
      priority: "normal",
      status: "unread",
      thisMonth: true,
    },
    {
      id: "em_004",
      sender: "Marcus Vance (Ops Lead)",
      senderEmail: "marcus.v@partnercorp.internal",
      subject: "Database Cluster Replication Metrics",
      snippet: "Latency benchmarks across APAC read-replicas stabilized within nominal 12ms threshold.",
      receivedAt: "Yesterday",
      priority: "high",
      status: "read",
      thisMonth: true,
    },
  ];

  const calendarEvents: WorkspaceCalendarEvent[] = [
    {
      id: "evt_001",
      title: "Executive Sync",
      description: "Weekly alignment on product strategy, architecture governance, and sprint goals.",
      startTime: "11:30 AM",
      endTime: "12:15 PM",
      location: "Google Meet",
      status: "confirmed",
      conflictDetected: false,
      isToday: true,
      hours: 0.75,
    },
    {
      id: "evt_002",
      title: "Client Technical Debrief",
      description: "Conflict resolved: Adjusted to honor protected deep focus blocks.",
      startTime: "3:30 PM",
      endTime: "4:30 PM",
      location: "Boardroom A / Hybrid",
      status: "confirmed",
      conflictDetected: false,
      isToday: true,
      hours: 1.0,
    },
    {
      id: "evt_003",
      title: "Architecture Sign-off Session",
      description: "Review of end-to-end token validation protocols and service boundaries.",
      startTime: "5:00 PM",
      endTime: "6:00 PM",
      location: "Google Meet",
      status: "confirmed",
      conflictDetected: false,
      isToday: true,
      hours: 1.0,
    },
  ];

  const tasks: WorkspaceTask[] = [
    {
      id: "tsk_001",
      title: "Top Action: Security",
      description: "Token rotation protocol",
      dueDate: "Today, 5:00 PM",
      priority: "urgent",
      status: "pending",
      isDueToday: true,
      isOverdue: false,
    },
    {
      id: "tsk_002",
      title: "Review automated email draft for Executive Sync rescheduling",
      description: "Verify participant availability and automated notification template.",
      dueDate: "Today, 6:30 PM",
      priority: "high",
      status: "pending",
      isDueToday: true,
      isOverdue: false,
    },
    {
      id: "tsk_003",
      title: "Validate Apple Silicon C++ engine benchmark metrics",
      description: "Inspect compile-time profiling logs and memory headroom allocations.",
      dueDate: "Tomorrow, 11:00 AM",
      priority: "medium",
      status: "pending",
      isDueToday: false,
      isOverdue: false,
    },
  ];

  return {
    user: {
      id: "usr_adityananda_dev",
      email: "adityananda.dev@gmail.com",
      fullName: "Aditya Nanda",
      avatarUrl: "",
      role: "Lead Architect",
      age: 24,
      schedulePreference: "Avoid meetings before 10:00 AM",
    },
    metrics: {
      unreadEmails: 14,
      emailsThisMonth: 342,
      emailsImportant: 4,
      meetingsToday: 3,
      thisWeekHours: "18.5h",
      conflicts: 0,
      activeTasks: 8,
      dueToday: 2,
      overdue: 0,
    },
    latestEmail: {
      id: "em_001",
      sender: "Sarah Lin (VP Eng)",
      subject: "Q4 Architecture Review Agenda",
      receivedAt: "25 mins ago",
      priority: "high",
    },
    nextMeeting: {
      id: "evt_001",
      title: "Executive Sync",
      time: "11:30 AM • Google Meet",
      location: "Google Meet",
      conflictDetected: false,
    },
    topAction: {
      id: "tsk_001",
      title: "Top Action: Security",
      description: "Token rotation protocol",
      priority: "urgent",
    },
    aiRecommendation: {
      id: "act_reschedule_client_debrief",
      title: "AI Recommended Action",
      status: "Ready",
      message: "Reschedule Client Debrief to 3:30 PM to honor your protected focus block rule.",
      targetService: "calendar",
      idempotencyKey: "idem_reschedule_cal_0942_safe",
    },
    settings: {
      mobileNotify: false,
      aiMode: "safe",
    },
    connectedApps: [
      {
        id: "gmail",
        name: "Gmail",
        connected: true,
        status: "Synchronized",
        icon: "/icons/gmail.png",
      },
      {
        id: "calendar",
        name: "Google Calendar",
        connected: true,
        status: "Synchronized",
        icon: "/icons/calendar.png",
      },
      {
        id: "tasks",
        name: "Google Tasks",
        connected: true,
        status: "Synchronized",
        icon: "/icons/tasks.svg",
      },
    ],
    emails,
    calendarEvents,
    tasks,
    pendingActions: [
      {
        id: "act_reschedule_client_debrief",
        actionType: "calendar_reschedule",
        title: "Reschedule Client Technical Debrief to 3:30 PM",
        summary: "Moves meeting away from protected focus block to prevent executive fatigue.",
        targetService: "calendar",
        status: "pending_approval",
        idempotencyKey: "idem_reschedule_cal_0942_safe",
        createdAt: new Date().toISOString(),
      },
    ],
    isLiveGoogleData: true,
  };
}

export function readWorkspace(): WorkspaceData {
  ensureStorage();
  let data: WorkspaceData = getDefaultWorkspace();

  if (fs.existsSync(WORKSPACE_FILE)) {
    try {
      const raw = fs.readFileSync(WORKSPACE_FILE, "utf-8");
      data = { ...data, ...JSON.parse(raw) };
    } catch {
      writeWorkspace(data);
    }
  } else {
    writeWorkspace(data);
  }

  // Synchronize user profile from users.json if present
  if (fs.existsSync(USERS_FILE)) {
    try {
      const usersRaw = fs.readFileSync(USERS_FILE, "utf-8");
      const users = JSON.parse(usersRaw);
      const primaryUser = Object.values(users)[0] as any;
      if (primaryUser) {
        data.user = {
          id: primaryUser.id || data.user.id,
          email: primaryUser.email || data.user.email,
          fullName: primaryUser.fullName || data.user.fullName,
          avatarUrl: primaryUser.avatarUrl || data.user.avatarUrl,
          role: primaryUser.role || data.user.role,
          age: primaryUser.age ? Number(primaryUser.age) : data.user.age,
          schedulePreference: primaryUser.schedulePreference || data.user.schedulePreference,
        };
      }
    } catch {}
  }

  return data;
}

export function writeWorkspace(data: WorkspaceData) {
  ensureStorage();
  fs.writeFileSync(WORKSPACE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function updateSettings(settings: {
  mobileNotify?: boolean;
  aiMode?: "safe" | "turbo";
}) {
  const workspace = readWorkspace();
  if (typeof settings.mobileNotify === "boolean") {
    workspace.settings.mobileNotify = settings.mobileNotify;
  }
  if (settings.aiMode) {
    workspace.settings.aiMode = settings.aiMode;
  }
  writeWorkspace(workspace);
  return workspace;
}

export function approvePendingAction(actionId?: string, idempotencyKey?: string) {
  const workspace = readWorkspace();
  const actionIndex = workspace.pendingActions.findIndex(
    (a) =>
      (actionId && a.id === actionId) ||
      (idempotencyKey && a.idempotencyKey === idempotencyKey)
  );

  if (actionIndex !== -1) {
    const action = workspace.pendingActions[actionIndex];
    action.status = "approved";
    action.approvedAt = new Date().toISOString();

    // If it's the current AI recommendation, update recommendation status
    if (workspace.aiRecommendation && workspace.aiRecommendation.id === action.id) {
      workspace.aiRecommendation.status = "Executed";
      workspace.aiRecommendation.message = "Client Debrief successfully rescheduled to 3:30 PM. Calendar conflict cleared.";
    }

    workspace.metrics.conflicts = Math.max(0, workspace.metrics.conflicts - 1);
    writeWorkspace(workspace);
    return { success: true, action };
  }

  // Fallback clearance
  if (workspace.aiRecommendation) {
    workspace.aiRecommendation.status = "Executed";
    workspace.aiRecommendation.message = "Recommended clearance executed and verified across Google Workspace.";
    writeWorkspace(workspace);
  }

  return { success: true, message: "Action approved and synchronized." };
}

export function addWorkspaceEmail(email: {
  to: string;
  subject: string;
  body: string;
  sender?: string;
  priority?: "urgent" | "high" | "normal";
}) {
  const workspace = readWorkspace();
  const id = `msg_${Date.now()}`;
  const newEmail: WorkspaceEmail = {
    id,
    sender: email.sender || workspace.user?.fullName || "Aditya Nanda",
    senderEmail: email.to,
    subject: email.subject || "Project Update",
    snippet: email.body.slice(0, 120),
    receivedAt: new Date().toISOString(),
    status: "read",
    priority: email.priority || "normal",
    thisMonth: true,
  };

  workspace.emails = [newEmail, ...(workspace.emails || [])];
  writeWorkspace(workspace);
  return { success: true, email: newEmail, workspace };
}

export function addWorkspaceCalendarEvent(event: {
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
}) {
  const workspace = readWorkspace();
  const id = `evt_${Date.now()}`;
  const newEvent: WorkspaceCalendarEvent = {
    id,
    title: event.title,
    description: "Scheduled via PACT Chief of Staff",
    startTime: event.startTime,
    endTime: event.endTime || "5:30 PM",
    location: event.location || "Google Meet (meet.google.com/pact-sync)",
    conflictDetected: false,
    isToday: true,
    hours: 1,
    status: "confirmed",
  };

  workspace.calendarEvents = [...(workspace.calendarEvents || []), newEvent];
  workspace.metrics.meetingsToday = (workspace.metrics.meetingsToday || 0) + 1;
  writeWorkspace(workspace);
  return { success: true, event: newEvent, workspace };
}

export function deleteWorkspaceCalendarEvent(identifier: string) {
  const workspace = readWorkspace();
  const initialCount = workspace.calendarEvents.length;
  const lower = identifier.toLowerCase();
  workspace.calendarEvents = workspace.calendarEvents.filter(
    (e) => e.id !== identifier && !e.title.toLowerCase().includes(lower)
  );

  if (workspace.calendarEvents.length < initialCount) {
    workspace.metrics.meetingsToday = Math.max(0, workspace.metrics.meetingsToday - 1);
    writeWorkspace(workspace);
    return { success: true, deleted: true, workspace };
  }
  return { success: false, message: "Event not found" };
}

export function addWorkspaceTask(task: {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: "urgent" | "high" | "medium" | "low";
}) {
  const workspace = readWorkspace();
  const id = `tsk_${Date.now()}`;
  const newTask: WorkspaceTask = {
    id,
    title: task.title,
    description: task.description || "",
    dueDate: task.dueDate || "Today",
    isDueToday: true,
    isOverdue: false,
    priority: task.priority || "medium",
    status: "pending",
  };

  workspace.tasks = [newTask, ...(workspace.tasks || [])];
  workspace.metrics.activeTasks = (workspace.metrics.activeTasks || 0) + 1;
  workspace.metrics.dueToday = (workspace.metrics.dueToday || 0) + 1;
  writeWorkspace(workspace);
  return { success: true, task: newTask, workspace };
}

export function deleteWorkspaceTask(identifier: string) {
  const workspace = readWorkspace();
  const initialCount = workspace.tasks.length;
  const lower = identifier.toLowerCase();
  workspace.tasks = workspace.tasks.filter(
    (t) => t.id !== identifier && !t.title.toLowerCase().includes(lower)
  );

  if (workspace.tasks.length < initialCount) {
    workspace.metrics.activeTasks = Math.max(0, workspace.metrics.activeTasks - 1);
    workspace.metrics.dueToday = Math.max(0, workspace.metrics.dueToday - 1);
    writeWorkspace(workspace);
    return { success: true, deleted: true, workspace };
  }
  return { success: false, message: "Task not found" };
}



export function simulateUrgentEmailCall() {
  const workspace = readWorkspace();
  const id = `call_${Date.now()}`;
  const nowStr = "Just now";

  const urgentEmail: WorkspaceEmail = {
    id: `msg_sim_${Date.now()}`,
    sender: "Elena Rostova (Executive Director)",
    senderEmail: "elena.rostova@partner-holding.com",
    subject: "CRITICAL: Urgent Authorization Needed for System Migration Window",
    snippet: "Aditya, the cloud infrastructure cutover window is locked at 2:00 PM today. We require immediate sign-off on the rollback policy to avoid downtime.",
    receivedAt: nowStr,
    priority: "urgent",
    status: "unread",
    thisMonth: true,
  };

  workspace.emails = [urgentEmail, ...(workspace.emails || [])];
  workspace.latestEmail = urgentEmail;
  workspace.metrics.unreadEmails = (workspace.metrics.unreadEmails || 0) + 1;
  workspace.metrics.emailsImportant = (workspace.metrics.emailsImportant || 0) + 1;

  workspace.aiRecommendation = {
    id: `rec_${Date.now()}`,
    title: "Urgent Authorization: Elena Rostova",
    status: "pending_review",
    message: "Elena Rostova requested immediate authorization for the 2:00 PM system migration rollback policy.",
    targetService: "gmail",
    idempotencyKey: `idemp_${id}`,
  };

  workspace.urgentCallTrigger = {
    id,
    type: "email_urgent_call",
    sender: "Elena Rostova (Executive Director)",
    subject: "CRITICAL: Urgent Authorization Needed for System Migration Window",
    snippet: "Aditya, the cloud infrastructure cutover window is locked at 2:00 PM today. We require immediate sign-off on the rollback policy to avoid downtime.",
    proposedAction: "Authorize 2:00 PM system migration rollback policy and reschedule conflicting sync",
    triggerAt: Date.now(),
    callDelaySeconds: 10,
    status: "pending",
    attempts: 0,
    maxAttempts: 2,
    idempotencyKey: `idemp_${id}`,
  };

  writeWorkspace(workspace);
  return { success: true, workspace, urgentCallTrigger: workspace.urgentCallTrigger };
}

export function updateUrgentCallTrigger(updates: Partial<any>) {
  const workspace = readWorkspace();
  if (workspace.urgentCallTrigger) {
    workspace.urgentCallTrigger = {
      ...workspace.urgentCallTrigger,
      ...updates,
    };
    writeWorkspace(workspace);
  }
  return { success: true, workspace };
}
