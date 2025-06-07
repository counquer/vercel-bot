const isDev = process.env.NODE_ENV !== "production";

function format(label, msg) {
  return `[${new Date().toISOString()}] [${label.toUpperCase()}] ${msg}`;
}

const logger = {
  info: (label, ...msgs) => {
    if (isDev) console.log(format(label, msgs.join(" ")));
  },
  error: (label, ...msgs) => {
    console.error(format(label, msgs.join(" ")));
  },
  warn: (label, ...msgs) => {
    console.warn(format(label, msgs.join(" ")));
  },
};

export default logger;
