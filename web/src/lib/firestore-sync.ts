import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface FirestoreEmail {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  snippet: string;
  received_at: string;
  priority: "high" | "medium" | "low";
  status: "unread" | "read" | "replied";
  thread_id?: string;
}

export interface FirestoreCalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  status: "confirmed" | "tentative" | "cancelled";
  conflict_detected: boolean;
}

export interface FirestoreTask {
  id: string;
  title: string;
  due_date: string;
  priority: "urgent" | "high" | "normal";
  status: "pending" | "completed";
}

export interface FirestoreAction {
  id: string;
  action_type: string;
  title: string;
  summary: string;
  target_service: "gmail" | "calendar" | "tasks";
  status: "pending_approval" | "approved" | "rejected" | "executed";
  idempotency_key: string;
  created_at: string;
  approved_at?: string;
}

export interface FirestoreAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  status: "active" | "dismissed";
  created_at: string;
}

export interface WorkspaceOverview {
  user: {
    email: string;
    full_name: string;
    avatar_url?: string;
    role: string;
    age?: number;
    schedule_preference: string;
  };
  metrics: {
    unreadEmails: number;
    pendingTasks: number;
    activeConflicts: number;
    pendingClearances: number;
  };
  emails: FirestoreEmail[];
  calendarEvents: FirestoreCalendarEvent[];
  tasks: FirestoreTask[];
  pendingActions: FirestoreAction[];
  proactiveAlerts: FirestoreAlert[];
  preferences: any[];
}

export async function fetchUserWorkspaceData(
  userId: string,
  userEmail: string,
  userName: string,
  userRole: string = "Lead Architect",
  userAge: number = 24,
  userPref: string = "Avoid meetings before 10:00 AM"
): Promise<WorkspaceOverview> {
  // 1. Fetch User Document
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  let profile = userSnap.exists()
    ? userSnap.data()
    : {
        email: userEmail,
        fullName: userName,
        role: userRole,
        age: userAge,
        schedulePreference: userPref,
      };

  // 2. Fetch Subcollections
  const emailsRef = collection(db, "users", userId, "emails");
  const calendarRef = collection(db, "users", userId, "calendar_events");
  const tasksRef = collection(db, "users", userId, "tasks");
  const actionsRef = collection(db, "users", userId, "agent_actions");
  const alertsRef = collection(db, "users", userId, "proactive_alerts");

  const [emailSnap, calSnap, taskSnap, actionSnap, alertSnap] = await Promise.all([
    getDocs(query(emailsRef, orderBy("received_at", "desc"), limit(10))).catch(() => null),
    getDocs(query(calendarRef, orderBy("start_time", "asc"), limit(10))).catch(() => null),
    getDocs(query(tasksRef, orderBy("due_date", "asc"), limit(10))).catch(() => null),
    getDocs(query(actionsRef, orderBy("created_at", "desc"))).catch(() => null),
    getDocs(query(alertsRef, orderBy("created_at", "desc"))).catch(() => null),
  ]);

  let emails: FirestoreEmail[] = emailSnap ? emailSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) : [];
  let calendarEvents: FirestoreCalendarEvent[] = calSnap ? calSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) : [];
  let tasks: FirestoreTask[] = taskSnap ? taskSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) : [];
  let pendingActions: FirestoreAction[] = actionSnap ? actionSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) : [];
  let proactiveAlerts: FirestoreAlert[] = alertSnap ? alertSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) : [];

  // Seed initial live workspace data if first login for this user
  if (emails.length === 0 && pendingActions.length === 0) {
    const initialEmails: Omit<FirestoreEmail, "id">[] = [
      {
        sender_name: "Sarah Lin (VP Engineering)",
        sender_email: "sarah.lin@partnercorp.internal",
        subject: "Q4 Architecture Review - Agenda & Pre-reads",
        snippet: "Please find the finalized architecture draft for the distributed ingestion pipeline...",
        received_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        priority: "high",
        status: "unread",
        thread_id: "th_arch_q4_001",
      },
      {
        sender_name: "Google Calendar",
        sender_email: "calendar-notification@google.com",
        subject: "Invitation: Executive Sync @ Fri 11:30 AM",
        snippet: "Aditya Nanda has been invited to Executive Sync by David Zhang...",
        received_at: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
        priority: "medium",
        status: "read",
        thread_id: "th_cal_inv_002",
      },
      {
        sender_name: "Marcus Vance (Ops Lead)",
        sender_email: "marcus.v@partnercorp.internal",
        subject: "Database Cluster Failover Post-Mortem",
        snippet: "Summary of latency spike during yesterday's replication failover testing...",
        received_at: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
        priority: "medium",
        status: "unread",
        thread_id: "th_ops_post_003",
      },
    ];

    const initialEvents: Omit<FirestoreCalendarEvent, "id">[] = [
      {
        title: "Sprint Planning & Resource Allocation",
        description: "Review sprint deliverables and task commitments across engineering tracks.",
        start_time: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        end_time: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
        location: "Google Meet (pact-eng-sync)",
        status: "confirmed",
        conflict_detected: false,
      },
      {
        title: "Client Technical Debrief",
        description: "Conflict detected: Overlaps with Focus Block policy.",
        start_time: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        end_time: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
        location: "Boardroom A / Hybrid",
        status: "tentative",
        conflict_detected: true,
      },
    ];

    const initialTasks: Omit<FirestoreTask, "id">[] = [
      {
        title: "Sign off on Q4 security token rotation protocol",
        due_date: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
        priority: "urgent",
        status: "pending",
      },
      {
        title: "Review automated email draft for Executive Sync rescheduling",
        due_date: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
        priority: "high",
        status: "pending",
      },
      {
        title: "Verify Apple Silicon C++ engine benchmark metrics",
        due_date: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        priority: "normal",
        status: "pending",
      },
    ];

    const initialActions: Omit<FirestoreAction, "id">[] = [
      {
        action_type: "calendar_reschedule",
        title: "Resolve Overlap: Reschedule Client Technical Debrief to 3:30 PM",
        summary:
          "PACT detected a direct conflict between Client Technical Debrief and your protected Focus Block. Moving to 3:30 PM satisfies both participants and honors your working preference.",
        target_service: "calendar",
        status: "pending_approval",
        idempotency_key: "idem_reschedule_cal_0942_safe",
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        action_type: "email_dispatch",
        title: "Dispatch Architecture Review Acknowledgment to Sarah Lin",
        summary:
          "Draft prepared summarizing acceptance of ingestion pipeline specs and noting attendance at tomorrow's sync.",
        target_service: "gmail",
        status: "pending_approval",
        idempotency_key: "idem_email_ack_sarah_lin_safe",
        created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      },
    ];

    const initialAlerts: Omit<FirestoreAlert, "id">[] = [
      {
        alert_type: "scheduling_conflict",
        title: "Calendar Conflict Detected",
        message:
          "Client Technical Debrief overlaps with your designated Focus Block at 2:00 PM.",
        status: "active",
        created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      },
      {
        alert_type: "high_priority_email",
        title: "Executive Email Flagged",
        message: "Sarah Lin requested confirmation on Q4 architecture review agenda.",
        status: "active",
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ];

    // Persist seeded documents to Firestore
    try {
      await Promise.all([
        ...initialEmails.map((e, idx) => setDoc(doc(emailsRef, `email_${idx + 1}`), e)),
        ...initialEvents.map((c, idx) => setDoc(doc(calendarRef, `event_${idx + 1}`), c)),
        ...initialTasks.map((t, idx) => setDoc(doc(tasksRef, `task_${idx + 1}`), t)),
        ...initialActions.map((a, idx) => setDoc(doc(actionsRef, `action_${idx + 1}`), a)),
        ...initialAlerts.map((al, idx) => setDoc(doc(alertsRef, `alert_${idx + 1}`), al)),
      ]);

      // Re-read populated arrays
      emails = initialEmails.map((e, idx) => ({ id: `email_${idx + 1}`, ...e }));
      calendarEvents = initialEvents.map((c, idx) => ({ id: `event_${idx + 1}`, ...c }));
      tasks = initialTasks.map((t, idx) => ({ id: `task_${idx + 1}`, ...t }));
      pendingActions = initialActions.map((a, idx) => ({ id: `action_${idx + 1}`, ...a }));
      proactiveAlerts = initialAlerts.map((al, idx) => ({ id: `alert_${idx + 1}`, ...al }));
    } catch (seedErr) {
      console.warn("Firestore seed notice (offline/rules fallback):", seedErr);
    }
  }

  // Filter only actions awaiting human approval
  const activeClearances = pendingActions.filter((a) => a.status === "pending_approval");
  const unreadEmailsCount = emails.filter((e) => e.status === "unread").length;
  const pendingTasksCount = tasks.filter((t) => t.status === "pending").length;
  const activeConflictsCount = proactiveAlerts.filter(
    (a) => a.alert_type === "scheduling_conflict" && a.status === "active"
  ).length;

  return {
    user: {
      email: profile.email || userEmail,
      full_name: profile.fullName || userName,
      avatar_url: profile.avatarUrl || "",
      role: profile.role || userRole,
      age: profile.age || userAge,
      schedule_preference: profile.schedulePreference || userPref,
    },
    metrics: {
      unreadEmails: unreadEmailsCount,
      pendingTasks: pendingTasksCount,
      activeConflicts: activeConflictsCount,
      pendingClearances: activeClearances.length,
    },
    emails,
    calendarEvents,
    tasks,
    pendingActions: activeClearances,
    proactiveAlerts,
    preferences: [
      { key: "schedule_preference", value: profile.schedulePreference || userPref },
      { key: "role", value: profile.role || userRole },
    ],
  };
}

export async function approveClearanceInFirestore(
  userId: string,
  actionId: string,
  idempotencyKey: string
): Promise<boolean> {
  try {
    const actionDocRef = doc(db, "users", userId, "agent_actions", actionId);
    await updateDoc(actionDocRef, {
      status: "approved",
      approved_at: new Date().toISOString(),
      updated_at: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.warn("Direct Firestore update failed, fallback:", err);
    return false;
  }
}
