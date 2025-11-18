import axios from 'axios'
import { getUserData } from '../common/userCache'
import { formatDateForBackend } from '../common/formatters'

const API_BASE_URL = import.meta.env.VITE_INCIDENTS_URL;
const PLAN_URL = import.meta.env.VITE_PLAN_URL;
const OBJECT_URL = import.meta.env.VITE_OBJECT_URL;

// ============================================
// Утилиты для работы с датой/временем
// ============================================

/**
 * Получить ISO строку для часового пояса Астаны (UTC+5)
 * @returns {string} ISO строка с timezone offset +05:00
 */
function getAstanaISOString() {
  const now = new Date();

  const ASTANA_OFFSET_MINUTES = 300; // UTC+5 = 300 минут

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

// ============================================
// LOAD методы (загрузка данных)
// ============================================

/**
 * Загрузить список инцидентов
 * @param {string} date - Дата в формате YYYY-MM-DD
 * @param {number} periodType - Тип периода
 * @returns {Promise<Array>} Список инцидентов
 */
export async function loadIncidents(date = "2025-07-30", periodType = 11) {
  console.log('Вызов метода data/loadIncident', {
    date,
    periodType,
  });

  const response = await axios.post(
    API_BASE_URL,
    {
      method: "data/loadIncident",
      params: [
        {
          date,
          periodType,
        }
      ]
    },
    {
      withCredentials: true
    }
  );

  return response.data.result?.records || [];
}

/**
 * Загрузить список событий/запросов
 * @returns {Promise<Array>} Список событий с полями label и value
 */
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

/**
 * Загрузить уровни критичности
 * @returns {Promise<Array>} Список уровней критичности
 */
export async function loadCriticalityLevels() {
  try {
    console.log('Вызов метода data/loadFactorValForSelect для Prop_Criticality');

    const response = await axios.post(
      OBJECT_URL,
      {
        method: "data/loadFactorValForSelect",
        params: ["Prop_Criticality"]
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
    console.error("Ошибка при загрузке уровней критичности:", error);
    throw error;
  }
}

/**
 * Загрузить работы для объекта инцидента
 * @param {number} objObject - ID объекта
 * @returns {Promise<Array>} Список работ
 */
export async function loadWorksForIncidentObject(objObject) {
  if (!objObject) {
    console.warn("loadWorksForIncidentObject вызван без objObject");
    return [];
  }
  try {
    console.log('Вызов метода data/loadWorkOnObjectServedForSelect для objObject:', objObject);

    const response = await axios.post(
      PLAN_URL,
      {
        method: "data/loadWorkOnObjectServedForSelect",
        params: [objObject]
      },
      {
        withCredentials: true
      }
    );

    const records = response.data.result?.records || [];
    return records.map(record => ({
      ...record,
      label: record.fullname,
      value: record.id,
    }));
  } catch (error) {
    console.error("Ошибка при загрузке работ для объекта инцидента:", error);
    throw error;
  }
}

// ============================================
// SAVE методы (сохранение)
// ============================================

/**
 * Сохранить новое событие
 * @param {string} eventName - Название события
 * @returns {Promise<Object>} Созданное событие с id, name, label, value
 */
export async function saveNewEvent(eventName) {
  try {
    const payload = {
      method: "data/saveEvent",
      params: ["ins", { "name": eventName }]
    };

    console.log('Отправляемый payload для saveNewEvent:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      API_BASE_URL,
      payload,
      {
        withCredentials: true
      }
    );

    if (response.data && response.data.error) {
      const error = response.data.error;
      throw new Error(error.message || JSON.stringify(error));
    }

    const newRecordId = response.data.result?.records?.[0]?.id;
    if (!newRecordId) {
      throw new Error('Сервер не вернул ID для нового события.');
    }
    return { id: newRecordId, name: eventName, label: eventName, value: newRecordId };
  } catch (error) {
    console.error("Ошибка при сохранении нового события:", error);
    throw error;
  }
}

/**
 * Сохранить новый инцидент
 * @param {Object} payloadData - Данные инцидента
 * @returns {Promise<Object>} Результат сохранения
 */
export async function saveIncident(payloadData) {
  try {
    const user = await getUserData();

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
        objLocationClsSection: payloadData.objLocationClsSection,
        pvLocationClsSection: payloadData.pvLocationClsSection,
        InfoApplicant: payloadData.InfoApplicant,
        StartKm: payloadData.StartKm,
        FinishKm: payloadData.FinishKm,
        StartPicket: payloadData.StartPicket,
        FinishPicket: payloadData.FinishPicket,
        StartLink: payloadData.StartLink,
        FinishLink: payloadData.FinishLink,
        Description: payloadData.Description,
        CreatedAt: datePart,
        UpdatedAt: datePart,
        RegistrationDateTime: registrationDateTime,
      }]
    };

    // Добавляем критичность, если она есть
    if (payloadData.criticalityFv !== undefined && payloadData.criticalityPv !== undefined) {
      payload.params[1].fvCriticality = payloadData.criticalityFv;
      payload.params[1].pvCriticality = payloadData.criticalityPv;
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

// ============================================
// UPDATE методы (обновление)
// ============================================

/**
 * Обновить существующий инцидент
 * @param {Object} payloadData - Данные для обновления
 * @returns {Promise<Object>} Результат обновления
 */
export async function updateIncident(payloadData) {
  try {
    const user = await getUserData();

    const registrationDateTime = getAstanaISOString();
    const datePart = registrationDateTime.slice(0, 10);

    const payload = {
      method: "data/saveIncident",
      params: ["upd", {
        id: payloadData.id,

        // Обновление полей
        idInfoApplicant: payloadData.idInfoApplicant,
        InfoApplicant: payloadData.InfoApplicant,
        idDescription: payloadData.idDescription,
        Description: payloadData.Description,
        idUpdatedAt: payloadData.idUpdatedAt,
        UpdatedAt: datePart,
        // Обновление критичности
        idCriticality: payloadData.idCriticality,
        pvCriticality: payloadData.criticalityPv,
        fvCriticality: payloadData.criticalityFv,
      }]
    };

    console.log('Отправляемый payload для updateIncident:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      API_BASE_URL,
      payload,
      { withCredentials: true }
    );

    if (response.data && response.data.error) {
        throw new Error(response.data.error.message || JSON.stringify(response.data.error));
    }

    return response.data.result;
  } catch (error) {
    console.error("Ошибка при обновлении инцидента:", error);
    throw new Error(error.response?.data?.error?.message || error.message || 'Не удалось обновить инцидент');
  }
}

// ============================================
// DELETE методы (удаление)
// ============================================

/**
 * Удалить инцидент
 * @param {number} id - ID инцидента
 * @returns {Promise<Object>} Результат удаления
 */
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

// ============================================
// ASSIGN методы (назначение работ)
// ============================================

/**
 * Назначить работу на инцидент
 * @param {Object} incident - Объект инцидента
 * @param {Object} work - Объект работы
 * @param {Date} completionDate - Дата завершения
 * @param {Object} selectedCriticality - Выбранная критичность
 * @param {Object} selectedSection - Выбранная секция
 * @param {string} assignDateTime - Дата/время назначения
 * @returns {Promise<Object>} Результат назначения
 */
export async function assignWorkToIncident(incident, work, completionDate, selectedCriticality, selectedSection, assignDateTime) {
  if (!incident || !work || !completionDate || !selectedCriticality || !selectedSection || !assignDateTime) {
    throw new Error("Недостаточно данных для назначения работы.");
  }

  try {
    const user = await getUserData();
    const today = formatDateForBackend(new Date());
    const planDateEnd = formatDateForBackend(completionDate);

    const payload = {
      method: "data/assignPlan",
      params: [
        {
          id: incident.id,
          cls: incident.cls,
          pvLocationClsSection: selectedSection.pv,
          objLocationClsSection: selectedSection.value,
          pvObject: incident.pvObject,
          objObject: incident.objObject,
          pvUser: user.pv,
          objUser: user.id,
          StartKm: incident.StartKm,
          FinishKm: incident.FinishKm,
          StartPicket: incident.StartPicket,
          FinishPicket: incident.FinishPicket,
          idStatus: incident.idStatus,
          name: `${incident.id}-${planDateEnd}`,
          PlanDateEnd: planDateEnd,
          CreatedAt: today,
          AssignDateTime: assignDateTime,
          UpdatedAt: today,
          objWork: work.value,
          pvWork: work.pv,
          linkCls: work.cls,
          fvCriticality: selectedCriticality.value,
          pvCriticality: selectedCriticality.pv,
        },
      ],
    };

    console.log('Отправка данных для назначения работы:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      PLAN_URL,
      payload,
      {
        withCredentials: true,
      }
    );

    if (response.data && response.data.error) {
      const errorMessage = typeof response.data.error === 'object' && response.data.error !== null
                           ? response.data.error.message || JSON.stringify(response.data.error)
                           : response.data.error;
      throw new Error(errorMessage || 'Ошибка от сервера при назначении работы');
    }

    return response.data.result;
  } catch (error) {
    console.error("Ошибка при назначении работы инциденту:", error);
    throw new Error(error.response?.data?.error?.message || error.message || 'Не удалось назначить работу');
  }
}
