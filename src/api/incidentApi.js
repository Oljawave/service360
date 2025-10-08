import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_INCIDENTS_URL;

async function fetchUserData() {
  return { id: 1003, pv: 1087 }; 
}

function getAstanaISOString() {
  const now = new Date();
  
  const ASTANA_OFFSET_MINUTES = 300; 
  
  const totalOffsetMinutes = now.getTimezoneOffset() + ASTANA_OFFSET_MINUTES;
  const correctedTime = now.getTime() - totalOffsetMinutes * 60000;
  
  const dateInAstana = new Date(correctedTime);
  
  const year = dateInAstana.getFullYear();
  const month = String(dateInAstana.getMonth() + 1).padStart(2, '0');
  const day = String(dateInAstana.getDate()).padStart(2, '0');
  const hours = String(dateInAstana.getHours()).padStart(2, '0');
  const minutes = String(dateInAstana.getMinutes()).padStart(2, '0');
  const seconds = String(dateInAstana.getSeconds()).padStart(2, '0');
  const milliseconds = '000';
  
  const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+05:00`;
  
  return isoString;
}

export async function loadIncidents(date = "2025-07-30", periodType = 11) {
  const objLocation = localStorage.getItem("objLocation");

  if (!objLocation) {
    throw new Error("objLocation не найден в localStorage");
  }

  console.log('Вызов метода data/loadIncident', {
    date,
    periodType,
    objLocation: parseInt(objLocation)
  });

  const response = await axios.post(
    API_BASE_URL, 
    {
      method: "data/loadIncident",
      params: [
        {
          date,
          periodType,
          objLocation: parseInt(objLocation),
        }
      ]
    },
    {
      withCredentials: true
    }
  );

  return response.data.result?.records || [];
}

export async function loadEvents() {
  try {
    console.log('Вызов метода data/loadEvent');

    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/loadEvent",
        params: [0]
      },
      {
        withCredentials: true
      }
    );

    const records = response.data.result?.records || [];
    return records.map(record => ({
      ...record,
      label: record.name,
      value: record.id,
    }));
  } catch (error) {
    console.error("Ошибка при загрузке событий/запросов:", error);
    throw error;
  }
}

export async function saveIncident(payloadData) {
  try {
    const user = await fetchUserData();
    
    const registrationDateTime = getAstanaISOString();
    const datePart = registrationDateTime.slice(0, 10);
    
    const payload = {
      method: "data/saveIncident",
      params: ["ins", {
        name: payloadData.eventName,
        codCls: "Cls_IncidentContactCenter",
        pvEvent: payloadData.eventPv,
        objEvent: payloadData.eventId,
        pvObject: payloadData.objectPv,
        objObject: payloadData.objectId,
        pvUser: user.pv,
        objUser: user.id,
        fvCriticality: payloadData.criticalityFv,
        pvCriticality: payloadData.criticalityPv,
        objLocationClsSection: payloadData.objLocationClsSection,
        pvLocationClsSection: payloadData.pvLocationClsSection,
        InfoApplicant: payloadData.InfoApplicant,
        StartKm: payloadData.StartKm,
        FinishKm: payloadData.FinishKm,
        StartPicket: payloadData.StartPicket,
        FinishPicket: payloadData.FinishPicket,
        StartLink: payloadData.StartLink || 0.0,
        FinishLink: payloadData.FinishLink || 0.0,
        Description: payloadData.Description,
        CreatedAt: datePart,
        UpdatedAt: datePart,
        RegistrationDateTime: registrationDateTime,
      }]
    };
    
    console.log('Отправляемый payload для saveIncident:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      API_BASE_URL,
      payload,
      {
        withCredentials: true
      }
    );

    if (response.data && response.data.error) {
        throw new Error(response.data.error);
    }
    
    return response.data.result;
  } catch (error) {
    console.error("Ошибка при сохранении инцидента:", error);
    throw new Error(error.response?.data?.error || error.message || 'Не удалось сохранить инцидент');
  }
}

export async function deleteIncident(id) {
  if (!id) {
    throw new Error("ID инцидента для удаления не предоставлен.");
  }

  try {
    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/deleteObjWithProperties",
        params: [id]
      },
      {
        withCredentials: true
      }
    );

    return response.data;
  } catch (error) {
    console.error("Ошибка при удалении инцидента:", error);
    throw new Error(error.response?.data?.error || error.message || 'Не удалось удалить инцидент');
  }
}