import AirTableModel from "../models/AirTableTokens.js";
import CookiesModel from "../models/CookiesModel.js";

const getCookies = async (page) => {
  const cookies = await page.cookies();
  const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  return cookieString;
};

const storeCookies = async (cookieString, userId) => {
  return await CookiesModel.updateOne(
    { userId },
    { $set: { cookiesString: cookieString } },
    { upsert: true }
  );
};

/**
 * Get cookies from page and convert it to string. Also it will update status of dataScrap
 * @param {Object} page - Puppeteer page
 * @param {String} userId - User id to store cookies in database
 * @returns {String} - Cookies String
 */

const getAndStoreCookies = async (page, userId) => {
  const cookiesString = await getCookies(page);
  await storeCookies(cookiesString, userId);
  await AirTableModel.updateOne({ userId }, { dataScrap: "PENDING" });
  return cookiesString;
};

export default getAndStoreCookies;
