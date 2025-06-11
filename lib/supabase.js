import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Получение URL и ключа Supabase из переменных окружения
// В разработке они берутся из Constants.expoConfig.extra
// В продакшене - из переменных окружения
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'http://localhost:54321';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Проверка наличия необходимых переменных окружения
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL или ключ не указаны. Убедитесь, что они настроены в app.config.js или app.json.'
  );
}

// Создание клиента Supabase для взаимодействия с базой данных
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    }
  }
);

// Вспомогательные функции для работы с Supabase

/**
 * Получение текущего авторизованного пользователя
 * @returns Текущий пользователь или null, если не авторизован
 */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/**
 * Вход по email и паролю
 * @param email Email пользователя
 * @param password Пароль пользователя
 * @returns Данные сессии или ошибка
 */
export const signInWithEmail = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

/**
 * Регистрация по email и паролю
 * @param email Email пользователя
 * @param password Пароль пользователя
 * @returns Данные сессии или ошибка
 */
export const signUpWithEmail = async (email, password) => {
  return await supabase.auth.signUp({ email, password });
};

/**
 * Вход по magic link (без пароля)
 * @param email Email пользователя
 * @returns Данные сессии или ошибка
 */
export const signInWithMagicLink = async (email) => {
  return await supabase.auth.signInWithOtp({ email });
};

/**
 * Выход текущего пользователя
 * @returns Void или ошибка
 */
export const signOut = async () => {
  return await supabase.auth.signOut();
};

/**
 * Подписка на изменения состояния аутентификации
 * @param callback Функция, вызываемая при изменении состояния
 * @returns Подписка, которую нужно отменить, когда она больше не нужна
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

/**
 * Получение настроек пользователя
 * @param userId ID пользователя
 * @returns Настройки пользователя или null
 */
export const getUserSettings = async (userId) => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Ошибка получения настроек пользователя:', error);
    return null;
  }
  
  return data;
};

/**
 * Обновление настроек пользователя
 * @param userId ID пользователя
 * @param settings Объект настроек для обновления
 * @returns Обновленные настройки или ошибка
 */
export const updateUserSettings = async (userId, settings) => {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      ...settings,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Ошибка обновления настроек пользователя:', error);
    throw error;
  }
  
  return data;
};

/**
 * Получение всех активных помощников
 * @param language Код языка (en, ru)
 * @returns Массив помощников
 */
export const getAssistants = async (language = 'en') => {
  const nameField = language === 'ru' ? 'name_ru' : 'name_en';
  const descriptionField = language === 'ru' ? 'description_ru' : 'description_en';
  const categoryField = language === 'ru' ? 'category_ru' : 'category_en';
  
  const { data, error } = await supabase
    .from('assistants')
    .select(`
      id, 
      ${nameField}, 
      ${descriptionField}, 
      ${categoryField}, 
      icon_url, 
      is_active
    `)
    .eq('is_active', true)
    .order(categoryField, { ascending: true });
  
  if (error) {
    console.error('Ошибка получения помощников:', error);
    return [];
  }
  
  return data;
};

/**
 * Получение чатов пользователя
 * @param userId ID пользователя
 * @returns Массив чатов с деталями помощников
 */
export const getUserChats = async (userId) => {
  const { data, error } = await supabase
    .from('chats')
    .select(`
      id,
      title,
      created_at,
      updated_at,
      assistants (
        id,
        name_en,
        name_ru,
        icon_url
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Ошибка получения чатов пользователя:', error);
    return [];
  }
  
  return data;
};

/**
 * Создание нового чата
 * @param userId ID пользователя
 * @param assistantId ID помощника
 * @param title Опциональное название
 * @returns Созданный чат или ошибка
 */
export const createChat = async (userId, assistantId, title) => {
  const { data, error } = await supabase
    .from('chats')
    .insert({
      user_id: userId,
      assistant_id: assistantId,
      title,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Ошибка создания чата:', error);
    throw error;
  }
  
  return data;
};

/**
 * Получение сообщений чата
 * @param chatId ID чата
 * @returns Массив сообщений
 */
export const getChatMessages = async (chatId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Ошибка получения сообщений чата:', error);
    return [];
  }
  
  return data;
};

/**
 * Отправка сообщения AI-помощнику
 * @param chatId ID чата
 * @param content Содержание сообщения
 * @param assistantId ID помощника
 * @param modelSettings Опциональные настройки модели
 * @returns Ответ AI или ошибка
 */
export const sendMessageToAI = async (
  chatId,
  content,
  assistantId,
  modelSettings
) => {
  // Вызов Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('generate_ai_response', {
    body: {
      chatId,
      userMessage: content,
      assistantId,
      modelSettings,
    },
  });
  
  if (error) {
    console.error('Ошибка отправки сообщения AI:', error);
    throw error;
  }
  
  return data;
};

export default supabase;
