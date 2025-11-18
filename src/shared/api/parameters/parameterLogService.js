import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_INSPECTIONS_URL;

// ============================================
// LOAD методы (загрузка данных)
// ============================================

/**
 * Загрузить журнал параметров
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @param {number} periodType - Тип периода
 * @returns {Promise<Array>} Журнал параметров
 */
export async function loadParameterLog(date = "2025-07-30", periodType = 11) {
  const objLocation = localStorage.getItem("objLocation");

  if (!objLocation) {
    throw new Error("objLocation не найден в localStorage");
  }

  console.log('Вызов метода data/loadParameterLog', {
    date,
    periodType,
    objLocation: parseInt(objLocation)
  });

  const response = await axios.post(
    API_BASE_URL,
    {
      method: "data/loadParameterLog",
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
