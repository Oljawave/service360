import axios from 'axios';


const API_URL = import.meta.env.VITE_PLAN_URL;

export const updatePlan = async (planData) => {
  console.log('Отправляемые данные в updatePlan:', JSON.stringify(planData, null, 2));

  if (planData.PlanDateEnd) {
    const date = new Date(planData.PlanDateEnd);
    if (isNaN(date.getTime())) {
      throw new Error('Некорректная дата: PlanDateEnd');
    }
    planData.PlanDateEnd = date.toISOString().split('T')[0];
  }

  try {
    const payload = {
      method: 'data/savePlan',
      params: ['upd', planData]
    };

    console.log('Полный запрос (payload):', JSON.stringify(payload, null, 2));

    const response = await axios.post(API_URL, payload);

    console.log('Успешный ответ от сервера:', response.data);

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
};
