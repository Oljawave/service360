import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_INSPECTIONS_URL;

const loadSections = async () => {
  try {
    const objLocation = localStorage.getItem("objLocation");

    if (!objLocation) {
      throw new Error("objLocation не найден в localStorage");
    }

    console.log("Запрос на загрузку участков с objLocation:", objLocation);

    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/loadObjLocationSectionForSelect",
        params: [parseInt(objLocation)],
      },
      {
        withCredentials: true,
      }
    );

    console.log("Ответ на загрузку участков:", response.data);
    return response.data.result?.records || [];
  } catch (error) {
    console.error("Ошибка при загрузке участков:", error);
    throw error;
  }
};

const loadWorkPlanDates = async (selectedSectionId, pv) => {
  try {
    console.log("Запрос на загрузку дат с selectedSectionId:", selectedSectionId, "и pv:", pv);

    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/loadDateWorkPlanInspection",
        params: [
          {
            id: selectedSectionId,
            pv: pv,
          }
        ]
      },
      {
        withCredentials: true
      }
    );

    console.log("Ответ на загрузку дат для плана:", response.data);
    return response.data.result || [];
  } catch (error) {
    console.error("Ошибка при загрузке дат для плана работ:", error);
    throw error;
  }
};

const loadWorkPlanUnfinishedByDate = async (sectionId, pv, date) => {
  try {
    console.log("Запрос на загрузку незавершённых работ:", { sectionId, pv, date });

    const response = await axios.post(
      API_BASE_URL,
      {
        method: "data/loadObjClsWorkPlanInspectionUnfinishedByDate",
        params: [
          {
            id: sectionId,
            pv: pv,
            date: date,
          }
        ]
      },
      {
        withCredentials: true
      }
    );

    console.log("Ответ на загрузку работ:", response.data);
    return response.data.result?.records || [];
  } catch (error) {
    console.error("Ошибка при загрузке незавершённых работ:", error);
    throw error;
  }
};

export { loadSections, loadWorkPlanDates, loadWorkPlanUnfinishedByDate };