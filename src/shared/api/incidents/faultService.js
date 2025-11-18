import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_INSPECTIONS_URL;

// ============================================
// LOAD методы (загрузка данных)
// ============================================

/**
 * Загрузить список неисправностей
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @param {number} periodType - Тип периода
 * @returns {Promise<Array>} Список неисправностей
 */
export async function loadFaults(date = "2025-07-30", periodType = 11) {
  const objLocation = localStorage.getItem("objLocation");

  if (!objLocation) {
    throw new Error("objLocation не найден в localStorage");
  }

  console.log('Вызов метода data/loadFault', {
    date,
    periodType,
    objLocation: parseInt(objLocation)
  });

  const response = await axios.post(
    API_BASE_URL,
    {
      method: "data/loadFault",
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
// DELETE методы (удаление)
// ============================================

/**
 * Удалить неисправность или параметр
 * @param {number} id - ID записи
 * @returns {Promise<Object>} Результат удаления
 */
export async function deleteFaultOrParameter(id) {
  if (!id) {
    throw new Error("ID записи для удаления не предоставлен.");
  }

  const response = await axios.post(
    API_BASE_URL,
    {
      method: "data/deleteObjWithProperties",
      params: [id]
    },
    {
      withCredentials: true
    }
  );

  if (response.data.result === undefined || response.data.result === null) {
    console.warn("API не вернул 'result' при удалении, возможно, ошибка или специфичный формат ответа.");
  }

  return response.data;
}
