import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import Supabase client and auth hook
import { getAssistants, createChat } from '../lib/supabase';
import { useAuth } from '../App';

const AssistantsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [assistants, setAssistants] = useState([]);
  const [filteredAssistants, setFilteredAssistants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch assistants from Supabase
  const fetchAssistants = async () => {
    try {
      setLoading(true);
      // Get language from user settings or default to 'en'
      const language = 'en'; // This would come from user settings in a real app
      const assistantsData = await getAssistants(language);
      
      if (assistantsData.length > 0) {
        setAssistants(assistantsData);
        setFilteredAssistants(assistantsData);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(assistantsData.map(item => 
          language === 'en' ? item.category_en : item.category_ru
        ))];
        setCategories(uniqueCategories);
      } else {
        // If no data from API, use mock data
        setAssistants(mockAssistants);
        setFilteredAssistants(mockAssistants);
        
        // Extract unique categories from mock data
        const uniqueCategories = [...new Set(mockAssistants.map(item => item.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching assistants:', error);
      // Use mock data if there's an error
      setAssistants(mockAssistants);
      setFilteredAssistants(mockAssistants);
      
      // Extract unique categories from mock data
      const uniqueCategories = [...new Set(mockAssistants.map(item => item.category))];
      setCategories(uniqueCategories);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchAssistants();
  }, [user]);

  // Filter assistants based on category and search query
  useEffect(() => {
    let filtered = assistants;
    
    if (selectedCategory) {
      filtered = filtered.filter(assistant => {
        // Handle both API data and mock data
        const category = assistant.category_en || assistant.category;
        return category === selectedCategory;
      });
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(assistant => {
        // Handle both API data and mock data
        const name = assistant.name_en || assistant.name || '';
        const description = assistant.description_en || assistant.description || '';
        
        return name.toLowerCase().includes(query) || 
               description.toLowerCase().includes(query);
      });
    }
    
    setFilteredAssistants(filtered);
  }, [selectedCategory, searchQuery, assistants]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  const handleAssistantSelect = async (assistantId, assistantName) => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Create a new chat with the selected assistant
      const newChat = await createChat(user.id, assistantId, null);
      
      // Navigate to the chat screen with the new chat
      navigation.navigate('Chat', { 
        chatId: newChat.id, 
        assistantId, 
        assistantName 
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      // For demo purposes, navigate directly without creating a chat
      navigation.navigate('Chat', { 
        assistantId, 
        assistantName 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryButton = (category) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.categoryButtonActive
      ]}
      onPress={() => handleCategorySelect(category)}
    >
      <Text
        style={[
          styles.categoryButtonText,
          selectedCategory === category && styles.categoryButtonTextActive
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  const renderAssistantCard = ({ item }) => {
    // Handle both API data and mock data
    const name = item.name_en || item.name;
    const description = item.description_en || item.description;
    
    return (
      <TouchableOpacity
        style={styles.assistantCard}
        onPress={() => handleAssistantSelect(item.id, name)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0)}</Text>
        </View>
        <Text style={styles.assistantName} numberOfLines={2}>{name}</Text>
        <Text
          style={styles.assistantDescription}
          numberOfLines={4}
        >
          {description}
        </Text>
        <TouchableOpacity
          style={styles.startChatButton}
          onPress={() => handleAssistantSelect(item.id, name)}
        >
          <Text style={styles.startChatButtonText}>Start Chat</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Mock data for when Supabase is not connected
  const mockAssistants = [
    {
      id: '1',
      name: 'Business Strategist',
      description: 'Provides strategic advice for business growth, market analysis, and competitive positioning.',
      category: 'Business & Career',
    },
    {
      id: '2',
      name: 'Marketing Guru',
      description: 'Offers expert guidance on digital marketing, branding, content strategy, and campaign optimization.',
      category: 'Business & Career',
    },
    {
      id: '3',
      name: 'Career Coach',
      description: 'Helps with career planning, resume building, interview preparation, and professional development.',
      category: 'Business & Career',
    },
    {
      id: '4',
      name: 'Study Buddy',
      description: 'Helps with understanding complex topics, provides study tips, and explains concepts in various subjects.',
      category: 'Education & Learning',
    },
    {
      id: '5',
      name: 'Coding Assistant',
      description: 'Offers help with programming concepts, debugging code, and understanding algorithms.',
      category: 'Education & Learning',
    },
    {
      id: '6',
      name: 'Fitness Coach',
      description: 'Provides workout plans, exercise tips, and motivation for physical health.',
      category: 'Health & Wellness',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>AI Assistants</Text>
        <Text style={styles.headerSubtitle}>
          Choose an assistant to start a conversation
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search assistants..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScrollView}
        contentContainerStyle={styles.categoriesContentContainer}
      >
        {categories.map(renderCategoryButton)}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading assistants...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAssistants}
          renderItem={renderAssistantCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.assistantsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={64}
                color="#CCCCCC"
              />
              <Text style={styles.emptyStateText}>
                No assistants found. Try a different search.
              </Text>
            </View>
          }
        />
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  headerSection: {
    padding: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  categoriesScrollView: {
    marginBottom: 12,
  },
  categoriesContentContainer: {
    paddingHorizontal: 12,
  },
  categoryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    color: '#666666',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  assistantsList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  assistantCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    height: 200,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  assistantName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  assistantDescription: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
  },
  startChatButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  startChatButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
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

export default AssistantsScreen;
