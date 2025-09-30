import axios from 'axios';

const API_URL = import.meta.env.VITE_OBJECT_URL;

export const saveObjectServed = async (formData, selectedType, stationData) => {
  try {
    const sideLabel = formData.sideLabel || (formData.side && typeof formData.side === 'object' ? formData.side.label : '') || '';
    const typeLabel = formData.typeLabel || (selectedType?.label || '');

    const sectionName = stationData?.name || '';

    const fullName =
      `${formData.name || ''} ${formData.additionalInfo || ''} [` +
      `${formData.coordStartKm}км ${formData.coordStartPk}пк - ` +
      `${formData.coordEndKm}км ${formData.coordEndPk}пк] ` +
      `${sideLabel ? `[${sideLabel}] ` : ''}[${typeLabel}] [${sectionName}]`;

    console.log("Form Data:", formData);

    const response = await axios.post(API_URL, {
      method: "data/saveObjectServed",
      params: ["ins", {
        name: formData.name,
        fullName: fullName.trim(),
        linkCls: selectedType.cls,
        objObjectType: selectedType.value,
        pvObjectType: selectedType.pv,
        StartKm: formData.coordStartKm,
        FinishKm: formData.coordEndKm,
        StartPicket: formData.coordStartPk,
        FinishPicket: formData.coordEndPk,
        fvSide: formData.fvSide || null, 
        pvSide: formData.pvSide || null, 
        Specs: formData.characteristic,
        LocationDetails: formData.additionalInfo,
        PeriodicityReplacement: formData.replacementPeriod,
        Number: formData.deviceNumber,
        InstallationDate: formData.installDate,
        CreatedAt: formData.createdAt,
        UpdatedAt: formData.createdAt,
        Description: formData.description,
        objSection: stationData.id,
        pvSection: stationData.pv,
        objUser: formData.objUser, 
        pvUser: formData.pvUser   
      }]
    });

    return response.data;
  } catch (error) {
    console.error('Ошибка при сохранении объекта:', error);
    throw error;
  }
};