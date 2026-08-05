var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
app.post("/api/gemini/generate-component", async (req, res) => {
  try {
    const { prompt, targetFolder } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Proporciona una descripci\xF3n v\xE1lida para el componente." });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no encontrada en la configuraci\xF3n del servidor." });
    }
    const ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const systemInstruction = `Eres un desarrollador web frontend senior especializado en PWA instalables (HTML5, CSS3 moderno, JavaScript ES6+).
El usuario te dar\xE1 una descripci\xF3n de un componente o m\xF3dulo web (ej: "un formulario de contacto con validaci\xF3n", "una calculadora de IMC", "un acorde\xF3n de preguntas frecuentes", "un conversor de moneda").
Debes generar los archivos necesarios para la soluci\xF3n funcional (HTML, CSS y JS, o archivos estructurados).
Aseg\xFArate de que los enlaces entre HTML, CSS y JS usen rutas relativas coherentes.
Si el usuario especific\xF3 una carpeta (ej: "components/contact"), las rutas de los archivos generados deben empezar con esa carpeta (ej: "components/contact/index.html", "components/contact/style.css", "components/contact/script.js").
El c\xF3digo debe ser totalmente limpio, responsivo, estilizado con CSS moderno y listo para ser usado directamente en el explorador de archivos PWA.`;
    const userPrompt = `Genera los archivos estructurados (HTML, CSS, JavaScript) para el siguiente componente web PWA:
Descripci\xF3n: "${prompt.trim()}"
${targetFolder ? `Carpeta destino solicitada: "${targetFolder.trim()}"` : "Si no hay carpeta especificada, crea los archivos en una subcarpeta limpia bajo components/ o en la ubicaci\xF3n m\xE1s l\xF3gica."}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            componentName: { type: import_genai.Type.STRING, description: "Nombre descriptivo del componente" },
            files: {
              type: import_genai.Type.ARRAY,
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  path: { type: import_genai.Type.STRING, description: "Ruta del archivo (ej: components/contact-form/contact.html)" },
                  content: { type: import_genai.Type.STRING, description: "C\xF3digo ejecutable completo para este archivo" }
                },
                required: ["path", "content"]
              }
            }
          },
          required: ["componentName", "files"]
        }
      }
    });
    const text = response.text;
    if (!text) {
      throw new Error("Respuesta vac\xEDa del modelo Gemini.");
    }
    const result = JSON.parse(text);
    return res.json(result);
  } catch (error) {
    console.error("Error en /api/gemini/generate-component:", error);
    return res.status(500).json({ error: error?.message || "Error al procesar la solicitud con la IA Gemini." });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
