import axios from "axios";

const API_REPAIR_URL = import.meta.env.VITE_REPAIR_URL;
const API_OBJECT_URL = import.meta.env.VITE_OBJECT_URL;

export async function loadPlanCorrectional(date = "2025-07-30", periodType = 11) {
  const objLocation = localStorage.getItem("objLocation");

  if (!objLocation) {
    throw new Error("objLocation не найден в localStorage");
  }

  console.log('Вызов метода data/loadPlanCorrectional', {
    date,
    periodType,
    objLocation: parseInt(objLocation)
  });

  const response = await axios.post(
    API_REPAIR_URL,
    {
      method: "data/loadTaskLog",
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

export async function loadDateWorkPlanCorrectional(selectedSectionId, pv) {
  try {
    const response = await axios.post(
      API_REPAIR_URL,
      {
        method: "data/loadDateWorkPlanCorrectional",
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

    return response.data.result || [];
  } catch (error) {
    throw error;
  }
};

export async function loadTasks() {
  try {
    const response = await axios.post(
      API_OBJECT_URL,
      {
        method: "data/loadObjList",
        params: ["Cls_Task", "Prop_Task", "nsidata"],
      },
      {
        withCredentials: true,
      }
    );

    const records = response.data.result?.records || [];
    return records.map((record) => ({
      label: record.fullName,
      value: record.id,
      cls: record.cls,
      pv: record.pv,
    }));
  } catch (error) {
    console.error("Ошибка при загрузке задач:", error);
    throw error;
  }
}

export async function loadTaskLogEntriesForWorkPlan(workPlanId, workPlanPv) {
  try {
    const response = await axios.post(
      API_REPAIR_URL,
      {
        method: "data/loadTaskLogEntriesForWorkPlan",
        params: [{ id: workPlanId, pv: workPlanPv }],
      },
      {
        withCredentials: true,
      }
    );
    return response.data.result?.records || [];
  } catch (error) {
    console.error("Ошибка при загрузке записей журнала работ:", error);
    throw error;
  }
}


export async function loadObjClsWorkPlanCorrectionalUnfinishedByDate(sectionId, pv, date) {
  try {
    const response = await axios.post(
      API_REPAIR_URL,
      {
        method: "data/loadObjClsWorkPlanCorrectionalUnfinishedByDate",
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

    return response.data.result?.records || [];
  } catch (error) {
    throw error;
  }
};

export async function saveTaskLog(payload) {
  try {
    const response = await axios.post(
      API_REPAIR_URL,
      {
        method: "data/saveTaskLog",
        params: ["ins", payload],
      },
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Ошибка при сохранении записи в журнал работ:", error);
    throw error;
  }
}

export async function loadTaskLog(workPlanId, workPlanPv) {
  try {
    const response = await axios.post(
      API_REPAIR_URL,
      {
        method: "data/loadTaskLogForWorkPlan",
        params: [{ id: workPlanId, pv: workPlanPv }],
      },
      {
        withCredentials: true,
      }
    );
    return response.data.result?.records || [];
  } catch (error) {
    console.error("Ошибка при загрузке журнала работ:", error);
    throw error;
  }
}