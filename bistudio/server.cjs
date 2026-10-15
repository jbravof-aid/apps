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
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not set. Using intelligent schema fallback.");
    return null;
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
function generateFallbackLayout(params) {
  const { tableName, fields = [], sampleRecord = {}, canvasWidth = 1200, canvasHeight = 800 } = params;
  const numericFields = fields.filter((f) => {
    const val = sampleRecord[f];
    return typeof val === "number" || /^(precio|total|monto|cantidad|stock|ventas|costo|edad|puntos|score|valor|importe|balance|qty|amount|price|salary|count|rating)$/i.test(f);
  });
  const dateFields = fields.filter((f) => {
    const val = sampleRecord[f];
    return val instanceof Date || /^(fecha|date|created_at|updated_at|timestamp|dia|mes|ano|year|month)$/i.test(f);
  });
  const categoryFields = fields.filter((f) => {
    return !numericFields.includes(f) && !dateFields.includes(f) && !/^(id|_id|uuid|guid)$/i.test(f);
  });
  const elements = [];
  let zIndex = 1;
  elements.push({
    id: `el_header_${Date.now()}`,
    type: "card",
    name: `Cabecera Dashboard - ${tableName}`,
    x: 20,
    y: 20,
    width: Math.min(canvasWidth - 40, 1160),
    height: 70,
    zIndex: zIndex++,
    visible: true,
    locked: false,
    style: {
      backgroundColor: "#1e293b",
      color: "#ffffff",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#334155",
      shadow: "md",
      padding: 16
    },
    binding: {
      template: `\u{1F4CA} Dashboard Ejecutivo de ${tableName.toUpperCase()}`,
      prefix: "Control de Datos"
    }
  });
  const kpiCount = Math.min(3, Math.max(1, numericFields.length || 2));
  const kpiWidth = Math.floor((Math.min(canvasWidth - 40, 1160) - (kpiCount - 1) * 20) / kpiCount);
  for (let i = 0; i < kpiCount; i++) {
    const numField = numericFields[i] || fields[i] || "id";
    const isSum = /precio|total|monto|ventas|costo|amount|price/i.test(numField);
    const aggregation = numericFields.includes(numField) ? isSum ? "sum" : "avg" : "count";
    const label = numField ? numField.replace(/_/g, " ").toUpperCase() : "REGISTROS";
    elements.push({
      id: `el_kpi_${i}_${Date.now()}`,
      type: "kpi",
      name: `KPI ${label}`,
      x: 20 + i * (kpiWidth + 20),
      y: 110,
      width: kpiWidth,
      height: 120,
      zIndex: zIndex++,
      visible: true,
      locked: false,
      style: {
        backgroundColor: "#1e293b",
        color: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#334155",
        shadow: "md",
        padding: 14
      },
      binding: {
        tableName,
        field: numField,
        aggregation,
        prefix: isSum ? "$" : "",
        suffix: aggregation === "avg" ? " (prom)" : aggregation === "count" ? " regs" : "",
        template: `${aggregation === "sum" ? "Total" : aggregation === "avg" ? "Promedio" : "Total"} ${label}`
      }
    });
  }
  const chartWidth = Math.floor(Math.min(canvasWidth - 40, 1160) * 0.48);
  const tableWidth = Math.min(canvasWidth - 40, 1160) - chartWidth - 20;
  const labelField = categoryFields[0] || dateFields[0] || fields[0] || "id";
  const valueField = numericFields[0] || fields[1] || fields[0] || "id";
  elements.push({
    id: `el_chart_${Date.now()}`,
    type: "chart",
    name: `Gr\xE1fico de ${valueField} por ${labelField}`,
    x: 20,
    y: 250,
    width: chartWidth,
    height: 380,
    zIndex: zIndex++,
    visible: true,
    locked: false,
    style: {
      backgroundColor: "#1e293b",
      color: "#ffffff",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#334155",
      shadow: "md",
      padding: 16
    },
    binding: {
      tableName,
      chartType: categoryFields.length > 0 ? "bar" : "line",
      labelField,
      valueField,
      chartColors: ["#38bdf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa"],
      template: `Distribuci\xF3n de ${valueField} por ${labelField}`
    }
  });
  const tableColumns = fields.slice(0, 6);
  elements.push({
    id: `el_table_${Date.now()}`,
    type: "table",
    name: `Tabla de Registros - ${tableName}`,
    x: 20 + chartWidth + 20,
    y: 250,
    width: tableWidth,
    height: 380,
    zIndex: zIndex++,
    visible: true,
    locked: false,
    style: {
      backgroundColor: "#1e293b",
      color: "#ffffff",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#334155",
      shadow: "md",
      padding: 12
    },
    binding: {
      tableName,
      columns: tableColumns,
      limit: 10
    }
  });
  return {
    dashboardTitle: `Dashboard de ${tableName}`,
    description: `Dise\xF1o generado autom\xE1ticamente para la tabla "${tableName}" estructurado con KPIs anal\xEDticos, visualizaci\xF3n gr\xE1fica y tabla de datos.`,
    elements
  };
}
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.post("/api/generate-layout", async (req, res) => {
  try {
    const {
      tableName,
      schema = "",
      fields = [],
      sampleRecord = {},
      canvasWidth = 1200,
      canvasHeight = 800,
      themeId = "midnight",
      promptGuidelines = ""
    } = req.body;
    if (!tableName) {
      return res.status(400).json({ error: "El nombre de la tabla es obligatorio." });
    }
    const ai = getGeminiClient();
    if (!ai) {
      const fallback = generateFallbackLayout({
        tableName,
        fields,
        sampleRecord,
        canvasWidth,
        canvasHeight,
        themeId
      });
      return res.json({
        success: true,
        source: "schema-rules-engine",
        layout: fallback
      });
    }
    const prompt = `You are an expert BI and Executive Dashboard Architect.
Generate an optimal, production-ready visual dashboard canvas layout for a dataset named "${tableName}".

TABLE METADATA:
- Table Name: ${tableName}
- Schema Definition: ${schema || "None provided"}
- Available Fields: ${JSON.stringify(fields)}
- Sample Record: ${JSON.stringify(sampleRecord)}
- Target Canvas Dimensions: ${canvasWidth}px width x ${canvasHeight}px height
- Preferred Theme Archetype: ${themeId}
${promptGuidelines ? `- Custom User Guidance: ${promptGuidelines}` : ""}

CANVAS DESIGN SPECIFICATIONS:
1. Coordinate space: X between 20 and ${canvasWidth - 20}, Y between 20 and ${canvasHeight - 20}.
2. Ensure clean grid alignment and generous negative space (padding: 16px, gap: 16px-20px). Do not overlap elements.
3. Include:
   - 1 Header Card/Banner at the top (x: 20, y: 20, width: ~${Math.min(canvasWidth - 40, 1160)}, height: 60-80).
   - 2 to 4 KPI metric cards across the row below the header (y: 110-120, height: 110-130). Set appropriate aggregations ('sum', 'avg', 'count', 'max', 'min') and prefixes (e.g. '$') based on field types.
   - 1 or 2 Chart widgets ('bar', 'line', 'pie', 'area') analyzing key numeric vs categorical or date fields (y: 260, height: 350-400).
   - 1 Rich Data Table with columns set to the most relevant 4-6 fields (y: 260, height: 350-400).
   - Optional: DetailCard, Badge, or Form component if relevant to the schema.
4. Set visual style properties:
   - backgroundColor: "#1e293b" for dark or appropriate color for the theme
   - color: "#f8fafc"
   - borderColor: "#334155"
   - borderWidth: 1
   - borderRadius: 8 to 12
   - shadow: "md"

Return the complete structured dashboard layout.`;
    const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let response = null;
    let usedModel = "gemini-3.8-flash";
    for (const modelName of candidateModels) {
      let modelSuccess = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: "You are an executive UI/UX and BI Dashboard layout designer. You generate JSON dashboard configurations composed of CanvasElement objects positioned on a 2D canvas.",
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  dashboardTitle: { type: import_genai.Type.STRING, description: "Descriptive title of the generated dashboard" },
                  description: { type: import_genai.Type.STRING, description: "Short rationale and summary of layout decisions" },
                  elements: {
                    type: import_genai.Type.ARRAY,
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        id: { type: import_genai.Type.STRING },
                        type: {
                          type: import_genai.Type.STRING,
                          description: "ControlType: 'kpi' | 'chart' | 'table' | 'card' | 'text' | 'badge' | 'detailCard' | 'matrix' | 'form'"
                        },
                        name: { type: import_genai.Type.STRING },
                        x: { type: import_genai.Type.NUMBER },
                        y: { type: import_genai.Type.NUMBER },
                        width: { type: import_genai.Type.NUMBER },
                        height: { type: import_genai.Type.NUMBER },
                        zIndex: { type: import_genai.Type.NUMBER },
                        visible: { type: import_genai.Type.BOOLEAN },
                        locked: { type: import_genai.Type.BOOLEAN },
                        style: {
                          type: import_genai.Type.OBJECT,
                          properties: {
                            backgroundColor: { type: import_genai.Type.STRING },
                            color: { type: import_genai.Type.STRING },
                            fontSize: { type: import_genai.Type.NUMBER },
                            fontWeight: { type: import_genai.Type.STRING },
                            textAlign: { type: import_genai.Type.STRING },
                            borderWidth: { type: import_genai.Type.NUMBER },
                            borderColor: { type: import_genai.Type.STRING },
                            borderStyle: { type: import_genai.Type.STRING },
                            borderRadius: { type: import_genai.Type.NUMBER },
                            padding: { type: import_genai.Type.NUMBER },
                            shadow: { type: import_genai.Type.STRING }
                          },
                          required: ["backgroundColor", "color", "borderRadius"]
                        },
                        binding: {
                          type: import_genai.Type.OBJECT,
                          properties: {
                            tableName: { type: import_genai.Type.STRING },
                            field: { type: import_genai.Type.STRING },
                            template: { type: import_genai.Type.STRING },
                            aggregation: { type: import_genai.Type.STRING },
                            columns: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                            chartType: { type: import_genai.Type.STRING },
                            labelField: { type: import_genai.Type.STRING },
                            valueField: { type: import_genai.Type.STRING },
                            chartColors: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
                            prefix: { type: import_genai.Type.STRING },
                            suffix: { type: import_genai.Type.STRING },
                            limit: { type: import_genai.Type.NUMBER }
                          }
                        }
                      },
                      required: ["id", "type", "name", "x", "y", "width", "height", "style", "binding"]
                    }
                  }
                },
                required: ["dashboardTitle", "elements"]
              }
            }
          });
          if (response && response.text) {
            usedModel = modelName;
            modelSuccess = true;
            break;
          }
        } catch (err) {
          const isRateOrUnavailable = err?.status === 503 || err?.status === 429 || err?.message?.includes("503") || err?.message?.includes("high demand") || err?.message?.includes("RESOURCE_EXHAUSTED");
          if (attempt === 1 && isRateOrUnavailable) {
            await new Promise((res2) => setTimeout(res2, 400));
            continue;
          }
          console.log(`[AI Layout] Model ${modelName} unavailable, switching to next candidate.`);
          break;
        }
      }
      if (modelSuccess) {
        break;
      }
    }
    if (!response || !response.text) {
      console.log("[AI Layout] Activating intelligent adaptive layout engine fallback.");
      const fallback = generateFallbackLayout({
        tableName,
        fields,
        sampleRecord,
        canvasWidth,
        canvasHeight,
        themeId
      });
      return res.json({
        success: true,
        source: "schema-rules-engine",
        warning: "Modelos de IA con alta demanda temporal. Se gener\xF3 el layout con el motor adaptativo inteligente.",
        layout: fallback
      });
    }
    const rawText = response.text?.trim();
    if (!rawText) {
      throw new Error("Respuesta vac\xEDa del servicio de IA.");
    }
    let parsed = null;
    try {
      let cleanText = rawText;
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(cleanText);
    } catch {
      console.log("[AI Layout] JSON parsing fallback activated.");
      const fallback = generateFallbackLayout({
        tableName,
        fields,
        sampleRecord,
        canvasWidth,
        canvasHeight,
        themeId
      });
      return res.json({
        success: true,
        source: "schema-rules-engine",
        warning: "Layout generado mediante motor adaptativo estructural.",
        layout: fallback
      });
    }
    const sanitizedElements = (parsed.elements || []).map((el, idx) => ({
      id: el.id || `gen_el_${Date.now()}_${idx}`,
      type: el.type || "card",
      name: el.name || `Elemento ${idx + 1}`,
      x: typeof el.x === "number" ? Math.max(0, el.x) : 20 + idx * 40,
      y: typeof el.y === "number" ? Math.max(0, el.y) : 20 + idx * 40,
      width: typeof el.width === "number" ? Math.max(100, el.width) : 300,
      height: typeof el.height === "number" ? Math.max(60, el.height) : 150,
      zIndex: el.zIndex || idx + 1,
      visible: el.visible !== false,
      locked: !!el.locked,
      style: {
        backgroundColor: el.style?.backgroundColor || "#1e293b",
        color: el.style?.color || "#f8fafc",
        fontSize: el.style?.fontSize,
        fontWeight: el.style?.fontWeight || "normal",
        textAlign: el.style?.textAlign || "left",
        borderWidth: el.style?.borderWidth ?? 1,
        borderColor: el.style?.borderColor || "#334155",
        borderStyle: el.style?.borderStyle || "solid",
        borderRadius: el.style?.borderRadius ?? 8,
        padding: el.style?.padding ?? 12,
        shadow: el.style?.shadow || "md"
      },
      binding: {
        tableName: el.binding?.tableName || tableName,
        field: el.binding?.field,
        template: el.binding?.template,
        aggregation: el.binding?.aggregation || "none",
        columns: Array.isArray(el.binding?.columns) ? el.binding.columns : fields.slice(0, 5),
        chartType: el.binding?.chartType || "bar",
        labelField: el.binding?.labelField || fields[0],
        valueField: el.binding?.valueField || fields[1] || fields[0],
        chartColors: el.binding?.chartColors || ["#38bdf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa"],
        prefix: el.binding?.prefix,
        suffix: el.binding?.suffix,
        limit: el.binding?.limit || 10
      }
    }));
    return res.json({
      success: true,
      source: usedModel,
      layout: {
        dashboardTitle: parsed.dashboardTitle || `Dashboard de ${tableName}`,
        description: parsed.description || "Layout propuesto por Gemini AI seg\xFAn el esquema de datos.",
        elements: sanitizedElements
      }
    });
  } catch (error) {
    console.warn("Recovered from /api/generate-layout error:", error?.message || error);
    const fallback = generateFallbackLayout({
      tableName: req.body?.tableName || "Datos",
      fields: req.body?.fields || [],
      sampleRecord: req.body?.sampleRecord || {},
      canvasWidth: req.body?.canvasWidth || 1200,
      canvasHeight: req.body?.canvasHeight || 800,
      themeId: req.body?.themeId || "midnight"
    });
    return res.json({
      success: true,
      source: "schema-fallback-recovery",
      warning: error?.message || "Servicio temporalmente ocupado. Se aplic\xF3 dise\xF1o adaptativo seg\xFAn el esquema.",
      layout: fallback
    });
  }
});
async function start() {
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
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}
start();
//# sourceMappingURL=server.cjs.map
