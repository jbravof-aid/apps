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
var aiClient = null;
function getAIClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}
var usersMemoryDB = /* @__PURE__ */ new Map();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/auth/register", (req, res) => {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      res.status(400).json({ error: "Todos los campos son requeridos" });
      return;
    }
    const lowerEmail = email.toLowerCase().trim();
    if (usersMemoryDB.has(lowerEmail)) {
      res.status(400).json({ error: "El usuario ya existe con este correo electr\xF3nico" });
      return;
    }
    const token = `token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const newUser = {
      email: lowerEmail,
      username,
      passwordHash: Buffer.from(password).toString("base64"),
      token
    };
    usersMemoryDB.set(lowerEmail, newUser);
    res.json({
      message: "Cuenta creada con \xE9xito",
      user: { email: newUser.email, username: newUser.username, token: newUser.token }
    });
  });
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Correo y contrase\xF1a requeridos" });
      return;
    }
    const lowerEmail = email.toLowerCase().trim();
    const user = usersMemoryDB.get(lowerEmail);
    if (!user || user.passwordHash !== Buffer.from(password).toString("base64")) {
      res.status(401).json({ error: "Credenciales inv\xE1lidas" });
      return;
    }
    res.json({
      message: "Inicio de sesi\xF3n correcto",
      user: { email: user.email, username: user.username, token: user.token },
      hasBackup: !!user.cloudSyncData,
      lastSyncTime: user.cloudSyncData?.updatedAt
    });
  });
  app.post("/api/sync/upload", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
    const token = authHeader.split(" ")[1];
    let foundUser;
    for (const u of usersMemoryDB.values()) {
      if (u.token === token) {
        foundUser = u;
        break;
      }
    }
    if (!foundUser) {
      res.status(401).json({ error: "Sesi\xF3n no v\xE1lida" });
      return;
    }
    const { payload, isEncrypted } = req.body;
    if (!payload) {
      res.status(400).json({ error: "Payload de sincronizaci\xF3n no proporcionado" });
      return;
    }
    foundUser.cloudSyncData = {
      payload,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      isEncrypted: !!isEncrypted
    };
    res.json({
      message: "Sincronizaci\xF3n en la nube completada con \xE9xito",
      updatedAt: foundUser.cloudSyncData.updatedAt,
      isEncrypted: foundUser.cloudSyncData.isEncrypted
    });
  });
  app.get("/api/sync/download", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }
    const token = authHeader.split(" ")[1];
    let foundUser;
    for (const u of usersMemoryDB.values()) {
      if (u.token === token) {
        foundUser = u;
        break;
      }
    }
    if (!foundUser || !foundUser.cloudSyncData) {
      res.status(444).json({ error: "No se encontraron datos de copia de seguridad en la nube" });
      return;
    }
    res.json({
      payload: foundUser.cloudSyncData.payload,
      updatedAt: foundUser.cloudSyncData.updatedAt,
      isEncrypted: foundUser.cloudSyncData.isEncrypted
    });
  });
  app.post("/api/suggest-tags", async (req, res) => {
    const { title = "", description = "" } = req.body;
    if (!title && !description) {
      res.json({ tags: [] });
      return;
    }
    const ai = getAIClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: `Analiza el siguiente t\xEDtulo y descripci\xF3n de un enlace o marcador y devuelve \xFAnicamente un JSON array de strings con entre 3 y 6 etiquetas (tags) cortas y relevantes en espa\xF1ol.
T\xEDtulo: "${title}"
Descripci\xF3n: "${description}"
Responde solo con el JSON array, ejemplo: ["tecnologia", "desarrollo", "tutorial"]`
        });
        const text = response.text || "";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            res.json({ tags: parsed.slice(0, 6).map((t) => String(t).trim().toLowerCase()) });
            return;
          }
        }
      } catch (e) {
        console.warn("Error calling Gemini for tag suggestions:", e);
      }
    }
    const combined = `${title} ${description}`.toLowerCase();
    const stopWords = ["para", "como", "con", "este", "esta", "sobre", "desde", "https", "http", "www", "com", "para", "cada", "pero"];
    const words = Array.from(new Set(combined.replace(/[^\wáéíóúñ\s]/gi, "").split(/\s+/))).filter((w) => w.length > 3 && !stopWords.includes(w));
    res.json({ tags: words.slice(0, 5) });
  });
  app.post("/api/auto-categorize", async (req, res) => {
    const { cards = [] } = req.body;
    if (!Array.isArray(cards) || cards.length === 0) {
      res.json({ categorizedCards: [] });
      return;
    }
    const ai = getAIClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: `Analiza los siguientes marcadores/enlaces web (con su id, t\xEDtulo, url y descripci\xF3n) y sugiere para cada uno una categor\xEDa corta, clara e inteligible en espa\xF1ol (por ejemplo: "Desarrollo", "Dise\xF1o UI", "Herramientas", "Recursos", "Noticias", "Productividad", "Educaci\xF3n", "Entretenimiento", "Redes Sociales", "Finanzas").

Enlaces a categorizar:
${JSON.stringify(cards.map((c) => ({ id: c.id, title: c.title, url: c.href || c.url, description: c.description || c.texto || "" })))}

Responde \xDANICAMENTE en formato JSON con la siguiente estructura exacta:
{
  "categorizedCards": [
    { "id": 1, "category": "Desarrollo" }
  ]
}`,
          config: {
            responseMimeType: "application/json"
          }
        });
        const text = response.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed && Array.isArray(parsed.categorizedCards)) {
            res.json({ categorizedCards: parsed.categorizedCards });
            return;
          }
        }
      } catch (e) {
        console.warn("Error calling Gemini for auto-categorize:", e);
      }
    }
    const fallbackResults = cards.map((c) => {
      const text = `${c.title || ""} ${c.href || c.url || ""} ${c.description || c.texto || ""}`.toLowerCase();
      let category = "General";
      if (text.includes("github") || text.includes("code") || text.includes("dev") || text.includes("script") || text.includes("api") || text.includes("npm") || text.includes("ts") || text.includes("react")) {
        category = "Desarrollo";
      } else if (text.includes("design") || text.includes("ui") || text.includes("ux") || text.includes("css") || text.includes("dribbble") || text.includes("figma") || text.includes("color") || text.includes("icon")) {
        category = "Dise\xF1o UI";
      } else if (text.includes("tool") || text.includes("app") || text.includes("generator") || text.includes("converter") || text.includes("util")) {
        category = "Herramientas";
      } else if (text.includes("photo") || text.includes("image") || text.includes("unsplash") || text.includes("stock") || text.includes("resource") || text.includes("vector")) {
        category = "Recursos";
      } else if (text.includes("doc") || text.includes("guide") || text.includes("tutorial") || text.includes("wiki") || text.includes("mdn")) {
        category = "Documentaci\xF3n";
      }
      return { id: c.id, category };
    });
    res.json({ categorizedCards: fallbackResults });
  });
  app.post("/api/fetch-site-icon", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: "URL requerida" });
      return;
    }
    let formattedUrl = String(url).trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }
    try {
      const urlObj = new URL(formattedUrl);
      const origin = urlObj.origin;
      const hostname = urlObj.hostname;
      let candidateIcon = null;
      let source = "google-s2";
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
        const response = await fetch(formattedUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
          },
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (response.ok) {
          const html = await response.text();
          const appleMatch = html.match(/<link[^>]+rel=["'](?:apple-touch-icon|apple-touch-icon-precomposed)["'][^>]*href=["']([^"']+)["']/i) || html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["'](?:apple-touch-icon|apple-touch-icon-precomposed)["']/i);
          if (appleMatch && appleMatch[1]) {
            let iconPath = appleMatch[1].trim();
            if (iconPath.startsWith("//")) iconPath = `https:${iconPath}`;
            else if (iconPath.startsWith("/")) iconPath = `${origin}${iconPath}`;
            else if (!iconPath.startsWith("http")) iconPath = `${origin}/${iconPath}`;
            candidateIcon = iconPath;
            source = "apple-touch-icon";
          } else {
            const iconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i) || html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i);
            if (iconMatch && iconMatch[1]) {
              let iconPath = iconMatch[1].trim();
              if (iconPath.startsWith("//")) iconPath = `https:${iconPath}`;
              else if (iconPath.startsWith("/")) iconPath = `${origin}${iconPath}`;
              else if (!iconPath.startsWith("http")) iconPath = `${origin}/${iconPath}`;
              candidateIcon = iconPath;
              source = "html-link";
            }
          }
        }
      } catch (err) {
      }
      if (!candidateIcon) {
        candidateIcon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
        source = "google-s2";
      }
      res.json({
        url: formattedUrl,
        iconUrl: candidateIcon,
        source,
        domain: hostname.replace(/^www\./, ""),
        origin
      });
    } catch (err) {
      res.status(400).json({
        error: err.message || "URL inv\xE1lida",
        iconUrl: `https://www.google.com/s2/favicons?domain=example.com&sz=128`,
        source: "fallback"
      });
    }
  });
  app.post("/api/verify-link", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: "URL requerida" });
      return;
    }
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6e3);
      const response = await fetch(formattedUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      const active = response.status >= 200 && response.status < 400;
      res.json({
        url: formattedUrl,
        active,
        status: response.status,
        error: active ? null : `Error HTTP ${response.status}`
      });
    } catch (err) {
      res.json({
        url: formattedUrl,
        active: false,
        status: 0,
        error: err.name === "AbortError" ? "Tiempo de espera agotado" : err.message || "Error de conexi\xF3n"
      });
    }
  });
  app.get("/api/proxy-pdf", async (req, res) => {
    const rawUrl = req.query.url;
    if (!rawUrl) {
      res.status(400).send("URL requerida");
      return;
    }
    let formattedUrl = rawUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15e3);
      const response = await fetch(formattedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/pdf,application/octet-stream,*/*"
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) {
        res.status(response.status).send(`Error al obtener archivo PDF: HTTP ${response.status}`);
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'inline; filename="document.pdf"');
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.removeHeader("X-Frame-Options");
      res.removeHeader("Content-Security-Policy");
      res.send(buffer);
    } catch (err) {
      res.status(500).send(`Error al cargar PDF: ${err.message || "Error de conexi\xF3n"}`);
    }
  });
  app.post("/api/reader-mode", async (req, res) => {
    const { url, title = "" } = req.body;
    if (!url) {
      res.status(400).json({ error: "URL requerida" });
      return;
    }
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8e3);
      const response = await fetch(formattedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      const htmlText = await response.text();
      let extractedTitle = title;
      const titleMatch = htmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        extractedTitle = titleMatch[1].replace(/\s+/g, " ").trim();
      }
      const cleanedHtml = htmlText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "").replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "").replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "").replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "");
      const imgMatches = Array.from(cleanedHtml.matchAll(/<img[^>]+src=["']([^"']+)["']/gi));
      const extractedImages = [];
      for (const match of imgMatches) {
        let imgSrc = match[1];
        if (imgSrc.startsWith("//")) imgSrc = `https:${imgSrc}`;
        else if (imgSrc.startsWith("/")) {
          try {
            const origin = new URL(formattedUrl).origin;
            imgSrc = `${origin}${imgSrc}`;
          } catch (_) {
          }
        }
        if (imgSrc.startsWith("http") && !imgSrc.includes("icon") && !imgSrc.includes("logo") && !extractedImages.includes(imgSrc)) {
          extractedImages.push(imgSrc);
        }
      }
      const pMatches = Array.from(cleanedHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
      let paragraphs = pMatches.map((m) => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()).filter((p) => p.length > 40);
      if (paragraphs.length === 0) {
        paragraphs = [cleanedHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 1500)];
      }
      const ai = getAIClient();
      if (ai) {
        try {
          const rawText = paragraphs.slice(0, 10).join("\n\n");
          const aiResponse = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `Formatea el siguiente texto extra\xEDdo de una web en p\xE1rrafos limpios, legibles y bien redactados en espa\xF1ol para un modo lectura sin distracciones.
T\xEDtulo: "${extractedTitle}"
Texto:
${rawText.slice(0, 3500)}`
          });
          if (aiResponse.text) {
            paragraphs = aiResponse.text.split("\n\n").filter((p) => p.trim().length > 0);
          }
        } catch (e) {
          console.warn("Gemini reader mode refinement skipped:", e);
        }
      }
      res.json({
        url: formattedUrl,
        title: extractedTitle || "Art\xEDculo en Modo Lectura",
        paragraphs,
        images: extractedImages.slice(0, 6),
        readingTimeMinutes: Math.max(1, Math.ceil(paragraphs.join(" ").split(" ").length / 200))
      });
    } catch (err) {
      res.json({
        url: formattedUrl,
        title: title || "Modo Lectura",
        paragraphs: [
          `No se pudo extraer el contenido directamente desde la p\xE1gina (${err.message || "Error de red"}).`,
          "Puedes abrir el visor iframe o abrir el sitio web original en una nueva pesta\xF1a."
        ],
        images: [],
        readingTimeMinutes: 1
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
