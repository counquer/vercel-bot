//import express from "express"
import express from "express";
import dotenv from "dotenv";
import validateEnvVars from "./config/envValidator.js";
import selenHandler from "./api/selen.js";
import logger from "./utils/logger.js";

// Cargar variables de entorno desde .env
dotenv.config();

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
