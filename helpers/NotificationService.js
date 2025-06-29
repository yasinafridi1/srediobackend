import webpush from "web-push";
import { envVariables, notificationMessages } from "../config/constants.js";
import SubscriptionModel from "../models/SubscriptionModel.js";
const { vapidPrivatekey, vapidPublickey } = envVariables;

webpush.setVapidDetails(
  "mailto:yaseenafridi10875@gmail.com",
  vapidPublickey,
  vapidPrivatekey
);

async function sendAirTableDataSyncSuccess(userId) {
  const subscriptionData = await SubscriptionModel.findOne({ userId });
  await webpush.sendNotification(
    subscriptionData.subscription,
    JSON.stringify(notificationMessages.syncDataSuccess)
  );
}

export async function sendAirTableDataSyncFailure(userId) {
  const subscriptionData = await SubscriptionModel.findOne({ userId });
  await webpush.sendNotification(
    subscriptionData.subscription,
    JSON.stringify(notificationMessages.syncDataFailure)
  );
}

export async function sendScrapingSuccess(userId) {
  const subscriptionData = await SubscriptionModel.findOne({ userId });
  await webpush.sendNotification(
    subscriptionData.subscription,
    JSON.stringify(notificationMessages.scrapDataSuccess)
  );
}

export async function sendScrapingFailure(userId) {
  const subscriptionData = await SubscriptionModel.findOne({ userId });
  await webpush.sendNotification(
    subscriptionData.subscription,
    JSON.stringify(notificationMessages.scrapFailure)
  );
}

export default sendAirTableDataSyncSuccess;
