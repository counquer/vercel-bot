import dotenv from "dotenv";
dotenv.config(); // ✅ Esto debe ir antes que todo lo que use process.env

import express from "express";
import validateEnvVars from "./config/envValidator.js";
import selenHandler from "./api/selen.js";
import logger from "./utils/logger.js";

// Validar que todas las vars necesarias estén disponibles
validateEnvVars();

const app = express();
app.use(express.json());

// Ruta POST principal
app.post("/api/selen", selenHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info("local", `Servidor local iniciado en http://localhost:${PORT}`);
});

// Manejo de errores globales
process.on("uncaughtException", (err) => {
  logger.error("global", "🔴 Excepción no capturada:", err);
});

process.on("unhandledRejection", (reason) => {
  logger.error("global", "🔴 Rechazo de promesa no manejado:", reason);
});
