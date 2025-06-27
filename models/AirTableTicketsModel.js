import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  baseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AirtableBases",
    default: null,
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AirTables",
    default: null,
  },
  rawData: { type: mongoose.Schema.Types.Mixed },
});

const AirTablesTicketModel = mongoose.model("AirtablesTickets", ticketSchema);

export default AirTablesTicketModel;
