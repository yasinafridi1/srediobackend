import AirTableBasesModel from "../models/AirTableBasesModel.js";
import AirTablesTicketModel from "../models/AirTableTicketsModel.js";
import AirTableModel from "../models/AirTableTokens.js";
import AirTablesModel from "../models/AirTablesModel.js";
import AirTableDataService from "./AirTableDataService.js";
import AxiosInstance from "./AxiosInstance.js";
import sendAirTableDataSyncSuccess, {
  sendAirTableDataSyncFailure,
} from "./NotificationService.js";
import {
  structureBases,
  structureTables,
  structureTickets,
} from "./StructureAirTableData.js";
const allRecords = [];

const processTables = async (base, dataService) => {
  const { baseId, _id, userId } = base;
  const tables = await dataService.getTables(baseId);
  const data = structureTables(tables, _id, userId, baseId);
  const tableDocs = await AirTablesModel.insertMany(data);
  for (let table of tableDocs) {
    const records = await dataService.getAllRecords(baseId, table.rawData.id);
    const formattedData = structureTickets(
      records,
      _id,
      baseId,
      table._id,
      table.rawData.id,
      userId
    );
    allRecords.push(...formattedData);
  }
};

const syncAirTableData = async (data) => {
  try {
    const { accessToken, refreshToken, _id, userId } = data;
    const apiClient = new AxiosInstance(accessToken, refreshToken, _id);
    const airTableDataService = new AirTableDataService(apiClient);

    const result = await airTableDataService.getBases();
    if (result?.bases?.length) {
      const bases = result.bases;
      const formattedBases = structureBases(bases, userId);
      const basesDocs = await AirTableBasesModel.insertMany(formattedBases);

      for (let base of basesDocs) {
        await processTables(base, airTableDataService);
      }
      await AirTablesTicketModel.insertMany(allRecords);
      await AirTableModel.updateOne({ _id }, { dataSync: "COMPLETED" });
      await sendAirTableDataSyncSuccess(userId);
    }
  } catch (error) {
    await sendAirTableDataSyncFailure(userId);
    throw error;
  }
};

export default syncAirTableData;
