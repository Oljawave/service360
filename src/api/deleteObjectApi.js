import axios from 'axios';

const deleteObject = async (objectId) => {
  try {
    const response = await axios.post('http://192.168.1.20:9178/api/', {
      method: 'data/deleteObjWithProperties',
      params: [objectId],
    });

    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении объекта:', error);
    throw error;
  }
};

export { deleteObject };
