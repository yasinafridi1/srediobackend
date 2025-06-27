import mongoose from "mongoose";

const AirtableSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  accessToken: String,
  refreshToken: String,
  dataSync: {
    type: String,
    enum: ["PENDING", "COMPLETED", "REJECTED"],
    default: "PENDING",
  },
});

const AirTableModel = mongoose.model("AirtableIntegration", AirtableSchema);

export default AirTableModel;
