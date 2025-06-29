import AirTableModel from "../models/AirTableTokens.js";
import AirTablesModel from "../models/AirTablesModel.js";
import loadGridView from "./gridView.js";

const scrapper = async (userId, browser, page) => {
  try {
    const tables = await AirTablesModel.find({ userId });

    if (!tables.length) {
      await browser.close();
      await AirTableModel.updateOne({ userId }, { dataScrap: "COMPLETED" });
      return;
    }

    for (const table of tables) {
      if (!table?.baseId || !table?.rawData) continue;
      const { baseId, rawData } = table;
      const { id: tableId, views } = rawData;
      for (const view of views) {
        const url = `https://airtable.com/${baseId}/${tableId}/${view.id}?blocks=hide`;
        await loadGridView(page, url, userId);
      }

      await browser.close();
      await AirTableModel.updateOne({ userId }, { dataScrap: "COMPLETED" });
    }
  } catch (error) {
    console.log("Something went wrong while scrapping revision history", error);
  }
};

export default scrapper;
