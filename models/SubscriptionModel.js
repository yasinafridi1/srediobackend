import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  subscription: { type: Object, required: true },
});

const SubscriptionModel = mongoose.model(
  "NotificationSubscription",
  subscriptionSchema
);

export default SubscriptionModel;
