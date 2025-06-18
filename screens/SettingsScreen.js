import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Button,
  Switch,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Using this community package for a better Picker
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import Supabase client and auth hook
import { supabase, getUserSettings, updateUserSettings } from '../lib/supabase';
import { useAuth } from '../App'; // Assuming App.js exports AuthContext
import { useLocalization } from '../App'; // Assuming App.js exports LocalizationContext

// App version
const APP_VERSION = '0.1.0';

// Default user settings
const defaultUserSettings = {
  temperature: 0.7,
  max_tokens: 1000,
  model_name: 'gpt-3.5-turbo', // Default model
  language: 'en',
};

// Available AI Models based on user request
const AVAILABLE_MODELS = [
  { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
  { label: "GPT-4o", value: "gpt-4o" },
  { label: "GPT-4o Mini", value: "gpt-4o-mini" },
  { label: "GPT-4.1", value: "gpt-4.1" },
  { label: "GPT-4.1 Mini", value: "gpt-4.1-mini" },
];

const SettingsScreen = () => {
  const { user, signOut: performSignOut } = useAuth();
  const { t, locale, setLocale } = useLocalization();

  const [userData, setUserData] = useState({
    username: '',
    email: '',
  });
  const [temperature, setTemperature] = useState(defaultUserSettings.temperature);
  const [maxTokens, setMaxTokens] = useState(defaultUserSettings.max_tokens.toString());
  const [modelName, setModelName] = useState(defaultUserSettings.model_name);
  // Language state is now managed by LocalizationContext's `locale` and `setLocale`
  // const [language, setLanguage] = useState(defaultUserSettings.language); 
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isScreenLoading, setIsScreenLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false); // Simple state for dark mode switch UI

  useEffect(() => {
    const fetchUserDataAndSettings = async () => {
      if (!user) {
        setIsScreenLoading(false);
        return;
      }

      setIsScreenLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('username, email')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching user profile:', profileError);
        }
        
        setUserData({
          username: profileData?.username || user.email?.split('@')[0] || 'User',
          email: profileData?.email || user.email || '',
        });

        const settingsData = await getUserSettings(user.id);
        if (settingsData) {
          setTemperature(settingsData.temperature ?? defaultUserSettings.temperature);
          setMaxTokens((settingsData.max_tokens ?? defaultUserSettings.max_tokens).toString());
          setModelName(settingsData.model_name ?? defaultUserSettings.model_name);
          // Set initial app locale from saved settings if available
          if (settingsData.language && settingsData.language !== locale) {
            setLocale(settingsData.language);
          }
        } else {
          setTemperature(defaultUserSettings.temperature);
          setMaxTokens(defaultUserSettings.max_tokens.toString());
          setModelName(defaultUserSettings.model_name);
          // Set app locale to device default or 'en' if not in settings
          // This is handled by i18n.js initialization, but we can sync it here too
          if (locale !== defaultUserSettings.language) {
             // setLocale(defaultUserSettings.language); // Or let i18n.js handle initial
          }
        }
      } catch (error) {
        console.error('Error fetching user data or settings:', error);
        setUserData({
          username: user.email ? user.email.split('@')[0] : 'User',
          email: user.email || 'user@example.com',
        });
        // Fallback to defaults
        setTemperature(defaultUserSettings.temperature);
        setMaxTokens(defaultUserSettings.max_tokens.toString());
        setModelName(defaultUserSettings.model_name);
      } finally {
        setIsScreenLoading(false);
      }
    };

    fetchUserDataAndSettings();
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateUserSettings(user.id, {
        temperature: parseFloat(temperature.toFixed(1)),
        max_tokens: parseInt(maxTokens, 10) || defaultUserSettings.max_tokens,
        model_name: modelName,
        language: locale, // Save the current app locale
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(t('errorOccurred') + ': ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await performSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
      alert(t('errorOccurred') + ': ' + error.message);
    }
  };

  if (isScreenLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('loadingSettings')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('userProfile')}</Text>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userData.username?.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
            <View>
              <Text style={styles.profileName}>{userData.username}</Text>
              <Text style={styles.profileEmail}>{userData.email}</Text>
            </View>
          </View>
          <Button title={t('signOut')} onPress={handleLogout} color="#FF3B30" />
        </View>

        {/* AI Model Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('aiModelSettings')}</Text>
          
          <Text style={styles.settingLabel}>{t('temperature')}: {temperature.toFixed(1)}</Text>
          <Text style={styles.settingDescription}>{t('temperatureDesc')}</Text>
          {/* Basic Temperature Control - Consider a Slider for better UX if possible */}
          <View style={styles.inputRow}>
            <Button title="-0.1" onPress={() => setTemperature(prev => Math.max(0, parseFloat((prev - 0.1).toFixed(1))))} />
            <Text style={styles.tempValueDisplay}>{temperature.toFixed(1)}</Text>
            <Button title="+0.1" onPress={() => setTemperature(prev => Math.min(2, parseFloat((prev + 0.1).toFixed(1))))} />
          </View>
          
          <Text style={styles.settingLabel}>{t('maxTokens')}</Text>
          <Text style={styles.settingDescription}>{t('maxTokensDesc')}</Text>
          <TextInput
            style={styles.input}
            value={maxTokens}
            onChangeText={setMaxTokens}
            keyboardType="numeric"
            placeholder="e.g., 1000"
          />
          
          <Text style={styles.settingLabel}>{t('aiModel')}</Text>
          <Text style={styles.settingDescription}>{t('aiModelDesc')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={modelName}
              onValueChange={(itemValue) => setModelName(itemValue)}
              style={styles.picker}
            >
              {AVAILABLE_MODELS.map(model => (
                <Picker.Item key={model.value} label={model.label} value={model.value} />
              ))}
            </Picker>
          </View>
          
          <Button 
            title={isSaving ? t('loading') : (saveSuccess ? t('settingsSaved') : t('saveSettings'))} 
            onPress={handleSaveSettings} 
            disabled={isSaving}
            color={saveSuccess ? '#4CAF50' : '#007AFF'}
          />
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('appSettings')}</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('darkMode')}</Text>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              // trackColor={{ false: '#767577', true: '#81b0ff' }}
              // thumbColor={isDarkMode ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          
          <Text style={styles.settingLabel}>{t('language')}</Text>
           <View style={styles.pickerContainer}>
            <Picker
              selectedValue={locale}
              onValueChange={(itemValue) => setLocale(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label={t('english')} value="en" />
              <Picker.Item label={t('russian')} value="ru" />
            </Picker>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about')}</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('version')}</Text>
            <Text style={styles.settingValue}>{APP_VERSION}</Text>
          </View>
          <TouchableOpacity onPress={() => alert('Terms of Service: To be implemented')}>
            <Text style={[styles.settingLabel, styles.linkText]}>{t('termsOfService')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => alert('Privacy Policy: To be implemented')}>
            <Text style={[styles.settingLabel, styles.linkText]}>{t('privacyPolicy')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    color: '#333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  input: {
    height: 40,
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  pickerContainer: {
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
  },
  picker: {
    height: Platform.OS === 'ios' ? undefined : 50, // iOS Picker height is intrinsic
    width: '100%',
  },
  linkText: {
    color: '#007AFF',
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tempValueDisplay: {
    fontSize: 16,
    marginHorizontal: 10,
    minWidth: 40,
    textAlign: 'center',
  }
});

export default SettingsScreen;
