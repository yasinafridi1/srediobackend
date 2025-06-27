import axios from "axios";
import { envVariables } from "../config/constants.js";
import AirTableModel from "../models/AirTableTokens.js";

const { airtableClientId, airtableClientSecret } = envVariables;
const BASE_URL = "https://api.airtable.com/v0";
const TOKEN_URL = "https://airtable.com/oauth2/v1/token";

class AxiosInstance {
  constructor(accessToken, refreshToken, airTableCollectionId) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.client = axios.create({ baseURL: BASE_URL });
    this._setAuthHeader();
    this._addResponseInterceptor();
    this.collectionId = airTableCollectionId;
  }

  _setAuthHeader() {
    this.client.defaults.headers.Authorization = `Bearer ${this.accessToken}`;
  }

  async _refreshAccessToken() {
    console.log("🔄 Refreshing Airtable Token...");
    const resp = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.refreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${airtableClientId}:${airtableClientSecret}`
          ).toString("base64")}`,
        },
      }
    );

    const { access_token, refresh_token } = resp.data;
    this.accessToken = access_token;
    this.refreshToken = refresh_token;

    await this._saveUserTokens(resp.data);
    this._setAuthHeader();
    return access_token;
  }

  async _saveUserTokens(data) {
    await AirTableModel.updateOne(
      { _id: this.collectionId },
      { accesstoken: data?.access_token, refreshToken: data?.refresh_token }
    );
  }

  _addResponseInterceptor() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          console.log("⚡️ Token expired, attempting refresh...");

          try {
            await this._refreshAccessToken();
            error.config.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.client(error.config);
          } catch (refreshError) {
            console.error("❌ Failed to refresh access token:", refreshError);
            throw refreshError;
          }
        }
        return Promise.reject(error);
      }
    );
  }
}

export default AxiosInstance;
