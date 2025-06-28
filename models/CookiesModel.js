import mongoose from "mongoose";

const cookiesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  cookiesString: String,
});

const CookiesModel = mongoose.model("cookies", cookiesSchema);

export default CookiesModel;
