const fs = require("node:fs");
const path = require("node:path");

const source = path.join(__dirname, "..", "..", "frontend", "dist");
const target = path.join(__dirname, "..", "app");

if (!fs.existsSync(path.join(source, "index.html"))) {
  console.error("No existe frontend/dist. Ejecuta primero: npm run build:demo (en frontend)");
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
console.log("Interfaz copiada a desktop/app");
