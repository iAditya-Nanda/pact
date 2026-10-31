import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useWorkspace } from '../context/WorkspaceContext';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import {
  Phone,
  PhoneOff,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Mic,
} from 'lucide-react-native';

export const UrgentCallModal: React.FC = () => {
  const { urgentCall, answerCall, settleCallByVoice, endCall, declineCall } = useWorkspace();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [callDuration, setCallDuration] = useState(0);

  // Timer for connected call
  useEffect(() => {
    let interval: any = null;
    if (urgentCall.isOpen && urgentCall.status === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [urgentCall.isOpen, urgentCall.status]);

  // Pulsing animation for calling orb
  useEffect(() => {
    if (urgentCall.isOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [urgentCall.isOpen]);

  if (!urgentCall.isOpen) return null;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={urgentCall.isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={urgentCall.status === 'ringing' ? declineCall : endCall}
    >
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.shieldPill}>
            <ShieldCheck size={14} color="#a8c7fa" />
            <Text style={styles.shieldText}>PACT END-TO-END VERIFIED LINE</Text>
          </View>
        </View>

        {/* Center Calling Area */}
        <View style={styles.centerSection}>
          <Animated.View
            style={[
              styles.avatarOrb,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.avatarInner}>
              <Sparkles size={44} color="#ffffff" />
            </View>
          </Animated.View>

          <Text style={styles.callerTitle}>PACT Chief of Staff</Text>
          <Text style={styles.callerSub}>
            {urgentCall.status === 'ringing'
              ? 'Incoming Urgent Voice Consultation'
              : urgentCall.status === 'connected'
              ? `Connected • ${formatTimer(callDuration)}`
              : urgentCall.status === 'settling'
              ? 'Verifying and executing policy...'
              : 'Matter Resolved & Logged'}
          </Text>

          {/* Alert Focus Card */}
          {urgentCall.alert && (
            <View style={styles.alertCard}>
              <View style={styles.alertHeaderRow}>
                <AlertTriangle size={16} color="#ffe2a9" />
                <Text style={styles.alertTypeBadge}>
                  {urgentCall.alert.type.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.alertTitle}>{urgentCall.alert.title}</Text>
              <Text style={styles.alertDesc}>{urgentCall.alert.description}</Text>
            </View>
          )}

          {/* Live Transcript / Dialogue Box */}
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptHeader}>LIVE EXECUTIVE LOG</Text>
            <ScrollView
              style={styles.transcriptScroll}
              contentContainerStyle={styles.transcriptContent}
            >
              {urgentCall.transcript.map((line, idx) => (
                <Text key={idx} style={styles.transcriptLine}>
                  {line}
                </Text>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
          {urgentCall.status === 'ringing' ? (
            <View style={styles.ringingButtonsRow}>
              {/* Decline Button */}
              <TouchableOpacity
                style={[styles.callCircleBtn, styles.declineBtn]}
                onPress={declineCall}
                activeOpacity={0.8}
              >
                <PhoneOff size={28} color="#ffffff" />
                <Text style={styles.btnLabel}>Decline</Text>
              </TouchableOpacity>

              {/* Accept Button */}
              <TouchableOpacity
                style={[styles.callCircleBtn, styles.acceptBtn]}
                onPress={answerCall}
                activeOpacity={0.8}
              >
                <Phone size={28} color="#ffffff" />
                <Text style={styles.btnLabel}>Answer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.connectedActions}>
              {urgentCall.status !== 'settled' && (
                <View style={styles.settleButtonsCol}>
                  <TouchableOpacity
                    style={styles.settlePillBtn}
                    onPress={() => settleCallByVoice('approve')}
                    activeOpacity={0.8}
                  >
                    <CheckCircle size={18} color="#041e49" />
                    <Text style={styles.settleBtnText}>
                      Authorize & Settle Action
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.holdPillBtn}
                    onPress={() => settleCallByVoice('decline')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.holdBtnText}>Decline / Keep Existing</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* End Call Button */}
              <TouchableOpacity
                style={[styles.callCircleBtn, styles.declineBtn, { alignSelf: 'center', marginTop: 12 }]}
                onPress={endCall}
                activeOpacity={0.8}
              >
                <PhoneOff size={24} color="#ffffff" />
                <Text style={styles.btnLabel}>
                  {urgentCall.status === 'settled' ? 'Close' : 'End Call'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041e49',
    paddingTop: 54,
    paddingBottom: 40,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topHeader: {
    alignItems: 'center',
  },
  shieldPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 87, 208, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0b57d0',
  },
  shieldText: {
    ...Typography.caption,
    color: '#a8c7fa',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  centerSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginVertical: 10,
  },
  avatarOrb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(11, 87, 208, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#0b57d0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0b57d0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  callerTitle: {
    ...Typography.headingDisplay,
    color: '#ffffff',
    fontSize: 22,
    marginBottom: 4,
  },
  callerSub: {
    ...Typography.bodySecondary,
    color: '#c2e7ff',
    marginBottom: 16,
  },
  alertCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 14,
    width: '100%',
    marginBottom: 12,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  alertTypeBadge: {
    ...Typography.caption,
    color: '#ffe2a9',
    fontWeight: '700',
  },
  alertTitle: {
    ...Typography.cardTitle,
    color: '#ffffff',
    fontSize: 15,
    marginBottom: 4,
  },
  alertDesc: {
    ...Typography.bodySecondary,
    color: '#d3e3fd',
    lineHeight: 18,
  },
  transcriptContainer: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 16,
    padding: 12,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  transcriptHeader: {
    ...Typography.caption,
    color: '#a8c7fa',
    fontWeight: '700',
    marginBottom: 6,
  },
  transcriptScroll: {
    flexGrow: 0,
  },
  transcriptContent: {
    gap: 4,
  },
  transcriptLine: {
    ...Typography.bodySecondary,
    color: '#ffffff',
    fontSize: 12,
  },
  bottomBar: {
    paddingTop: 10,
  },
  ringingButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  callCircleBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  declineBtn: {
    backgroundColor: '#ba1a1a',
  },
  acceptBtn: {
    backgroundColor: '#146c2e',
  },
  btnLabel: {
    ...Typography.caption,
    color: '#ffffff',
    marginTop: 4,
    fontWeight: '600',
  },
  connectedActions: {
    width: '100%',
    alignItems: 'center',
  },
  settleButtonsCol: {
    width: '100%',
    gap: 10,
  },
  settlePillBtn: {
    backgroundColor: '#c2e7ff',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  settleBtnText: {
    ...Typography.buttonLabel,
    color: '#041e49',
    fontWeight: '700',
  },
  holdPillBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdBtnText: {
    ...Typography.buttonLabel,
    color: '#ffffff',
    fontWeight: '500',
  },
});
