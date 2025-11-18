import axios from 'axios'
import { formatDate } from '../common/formatters'

const API_RESOURCE_URL = import.meta.env.VITE_RESOURCE_URL;

export async function loadTools({ page = 1, limit = 10 }) {
  const response = await axios.post(API_RESOURCE_URL, {
    method: 'data/loadTool',
    params: [0]
  })

  const records = response.data.result?.records || []

  return {
    data: records.map((item, i) => ({
      rawData: item,
      id: item.id,
      cls: item.cls,
      number: item.Number || '',
      name: item.name || '',
      nameTypTool: item.nameTypTool || '',
      nameLocationClsSection: item.nameLocationClsSection || '',
      createdAt: formatDate(item.CreatedAt),
      updatedAt: formatDate(item.UpdatedAt),
      fullNameUser: item.fullNameUser || '',

      // ID полей для возможного редактирования
      idNumber: item.idNumber,
      idTypTool: item.idTypTool,
      fvTypTool: item.fvTypTool,
      pvTypTool: item.pvTypTool,
      idLocationClsSection: item.idLocationClsSection,
      pvLocationClsSection: item.pvLocationClsSection,
      objLocationClsSection: item.objLocationClsSection,
      idCreatedAt: item.idCreatedAt,
      idUpdatedAt: item.idUpdatedAt,
      idUser: item.idUser,
      pvUser: item.pvUser,
      objUser: item.objUser,

      _originalIndex: i + 1,
    })),
    total: records.length
  }
}

export async function loadEquipment({ page = 1, limit = 10 }) {
  const response = await axios.post(API_RESOURCE_URL, {
    method: 'data/loadEquipment',
    params: [0]
  })

  const records = response.data.result?.records || []

  return {
    data: records.map((item, i) => ({
      rawData: item,
      id: item.id,
      cls: item.cls,
      number: item.Number || '',
      name: item.name || '',
      nameTypEquipment: item.nameTypEquipment || '',
      nameLocationClsSection: item.nameLocationClsSection || '',
      createdAt: formatDate(item.CreatedAt),
      updatedAt: formatDate(item.UpdatedAt),
      fullNameUser: item.fullNameUser || '',

      // ID полей для возможного редактирования
      idNumber: item.idNumber,
      idTypEquipment: item.idTypEquipment,
      fvTypEquipment: item.fvTypEquipment,
      pvTypEquipment: item.pvTypEquipment,
      idLocationClsSection: item.idLocationClsSection,
      pvLocationClsSection: item.pvLocationClsSection,
      objLocationClsSection: item.objLocationClsSection,
      idCreatedAt: item.idCreatedAt,
      idUpdatedAt: item.idUpdatedAt,
      idUser: item.idUser,
      pvUser: item.pvUser,
      objUser: item.objUser,

      _originalIndex: i + 1,
    })),
    total: records.length
  }
}

// Здесь можно будет добавить методы для материалов и услуг
// export async function loadMaterials({ page = 1, limit = 10 }) { ... }
// export async function loadServices({ page = 1, limit = 10 }) { ... }
