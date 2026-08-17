

const WEB_BASE_URL = process.env.WEB_BASE_URL || "http://localhost:3000";
const BASE_URL = process.env.REACT_APP_API_URL || "http://115.84.171.88:5000";

// Fetching config from process.env
const config = {
  server: {

    host: process.env.REACT_APP_API_HOST || "0.0.0.0",
    port: parseInt(process.env.REACT_APP_API_PORT || "5000"),

  },
  baseurl:
  {
     webbaseurl: process.env.REACT_APP_WEB_URL || "http://localhost:3000",
    //apibaseurl: process.env.REACT_APP_API_URL || "http://115.84.171.88:5000",
    // apibaseurl: process.env.REACT_APP_API_URL || "https://gracecabs.com",
    apibaseurl: process.env.REACT_APP_API_URL || "http://localhost:5000",

  }

};

export default config;
