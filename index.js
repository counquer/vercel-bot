// index.js (o server.js si prefieres ese nombre como entry point)

import express from "express";
import dotenv from "dotenv";
import validateEnvVars, { isLocal, isVercel } from "./config/envValidator.js";
import selenHandler from "./api/selen.js";
import logger from "./utils/logger.js";

// Cargar variables de entorno desde .env
dotenv.config();

// Validar que todas las vars necesarias estén disponibles
validateEnvVars();

const app = express();
app.use(express.json());

// Ruta de prueba para verificar que Express y la API respondan
app.post("/api/selen", selenHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info("local", `Servidor local iniciado en http://localhost:${PORT}`);
});

// Manejo de errores globales para que no se caiga el proceso en test local
process.on("uncaughtException", (err) => {
  logger.error("global", "🔴 Excepción no capturada:", err);
});

process.on("unhandledRejection", (reason) => {
  logger.error("global", "🔴 Rechazo de promesa no manejado:", reason);
});
