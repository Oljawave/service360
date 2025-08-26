import axios from 'axios';

export const loadLocation = async () => {
  try {
    console.log('📡 Отправка запроса на сервер...');
    const response = await axios.post('http://192.168.1.20:9181/api', {
      method: 'data/loadLocation',
      params: [0]
    });
    console.log('📬 Ответ от сервера:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Ошибка при загрузке локаций:', error);
    throw error;
  }
};

