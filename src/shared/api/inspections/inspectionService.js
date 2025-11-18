import axios from 'axios'
import { getUserData } from '../common/userCache'

const API_BASE_URL = import.meta.env.VITE_INSPECTIONS_URL;

// ============================================
// LOAD методы (загрузка данных)
// ============================================

/**
 * Загрузить список осмотров
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @param {number} periodType - Тип периода
 * @returns {Promise<Array>} Список осмотров
 */
export async function loadInspections(date = "2025-07-30", periodType = 11) {
  const objLocation = localStorage.getItem("objLocation");

  if (!objLocation) {
    throw new Error("objLocation не найден в localStorage");
  }

  console.log('Вызов метода data/loadInspection', {
    date,
    periodType,
    objLocation: parseInt(objLocation)
  });

  const response = await axios.post(
    API_BASE_URL,
    {
      method: "data/loadInspection",
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

/**
 * Загрузить секции для выбранной локации
 * @returns {Promise<Array>} Список секций
 */
export async function loadSections() {
  try {
    const objLocation = localStorage.getItem("objLocation");

    if (!objLocation) {
      throw new Error("objLocation не найден в localStorage");
    }

    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/loadObjLocationSectionForSelect",
        params: [parseInt(objLocation)],
      },
      {
        withCredentials: true,
      }
    );

    return response.data.result?.records || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Загрузить даты плана работ для осмотров
 * @param {number} selectedSectionId - ID выбранной секции
 * @param {number} pv - PV секции
 * @returns {Promise<Array>} Список дат
 */
export async function loadWorkPlanDates(selectedSectionId, pv) {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/loadDateWorkPlanInspection",
        params: [
          {
            id: selectedSectionId,
            pv: pv,
          }
        ]
      },
      {
        withCredentials: true
      }
    );

    return response.data.result || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Загрузить незавершенные планы работ по дате
 * @param {number} sectionId - ID секции
 * @param {number} pv - PV секции
 * @param {string} date - Дата
 * @returns {Promise<Array>} Список незавершенных планов
 */
export async function loadWorkPlanUnfinishedByDate(sectionId, pv, date) {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/loadObjClsWorkPlanInspectionUnfinishedByDate",
        params: [
          {
            id: sectionId,
            pv: pv,
            date: date,
          }
        ]
      },
      {
        withCredentials: true
      }
    );

    return response.data.result?.records || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Загрузить записи осмотров для плана работ
 * @param {number} workPlanId - ID плана работ
 * @param {number} workPlanPv - PV плана работ
 * @returns {Promise<Array>} Список записей осмотров
 */
export async function loadInspectionEntriesForWorkPlan(workPlanId, workPlanPv) {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/loadInspectionEntriesForWorkPlan",
        params: [
          {
            id: workPlanId,
            pv: workPlanPv,
          }
        ]
      },
      {
        withCredentials: true,
      }
    );

    return response.data.result?.records || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Загрузить компоненты по типу объекта
 * @param {number} objObject - ID объекта
 * @returns {Promise<Array>} Список компонентов
 */
export async function loadComponentsByTypObjectForSelect(objObject) {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/loadComponentsByTypObjectForSelect",
        params: [objObject],
      },
      {
        withCredentials: true,
      }
    );
    return response.data.result?.records || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Загрузить дефекты по компоненту
 * @param {number} objComponent - ID компонента
 * @returns {Promise<Array>} Список дефектов
 */
export async function loadDefectsByComponentForSelect(objComponent) {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/loadDefectsByComponentForSelect",
        params: [objComponent],
      },
      {
        withCredentials: true,
      }
    );
    return response.data.result?.records || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Загрузить параметры компонента
 * @param {number} objComponent - ID компонента
 * @returns {Promise<Array>} Список параметров
 */
export async function loadComponentParametersForSelect(objComponent) {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/loadComponentParametersForSelect",
        params: [objComponent],
      },
      {
        withCredentials: true,
      }
    );
    return response.data.result?.records || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Загрузить записи о неисправностях для осмотра
 * @param {number} inspectionId - ID осмотра
 * @returns {Promise<Array>} Список записей о неисправностях
 */
export async function loadFaultEntriesForInspection(inspectionId) {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/loadFaultEntriesForInspection",
        params: [inspectionId],
      },
      {
        withCredentials: true,
      }
    );
    return response.data.result?.records || [];
  } catch (error) {
    console.error("Ошибка при загрузке записей о неисправностях:", error);
    throw error;
  }
}

/**
 * Загрузить записи о параметрах для осмотра
 * @param {number} inspectionId - ID осмотра
 * @returns {Promise<Array>} Список записей о параметрах
 */
export async function loadParameterEntriesForInspection(inspectionId) {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/loadParameterEntriesForInspection",
        params: [inspectionId],
      },
      {
        withCredentials: true,
      }
    );
    return response.data.result?.records || [];
  } catch (error) {
    console.error("Ошибка при загрузке записей о параметрах:", error);
    throw error;
  }
}

// ============================================
// SAVE методы (сохранение)
// ============================================

/**
 * Сохранить информацию об осмотре
 * @param {Object} payload - Данные осмотра
 * @returns {Promise<Object>} Результат сохранения
 */
export async function saveInspectionInfo(payload) {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/saveInspection",
        params: ["ins", payload],
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Сохранить информацию о неисправности
 * @param {Object} payload - Данные неисправности
 * @returns {Promise<Object>} Результат сохранения
 */
export async function saveFaultInfo(payload) {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/saveFault",
        params: ["ins", payload],
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Сохранить информацию о параметре
 * @param {Object} payload - Данные параметра
 * @returns {Promise<Object>} Результат сохранения
 */
export async function saveParameterInfo(payload) {
  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/saveParameterLog",
        params: ["ins", payload],
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

// ============================================
// LEGACY - для обратной совместимости
// ============================================

/**
 * @deprecated Используйте getUserData из common/userCache
 */
export const fetchUserData = getUserData;
