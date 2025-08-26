import axios from 'axios';


const API_URL = import.meta.env.VITE_OBJECT_URL;

export const updateObject = async (data) => {
  try {
    console.log("Данные, отправляемые на сервер:", data);

    const response = await axios.post(API_URL, {
      method: 'data/saveObjectServed',
      params: ['upd', data]
    });

    console.log("Ответ от сервера:", response.data);

    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении объекта:', error);
    throw error;
  }
};
