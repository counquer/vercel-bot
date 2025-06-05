import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, "../.env") });

export function validarEntorno() {
  const requeridas = [
    "NOTION_KEY",
    "DB_SELEN",
    "DB_MEMORIA_CURADA",
    "NODE_ENV"
  ];

  requeridas.forEach((variable) => {
    if (!process.env[variable]) {
      console.error(`Falta la variable de entorno: ${variable}`);
      process.exit(1);
    }
  });

  return process.env;
}
