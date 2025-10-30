import axios from "axios";

const API_REPAIR_URL = import.meta.env.VITE_REPAIR_URL;

export async function loadTaskLogFact(date, periodType) {
  const objLocation = localStorage.getItem("objLocation");

  if (!objLocation) {
    throw new Error("objLocation не найден в localStorage");
  }

  console.log('Вызов метода data/loadTaskLogFact', {
    date,
    periodType,
    objLocation: parseInt(objLocation)
  });

  const response = await axios.post(
    API_REPAIR_URL,
    {
      method: "data/loadTaskLogFact",
      params: [{ date, periodType, objLocation: parseInt(objLocation) }]
    },
    {
      withCredentials: true
    }
  );

  return response.data.result || [];
}