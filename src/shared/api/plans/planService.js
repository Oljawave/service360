import axios from 'axios'
import { getUserData } from '../common/userCache'
import { formatDateForBackend } from '../common/formatters'

const API_PLAN_URL = import.meta.env.VITE_PLAN_URL;

// ============================================
// LOAD методы (загрузка данных)
// ============================================

/**
 * Загрузить план работ
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @param {number} periodType - Тип периода (по умолчанию 11)
 * @returns {Promise<Array>} Список планов работ
 */
export async function loadWorkPlan(date = "2025-07-30", periodType = 11) {
  const objLocation = localStorage.getItem("objLocation");

  if (!objLocation) {
    throw new Error("objLocation не найден в localStorage");
  }

  const response = await axios.post(
    API_PLAN_URL,
    {
      method: "data/loadPlan",
      params: [
        {
          date,
          periodType,
          objLocation: parseInt(objLocation),
        }
      ]
    },
    {
      withCredentials: true
    }
  );

  return response.data.result?.records || [];
}

// ============================================
// SAVE методы (сохранение)
// ============================================

/**
 * Сохранить один план работ
 * @param {Object} workData - Данные о работе
 * @param {Object} formData - Данные формы
 */
export async function savePlan(workData, formData) {
  try {
    const user = await getUserData();

    const section = formData.section || {};

    const formattedPlannedDate = formatDateForBackend(formData.plannedDate);
    const today = formatDateForBackend(new Date());

    const planName = `${workData.value}_${formattedPlannedDate || today}`;

    const payload = {
      method: 'data/savePlan',
      params: [
        'ins',
        {
          name: planName,
          linkCls: workData.cls,
          objLocationClsSection: section.value || null,
          pvLocationClsSection: section.pv || null,
          objWork: workData.value,
          pvWork: workData.pv || null,
          objObject: formData.object?.value || null,
          pvObject: formData.object?.fullRecord?.pvObject || null,
          objUser: user.id,
          pvUser: user.pv,
          StartKm: formData.coordStartKm || 0,
          FinishKm: formData.coordEndKm || 0,
          StartPicket: formData.coordStartPk || 0,
          FinishPicket: formData.coordEndPk || 0,
          PlanDateEnd: formattedPlannedDate,
          CreatedAt: today,
          UpdatedAt: today
        }
      ]
    };

    console.log('Отправка плана:', payload);
    const response = await axios.post(API_PLAN_URL, payload);

    if (response.data?.result) {
      return response.data.result;
    }
    throw new Error('Ошибка сохранения: нет результата');
  } catch (error) {
    console.error('Ошибка при сохранении плана:', error);
    throw error;
  }
}

/**
 * Сохранить несколько планов работ
 * @param {Object} workData - Данные о работе
 * @param {Array} forms - Массив форм с данными
 */
export async function saveAllPlans(workData, forms) {
  const results = [];
  for (const form of forms) {
    try {
      const result = await savePlan(workData, form);
      results.push({ success: true, result });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  return results;
}

// ============================================
// UPDATE методы (обновление)
// ============================================

/**
 * Обновить план работ
 * @param {Object} planData - Данные плана для обновления
 */
export async function updatePlan(planData) {
  // Форматируем дату если она есть
  if (planData.PlanDateEnd) {
    const date = new Date(planData.PlanDateEnd);
    if (isNaN(date.getTime())) {
      throw new Error('Некорректная дата: PlanDateEnd');
    }
    planData.PlanDateEnd = formatDateForBackend(date);
  }

  try {
    const payload = {
      method: 'data/savePlan',
      params: ['upd', planData]
    };

    const response = await axios.post(API_PLAN_URL, payload);

    if (response.data && response.data.result) {
      return response.data.result;
    } else {
      const errorMsg = response.data?.error?.message || 'Неизвестная ошибка';
      console.error('Ошибка от сервера:', errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    if (error.response) {
      console.error('Ответ сервера (ошибка):', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Нет ответа от сервера:', error.request);
    } else {
      console.error('Ошибка настройки запроса:', error.message);
    }
    throw error;
  }
}

// ============================================
// DELETE методы (удаление)
// ============================================

/**
 * Удалить план работ
 * @param {number} planId - ID плана для удаления
 */
export async function deletePlan(planId) {
  if (!planId) {
    throw new Error('ID плана не указан');
  }

  try {
    // Используем axios вместо fetch для единообразия
    const response = await axios.post(API_PLAN_URL, {
      method: 'data/deleteObjWithProperties',
      params: [planId]
    });

    // Проверяем на наличие ошибок в ответе
    if (response.data?.error) {
      throw new Error(response.data.error.message || 'Ошибка при удалении плана');
    }

    return response.data;
  } catch (error) {
    console.error('❌ Ошибка при удалении плана:', error);
    throw new Error(`Не удалось удалить план: ${error.message}`);
  }
}
