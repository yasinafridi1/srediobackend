import mongoose from "mongoose";

const AirtableSchema = new mongoose.Schema(
  {
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
    dataScrap: {
      type: String,
      enum: ["NOT_STARTED", "PENDING", "COMPLETED", "REJECTED"],
      default: "NOT_STARTED",
    },
  },
  { timestamps: true }
);

const AirTableModel = mongoose.model("AirtableIntegration", AirtableSchema);

export default AirTableModel;
