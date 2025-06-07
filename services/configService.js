// services/configService.js
import dotenv from "dotenv";
dotenv.config();

const config = {
  NOTION_API_KEY: process.env.NOTION_API_KEY,
  GROK_API_KEY: process.env.GROK_API_KEY,
  VERCEL_AUTOMATION_BYPASS_SECRET: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
  IS_LOCAL: process.env.VERCEL !== "1",
  IS_VERCEL: process.env.VERCEL === "1",
  NODE_ENV: process.env.NODE_ENV || "development"
};

export default config;
