import React, { useState, useEffect } from 'react';
import { Platform, Keyboard } from 'react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { supabase, signInWithEmail, signUpWithEmail, signInWithMagicLink } from '../lib/supabase';
import { useAuth } from '../App'; // Import useAuth hook

const AuthScreen = () => {
  const { enterDemoMode } = useAuth(); // Get enterDemoMode from auth context
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);

  // Email validation
  const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation (at least 6 characters)
  const isPasswordValid = (password) => {
    return password.length >= 6;
  };

  // Reset state when toggling between login and signup
  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsMagicLinkSent(false);
  }, [isLogin]);

  const handleSignInWithEmail = async () => {
    Keyboard.dismiss();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (!email) {
      setErrorMsg('Please enter your email address');
      return;
    }
    
    if (!isEmailValid(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signInWithEmail(email, password);
      
      if (error) throw error;
      
      // Auth state change will be handled by the listener in App.js
    } catch (error) {
      setErrorMsg(error.message || 'An error occurred during sign in');
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpWithEmail = async () => {
    Keyboard.dismiss();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (!email) {
      setErrorMsg('Please enter your email address');
      return;
    }
    
    if (!isEmailValid(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    
    if (!password) {
      setErrorMsg('Please enter a password');
      return;
    }
    
    if (!isPasswordValid(password)) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signUpWithEmail(email, password);
      
      if (error) throw error;
      
      setSuccessMsg('Registration successful! Check your email for confirmation.');
    } catch (error) {
      setErrorMsg(error.message || 'An error occurred during sign up');
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    Keyboard.dismiss();
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (!email) {
      setErrorMsg('Please enter your email address');
      return;
    }
    
    if (!isEmailValid(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signInWithMagicLink(email);
      
      if (error) throw error;
      
      setIsMagicLinkSent(true);
      setSuccessMsg('Check your email for the login link!');
    } catch (error) {
      setErrorMsg(error.message || 'An error occurred sending the magic link');
      console.error('Magic link error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Ionicons name="chatbubbles" size={64} color="#007AFF" />
            </View>
            <Text style={styles.title}>AI Assistant</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Sign in to continue' : 'Create a new account'}
            </Text>
          </View>

          {/* Demo Mode Button */}
          <TouchableOpacity
            style={styles.demoButton}
            onPress={enterDemoMode}
          >
            <Text style={styles.demoButtonText}>Enter Demo Mode</Text>
            <Text style={styles.demoButtonSubtitle}>(No Registration Needed)</Text>
          </TouchableOpacity>

          <View style={styles.formContainer}>
            {/* Success Message */}
            {successMsg && (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}

            {/* Error Message */}
            {errorMsg && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Magic Link Sent State */}
            {isMagicLinkSent ? (
              <View style={styles.magicLinkContainer}>
                <Ionicons name="mail-outline" size={64} color="#007AFF" />
                <Text style={styles.magicLinkTitle}>Check your inbox</Text>
                <Text style={styles.magicLinkSubtitle}>
                  We've sent a magic link to:
                </Text>
                <Text style={styles.magicLinkEmail}>{email}</Text>
                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={() => setIsMagicLinkSent(false)}
                >
                  <Text style={styles.outlineButtonText}>Use a different email</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color="#999"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="your.email@example.com"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#999"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={isLogin ? "Your password" : "Create a password"}
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.passwordToggle}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#999"
                      />
                    </TouchableOpacity>
                  </View>
                  {!isLogin && (
                    <Text style={styles.helperText}>
                      Password must be at least 6 characters
                    </Text>
                  )}
                </View>

                {/* Sign In / Sign Up Button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={isLogin ? handleSignInWithEmail : handleSignUpWithEmail}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {isLogin ? 'Sign In' : 'Create Account'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Magic Link Option (for login only) */}
                {isLogin && (
                  <>
                    <View style={styles.dividerContainer}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or</Text>
                      <View style={styles.dividerLine} />
                    </View>
                    
                    <TouchableOpacity
                      style={styles.outlineButton}
                      onPress={handleSendMagicLink}
                      disabled={loading}
                    >
                      <Ionicons
                        name="link-outline"
                        size={20}
                        color="#007AFF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.outlineButtonText}>
                        Sign In with Magic Link
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>

          {/* Toggle between Login and Signup */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.footerLink}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E1F5FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  demoButton: {
    backgroundColor: '#4CAF50', // Green color for demo mode
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoButtonSubtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#2E7D32',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    textAlign: 'center',
  },
  magicLinkContainer: {
    alignItems: 'center',
    padding: 16,
  },
  magicLinkTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  magicLinkSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  magicLinkEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDD',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#666',
  },
  outlineButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 4,
  },
});

export default AuthScreen;
