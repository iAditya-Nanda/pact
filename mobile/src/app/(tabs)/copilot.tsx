import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkspace } from '../../context/WorkspaceContext';
import { sendChatMessage, approveAction } from '../../services/api';
import { speakVoice, stopSpeaking, getVoiceMuted, setVoiceMuted } from '../../services/voiceService';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import {
  Sparkles,
  Send,
  PhoneCall,
  Volume2,
  VolumeX,
  ShieldCheck,
  Zap,
  CheckCircle,
  AlertTriangle,
  Bot,
  User,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  hitlApproval?: {
    tool_name?: string;
    summary?: string;
    payload_hash?: string;
    payload?: any;
  } | null;
}

export default function CopilotScreen() {
  const insets = useSafeAreaInsets();
  const { refreshWorkspace, triggerUrgentCall } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm_welcome',
      sender: 'ai',
      text: 'Good day Aditya. I am your PACT Chief of Staff, actively monitoring your Gmail, Calendar, and Tasks. How can I coordinate your schedule today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiMode, setAiMode] = useState<'safe' | 'turbo'>('safe');
  const [isMuted, setIsMutedState] = useState(getVoiceMuted());

  const handleToggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !isMuted;
    setIsMutedState(next);
    setVoiceMuted(next);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await sendChatMessage(text.trim(), aiMode);
      const aiReply = res.reply || 'Request synchronized across your tools.';

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        hitlApproval: res.hitlApproval || null,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Speak response aloud if not muted
      speakVoice(aiReply);

      // Refresh workspace telemetry
      await refreshWorkspace();
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorizeClearance = async (approval: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (approval?.payload_hash) {
      await approveAction(approval.tool_name || 'action', approval.payload_hash);
    }

    const confirmationText = `Clearance authorized. Action '${approval.tool_name}' executed idempotently.`;
    setMessages((prev) => [
      ...prev,
      {
        id: `ai_auth_${Date.now()}`,
        sender: 'ai',
        text: confirmationText,
      },
    ]);

    speakVoice(confirmationText);
    await refreshWorkspace();
  };

  const suggestions = [
    'Check schedule conflicts for today',
    'Reschedule Client Technical Debrief to 4 PM',
    'Summarize priority unread emails',
    'Review task token rotation deadline',
  ];

  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 48) + 14 : insets.top + 14;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: topPadding }]}>
        <View style={styles.headerLeft}>
          <View style={styles.aiBadge}>
            <Sparkles size={18} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>PACT AI Copilot</Text>
            <Text style={styles.headerSub}>Connected to Executive Dashboard</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Voice Call Pill */}
          <TouchableOpacity
            style={styles.callHeaderBtn}
            onPress={() => triggerUrgentCall()}
            activeOpacity={0.8}
            accessibilityLabel="Start Voice Consultation"
          >
            <PhoneCall size={14} color="#0b57d0" />
            <Text style={styles.callHeaderText}>Call AI</Text>
          </TouchableOpacity>

          {/* Mute Audio Toggle */}
          <TouchableOpacity
            style={styles.muteBtn}
            onPress={handleToggleMute}
          >
            {isMuted ? (
              <VolumeX size={16} color="#ba1a1a" />
            ) : (
              <Volume2 size={16} color="#0b57d0" />
            )}
          </TouchableOpacity>

          {/* Safe / Turbo Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, aiMode === 'safe' && styles.modeBtnActive]}
              onPress={() => setAiMode('safe')}
            >
              <ShieldCheck size={12} color={aiMode === 'safe' ? '#0b57d0' : '#747775'} />
              <Text style={[styles.modeText, aiMode === 'safe' && styles.modeTextActive]}>
                Safe
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeBtn, aiMode === 'turbo' && styles.modeBtnActive]}
              onPress={() => setAiMode('turbo')}
            >
              <Zap size={12} color={aiMode === 'turbo' ? '#e65100' : '#747775'} />
              <Text style={[styles.modeText, aiMode === 'turbo' && styles.modeTextActive]}>
                Turbo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Messages List */}
      <ScrollView
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.messageWrapper,
              m.sender === 'user' ? styles.userWrapper : styles.aiWrapper,
            ]}
          >
            <View
              style={[
                styles.messageAvatar,
                m.sender === 'user' ? styles.userAvatar : styles.aiAvatar,
              ]}
            >
              {m.sender === 'user' ? (
                <User size={14} color="#ffffff" />
              ) : (
                <Bot size={14} color="#0b57d0" />
              )}
            </View>

            <View style={styles.bubbleCol}>
              <View
                style={[
                  styles.messageBubble,
                  m.sender === 'user' ? styles.userBubble : styles.aiBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    m.sender === 'user' ? styles.userText : styles.aiText,
                  ]}
                >
                  {m.text}
                </Text>
              </View>

              {/* Human-in-the-Loop Clearance Card */}
              {m.hitlApproval && (
                <View style={styles.clearanceCard}>
                  <View style={styles.clearanceHeader}>
                    <AlertTriangle size={15} color="#b06000" />
                    <Text style={styles.clearanceTag}>HUMAN CLEARANCE REQUIRED</Text>
                  </View>
                  <Text style={styles.clearanceDesc}>
                    {m.hitlApproval.summary || `Execute action: ${m.hitlApproval.tool_name}`}
                  </Text>
                  {m.hitlApproval.payload_hash && (
                    <Text style={styles.payloadHash}>
                      Payload Hash: {m.hitlApproval.payload_hash}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.authorizeBtn}
                    onPress={() => handleAuthorizeClearance(m.hitlApproval)}
                    activeOpacity={0.85}
                  >
                    <CheckCircle size={15} color="#ffffff" />
                    <Text style={styles.authorizeBtnText}>Authorize Execution</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={styles.thinkingRow}>
            <ActivityIndicator size="small" color="#0b57d0" />
            <Text style={styles.thinkingText}>PACT AI is coordinating tools...</Text>
          </View>
        )}
      </ScrollView>

      {/* Suggested Prompts */}
      <View style={styles.promptsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsScroll}>
          {suggestions.map((s, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.promptChip}
              onPress={() => handleSend(s)}
              activeOpacity={0.7}
            >
              <Text style={styles.promptText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask PACT to check, reschedule, or draft..."
          placeholderTextColor={Colors.light.textMuted}
          onSubmitEditing={() => handleSend()}
        />

        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || isLoading}
          activeOpacity={0.8}
        >
          <Send size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.canvasBackground,
  },
  topHeader: {
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubdued,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: Colors.light.primaryBrandBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
    color: Colors.light.textDisplay,
  },
  headerSub: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.surfaceActivePill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  callHeaderText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.primaryBrandBlue,
    fontWeight: '700',
  },
  muteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.cardSurfaceMuted,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardSurfaceMuted,
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.light.borderSubdued,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modeBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  modeText: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.light.textMuted,
    fontWeight: '700',
  },
  modeTextActive: {
    color: Colors.light.textDisplay,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    gap: 10,
    maxWidth: '88%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  userAvatar: {
    backgroundColor: Colors.light.primaryBrandBlue,
  },
  aiAvatar: {
    backgroundColor: Colors.light.surfaceActivePill,
  },
  bubbleCol: {
    flexShrink: 1,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: Colors.light.primaryBrandBlue,
    borderTopRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.light.cardSurface,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.borderSubdued,
  },
  messageText: {
    ...Typography.bodyPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: Colors.light.textDisplay,
  },
  clearanceCard: {
    backgroundColor: '#fff8e1',
    borderWidth: 1.5,
    borderColor: '#ffe2a9',
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
  },
  clearanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  clearanceTag: {
    ...Typography.caption,
    fontSize: 10,
    color: '#b06000',
    fontWeight: '700',
  },
  clearanceDesc: {
    ...Typography.bodySecondary,
    fontSize: 12,
    color: '#5d4037',
    marginBottom: 6,
  },
  payloadHash: {
    ...Typography.caption,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#8d6e63',
    marginBottom: 8,
  },
  authorizeBtn: {
    backgroundColor: Colors.light.primaryBrandBlue,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  authorizeBtnText: {
    ...Typography.caption,
    color: '#ffffff',
    fontWeight: '700',
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  thinkingText: {
    ...Typography.caption,
    color: Colors.light.textMuted,
  },
  promptsContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubdued,
    backgroundColor: Colors.light.canvasBackground,
  },
  promptsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  promptChip: {
    backgroundColor: Colors.light.cardSurface,
    borderWidth: 1,
    borderColor: Colors.light.borderSubdued,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  promptText: {
    ...Typography.caption,
    color: Colors.light.primaryBrandBlue,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubdued,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.light.cardSurfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderSubdued,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primaryBrandBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
