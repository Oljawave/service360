import axios from 'axios'

const API_URL = import.meta.env.VITE_OBJECT_URL;

/**
 * Универсальный метод для загрузки списка объектов
 * @param {string} className - Имя класса (например, "Typ_ObjectTyp")
 * @param {string} propName - Имя свойства (например, "Prop_ObjectType")
 * @param {string} sourceName - Имя источника данных (по умолчанию "nsidata")
 * @returns {Promise<Array>} Массив объектов с полями id, name, cls
 */
export async function loadObjList(className, propName, sourceName = "nsidata") {
  const response = await axios.post(API_URL, {
    method: 'data/loadObjList',
    params: [className, propName, sourceName]
  })

  const records = response.data.result?.records || []
  return records.map(item => ({
    id: item.id,
    name: item.name,
    cls: item.cls
  }))
}
