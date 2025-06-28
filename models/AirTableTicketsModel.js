import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  baseDocId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AirtableBases",
    default: null,
  },
  tableDocId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AirTables",
    default: null,
  },
  tableId: String,
  baseId: String,
  rawData: { type: mongoose.Schema.Types.Mixed },
  recordId: String,
  scrapingStatus: {
    type: String,
    enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"],
    default: "PENDING",
  },
});

const AirTablesTicketModel = mongoose.model("AirtablesTickets", ticketSchema);

export default AirTablesTicketModel;
