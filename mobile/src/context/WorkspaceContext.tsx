import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  fetchWorkspaceOverview,
  approveAction,
  updateWorkspaceSettings,
  resolveApiHost,
  WorkspaceOverview,
} from '../services/api';
import { speakVoice, stopSpeaking, triggerUrgentRingtone } from '../services/voiceService';
import * as Haptics from 'expo-haptics';

export interface MobileAlert {
  id: string;
  type: 'conflict' | 'deadline' | 'clearance' | 'email';
  title: string;
  description: string;
  time?: string;
  priority: 'urgent' | 'high' | 'normal';
  targetService: 'calendar' | 'tasks' | 'gmail';
  proposedAction?: string;
  idempotencyKey?: string;
  isResolved?: boolean;
}

export interface UrgentCallState {
  isOpen: boolean;
  alert: MobileAlert | null;
  status: 'ringing' | 'connected' | 'settling' | 'settled';
  transcript: string[];
  attempt: number;
}

interface WorkspaceContextType {
  workspace: WorkspaceOverview | null;
  alerts: MobileAlert[];
  isLoading: boolean;
  notificationBanner: string | null;
  mobileNotify: boolean;
  setMobileNotify: (val: boolean) => Promise<void>;
  aiMode: 'safe' | 'turbo';
  setAiMode: (mode: 'safe' | 'turbo') => Promise<void>;
  refreshWorkspace: () => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  dismissAlert: (alertId: string) => void;
  urgentCall: UrgentCallState;
  triggerUrgentCall: (alert?: MobileAlert, attempt?: number) => void;
  answerCall: () => void;
  declineCall: () => Promise<void>;
  settleCallByVoice: (decision: 'approve' | 'reschedule' | 'decline') => Promise<void>;
  endCall: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspace: null,
  alerts: [],
  isLoading: true,
  notificationBanner: null,
  mobileNotify: true,
  setMobileNotify: async () => {},
  aiMode: 'safe',
  setAiMode: async () => {},
  refreshWorkspace: async () => {},
  resolveAlert: async () => {},
  dismissAlert: () => {},
  urgentCall: { isOpen: false, alert: null, status: 'ringing', transcript: [], attempt: 0 },
  triggerUrgentCall: () => {},
  answerCall: () => {},
  declineCall: async () => {},
  settleCallByVoice: async () => {},
  endCall: () => {},
});

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspace, setWorkspace] = useState<WorkspaceOverview | null>(null);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [mobileNotify, setMobileNotifyState] = useState<boolean>(true);
  const [aiMode, setAiModeState] = useState<'safe' | 'turbo'>('safe');
  const [alerts, setAlerts] = useState<MobileAlert[]>([
    {
      id: 'alt_01',
      type: 'conflict',
      title: 'Schedule Collision Detected',
      description: 'Client Technical Debrief at 3:30 PM overlaps with your protected Focus Block rule.',
      time: 'Today, 3:30 PM',
      priority: 'urgent',
      targetService: 'calendar',
      proposedAction: 'Reschedule to 4:00 PM - 5:00 PM',
      idempotencyKey: 'idemp_cal_conflict_400',
    },
    {
      id: 'alt_02',
      type: 'clearance',
      title: 'Human Clearance Required',
      description: 'Draft email to Sarah Chen ready for review before dispatch.',
      time: '15 mins ago',
      priority: 'urgent',
      targetService: 'gmail',
      proposedAction: 'Send confirmation email with agenda attachment',
      idempotencyKey: 'idemp_gmail_sarah_send',
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Urgent Call State with attempt counter
  const [urgentCall, setUrgentCall] = useState<UrgentCallState>({
    isOpen: false,
    alert: null,
    status: 'ringing',
    transcript: [],
    attempt: 0,
  });

  // Track processed triggers to prevent duplicate handling
  const processedTriggerRef = useRef<string | null>(null);

  const loadData = async () => {
    try {
      const data: any = await fetchWorkspaceOverview();
      setWorkspace(data);

      // Check for urgent call trigger from web simulation or backend
      if (data?.urgentCallTrigger && data.urgentCallTrigger.status === 'pending') {
        const trigger = data.urgentCallTrigger;
        if (processedTriggerRef.current !== trigger.id) {
          processedTriggerRef.current = trigger.id;

          const urgentEmailAlert: MobileAlert = {
            id: trigger.id,
            type: 'email',
            title: trigger.sender,
            description: trigger.subject,
            time: 'Just now',
            priority: 'urgent',
            targetService: 'gmail',
            proposedAction: trigger.proposedAction,
            idempotencyKey: trigger.idempotencyKey,
          };

          // 1. Immediately notify user on phone about the high priority email
          setNotificationBanner(
            `🚨 High-Priority Email from ${trigger.sender}: "${trigger.subject}". AI Chief of Staff calling in 10s...`
          );
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

          // 2. In 10 seconds: Trigger incoming voice call!
          setTimeout(() => {
            setNotificationBanner(null);
            triggerUrgentCall(urgentEmailAlert, 0);
          }, 10000);
        }
      }
    } catch (err) {
      console.warn('Failed to refresh mobile workspace:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll every 2.5 seconds for real-time synchronization with web dashboard
    const interval = setInterval(loadData, 2500);
    return () => clearInterval(interval);
  }, []);

  const refreshWorkspace = async () => {
    setIsLoading(true);
    await loadData();
  };

  // Immediate 1-tap resolution of an alert
  const resolveAlert = async (alertId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const target = alerts.find((a) => a.id === alertId);
    if (target?.idempotencyKey) {
      await approveAction(alertId, target.idempotencyKey);
    }
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isResolved: true } : a))
    );
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const dismissAlert = (alertId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Trigger Urgent AI Phone Call with voice ringing
  const triggerUrgentCall = (customAlert?: MobileAlert, attempt = 0) => {
    const alertToUse = customAlert || alerts.find((a) => !a.isResolved) || alerts[0];
    triggerUrgentRingtone();

    const isCallback = attempt > 0;
    setUrgentCall({
      isOpen: true,
      alert: alertToUse,
      status: 'ringing',
      attempt,
      transcript: [
        isCallback
          ? '[Callback Attempt 2 from PACT AI Chief of Staff...]'
          : '[Incoming Urgent Voice Call from PACT AI Chief of Staff...]',
      ],
    });
  };

  // Answer Call -> Voice Agent speaks out the exact emergency and prompts resolution
  const answerCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const alert = urgentCall.alert;
    const isCallback = urgentCall.attempt > 0;

    const speechText = alert
      ? `Hi Aditya, this is PACT Chief of Staff calling. An urgent high-priority email just arrived from ${alert.title} regarding: ${alert.description}. She requires immediate executive sign-off on the rollback policy before 2:00 PM. I propose that we ${alert.proposedAction}. Should I authorize and settle this right now?`
      : 'Hi Aditya, this is PACT Chief of Staff calling. An urgent high-priority matter requires your authorization. How would you like to proceed?';

    setUrgentCall((prev) => ({
      ...prev,
      status: 'connected',
      transcript: [
        'Call connected.',
        `PACT AI: "${isCallback ? 'Hi Aditya, this is your AI Chief of Staff calling back as requested.' : 'Hi Aditya, this is your AI Chief of Staff calling.'}"`,
        `PACT AI: "${speechText}"`,
        'Awaiting your decision: Tap "Authorize & Settle Action" to execute.',
      ],
    }));

    speakVoice(speechText);
  };

  // Decline / Reject Call Handler
  const declineCall = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopSpeaking();

    const currentAttempt = urgentCall.attempt ?? 0;
    const currentAlert = urgentCall.alert;

    // Close the current modal
    setUrgentCall((prev) => ({
      ...prev,
      isOpen: false,
      status: 'ringing',
    }));

    if (currentAttempt === 0 && currentAlert) {
      // 1st cut: schedule callback in exactly 10 seconds!
      setNotificationBanner('Call declined. PACT Chief of Staff will call back in 10 seconds...');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      setTimeout(() => {
        setNotificationBanner(null);
        triggerUrgentCall(currentAlert, 1); // 2nd attempt!
      }, 10000);
    } else {
      // 2nd cut: after 2nd cut call will NOT go!
      setNotificationBanner('2nd call declined. PACT Chief of Staff will not dial again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => setNotificationBanner(null), 8000);

      // Notify backend that trigger is dismissed
      try {
        const baseUrl = await resolveApiHost();
        await fetch(`${baseUrl}/api/workspace/overview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_call_trigger',
            urgentCallTrigger: {
              status: 'dismissed',
              dismissedAt: Date.now(),
            },
          }),
        });
      } catch {}
    }
  };

  // Settle things during the voice call
  const settleCallByVoice = async (decision: 'approve' | 'reschedule' | 'decline') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUrgentCall((prev) => ({ ...prev, status: 'settling' }));

    const alert = urgentCall.alert;
    if (alert) {
      if (decision === 'approve' || decision === 'reschedule') {
        if (alert.idempotencyKey) {
          await approveAction(alert.id, alert.idempotencyKey);
        }
        setAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? { ...a, isResolved: true } : a))
        );

        const confirmationText = `Understood Aditya. I have authorized the executive sign-off for ${alert.title} and updated your workspace with verified idempotency. Everything is settled.`;

        setUrgentCall((prev) => ({
          ...prev,
          status: 'settled',
          transcript: [
            ...prev.transcript,
            `User: "Approved, settle this now."`,
            `PACT AI: "${confirmationText}"`,
            'Status: Action verified and saved.',
          ],
        }));

        speakVoice(confirmationText);

        // Notify backend trigger settled
        try {
          const baseUrl = await resolveApiHost();
          await fetch(`${baseUrl}/api/workspace/overview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_call_trigger',
              urgentCallTrigger: {
                status: 'settled',
                settledAt: Date.now(),
              },
            }),
          });
        } catch {}

        setTimeout(() => {
          endCall();
        }, 3500);
      } else {
        const declineText = 'Understood. I have held execution and dismissed the urgent prompt.';
        setUrgentCall((prev) => ({
          ...prev,
          status: 'settled',
          transcript: [
            ...prev.transcript,
            `User: "Decline action."`,
            `PACT AI: "${declineText}"`,
          ],
        }));
        speakVoice(declineText);
        setTimeout(() => {
          endCall();
        }, 2500);
      }
    }
  };

  const endCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopSpeaking();
    setUrgentCall({
      isOpen: false,
      alert: null,
      status: 'ringing',
      transcript: [],
      attempt: 0,
    });
  };

  const setMobileNotify = async (val: boolean) => {
    setMobileNotifyState(val);
    await updateWorkspaceSettings({ mobileNotify: val });
  };

  const setAiMode = async (mode: 'safe' | 'turbo') => {
    setAiModeState(mode);
    await updateWorkspaceSettings({ aiMode: mode });
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        alerts,
        isLoading,
        notificationBanner,
        mobileNotify,
        setMobileNotify,
        aiMode,
        setAiMode,
        refreshWorkspace,
        resolveAlert,
        dismissAlert,
        urgentCall,
        triggerUrgentCall,
        answerCall,
        declineCall,
        settleCallByVoice,
        endCall,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
