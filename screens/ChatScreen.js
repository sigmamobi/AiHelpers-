import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import Supabase client and auth hook
import { supabase, getChatMessages, createChat, sendMessageToAI } from '../lib/supabase';
import { useAuth } from '../App';

const ChatScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { chatId: initialChatId, assistantId, assistantName } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(initialChatId);
  const flatListRef = useRef(null);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Set up navigation header with assistant name
  useEffect(() => {
    navigation.setOptions({
      title: assistantName || 'Chat',
      headerBackTitle: 'Back',
    });
  }, [assistantName, navigation]);

  // Fetch messages or create a new chat
  useEffect(() => {
    const fetchOrCreateChat = async () => {
      if (!user) {
        setInitialLoading(false);
        return;
      }

      try {
        setInitialLoading(true);
        if (initialChatId) {
          // Fetch existing chat messages
          const fetchedMessages = await getChatMessages(initialChatId);
          setMessages(fetchedMessages);
          setCurrentChatId(initialChatId);
        } else {
          // Create a new chat
          const newChat = await createChat(user.id, assistantId, null);
          setCurrentChatId(newChat.id);
          
          // Add initial greeting from AI
          const initialMessage = {
            id: `initial-${Date.now()}`,
            content: `Hello! I'm your ${assistantName || 'AI Assistant'}. How can I help you today?`,
            sender_type: 'ai',
            created_at: new Date().toISOString(),
          };
          setMessages([initialMessage]);
        }
      } catch (error) {
        console.error('Error fetching or creating chat:', error);
        // Fallback to mock data if Supabase fails
        setMessages([
          {
            id: '1',
            content: 'Hello! How can I help you today?',
            sender_type: 'ai',
            created_at: new Date(Date.now() - 100000).toISOString(),
          },
          {
            id: '2',
            content: 'I need some advice on my business strategy.',
            sender_type: 'user',
            created_at: new Date(Date.now() - 80000).toISOString(),
          },
          {
            id: '3',
            content: 'I\'d be happy to help with your business strategy. Could you tell me more about your business and what specific aspects you\'re looking to improve?',
            sender_type: 'ai',
            created_at: new Date(Date.now() - 60000).toISOString(),
          },
        ]);
        if (!currentChatId) {
          setCurrentChatId(`mock-chat-${Date.now()}`);
        }
      } finally {
        setInitialLoading(false);
      }
    };

    fetchOrCreateChat();
  }, [initialChatId, assistantId, user]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!currentChatId) return;

    const channel = supabase
      .channel(`chat:${currentChatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${currentChatId}`,
      }, (payload) => {
        const newMessage = payload.new;
        setMessages((prevMessages) => {
          // Check if message already exists to avoid duplicates
          const exists = prevMessages.some(msg => msg.id === newMessage.id);
          if (exists) return prevMessages;
          return [...prevMessages, newMessage];
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentChatId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentChatId || !user) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    Keyboard.dismiss();

    // Create a temporary user message object
    const tempUserMessage = {
      id: `temp-user-${Date.now()}`,
      content: messageText,
      sender_type: 'user',
      created_at: new Date().toISOString(),
    };

    // Add temporary AI typing indicator
    const tempAiMessage = {
      id: `temp-ai-${Date.now()}`,
      content: '',
      sender_type: 'ai',
      created_at: new Date().toISOString(),
      is_loading: true,
    };

    // Add messages to local state immediately for UI responsiveness
    setMessages(prev => [...prev, tempUserMessage, tempAiMessage]);
    setIsAiTyping(true);

    try {
      // Call the Supabase Edge Function to generate AI response
      // The Edge Function will save both user and AI messages to DB
      await sendMessageToAI(currentChatId, messageText, assistantId);

      // Remove the temporary AI typing indicator once the real message comes via Realtime
      setMessages(prev => prev.filter(msg => !msg.is_loading));

    } catch (error) {
      console.error('Error sending message:', error);
      // Update the temporary AI message with an error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempAiMessage.id
            ? {
                ...msg,
                content: 'Sorry, I encountered an error processing your request. Please try again.',
                is_loading: false
              }
            : msg
        )
      );
    } finally {
      setIsAiTyping(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender_type === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        {!isUser && (
          <View style={styles.messageHeader}>
            <View style={styles.smallAvatar}>
              <Text style={styles.smallAvatarText}>{assistantName?.charAt(0) || 'A'}</Text>
            </View>
            <Text style={styles.messageSender}>{assistantName || 'AI Assistant'}</Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.aiMessageBubble,
        ]}>
          {item.is_loading ? (
            <View style={styles.typingIndicatorContainer}>
              <ActivityIndicator size="small" color={isUser ? '#FFFFFF' : '#666666'} />
              <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.aiMessageText]}>
                Thinking...
              </Text>
            </View>
          ) : (
            <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.aiMessageText]}>
              {item.content}
            </Text>
          )}
        </View>
        
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {initialLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => item.id || index.toString()}
              contentContainerStyle={styles.chatContainer}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={64}
                    color="#CCCCCC"
                  />
                  <Text style={styles.emptyStateText}>
                    No messages yet. Start the conversation!
                  </Text>
                </View>
              }
            />
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="#999999"
                value={inputMessage}
                onChangeText={setInputMessage}
                multiline
                maxHeight={100}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputMessage.trim() || loading || isAiTyping) && styles.sendButtonDisabled,
                ]}
                onPress={sendMessage}
                disabled={!inputMessage.trim() || loading || isAiTyping}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 80, // Ensure space for input
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  smallAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageSender: {
    fontSize: 12,
    color: '#999999',
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
  },
  userMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#000000',
  },
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageTime: {
    fontSize: 10,
    color: '#999999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default ChatScreen;
