import axios from "axios";

const API_REPAIR_URL = import.meta.env.VITE_REPAIR_URL;

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

  // В ответе от data/loadTaskLog данные могут быть в result.store.records
  const result = response.data.result;
  return result?.store?.records || result || [];
}