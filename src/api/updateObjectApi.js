import axios from 'axios';


const API_URL = import.meta.env.VITE_OBJECT_URL;

export const updateObject = async (formData, selectedType, stationData) => {
  try {
    const sideLabel = formData.sideLabel || (formData.side && typeof formData.side === 'object' ? formData.side.label : '') || '';
    const typeLabel = formData.typeLabel || (selectedType?.label || '');
    const sectionName = stationData?.name || '';

    const fullName =
      `${formData.name || ''} ${formData.additionalInfo || ''} [` +
      `${formData.coordStartKm}км ${formData.coordStartPk}пк - ` +
      `${formData.coordEndKm}км ${formData.coordEndPk}пк] ` +
      `${sideLabel ? `[${sideLabel}] ` : ''}[${typeLabel}] [${sectionName}]`;

    const dataToUpdate = {
      ...formData, // Включаем все поля из formData, включая ID
      name: formData.name,
      fullName: fullName.trim(),
      linkCls: selectedType.cls,
      objObjectType: selectedType.value,
      pvObjectType: selectedType.pv,
      StartKm: formData.StartKm || formData.coordStartKm,
      FinishKm: formData.FinishKm || formData.coordEndKm,
      StartPicket: formData.StartPicket || formData.coordStartPk,
      FinishPicket: formData.FinishPicket || formData.coordEndPk,
      fvSide: formData.fvSide || null,
      pvSide: formData.pvSide || null,
      Specs: formData.Specs || formData.characteristic,
      LocationDetails: formData.LocationDetails || formData.additionalInfo,
      PeriodicityReplacement: formData.PeriodicityReplacement || formData.replacementPeriod,
      Number: formData.Number || formData.deviceNumber,
      InstallationDate: formData.InstallationDate || formData.installDate,
      UpdatedAt: new Date().toISOString(), // Устанавливаем текущую дату как дату обновления
      Description: formData.description,
      objSection: stationData.id,
      pvSection: stationData.pv,
      objUser: formData.objUser,
      pvUser: formData.pvUser,
    };

    console.log("Данные, отправляемые на сервер для обновления:", dataToUpdate);

    const response = await axios.post(API_URL, {
      method: 'data/saveObjectServed',
      params: ['upd', dataToUpdate]
    });

    console.log("Ответ от сервера:", response.data);

    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении объекта:', error);
    throw error;
  }
};
