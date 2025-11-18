import axios from 'axios'

const DEFAULT_API_URL = import.meta.env.VITE_OBJECT_URL;
const LOCATION_API_URL = import.meta.env.VITE_LOCATION_URL;

/**
 * Универсальная функция для POST запросов
 * @param {string} method - Метод API
 * @param {Array} params - Параметры запроса
 * @param {string} apiUrl - URL API (по умолчанию DEFAULT_API_URL)
 * @returns {Promise<Array>} Массив записей
 */
async function postRequest(method, params, apiUrl = DEFAULT_API_URL) {
  try {
    const response = await axios.post(apiUrl, {
      method,
      params,
    })
    return response.data.result?.records || []
  } catch (error) {
    console.error(`Ошибка при запросе ${method}:`, error.response?.data || error.message)
    return []
  }
}

// ============================================
// LOAD методы - Справочники организации
// ============================================

/**
 * Загрузить родительские отделения
 * @returns {Promise<Array>} Список отделений
 */
export async function fetchParentDepartments() {
  return await postRequest('data/loadObjForSelect', ['Typ_Location'], LOCATION_API_URL)
}

/**
 * Загрузить типы деятельности
 * @returns {Promise<Array>} Список типов деятельности
 */
export async function fetchActivityTypes() {
  return await postRequest('data/loadClsForSelect', ['Typ_Location'], LOCATION_API_URL)
}

/**
 * Загрузить регионы
 * @returns {Promise<Array>} Список регионов
 */
export async function fetchRegions() {
  return await postRequest('data/loadFactorValForSelect', ['Prop_Region'])
}

/**
 * Загрузить опции активности
 * @returns {Promise<Array>} Список опций активности
 */
export async function fetchActiveOptions() {
  return await postRequest('data/loadFactorValForSelect', ['Prop_IsActive'])
}

/**
 * Загрузить типы объектов
 * @returns {Promise<Array>} Список типов объектов
 */
export async function loadTypes() {
  try {
    const response = await axios.post(DEFAULT_API_URL, {
      method: 'data/loadObjList',
      params: ['Typ_ObjectTyp', 'Prop_ObjectTypeMulti', 'nsidata'],
    });
    return response.data?.result?.records.map(option => ({
      label: option.name,
      value: option.id,
      cls: option.cls,
      pv: option.pv
    })) || [];
  } catch (error) {
    console.error('Ошибка загрузки видов объектов:', error);
    throw error;
  }
}
