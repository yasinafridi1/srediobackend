import mongoose from "mongoose";

const tablesSchema = new mongoose.Schema({
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
  rawData: { type: mongoose.Schema.Types.Mixed },
});

const AirTablesModel = mongoose.model("AirTables", tablesSchema);

export default AirTablesModel;
