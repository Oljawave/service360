import axios from "axios";

const API_URL = import.meta.env.VITE_LOCATION_URL;
const API_PLAN_URL = import.meta.env.VITE_PLAN_URL;
const API_INCIDENTS_URL = import.meta.env.VITE_INCIDENTS_URL;

export const loadDepartments = async () => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: "data/loadDepartmentForSelect",
        params: []
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.result?.records || [];
  } catch (error) {
    console.error('Ошибка при загрузке списка хозяйств:', error);
    throw error;
  }
};

export const loadWorkPlanForKpi = async (date, periodType = null, objLocation = null) => {
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

  console.log('Вызов метода data/loadPlan для KPI', params);

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
};

export const loadIncidentsForKpi = async (date, periodType, objLocation = null, status = null, event = null) => {
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

  console.log('Вызов метода data/loadIncident для KPI', params);

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
};