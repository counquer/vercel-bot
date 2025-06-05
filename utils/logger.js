const fs = require("fs");
const path = require("path");

const ENV = process.env.NODE_ENV || "development";
const LOG_FILE = process.env.LOG_FILE || path.join(__dirname, "../logs/app.log");

const COLORS = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  green: "\x1b[32m",
};

function formatMsg(level, mod, ...msg) {
  const time = new Date().toISOString();
  return `[${time}] [${level}] [${mod}] ${msg.join(" ")}`;
}

function devLogger(level, mod, ...msg) {
  let prefix = "";
  switch (level) {
    case "INFO": prefix = COLORS.cyan; break;
    case "WARN": prefix = COLORS.yellow; break;
    case "ERROR": prefix = COLORS.red; break;
    case "DEBUG": prefix = COLORS.gray; break;
    default: prefix = COLORS.green;
  }
  console.log(prefix + formatMsg(level, mod, ...msg) + COLORS.reset);
}

function prodLogger(level, mod, ...msg) {
  if (level === "ERROR" || level === "WARN") {
    const line = formatMsg(level, mod, ...msg);
    if (process.env.LOG_TO_FILE === "1") {
      try {
        fs.appendFileSync(LOG_FILE, line + "\n");
      } catch (e) {
        console.error(line);
      }
    } else {
      console.log(line);
    }
  }
}

const logger = {
  info: (mod, ...msg) => {
    if (ENV === "development") devLogger("INFO", mod, ...msg);
    else if (ENV === "production") prodLogger("INFO", mod, ...msg);
  },
  warn: (mod, ...msg) => {
    if (ENV === "development") devLogger("WARN", mod, ...msg);
    else if (ENV === "production") prodLogger("WARN", mod, ...msg);
  },
  error: (mod, ...msg) => {
    if (ENV === "development") devLogger("ERROR", mod, ...msg);
    else if (ENV === "production") prodLogger("ERROR", mod, ...msg);
  },
  debug: (mod, ...msg) => {
    if (ENV === "development") devLogger("DEBUG", mod, ...msg);
  },
  _setLogger: (mockLogger) => {
    Object.assign(logger, mockLogger);
  }
};

module.exports = logger;