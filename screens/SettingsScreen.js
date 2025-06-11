import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import Supabase client and auth hook
import { supabase, getUserSettings, updateUserSettings } from '../lib/supabase';
import { useAuth } from '../App';

// App version
const APP_VERSION = '0.1.0';

// Mock user settings (will be replaced with actual settings from Supabase)
const mockUserSettings = {
  temperature: 0.7,
  max_tokens: 1000,
  model_name: 'gpt-4',
  language: 'en',
};

const SettingsScreen = () => {
  const { user, signOut } = useAuth();
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    avatar_url: null,
  });
  const [temperature, setTemperature] = useState(mockUserSettings.temperature);
  const [maxTokens, setMaxTokens] = useState(mockUserSettings.max_tokens.toString());
  const [modelName, setModelName] = useState(mockUserSettings.model_name);
  const [language, setLanguage] = useState(mockUserSettings.language);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Local state for dark mode toggle

  // Fetch user data and settings from Supabase
  useEffect(() => {
    const fetchUserDataAndSettings = async () => {
      if (!user) {
        return;
      }

      try {
        setIsLoading(true);
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError; // PGRST116 means no rows found

        if (profileData) {
          setUserData({
            username: profileData.username || user.email.split('@')[0],
            email: profileData.email || user.email,
            avatar_url: profileData.avatar_url,
          });
        } else {
          // Fallback to user email if no profile found
          setUserData({
            username: user.email.split('@')[0],
            email: user.email,
            avatar_url: null,
          });
        }

        // Fetch user settings
        const settingsData = await getUserSettings(user.id);
        if (settingsData) {
          setTemperature(settingsData.temperature);
          setMaxTokens(settingsData.max_tokens.toString());
          setModelName(settingsData.model_name);
          setLanguage(settingsData.language);
        }
      } catch (error) {
        console.error('Error fetching user data or settings:', error);
        // Fallback to mock data if Supabase fails
        setUserData({
          username: user.email ? user.email.split('@')[0] : 'User',
          email: user.email || 'user@example.com',
          avatar_url: null,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDataAndSettings();
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateUserSettings(user.id, {
        temperature: parseFloat(temperature),
        max_tokens: parseInt(maxTokens, 10),
        model_name: modelName,
        language: language,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading && !userData.email) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Profile</Text>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userData.username.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.profileName}>{userData.username}</Text>
              <Text style={styles.profileEmail}>{userData.email}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" style={styles.logoutIcon} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* AI Model Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Model Settings</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Temperature</Text>
            <View style={styles.settingValueContainer}>
              <Text style={styles.settingValue}>{temperature.toFixed(1)}</Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity 
                  onPress={() => setTemperature(Math.max(0, temperature - 0.1))}
                  style={styles.sliderButton}
                >
                  <Ionicons name="remove" size={16} color="#007AFF" />
                </TouchableOpacity>
                <View style={styles.slider}>
                  <View 
                    style={[
                      styles.sliderFill, 
                      { width: `${(temperature / 2) * 100}%` }
                    ]} 
                  />
                </View>
                <TouchableOpacity 
                  onPress={() => setTemperature(Math.min(2, temperature + 0.1))}
                  style={styles.sliderButton}
                >
                  <Ionicons name="add" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <Text style={styles.settingDescription}>
            Lower values make responses more focused and deterministic
          </Text>
          
          <View style={styles.settingDivider} />
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Max Tokens</Text>
            <TextInput
              style={styles.settingInput}
              value={maxTokens}
              onChangeText={setMaxTokens}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.settingDescription}>
            Maximum length of AI responses
          </Text>
          
          <View style={styles.settingDivider} />
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>AI Model</Text>
            <View style={styles.modelSelector}>
              <TouchableOpacity 
                style={[
                  styles.modelOption,
                  modelName === 'gpt-4' && styles.modelOptionSelected
                ]}
                onPress={() => setModelName('gpt-4')}
              >
                <Text 
                  style={[
                    styles.modelOptionText,
                    modelName === 'gpt-4' && styles.modelOptionTextSelected
                  ]}
                >
                  GPT-4
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modelOption,
                  modelName === 'gpt-3.5-turbo' && styles.modelOptionSelected
                ]}
                onPress={() => setModelName('gpt-3.5-turbo')}
              >
                <Text 
                  style={[
                    styles.modelOptionText,
                    modelName === 'gpt-3.5-turbo' && styles.modelOptionTextSelected
                  ]}
                >
                  GPT-3.5
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.saveButton,
              saveSuccess && styles.saveButtonSuccess
            ]}
            onPress={handleSaveSettings}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {saveSuccess ? 'Settings Saved!' : 'Save Settings'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons 
                name={isDarkMode ? "moon" : "sunny"} 
                size={20} 
                color="#666666" 
                style={styles.settingIcon}
              />
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDarkMode ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingDivider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons 
                name="language" 
                size={20} 
                color="#666666" 
                style={styles.settingIcon}
              />
              <Text style={styles.settingLabel}>Language</Text>
            </View>
            <View style={styles.languageSelector}>
              <TouchableOpacity 
                style={[
                  styles.languageOption,
                  language === 'en' && styles.languageOptionSelected
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text 
                  style={[
                    styles.languageOptionText,
                    language === 'en' && styles.languageOptionTextSelected
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.languageOption,
                  language === 'ru' && styles.languageOptionSelected
                ]}
                onPress={() => setLanguage('ru')}
              >
                <Text 
                  style={[
                    styles.languageOptionText,
                    language === 'ru' && styles.languageOptionTextSelected
                  ]}
                >
                  Русский
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>{APP_VERSION}</Text>
          </View>
          
          <View style={styles.settingDivider} />
          
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
          
          <View style={styles.settingDivider} />
          
          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333333',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 8,
  },
  settingValue: {
    fontSize: 16,
    color: '#666666',
  },
  settingValueContainer: {
    alignItems: 'flex-end',
  },
  settingDescription: {
    fontSize: 12,
    color: '#999999',
    marginTop: -5,
    marginBottom: 5,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 5,
  },
  settingInput: {
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    minWidth: 80,
    textAlign: 'right',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    width: 150,
  },
  sliderButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginHorizontal: 8,
  },
  sliderFill: {
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  modelSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modelOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
  },
  modelOptionSelected: {
    backgroundColor: '#007AFF',
  },
  modelOptionText: {
    fontSize: 14,
    color: '#666666',
  },
  modelOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  languageSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    overflow: 'hidden',
  },
  languageOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
  },
  languageOptionSelected: {
    backgroundColor: '#007AFF',
  },
  languageOptionText: {
    fontSize: 14,
    color: '#666666',
  },
  languageOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonSuccess: {
    backgroundColor: '#4CAF50', // Green color for success
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
});

export default SettingsScreen;
