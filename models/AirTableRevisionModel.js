import mongoose from "mongoose";

const revisionSchema = new mongoose.Schema({
  uuid: String,
  issueId: String,
  column: String,
  columnType: String,
  oldValue: String,
  newValue: String,
  createdDate: Date,
  authoredBy: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});

const AirTableRevisionModel = mongoose.model(
  "AirTableRevision",
  revisionSchema
);

export default AirTableRevisionModel;
