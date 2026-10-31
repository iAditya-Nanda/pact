import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Colors } from '../../theme/colors';
import {
  Mail,
  Calendar as CalendarIcon,
  CheckSquare,
  Clock,
  Send,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function WorkspaceScreen() {
  const insets = useSafeAreaInsets();
  const { workspace, isLoading, refreshWorkspace } = useWorkspace();
  const [activeSegment, setActiveSegment] = useState<'gmail' | 'calendar' | 'tasks'>('gmail');

  const emails = workspace?.emails || [
    {
      id: '1a18f8f6fca089b1',
      sender: 'Google Cloud Platform',
      senderEmail: 'google-cloud-noreply@google.com',
      subject: 'Security Alert: Access granted to pact-18',
      snippet: 'You allowed pact-18.firebaseapp.com access to Google Workspace APIs for adityananda.dev@gmail.com',
      receivedAt: '3h ago',
      priority: 'high',
      status: 'unread',
    },
    {
      id: 'msg_02',
      sender: 'Renee from Cline',
      senderEmail: 'renee@cline.bot',
      subject: 'Join Hackathon: Built with Kimi K3.1 & Moonshot AI',
      snippet: 'Hey Aditya, we are thrilled to invite you to our upcoming hackathon building next-gen autonomous agent architectures...',
      receivedAt: 'Yesterday',
      priority: 'urgent',
      status: 'read',
    },
  ];

  const calendarEvents = workspace?.calendarEvents || [
    {
      id: 'cal_01',
      title: 'Protected Deep Focus Block',
      startTime: 'Today, 10:00 AM',
      endTime: 'Today, 12:30 PM',
      location: 'Private Office',
      conflictDetected: false,
    },
    {
      id: 'cal_02',
      title: 'Client Technical Debrief',
      startTime: 'Today, 4:00 PM',
      endTime: 'Today, 5:00 PM',
      location: 'Google Meet',
      conflictDetected: false,
    },
  ];

  const tasks = workspace?.tasks || [
    {
      id: 'tsk_01',
      title: 'Verify OAuth 2.0 Credentials with Project pact-18',
      due: 'Today, 5:00 PM',
      status: 'completed',
    },
    {
      id: 'tsk_02',
      title: 'Review Autonomous Settlement Protocol in Chief of Staff Engine',
      due: 'Today, 6:30 PM',
      status: 'pending',
    },
  ];

  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 48) + 14 : insets.top + 14;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: topPadding }]}>
        <View>
          <Text style={styles.headerTitle}>Workspace Viewer</Text>
          <Text style={styles.headerSubtitle}>Real-time Google Workspace Data</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={refreshWorkspace}
          accessibilityLabel="Refresh"
        >
          <RefreshCw size={15} color={Colors.light.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Segment Selector Tabs */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'gmail' && styles.segmentBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSegment('gmail');
          }}
        >
          <Mail
            size={14}
            color={activeSegment === 'gmail' ? '#0b57d0' : Colors.light.textMuted}
          />
          <Text
            style={[
              styles.segmentText,
              activeSegment === 'gmail' && styles.segmentTextActive,
            ]}
          >
            Gmail ({workspace?.metrics?.unreadEmails ?? 2})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'calendar' && styles.segmentBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSegment('calendar');
          }}
        >
          <CalendarIcon
            size={14}
            color={activeSegment === 'calendar' ? '#0b57d0' : Colors.light.textMuted}
          />
          <Text
            style={[
              styles.segmentText,
              activeSegment === 'calendar' && styles.segmentTextActive,
            ]}
          >
            Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === 'tasks' && styles.segmentBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveSegment('tasks');
          }}
        >
          <CheckSquare
            size={14}
            color={activeSegment === 'tasks' ? '#0b57d0' : Colors.light.textMuted}
          />
          <Text
            style={[
              styles.segmentText,
              activeSegment === 'tasks' && styles.segmentTextActive,
            ]}
          >
            Tasks ({workspace?.metrics?.activeTasks ?? 0})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshWorkspace} colors={['#0b57d0']} />
        }
      >
        {/* Gmail Segment */}
        {activeSegment === 'gmail' && (
          <View style={styles.listContainer}>
            {emails.map((email: any) => (
              <View key={email.id} style={styles.itemCard}>
                <View style={styles.itemCardTop}>
                  <Text style={styles.senderText} numberOfLines={1}>
                    {email.sender}
                  </Text>
                  <Text style={styles.timeLabel}>{email.receivedAt}</Text>
                </View>
                <Text style={styles.subjectText} numberOfLines={1}>
                  {email.subject}
                </Text>
                <Text style={styles.snippetText} numberOfLines={2}>
                  {email.snippet}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Calendar Segment */}
        {activeSegment === 'calendar' && (
          <View style={styles.listContainer}>
            {calendarEvents.map((evt: any) => (
              <View key={evt.id} style={styles.itemCard}>
                <View style={styles.itemCardTop}>
                  <Text style={styles.senderText}>{evt.title}</Text>
                  <View style={styles.protectedChip}>
                    <ShieldCheck size={11} color="#146c2e" />
                    <Text style={styles.protectedChipText}>Protected</Text>
                  </View>
                </View>
                <View style={styles.eventTimeRow}>
                  <Clock size={12} color="#747775" />
                  <Text style={styles.eventTimeText}>
                    {evt.startTime} - {evt.endTime}
                  </Text>
                </View>
                <Text style={styles.locationText}>{evt.location || 'Google Meet'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tasks Segment */}
        {activeSegment === 'tasks' && (
          <View style={styles.listContainer}>
            {tasks.map((tsk: any) => (
              <View key={tsk.id} style={styles.itemCard}>
                <View style={styles.itemCardTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <CheckCircle2
                      size={16}
                      color={tsk.status === 'completed' ? '#146c2e' : '#747775'}
                    />
                    <Text
                      style={[
                        styles.taskTitle,
                        tsk.status === 'completed' && styles.taskCompleted,
                      ]}
                      numberOfLines={2}
                    >
                      {tsk.title}
                    </Text>
                  </View>
                </View>
                <Text style={styles.dueText}>Due: {tsk.due}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafd',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e3e7',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#1f1f1f',
  },
  headerSubtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#747775',
    marginTop: 1,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e0e3e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e3e7',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#f0f4f9',
  },
  segmentBtnActive: {
    backgroundColor: '#c2e7ff',
  },
  segmentText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    color: '#444746',
  },
  segmentTextActive: {
    color: '#041e49',
    fontFamily: 'Outfit_600SemiBold',
  },
  scrollContent: {
    padding: 16,
  },
  listContainer: {
    gap: 10,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e3e7',
    padding: 12,
  },
  itemCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
    color: '#1f1f1f',
    flex: 1,
  },
  timeLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    color: '#747775',
  },
  subjectText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#1f1f1f',
    marginBottom: 4,
  },
  snippetText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
    color: '#747775',
    lineHeight: 15,
  },
  protectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#c4eed0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  protectedChipText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 9,
    color: '#146c2e',
  },
  eventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  eventTimeText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 11,
    color: '#444746',
  },
  locationText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    color: '#747775',
    marginTop: 3,
  },
  taskTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#1f1f1f',
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#747775',
  },
  dueText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    color: '#747775',
    marginTop: 4,
    marginLeft: 24,
  },
});
