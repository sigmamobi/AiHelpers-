import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import Supabase client and auth hook
import { getUserChats } from '../lib/supabase';
import { useAuth } from '../App';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user chats from Supabase
  const fetchChats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userChats = await getUserChats(user.id);
      
      // Transform data for display
      const formattedChats = userChats.map(chat => ({
        id: chat.id,
        assistantId: chat.assistants.id,
        assistantName: chat.assistants.name_en, // Use name_en for now, can be changed based on language settings
        lastMessage: 'Loading last message...', // This would be fetched from messages table in a real implementation
        timestamp: new Date(chat.updated_at).toLocaleDateString(),
      }));
      
      setChats(formattedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      // If there's an error, use mock data for demo purposes
      setChats(mockChats);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchChats();
  }, [user]);

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const navigateToChat = (chatId, assistantId, assistantName) => {
    navigation.navigate('Chat', { chatId, assistantId, assistantName });
  };

  const navigateToAssistants = () => {
    navigation.navigate('Assistants');
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigateToChat(item.id, item.assistantId, item.assistantName)}
    >
      <View style={styles.chatItemContent}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.assistantName.charAt(0)}</Text>
        </View>
        <View style={styles.chatItemText}>
          <View style={styles.chatItemHeader}>
            <Text style={styles.chatItemTitle}>{item.assistantName}</Text>
            <Text style={styles.chatItemTime}>{item.timestamp}</Text>
          </View>
          <Text style={styles.chatItemMessage} numberOfLines={2}>
            {item.lastMessage}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Mock data for when Supabase is not connected
  const mockChats = [
    {
      id: '1',
      assistantId: '1',
      assistantName: 'Business Strategist',
      lastMessage: 'Based on your market research, I recommend focusing on the B2B segment first.',
      timestamp: '2h ago',
    },
    {
      id: '2',
      assistantId: '2',
      assistantName: 'Marketing Guru',
      lastMessage: 'Your social media strategy needs more focus on engagement rather than just posting content.',
      timestamp: '5h ago',
    },
    {
      id: '3',
      assistantId: '5',
      assistantName: 'Coding Assistant',
      lastMessage: 'The bug is in your async function. You need to properly handle the Promise rejection.',
      timestamp: 'Yesterday',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome to AI Assistant</Text>
        <Text style={styles.welcomeSubtitle}>Chat with specialized AI assistants to get help with various tasks</Text>
      </View>

      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Conversations</Text>
          <TouchableOpacity onPress={navigateToAssistants}>
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : (
          <FlatList
            data={chats.length > 0 ? chats : []}
            renderItem={renderChatItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chatList}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>No conversations yet</Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={navigateToAssistants}
                >
                  <Text style={styles.emptyStateButtonText}>Browse Assistants</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  welcomeSection: {
    padding: 16,
    paddingTop: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  recentSection: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  newChatText: {
    color: '#007AFF',
  },
  chatList: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  chatItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatItemText: {
    flex: 1,
  },
  chatItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatItemTime: {
    fontSize: 12,
    color: '#999999',
  },
  chatItemMessage: {
    fontSize: 14,
    color: '#666666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    flex: 1,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
});

export default HomeScreen;
