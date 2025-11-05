import axios from "axios";

const API_REPAIR_URL = import.meta.env.VITE_REPAIR_URL;
const AUTH_API_URL = import.meta.env.VITE_OBJECT_URL;

let userDataCache = null;

const fetchUserData = async () => {
  if (userDataCache) return userDataCache;

  try {
    const response = await axios.post(AUTH_API_URL, {
      method: 'data/loadObjList',
      params: ['Typ_Personnel', 'Prop_User', 'personnaldata']
    });

    const user = response.data?.result?.records?.[0];
    if (!user) throw new Error('Данные пользователя не найдены');

    userDataCache = user;
    return user;
  } catch (error) {
    console.error('Ошибка при загрузке данных пользователя:', error);
    throw error;
  }
};

export async function loadTaskLog(date, periodType) {
  const objLocation = localStorage.getItem("objLocation");

  if (!objLocation) {
    throw new Error("objLocation не найден в localStorage");
  }

  const params = {
    date,
    periodType,
    objLocation: parseInt(objLocation),
    notResource: 1
  };

  console.log('Вызов метода data/loadTaskLog', params);

  const response = await axios.post(
    API_REPAIR_URL,
    {
      method: "data/loadTaskLog",
      params: [params]
    },
    {
      withCredentials: true
    }
  );

  const result = response.data.result;
  return result?.store?.records || result || [];
}

export async function loadObjTaskLog(taskLogId) {
  if (!taskLogId) {
    console.warn("loadObjTaskLog вызван без ID записи.");
    return null;
  }

  try {
    console.log('Вызов метода data/loadObjTaskLog с ID:', taskLogId);
    const response = await axios.post(
      API_REPAIR_URL,
      {
        method: "data/loadObjTaskLog",
        params: [taskLogId],
      },
      {
        withCredentials: true,
      }
    );
    return response.data.result;
  } catch (error) {
    console.error(`Ошибка при вызове loadObjTaskLog для ID ${taskLogId}:`, error);
    throw error;
  }
}

export async function saveResourceFact(materialData) {
  if (!materialData || !materialData.id) {
    throw new Error("Для сохранения факта по материалу необходимо передать данные с ID.");
  }

  try {
    // Получаем данные пользователя
    const user = await fetchUserData();
    
    // Получаем текущую дату в формате YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const payload = {
      id: materialData.id,                    
      idValue: materialData.idValue,         
      Value: Number(materialData.Value),     
      idUser: materialData.idUser,           
      objUser: user.id,                       
      pvUser: user.pv,                       
      idUpdatedAt: materialData.idUpdatedAt,  
      UpdatedAt: today,                       
    };

    console.log('Отправка data/saveResourceFact с данными:', payload);
    
    const response = await axios.post(
      API_REPAIR_URL,
      {
        method: "data/saveResourceFact",
        params: [payload],
      },
      {
        withCredentials: true,
      }
    );
    
    console.log('Ответ от data/saveResourceFact:', response.data);
    return response.data.result;
  } catch (error) {
    console.error(`Ошибка при вызове saveResourceFact для ID ${materialData.id}:`, error);
    console.error('Детали ошибки:', error.response?.data);
    throw error;
  }
}

export async function saveServiceFact(serviceData) {
  if (!serviceData || !serviceData.id) {
    throw new Error("Для сохранения факта по услуге необходимо передать данные с ID.");
  }

  try {
    // Получаем данные пользователя
    const user = await fetchUserData();
    
    // Получаем текущую дату в формате YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const payload = {
      id: serviceData.id,                    
      idValue: serviceData.idValue,         
      Value: Number(serviceData.Value),     
      idUser: serviceData.idUser,           
      objUser: user.id,                       
      pvUser: user.pv,                       
      idUpdatedAt: serviceData.idUpdatedAt,  
      UpdatedAt: today,                       
    };

    console.log('Отправка data/saveResourceFact (услуга) с данными:', payload);
    
    const response = await axios.post(
      API_REPAIR_URL,
      {
        method: "data/saveResourceFact",
        params: [payload],
      },
      {
        withCredentials: true,
      }
    );
    
    console.log('Ответ от data/saveResourceFact (услуга):', response.data);
    return response.data.result;
  } catch (error) {
    console.error(`Ошибка при вызове saveServiceFact для ID ${serviceData.id}:`, error);
    console.error('Детали ошибки:', error.response?.data);
    throw error;
  }
}

/**
 * Сохранение фактических данных по задаче
 * @param {Object} payload - Данные для сохранения
 * @returns {Promise} - Результат сохранения
 */
export async function saveTaskLogFact(payload) {
  if (!payload || !payload.id) {
    throw new Error("Payload должен содержать ID записи.");
  }

  try {
    console.log('Вызов метода data/saveTaskLogFact с данными:', payload);
    const response = await axios.post(
      API_REPAIR_URL,
      {
        method: "data/saveTaskLogFact",
        params: [payload],
      },
      {
        withCredentials: true,
      }
    );
    return response.data.result;
  } catch (error) {
    console.error(`Ошибка при вызове saveTaskLogFact для ID ${payload.id}:`, error);
    throw error;
  }
}