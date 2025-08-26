import axios from 'axios';

const API_URL = import.meta.env.VITE_OBJECT_URL;

export const loadTypes = async () => {
  try {
    const response = await axios.post(API_URL, {
      method: 'data/loadObjList',
      params: ['Typ_ObjectTyp', 'Prop_ObjectType', 'nsidata'],
    });
    return response.data?.result?.records.map(option => ({
      label: option.name,
      value: option.id,
      cls: option.cls, 
      pv: option.pv      
    })) || [];
  } catch (error) {
    console.error('Ошибка загрузки видов объектов:', error);
    throw error;
  }
};

export const loadSides = async () => {
  try {
    const response = await axios.post(API_URL, {
      method: 'data/loadFactorValForSelect',
      params: ['Prop_Side'],
    });
    return response.data?.result?.records || [];
  } catch (error) {
    console.error('Ошибка загрузки сторон:', error);
    throw error;
  }
};

export const fetchStationOfCoord = async (params) => {
  try {
    console.log('Отправляемые данные:', params);
    const response = await axios.post(API_URL, {
      method: 'data/findStationOfCoord',
      params: [params],
    });
    console.log('Ответ от сервера:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при запросе координат:', error);
    throw error;
  }
};
