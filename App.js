import React, { useState, useEffect, createContext, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, Image } from 'react-native'; // Added Image
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-url-polyfill/auto';
// Localization is initialized in lib/i18n.js, no need for direct import here unless for specific functions
// import * as Localization from 'expo-localization'; 

// Supabase client
import { supabase, signOut } from './lib/supabase'; // Removed unused getCurrentUser

// i18n setup
import i18n, { t, setLocale as i18nSetLocale } from './lib/i18n';

// Screens
import HomeScreen from './screens/HomeScreen';
import AssistantsScreen from './screens/AssistantsScreen';
import ChatScreen from './screens/ChatScreen';
import SettingsScreen from './screens/SettingsScreen';
import AuthScreen from './screens/AuthScreen';

// Create Auth Context
const AuthContext = createContext({
  user: null,
  session: null,
  isLoading: true,
  isDemoMode: false,
  signOut: async () => {},
  enterDemoMode: () => {},
});

// Create Localization Context
const LocalizationContext = createContext({
  locale: 'en', // Default to 'en'
  setLocale: (locale) => {},
  t: (scope, options) => `[${scope}]`, // Fallback t function
});

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession);
        setSession(newSession);
        setUser(newSession?.user || null);
        setIsLoading(false);
        if (newSession || event === 'SIGNED_OUT') {
          setIsDemoMode(false);
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setIsLoading(false);
    setUser({ id: 'demo-user', email: 'demo@example.com' });
    setSession({}); // Mock session
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isDemoMode,
        signOut: handleSignOut,
        enterDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Localization Provider Component
const LocalizationProvider = ({ children }) => {
  const [locale, setLocaleState] = useState(i18n.locale || 'en');

  const setAppLocale = (newLocale) => {
    try {
      i18nSetLocale(newLocale); // Update i18n instance
      setLocaleState(newLocale); // Update React state
    } catch (error) {
      console.error("Error in setAppLocale:", error);
    }
  };
  
  const safeT = (scope, options) => {
    try {
      return t(scope, options);
    } catch (error) {
      console.error(`Error using t function for scope "${scope}":`, error);
      return `[${scope}]`; // Fallback
    }
  };


  return (
    <LocalizationContext.Provider value={{ locale, setLocale: setAppLocale, t: safeT }}>
      {children}
    </LocalizationContext.Provider>
  );
};


// Hook for using Auth Context
export const useAuth = () => useContext(AuthContext);

// Hook for using Localization Context
export const useLocalization = () => useContext(LocalizationContext);

// Navigation setup
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
function MainTabNavigator() {
  const { t: safeT } = useLocalization(); 
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeNav') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AssistantsNav') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'SettingsNav') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="HomeNav" 
        component={HomeScreen} 
        options={{ 
          title: safeT('appName'), // This sets the title in the tab bar if header is not shown or for accessibility
          headerTitle: () => ( // Custom header title component
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image 
                source={require('./assets/icon.png')} 
                style={{ width: 24, height: 24, marginRight: 8 }} 
              />
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{safeT('appName')}</Text>
            </View>
          )
        }} 
      />
      <Tab.Screen 
        name="AssistantsNav" 
        component={AssistantsScreen} 
        options={{ title: safeT('assistants') }} 
      />
      <Tab.Screen 
        name="SettingsNav" 
        component={SettingsScreen} 
        options={{ title: safeT('settings') }} 
      />
    </Tab.Navigator>
  );
}

// Loading Component
const LoadingScreen = () => {
  const { t: safeT } = useLocalization();
  return (
    <View style={styles.loadingContainer}>
      <Image 
        source={require('./assets/splash.png')} 
        style={styles.splashImage} 
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>{safeT('loading')}</Text>
    </View>
  );
};

// Main App Component
export default function App() {
  try {
    return (
      <SafeAreaProvider>
        <LocalizationProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LocalizationProvider>
      </SafeAreaProvider>
    );
  } catch (error) {
    console.error("Critical error in App component:", error);
    // Basic fallback UI
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <Text style={{ color: 'red', fontSize: 18, textAlign: 'center', padding: 20 }}>
          An unexpected error occurred. Please restart the application.
        </Text>
      </View>
    );
  }
}

// App Content with Auth Check
function AppContent() {
  const { user, isLoading, isDemoMode } = useAuth();
  const { locale, t: safeT } = useLocalization(); 

  if (isLoading) {
    return <LoadingScreen />;
  }

  try {
    return (
      <NavigationContainer key={locale}> 
        <StatusBar style="auto" />
        {user || isDemoMode ? (
          <Stack.Navigator>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                headerBackTitle: safeT('back'), 
              }}
            />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Auth" component={AuthScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    );
  } catch (error) {
    console.error("Error in AppContent navigation:", error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <Text style={{ color: 'red', fontSize: 16, textAlign: 'center', padding: 20 }}>
          Error loading application content. Please try again.
        </Text>
      </View>
    );
  }
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  splashImage: { // Added style for splash image
    width: 200,
    height: 200,
    marginBottom: 20,
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
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  assistantsList: {
    padding: 8,
  },
  assistantItem: {
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
  assistantName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  assistantDescription: {
    fontSize: 14,
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
  chatContainer: {
    padding: 16,
    paddingBottom: 80,
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
});
