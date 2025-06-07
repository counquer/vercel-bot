// api/health.js
import { isVercel } from "../config/envValidator.js";
import { Client as NotionClient } from "@notionhq/client";
import cacheService from "../cache/cacheService.js";
import logger from "../utils/logger.js";
import { guardarMemoriaCurada } from "../notion/notionService.js";

export default async function handler(req, res) {
  const notion = new NotionClient({ auth: process.env.NOTION_API_KEY });

  const notionStatus = await notion.users.list({ page_size: 1 }).then(() => "connected").catch(() => "error");
  const cacheStatus = typeof cacheService?.check === "function" ? "working" : "error";

  res.status(200).json({
    status: "ok",
    vercel: isVercel,
    notion: notionStatus,
    cache: cacheStatus,
    timestamp: new Date().toISOString()
  });
}
