import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Switch,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Colors } from '../../theme/colors';
import {
  ShieldCheck,
  Calendar,
  Mail,
  CheckSquare,
  Clock,
  LogOut,
  RefreshCw,
  Zap,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const {
    workspace,
    isLoading,
    refreshWorkspace,
    mobileNotify,
    setMobileNotify,
    aiMode,
    setAiMode,
    triggerUrgentCall,
    notificationBanner,
  } = useWorkspace();

  // Dynamic IST Clock & Greeting
  const [istTime, setIstTime] = useState('');
  const [greeting, setGreeting] = useState('Good afternoon');
  const [isApproving, setIsApproving] = useState(false);
  const [approvedAction, setApprovedAction] = useState(false);

  useEffect(() => {
    const updateIST = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setIstTime(`${new Intl.DateTimeFormat('en-IN', options).format(now)} IST`);

      const istHour = parseInt(
        new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: 'numeric',
          hour12: false,
        }).format(now),
        10
      );

      if (istHour >= 4 && istHour < 12) setGreeting('Good morning');
      else if (istHour >= 12 && istHour < 17) setGreeting('Good afternoon');
      else if (istHour >= 17 && istHour < 22) setGreeting('Good evening');
      else setGreeting('Good night');
    };

    updateIST();
    const interval = setInterval(updateIST, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async () => {
    if (isApproving || approvedAction) return;
    setIsApproving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(async () => {
      setApprovedAction(true);
      setIsApproving(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 500);
  };

  const displayName = workspace?.user?.fullName || user?.fullName || 'Aditya Nanda';
  const displayRole = workspace?.user?.role || 'Lead Architect';
  const displayEmail = workspace?.user?.email || user?.email || 'adityananda.dev@gmail.com';
  const avatarUrl = workspace?.user?.avatarUrl || user?.avatarUrl;

  const unreadEmails = workspace?.metrics?.unreadEmails ?? 2;
  const emailsThisMonth = workspace?.metrics?.emailsThisMonth ?? 97;
  const emailsImportant = workspace?.metrics?.emailsImportant ?? 0;
  const latestEmail = workspace?.latestEmail;

  const meetingsToday = workspace?.metrics?.meetingsToday ?? 0;
  const thisWeekHours = workspace?.metrics?.thisWeekHours ?? '0h';
  const conflicts = workspace?.metrics?.conflicts ?? 0;
  const nextMeeting = workspace?.nextMeeting;

  const activeTasks = workspace?.metrics?.activeTasks ?? 0;
  const dueToday = workspace?.metrics?.dueToday ?? 0;
  const overdue = workspace?.metrics?.overdue ?? 0;
  const topAction = workspace?.topAction;

  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 48) + 14 : insets.top + 14;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding }]}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refreshWorkspace} colors={['#0b57d0']} />
      }
    >
      {/* 1. Top Executive Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>P</Text>
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>P.A.C.T.</Text>
              <View style={styles.liveBadge}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.liveBadgeText}>Google Live</Text>
              </View>
            </View>
            <Text style={styles.brandSub}>Executive OS</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={refreshWorkspace}
            accessibilityLabel="Refresh Workspace"
          >
            <RefreshCw size={15} color={Colors.light.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={logout}
            accessibilityLabel="Sign Out"
          >
            <LogOut size={15} color={Colors.light.criticalText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Real-time Notification Banner */}
      {notificationBanner && (
        <View style={styles.notificationBanner}>
          <Sparkles size={16} color="#0b57d0" />
          <Text style={styles.notificationBannerText}>{notificationBanner}</Text>
        </View>
      )}

      {/* 2. Executive Profile & Dynamic Greeting */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  borderWidth: 1.5,
                  borderColor: '#e0e3e7',
                }}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>AN</Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={11} color="#ffffff" />
            </View>
          </View>

          <View style={styles.profileInfoCol}>
            <Text style={styles.greetingText}>
              {greeting}, <Text style={styles.userNameText}>{displayName.split(' ')[0]}</Text>
            </Text>
            <View style={styles.roleRow}>
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>{displayRole}</Text>
              </View>
              <View style={styles.timeRow}>
                <Clock size={11} color={Colors.light.textMuted} />
                <Text style={styles.timeText}>{istTime}</Text>
              </View>
            </View>
            <Text style={styles.emailText} numberOfLines={1}>
              {displayEmail}
            </Text>
          </View>
        </View>

        {/* Executive Quick Controls: Safe/Turbo Mode + Call on Mobile */}
        <View style={styles.executiveControlsRow}>
          {/* Autonomy Mode Segmented Pill */}
          <View style={styles.modeSegmentContainer}>
            <TouchableOpacity
              style={[styles.modeSegmentBtn, aiMode === 'safe' && styles.modeSegmentActive]}
              onPress={() => setAiMode('safe')}
            >
              <Text style={[styles.modeSegmentText, aiMode === 'safe' && styles.modeSegmentTextActive]}>
                Safe (HITL)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeSegmentBtn, aiMode === 'turbo' && styles.modeSegmentActive]}
              onPress={() => setAiMode('turbo')}
            >
              <Text style={[styles.modeSegmentText, aiMode === 'turbo' && styles.modeSegmentTextActive]}>
                Turbo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Call on Mobile Toggle */}
          <TouchableOpacity
            style={[styles.callToggleContainer, mobileNotify && styles.callToggleContainerActive]}
            onPress={() => setMobileNotify(!mobileNotify)}
            activeOpacity={0.8}
          >
            <PhoneCall size={13} color={mobileNotify ? '#0b57d0' : Colors.light.textMuted} />
            <Text style={[styles.callToggleLabel, mobileNotify && styles.callToggleLabelActive]}>
              Call on Mobile
            </Text>
            <Switch
              value={mobileNotify}
              onValueChange={setMobileNotify}
              trackColor={{ false: '#e0e3e7', true: '#c2e7ff' }}
              thumbColor={mobileNotify ? '#0b57d0' : '#ffffff'}
              style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Section Title: Google Workspace Insights */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Workspace Telemetry</Text>
        <Text style={styles.sectionSubtitle}>Synced with Google Cloud Project</Text>
      </View>

      {/* 4. Three Core Google Workspace Cards (Gmail, Calendar, Tasks) */}
      <View style={styles.workspaceCardsCol}>
        {/* Card 1: Gmail Insights */}
        <View style={styles.insightCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.serviceIconContainer, { backgroundColor: '#fce8e6' }]}>
                <Mail size={16} color="#c5221f" />
              </View>
              <Text style={styles.cardServiceTitle}>Gmail</Text>
            </View>
            <View style={styles.liveTagRow}>
              <View style={styles.liveSmallDot} />
              <Text style={styles.liveTagText}>Live</Text>
            </View>
          </View>

          {/* Big Number Container */}
          <View style={styles.statBox}>
            <Text style={styles.statBigNumber}>{unreadEmails}</Text>
            <Text style={styles.statLabel}>Unread priority emails</Text>
          </View>

          {/* 3 Stacked Sub-metric rows */}
          <View style={styles.subMetricsContainer}>
            <View style={styles.subMetricRow}>
              <Text style={styles.subMetricLabel}>This month</Text>
              <Text style={styles.subMetricValue}>{emailsThisMonth}</Text>
            </View>
            <View style={styles.subMetricRow}>
              <Text style={styles.subMetricLabel}>Important</Text>
              <Text style={[styles.subMetricValue, emailsImportant > 0 && { color: '#c5221f' }]}>
                {emailsImportant}
              </Text>
            </View>
            <View style={[styles.subMetricRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.subMetricLabel}>Latest</Text>
              <Text style={styles.subMetricSnippet} numberOfLines={1}>
                {latestEmail?.sender ? `${latestEmail.sender} - ${latestEmail.subject}` : 'Inbox is clean'}
              </Text>
            </View>
          </View>
        </View>

        {/* Card 2: Calendar Insights */}
        <View style={styles.insightCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.serviceIconContainer, { backgroundColor: '#e8f0fe' }]}>
                <Calendar size={16} color="#1a73e8" />
              </View>
              <Text style={styles.cardServiceTitle}>Calendar</Text>
            </View>
            <View style={styles.liveTagRow}>
              <View style={styles.liveSmallDot} />
              <Text style={styles.liveTagText}>Live</Text>
            </View>
          </View>

          {/* Big Number Container */}
          <View style={styles.statBox}>
            <Text style={styles.statBigNumber}>{meetingsToday}</Text>
            <Text style={styles.statLabel}>Meetings scheduled today</Text>
          </View>

          {/* 3 Stacked Sub-metric rows */}
          <View style={styles.subMetricsContainer}>
            <View style={styles.subMetricRow}>
              <Text style={styles.subMetricLabel}>This week</Text>
              <Text style={styles.subMetricValue}>{thisWeekHours}</Text>
            </View>
            <View style={styles.subMetricRow}>
              <Text style={styles.subMetricLabel}>Conflicts</Text>
              <Text style={[styles.subMetricValue, { color: '#137333' }]}>
                {conflicts} Protected
              </Text>
            </View>
            <View style={[styles.subMetricRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.subMetricLabel}>Next</Text>
              <Text style={styles.subMetricSnippet} numberOfLines={1}>
                {nextMeeting?.title && nextMeeting.title !== 'No upcoming meetings'
                  ? `${nextMeeting.title} (${nextMeeting.time})`
                  : 'Calendar clear today'}
              </Text>
            </View>
          </View>
        </View>

        {/* Card 3: Tasks Insights */}
        <View style={styles.insightCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.serviceIconContainer, { backgroundColor: '#e6f4ea' }]}>
                <CheckSquare size={16} color="#1e8e3e" />
              </View>
              <Text style={styles.cardServiceTitle}>Tasks</Text>
            </View>
            <View style={styles.liveTagRow}>
              <View style={styles.liveSmallDot} />
              <Text style={styles.liveTagText}>Live</Text>
            </View>
          </View>

          {/* Big Number Container */}
          <View style={styles.statBox}>
            <Text style={styles.statBigNumber}>{activeTasks}</Text>
            <Text style={styles.statLabel}>Active deliverables</Text>
          </View>

          {/* 3 Stacked Sub-metric rows */}
          <View style={styles.subMetricsContainer}>
            <View style={styles.subMetricRow}>
              <Text style={styles.subMetricLabel}>Due today</Text>
              <Text style={[styles.subMetricValue, dueToday > 0 && { color: '#e65100' }]}>
                {dueToday} Urgent
              </Text>
            </View>
            <View style={styles.subMetricRow}>
              <Text style={styles.subMetricLabel}>Overdue</Text>
              <Text style={[styles.subMetricValue, { color: '#137333' }]}>
                {overdue} On track
              </Text>
            </View>
            <View style={[styles.subMetricRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.subMetricLabel}>Top</Text>
              <Text style={styles.subMetricSnippet} numberOfLines={1}>
                {topAction?.title && topAction.title !== 'none'
                  ? topAction.title
                  : 'All deliverables complete'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 5. Human-in-the-Loop Clearance & Recommended Action Card */}
      <View style={styles.hitlCard}>
        <View style={styles.hitlHeader}>
          <View style={styles.hitlBadge}>
            <Zap size={12} color="#0b57d0" />
            <Text style={styles.hitlBadgeText}>AI RECOMMENDED ACTION</Text>
          </View>
          <View
            style={[
              styles.statusChip,
              approvedAction ? styles.statusChipSuccess : styles.statusChipPending,
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                approvedAction ? styles.statusChipTextSuccess : styles.statusChipTextPending,
              ]}
            >
              {approvedAction ? 'EXECUTED' : 'READY'}
            </Text>
          </View>
        </View>

        <Text style={styles.hitlMessage}>
          {approvedAction
            ? 'Action verified and scheduled in Google Calendar with protected focus parameters.'
            : workspace?.aiRecommendation?.message ||
              'Reschedule Client Technical Debrief to 3:30 PM to honor your protected focus block rule.'}
        </Text>

        {!approvedAction ? (
          <TouchableOpacity
            style={styles.authorizeBtn}
            onPress={handleApprove}
            disabled={isApproving}
            activeOpacity={0.85}
          >
            <CheckCircle2 size={16} color="#ffffff" />
            <Text style={styles.authorizeBtnText}>
              {isApproving ? 'Authorizing...' : 'Authorize & Execute'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.executedRow}>
            <CheckCircle2 size={15} color="#137333" />
            <Text style={styles.executedText}>Idempotently executed and verified</Text>
          </View>
        )}
      </View>

      {/* 6. Emergency Voice Protocol (Restrained Executive Banner) */}
      <View style={styles.voiceProtocolCard}>
        <View style={styles.voiceProtocolLeft}>
          <View style={styles.voiceProtocolIcon}>
            <PhoneCall size={16} color="#0b57d0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.voiceProtocolTitle}>Emergency Voice Protocol</Text>
            <Text style={styles.voiceProtocolSub}>
              {mobileNotify
                ? 'Active — PACT will auto-dial if a conflict requires verbal authorization'
                : 'Disabled — Enable "Call on Mobile" above to receive urgent voice alerts'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.voiceTestBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            triggerUrgentCall();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.voiceTestBtnText}>Test Call</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafd',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  // Top Header
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e3e7',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#0b57d0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0b57d0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  logoBadgeText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#ffffff',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#1f1f1f',
    letterSpacing: -0.3,
  },
  brandSub: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#747775',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#e6f4ea',
    borderWidth: 1,
    borderColor: '#ceead6',
  },
  greenPulseDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#1e8e3e',
  },
  liveBadgeText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 9,
    color: '#137333',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e0e3e7',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e3e7',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#e0e3e7',
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0b57d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    color: '#ffffff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#34A853',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 17,
    color: '#1f1f1f',
  },
  userNameText: {
    color: '#0b57d0',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  roleChip: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 999,
    backgroundColor: '#e8f0fe',
    borderWidth: 1,
    borderColor: '#d3e3fd',
  },
  roleChipText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 10,
    color: '#0b57d0',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 10,
    color: '#747775',
  },
  emailText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#747775',
    marginTop: 2,
  },

  // Executive Controls
  executiveControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f4f9',
    gap: 8,
  },
  modeSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f4f9',
    borderRadius: 999,
    padding: 2,
    borderWidth: 1,
    borderColor: '#e0e3e7',
  },
  modeSegmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  modeSegmentActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  modeSegmentText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    color: '#747775',
  },
  modeSegmentTextActive: {
    color: '#0b57d0',
  },
  callToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#f8fafd',
    borderWidth: 1,
    borderColor: '#e0e3e7',
  },
  callToggleContainerActive: {
    backgroundColor: '#e8f0fe',
    borderColor: '#d3e3fd',
  },
  callToggleLabel: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    color: '#444746',
  },
  callToggleLabelActive: {
    color: '#0b57d0',
    fontFamily: 'Outfit_600SemiBold',
  },

  // Section Headers
  sectionTitleRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 15,
    color: '#1f1f1f',
  },
  sectionSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#747775',
    marginTop: 1,
  },

  // Workspace Cards
  workspaceCardsCol: {
    gap: 12,
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e3e7',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f9',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardServiceTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#1f1f1f',
  },
  liveTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveSmallDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#1e8e3e',
  },
  liveTagText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 10,
    color: '#747775',
  },

  // Stat Box
  statBox: {
    backgroundColor: '#f8fafd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e3e7',
    paddingVertical: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  statBigNumber: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 32,
    color: '#1f1f1f',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#747775',
    marginTop: 1,
  },

  // Sub Metrics
  subMetricsContainer: {
    backgroundColor: '#f8fafd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e3e7',
    paddingHorizontal: 12,
  },
  subMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f9',
  },
  subMetricLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#747775',
  },
  subMetricValue: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    color: '#1f1f1f',
  },
  subMetricSnippet: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    color: '#1f1f1f',
    maxWidth: '70%',
    textAlign: 'right',
  },

  // Human-in-the-Loop Clearance Card
  hitlCard: {
    backgroundColor: '#f8fafd',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#c2e7ff',
    padding: 14,
    marginBottom: 16,
  },
  hitlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hitlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    backgroundColor: '#d3e3fd',
  },
  hitlBadgeText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 9,
    color: '#041e49',
    letterSpacing: 0.5,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusChipPending: {
    backgroundColor: '#ffe2a9',
  },
  statusChipSuccess: {
    backgroundColor: '#c4eed0',
  },
  statusChipText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 9,
  },
  statusChipTextPending: {
    color: '#b06000',
  },
  statusChipTextSuccess: {
    color: '#146c2e',
  },
  hitlMessage: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#1f1f1f',
    lineHeight: 18,
    marginBottom: 12,
  },
  authorizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0b57d0',
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#0b57d0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  authorizeBtnText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: '#ffffff',
  },
  executedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e6f4ea',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  executedText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    color: '#137333',
  },

  // Voice Protocol Card
  voiceProtocolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e3e7',
    padding: 12,
    gap: 10,
  },
  voiceProtocolLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  voiceProtocolIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceProtocolTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 13,
    color: '#1f1f1f',
  },
  voiceProtocolSub: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    color: '#747775',
    marginTop: 1,
  },
  voiceTestBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f0f4f9',
    borderWidth: 1,
    borderColor: '#d3e3fd',
  },
  voiceTestBtnText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 11,
    color: '#0b57d0',
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ebf3fe',
    borderWidth: 1,
    borderColor: '#c2e7ff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  notificationBannerText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: '#041e49',
    flex: 1,
    lineHeight: 17,
  },
});
