import mongoose from "mongoose";

const basesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  baseId: {
    type: String,
    required: true,
  },
  name: String,
  permissionLevel: String,
});

const AirTableBasesModel = mongoose.model("AirtableBases", basesSchema);

export default AirTableBasesModel;
