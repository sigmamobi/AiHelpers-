import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Define translations
const translations = {
  en: {
    // Common
    appName: "AI Assistant",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    back: "Back",
    error: "Error",
    success: "Success",
    thinking: "Thinking...",
    pleaseEnterEmail: "Please enter your email address",
    pleaseEnterValidEmail: "Please enter a valid email address",
    pleaseEnterPassword: "Please enter your password",
    passwordMinLength: "Password must be at least 6 characters",
    errorOccurred: "An error occurred",

    // AuthScreen
    signIn: "Sign In",
    signUp: "Sign Up",
    createAccount: "Create Account",
    email: "Email",
    password: "Password",
    magicLink: "Sign In with Magic Link",
    magicLinkSent: "Magic link sent! Check your email.",
    demoMode: "Enter Demo Mode",
    demoModeSubtitle: "(No Registration Needed)",
    signInToContinue: "Sign in to continue",
    createNewAccount: "Create a new account",
    checkYourInbox: "Check your inbox",
    magicLinkSentTo: "We've sent a magic link to:",
    useDifferentEmail: "Use a different email",
    yourEmailPlaceholder: "your.email@example.com",
    yourPasswordPlaceholder: "Your password",
    createPasswordPlaceholder: "Create a password",
    orDivider: "or",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",

    // HomeScreen
    welcomeMessage: "Welcome to AI Assistant",
    welcomeSubtitle: "Chat with specialized AI assistants to get help with various tasks",
    recentConversations: "Recent Conversations",
    newChat: "New Chat",
    noConversations: "No conversations yet",
    browseAssistants: "Browse Assistants",
    loadingConversations: "Loading conversations...",

    // AssistantsScreen
    assistants: "Assistants",
    assistantsSubtitle: "Choose an assistant to start a conversation",
    searchAssistants: "Search assistants...",
    noAssistantsFound: "No assistants found",
    tryDifferentSearch: "Try a different search",
    startChat: "Start Chat",
    loadingAssistants: "Loading assistants...",

    // ChatScreen
    typeMessage: "Type a message...",
    aiTyping: "is typing...",
    aiIsTyping: "is typing...",
    loadingConversation: "Loading conversation...",
    noMessagesYet: "No messages yet. Start the conversation!",
    errorProcessingRequest: "Sorry, I encountered an error processing your request. Please try again.",
    errorUserNotLoggedIn: "Sorry, you need to be logged in for real AI responses.",
    demoResponse: "This is a demo response from your {assistantName}. To get real AI responses, please connect to Supabase and OpenAI.",
    demoHello: "Hello! I'm your {assistantName}. How can I help you today in demo mode?",
    demoHelp: "In demo mode, I can provide general assistance. What specific help do you need?",
    demoThanks: "You're welcome! This is a demo response. Feel free to ask more questions.",
    demoBusiness: "As a Business Strategist (in demo mode), I can tell you that market analysis is crucial for growth.",
    demoCode: "In this demo, I can confirm that clean code practices are essential for maintainability.",


    // SettingsScreen
    settings: "Settings",
    userProfile: "User Profile",
    signOut: "Sign Out",
    aiModelSettings: "AI Model Settings",
    temperature: "Temperature",
    temperatureDesc: "Lower values make responses more focused and deterministic",
    maxTokens: "Max Tokens",
    maxTokensDesc: "Maximum length of AI responses",
    aiModel: "AI Model",
    aiModelDesc: "Select the AI model to use for responses",
    saveSettings: "Save AI Settings",
    settingsSaved: "Settings Saved!",
    appSettings: "App Settings",
    darkMode: "Dark Mode",
    language: "Language",
    english: "English",
    russian: "Russian",
    about: "About",
    version: "Version",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    selectModel: "Select model",
    selectLanguage: "Select language",
    loadingSettings: "Loading settings...",
  },
  ru: {
    // Common
    appName: "AI Помощник",
    loading: "Загрузка...",
    save: "Сохранить",
    cancel: "Отмена",
    back: "Назад",
    error: "Ошибка",
    success: "Успешно",
    thinking: "Думаю...",
    pleaseEnterEmail: "Пожалуйста, введите ваш email",
    pleaseEnterValidEmail: "Пожалуйста, введите корректный email",
    pleaseEnterPassword: "Пожалуйста, введите ваш пароль",
    passwordMinLength: "Пароль должен содержать не менее 6 символов",
    errorOccurred: "Произошла ошибка",

    // AuthScreen
    signIn: "Войти",
    signUp: "Регистрация",
    createAccount: "Создать аккаунт",
    email: "Электронная почта",
    password: "Пароль",
    magicLink: "Войти по магической ссылке",
    magicLinkSent: "Магическая ссылка отправлена! Проверьте почту.",
    demoMode: "Войти в демо-режим",
    demoModeSubtitle: "(Регистрация не требуется)",
    signInToContinue: "Войдите, чтобы продолжить",
    createNewAccount: "Создайте новый аккаунт",
    checkYourInbox: "Проверьте ваш почтовый ящик",
    magicLinkSentTo: "Мы отправили магическую ссылку на:",
    useDifferentEmail: "Использовать другой email",
    yourEmailPlaceholder: "your.email@example.com",
    yourPasswordPlaceholder: "Ваш пароль",
    createPasswordPlaceholder: "Создайте пароль",
    orDivider: "или",
    dontHaveAccount: "Нет аккаунта?",
    alreadyHaveAccount: "Уже есть аккаунт?",

    // HomeScreen
    welcomeMessage: "Добро пожаловать в AI Помощник",
    welcomeSubtitle: "Общайтесь со специализированными AI-помощниками для решения различных задач",
    recentConversations: "Недавние диалоги",
    newChat: "Новый чат",
    noConversations: "Пока нет диалогов",
    browseAssistants: "Выбрать помощника",
    loadingConversations: "Загрузка диалогов...",

    // AssistantsScreen
    assistants: "Помощники",
    assistantsSubtitle: "Выберите помощника, чтобы начать диалог",
    searchAssistants: "Поиск помощников...",
    noAssistantsFound: "Помощники не найдены",
    tryDifferentSearch: "Попробуйте другой поиск",
    startChat: "Начать чат",
    loadingAssistants: "Загрузка помощников...",

    // ChatScreen
    typeMessage: "Введите сообщение...",
    aiTyping: "печатает...",
    aiIsTyping: "печатает...",
    loadingConversation: "Загрузка диалога...",
    noMessagesYet: "Сообщений пока нет. Начните диалог!",
    errorProcessingRequest: "Извините, при обработке вашего запроса произошла ошибка. Пожалуйста, попробуйте еще раз.",
    errorUserNotLoggedIn: "Извините, для получения реальных ответов AI необходимо войти в систему.",
    demoResponse: "Это демонстрационный ответ от вашего {assistantName}. Для получения реальных ответов AI, пожалуйста, подключитесь к Supabase и OpenAI.",
    demoHello: "Привет! Я ваш {assistantName}. Чем могу помочь сегодня в демо-режиме?",
    demoHelp: "В демо-режиме я могу оказать общую помощь. Какая конкретно помощь вам нужна?",
    demoThanks: "Пожалуйста! Это демонстрационный ответ. Не стесняйтесь задавать еще вопросы.",
    demoBusiness: "Как Бизнес-стратег (в демо-режиме), могу сказать, что анализ рынка крайне важен для роста.",
    demoCode: "В этой демонстрации могу подтвердить, что практика написания чистого кода важна для поддержки проекта.",


    // SettingsScreen
    settings: "Настройки",
    userProfile: "Профиль пользователя",
    signOut: "Выйти",
    aiModelSettings: "Настройки AI модели",
    temperature: "Температура",
    temperatureDesc: "Низкие значения делают ответы более сфокусированными",
    maxTokens: "Макс. токенов",
    maxTokensDesc: "Максимальная длина ответов AI",
    aiModel: "AI Модель",
    aiModelDesc: "Выберите модель AI для ответов",
    saveSettings: "Сохранить настройки AI",
    settingsSaved: "Настройки сохранены!",
    appSettings: "Настройки приложения",
    darkMode: "Темная тема",
    language: "Язык",
    english: "Английский",
    russian: "Русский",
    about: "О приложении",
    version: "Версия",
    termsOfService: "Условия использования",
    privacyPolicy: "Политика конфиденциальности",
    selectModel: "Выберите модель",
    selectLanguage: "Выберите язык",
    loadingSettings: "Загрузка настроек...",
  },
};

let i18nInstance;

try {
  i18nInstance = new I18n(translations);
} catch (error) {
  console.error("Failed to initialize I18n instance:", error);
  // Fallback to a dummy i18n object to prevent crashes
  i18nInstance = {
    t: (scope) => `[i18n error: ${scope}]`,
    locale: 'en',
    enableFallback: true,
    defaultLocale: 'en',
  };
}

// Set the locale once at the beginning of your app.
try {
  let deviceLocale = 'en'; // Default locale
  if (typeof Localization.getLocales === 'function') {
    const locales = Localization.getLocales();
    if (Array.isArray(locales) && locales.length > 0 && locales[0]?.languageCode) {
      const detectedLocale = locales[0].languageCode;
      // Ensure the detected locale is supported, otherwise fallback
      if (translations[detectedLocale]) {
        deviceLocale = detectedLocale;
      } else {
        console.warn(`Detected locale '${detectedLocale}' is not supported. Falling back to 'en'.`);
      }
    }
  }
  i18nInstance.locale = deviceLocale;
} catch (error) {
  console.error("Error setting initial locale:", error);
  i18nInstance.locale = 'en'; // Fallback locale in case of error
}

// When a value is missing from a language it'll fallback to another language with the key present.
i18nInstance.enableFallback = true;
i18nInstance.defaultLocale = 'en'; // Explicitly set default locale for fallback

// Export t function for use in components
export const t = (scope, options) => {
  try {
    if (!i18nInstance) {
      // This case should ideally not be reached if the fallback dummy object is created
      console.error("i18n instance is not available.");
      return `[missing i18n: ${scope}]`;
    }
    return i18nInstance.t(scope, options);
  } catch (error) {
    console.error(`Error translating scope "${scope}":`, error);
    return `[translation error: ${scope}]`; // Fallback to key or placeholder
  }
};

// Function to change language dynamically
export const setLocale = (locale) => {
  if (!i18nInstance) {
    console.error("i18n instance is not available for setLocale.");
    return;
  }
  if (translations[locale]) {
    i18nInstance.locale = locale;
  } else {
    console.warn(`Locale '${locale}' not found for setLocale. Falling back to default '${i18nInstance.defaultLocale}'.`);
    i18nInstance.locale = i18nInstance.defaultLocale;
  }
};

// Export the i18n instance itself if needed for more advanced use cases
export default i18nInstance;
