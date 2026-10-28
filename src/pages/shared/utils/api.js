// export const API_URL = "https://sales-api.searchopal.com/";
// export const API_URL = "https://588ca4d885de.ngrok.app/";
// export const API_URL = "http://192.168.100.42:8001/";

let API_URL;
let MAIN_SYSTEM_BASE_URL;

if (process.env.NODE_ENV === "production") {
  API_URL = "https://site-great-transport-spotlight.trycloudflare.com/api";
  // API_URL = "https://sop-crm-api-8dd4162d27d6.herokuapp.com/api";
  MAIN_SYSTEM_BASE_URL = "https://searchopal-dev-11311db4105f.herokuapp.com/";

} else {
  API_URL = "https://site-great-transport-spotlight.trycloudflare.com/api";
  // API_URL = "https://crm-api.searchopal.ca/api";
  MAIN_SYSTEM_BASE_URL = "https://duplicate-api.searchopal.ca/";
}

API_URL = import.meta.env.VITE_API_URL || API_URL;
MAIN_SYSTEM_BASE_URL = import.meta.env.VITE_MAIN_SYSTEM_BASE_URL || MAIN_SYSTEM_BASE_URL;

export { API_URL, MAIN_SYSTEM_BASE_URL };
