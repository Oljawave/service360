const API_URL = import.meta.env.VITE_LOCATION_URL;

export const loadDepartments = async () => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: "data/loadDepartmentForSelect",
        params: []
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.result?.records || [];
  } catch (error) {
    console.error('Ошибка при загрузке списка хозяйств:', error);
    throw error;
  }
};