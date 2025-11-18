import axios from 'axios'

const AUTH_API_URL = import.meta.env.VITE_OBJECT_URL;
let userDataCache = null;

/**
 * Получить данные текущего авторизованного пользователя
 * Использует кэширование для избежания повторных запросов
 * @returns {Promise<Object>} Объект с данными пользователя { id, pv, name, ... }
 */
export async function getUserData() {
  if (userDataCache) return userDataCache;

  try {
    const response = await axios.post(AUTH_API_URL, {
      method: 'data/loadObjList',
      params: ['Typ_Personnel', 'Prop_User', 'personnaldata']
    });

    const user = response.data?.result?.records?.[0];
    if (!user) throw new Error('Данные пользователя не найдены');

    userDataCache = user;
    return user;
  } catch (error) {
    console.error('Ошибка при загрузке данных пользователя:', error);
    throw error;
  }
}

/**
 * Очистить кэш данных пользователя
 * Используется при логауте или смене пользователя
 */
export function clearUserCache() {
  userDataCache = null;
}
