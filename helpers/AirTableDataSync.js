import AirTableBasesModel from "../models/AirTableBasesModel.js";
import AirTablesTicketModel from "../models/AirTableTicketsModel.js";
import AirTablesModel from "../models/AirTablesModel.js";
import AirTableDataService from "./AirTableDataService.js";
import AxiosInstance from "./AxiosInstance.js";
import {
  structureBases,
  structureTables,
  structureTickets,
} from "./StructureAirTableData.js";
const allRecords = [];

const processTables = async (base, dataService) => {
  const { baseId, _id, userId } = base;
  const tables = await dataService.getTables(baseId);
  const data = structureTables(tables, _id, userId);
  const tableDocs = await AirTablesModel.insertMany(data);
  for (let table of tableDocs) {
    const records = await dataService.getAllRecords(baseId, table.rawData.id);
    const formattedData = structureTickets(records, _id, table._id, userId);
    allRecords.push(...formattedData);
  }
};

const syncAirTableData = async (data) => {
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
    // const users = await airTableDataService.getUsers();
  }
};

export default syncAirTableData;
