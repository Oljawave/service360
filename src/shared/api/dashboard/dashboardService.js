import axios from 'axios'

const API_URL = import.meta.env.VITE_LOCATION_URL;
const API_PLAN_URL = import.meta.env.VITE_PLAN_URL;
const API_INCIDENTS_URL = import.meta.env.VITE_INCIDENTS_URL;
const API_INSPECTIONS_URL = import.meta.env.VITE_INSPECTIONS_URL;

// ============================================
// LOAD методы - Справочники
// ============================================

/**
 * Загрузить список отделений/хозяйств
 * @returns {Promise<Array>} Список отделений
 */
export async function loadDepartments() {
  try {
    const response = await axios.post(
      API_URL,
      {
        method: "data/loadDepartmentForSelect",
        params: []
      },
      {
        withCredentials: true
      }
    );

    return response.data.result?.records || [];
  } catch (error) {
    console.error('Ошибка при загрузке списка хозяйств:', error);
    throw error;
  }
}

// ============================================
// LOAD методы - KPI данные
// ============================================

/**
 * Загрузить план работ для KPI
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @param {number|null} periodType - Тип периода
 * @param {number|null} objLocation - ID локации (null для всех хозяйств)
 * @returns {Promise<Array>} План работ
 */
export async function loadWorkPlanForKpi(date, periodType = null, objLocation = null) {
  const params = {
    date,
    codCls: "Cls_WorkPlanCorrectional"
  };

  if (periodType !== null) {
    params.periodType = periodType;
  }

  // Только добавляем objLocation если он не null (не "Все хозяйства")
  if (objLocation !== null) {
    params.objLocation = objLocation;
  }

  const response = await axios.post(
    API_PLAN_URL,
    {
      method: "data/loadPlan",
      params: [params]
    },
    {
      withCredentials: true
    }
  );

  return response.data.result?.records || [];
}

/**
 * Загрузить инциденты для KPI
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @param {number} periodType - Тип периода
 * @param {number|null} objLocation - ID локации
 * @param {string|null} status - Статус инцидента
 * @param {number|null} event - ID события
 * @returns {Promise<Array>} Список инцидентов
 */
export async function loadIncidentsForKpi(date, periodType, objLocation = null, status = null, event = null) {
  const params = {
    date,
    periodType
  };

  // Добавляем objLocation только если он не null
  if (objLocation !== null) {
    params.objLocation = objLocation;
  }

  // Добавляем status только если он не null
  if (status !== null) {
    params.status = status;
  }

  // Добавляем event только если он не null
  if (event !== null) {
    params.event = event;
  }

  const response = await axios.post(
    API_INCIDENTS_URL,
    {
      method: "data/loadIncident",
      params: [params]
    },
    {
      withCredentials: true
    }
  );

  return response.data.result?.records || [];
}

/**
 * Загрузить количество инцидентов за месяц
 * @param {number|null} objLocation - ID локации
 * @param {number|null} event - ID события
 * @param {boolean|null} open - Флаг открытых инцидентов
 * @returns {Promise<number>} Количество инцидентов
 */
export async function loadSizeIncidentOfMonth(objLocation = null, event = null, open = null) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const params = {
    date: dateStr
  };

  // Добавляем objLocation только если он не null
  if (objLocation !== null) {
    params.objLocation = objLocation;
  }

  // Добавляем event только если он не null
  if (event !== null) {
    params.event = event;
  }

  // Добавляем open только если он не null
  if (open !== null) {
    params.open = open;
  }

  const response = await axios.post(
    API_INCIDENTS_URL,
    {
      method: "data/loadSizeIncidentOfMonth",
      params: [params]
    },
    {
      withCredentials: true
    }
  );

  return response.data.result || 0;
}

// ============================================
// LOAD методы - Статус железной дороги
// ============================================

/**
 * Загрузить статус железной дороги
 * @param {string|null} customDate - Дата в формате YYYY-MM-DD
 * @param {number} relobj - ID связанного объекта
 * @returns {Promise<Array>} Статус железной дороги
 */
export async function loadRailwayStatus(customDate = null, relobj = 2525) {
  let dateStr;

  if (customDate) {
    // Если передана кастомная дата, используем её
    dateStr = customDate;
  } else {
    // Иначе используем сегодняшнюю дату
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  }

  const params = {
    date: dateStr,
    relobj: relobj
  };

  const response = await axios.post(
    API_INSPECTIONS_URL,
    {
      method: "data/loadParameterLogByComponentParameter",
      params: [params]
    },
    {
      withCredentials: true
    }
  );

  return response.data.result?.records || [];
}

/**
 * Загрузить данные об отклонениях ж/д пути
 * @param {string|null} customDate - Дата в формате YYYY-MM-DD
 * @returns {Promise<Array>} Данные об отклонениях
 */
export async function loadRailwaySkewData(customDate = null) {
  let dateStr;

  if (customDate) {
    dateStr = customDate;
  } else {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  }

  // Загружаем данные по всем 4 типам отклонений параллельно
  const [levelData, skewData, subsidence, planDeviation] = await Promise.all([
    axios.post(
      API_INSPECTIONS_URL,
      {
        method: "data/loadParameterLogByComponentParameter",
        params: [{ date: dateStr, relobj: 1701 }]
      },
      { withCredentials: true }
    ),
    axios.post(
      API_INSPECTIONS_URL,
      {
        method: "data/loadParameterLogByComponentParameter",
        params: [{ date: dateStr, relobj: 1703 }]
      },
      { withCredentials: true }
    ),
    axios.post(
      API_INSPECTIONS_URL,
      {
        method: "data/loadParameterLogByComponentParameter",
        params: [{ date: dateStr, relobj: 1694 }]
      },
      { withCredentials: true }
    ),
    axios.post(
      API_INSPECTIONS_URL,
      {
        method: "data/loadParameterLogByComponentParameter",
        params: [{ date: dateStr, relobj: 1704 }]
      },
      { withCredentials: true }
    )
  ]);

  // Объединяем все данные и добавляем тип отклонения
  const allData = [
    ...(levelData.data.result?.records || []).map(item => ({ ...item, skewType: 'level' })),
    ...(skewData.data.result?.records || []).map(item => ({ ...item, skewType: 'skew' })),
    ...(subsidence.data.result?.records || []).map(item => ({ ...item, skewType: 'subsidence' })),
    ...(planDeviation.data.result?.records || []).map(item => ({ ...item, skewType: 'planDeviation' }))
  ];

  return allData;
}
