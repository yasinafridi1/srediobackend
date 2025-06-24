import webpush from "web-push";
import { envVariables, notificationMessages } from "../config/constants.js";
import SubscriptionModel from "../models/SubscriptionModel.js";
const { vapidPrivatekey, vapidPublickey } = envVariables;

webpush.setVapidDetails(
  "mailto:yaseenafridi10875@gmail.com",
  vapidPublickey,
  vapidPrivatekey
);

async function sendGithubSyncNotification(userId) {
  console.log("UsreId", userId);
  const subscriptionData = await SubscriptionModel.findOne({ userId });
  await webpush.sendNotification(
    subscriptionData.subscription,
    JSON.stringify(notificationMessages.syncDataSuccess)
  );
}

export default sendGithubSyncNotification;
