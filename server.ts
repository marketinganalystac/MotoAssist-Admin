import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload bounds for high-res base64 invoice scans
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Direct persistent JSON models
interface Motorizado {
  id: string;
  nombre: string;
  telefono: string;
  estado: string; // "Activo" | "Inactivo"
  fecha_ingreso: string;
  asistencias_realizadas: number;
  total_facturado: number;
  promedio_diario: number;
  ultima_asistencia: string;
}

interface Asistencia {
  id: string;
  fecha: string;
  hora: string;
  numero_factura: string;
  cliente: string;
  ruc_cliente: string;
  telefono: string;
  direccion: string;
  comentario: string;
  ubicacion_servicio: string;
  vendedor: string;
  forma_pago: string;
  subtotal: number;
  itbms: number;
  total: number;
  estado: string; // "Completado" | "Pendiente"
  motorizado_id: string;
  imagen_original: string; // base64 string
  imagen_procesada: string; // base64 string
  ocr_json: any; // complete extracted JSON
  created_at: string;
}

// Fallback seed data
const initialMotorizados: Motorizado[] = [
  {
    id: "diego_torres",
    nombre: "Diego Torres",
    telefono: "+507 6123-4567",
    estado: "Activo",
    fecha_ingreso: "2025-01-10",
    asistencias_realizadas: 14,
    total_facturado: 630.00,
    promedio_diario: 15.5,
    ultima_asistencia: "2026-06-11 09:12"
  },
  {
    id: "sofia_ruiz",
    nombre: "Sofía Ruiz",
    telefono: "+507 6321-8901",
    estado: "Activo",
    fecha_ingreso: "2025-02-14",
    asistencias_realizadas: 11,
    total_facturado: 495.50,
    promedio_diario: 12.1,
    ultima_asistencia: "2026-06-11 08:30"
  },
  {
    id: "carlos_mendoza",
    nombre: "Carlos Mendoza",
    telefono: "+507 6555-4321",
    estado: "Activo",
    fecha_ingreso: "2024-11-05",
    asistencias_realizadas: 28,
    total_facturado: 1260.00,
    promedio_diario: 18.2,
    ultima_asistencia: "2026-06-10 17:40"
  },
  {
    id: "ana_gomez",
    nombre: "Ana Gómez",
    telefono: "+507 6987-6543",
    estado: "Inactivo",
    fecha_ingreso: "2025-03-01",
    asistencias_realizadas: 5,
    total_facturado: 225.00,
    promedio_diario: 8.5,
    ultima_asistencia: "2026-06-08 11:20"
  }
];

const initialAsistencias: Asistencia[] = [
  {
    id: "AST-1001",
    fecha: "2026-06-11",
    hora: "09:12",
    numero_factura: "FAC-99231",
    cliente: "Distribuidora El Éxito",
    ruc_cliente: "8-765-4321 DV 90",
    telefono: "+507 6123-4567",
    direccion: "Ave. Balboa, Edificio Miramar, Planta Baja",
    comentario: "Suministro e instalación de batería por descarga total de panel eléctrico.",
    ubicacion_servicio: "Ave. Balboa, Ciudad de Panamá",
    vendedor: "Juan Carlos Pérez",
    forma_pago: "Efectivo",
    subtotal: 45.00,
    itbms: 3.15,
    total: 48.15,
    estado: "Completado",
    motorizado_id: "diego_torres",
    imagen_original: "",
    imagen_procesada: "",
    ocr_json: {
      numero_factura: "FAC-99231",
      fecha: "2026-06-11",
      hora: "09:12",
      cliente: "Distribuidora El Éxito",
      ruc_cliente: "8-765-4321 DV 90",
      vendedor: "Juan Carlos Pérez",
      subtotal: 45.00,
      itbms: 3.15,
      total: 48.15,
      descripcion_servicio: "Asistencia vial: Carga e instalación de batería"
    },
    created_at: "2026-06-11T09:12:00.000Z"
  },
  {
    id: "AST-1002",
    fecha: "2026-06-11",
    hora: "08:30",
    numero_factura: "FAC-99232",
    cliente: "Almacén Central S.A.",
    ruc_cliente: "4-123-1492 DV 11",
    telefono: "+507 6321-8901",
    direccion: "Vía España, Galerías Obarrio",
    comentario: "Neumático desinflado, cambio rápido por neumático de repuesto.",
    ubicacion_servicio: "Vía España, Panamá",
    vendedor: "Miriam Herrera",
    forma_pago: "Tarjeta de Crédito",
    subtotal: 35.00,
    itbms: 2.45,
    total: 37.45,
    estado: "Completado",
    motorizado_id: "sofia_ruiz",
    imagen_original: "",
    imagen_procesada: "",
    ocr_json: {
      numero_factura: "FAC-99232",
      fecha: "2026-06-11",
      hora: "08:30",
      cliente: "Almacén Central S.A.",
      ruc_cliente: "4-123-1492 DV 11",
      vendedor: "Miriam Herrera",
      subtotal: 35.00,
      itbms: 2.45,
      total: 37.45,
      descripcion_servicio: "Asistencia vial: Neumático"
    },
    created_at: "2026-06-11T08:30:00.000Z"
  },
  {
    id: "AST-1003",
    fecha: "2026-06-10",
    hora: "14:15",
    numero_factura: "FAC-99112",
    cliente: "Industrias Metalúrgicas Corro",
    ruc_cliente: "PE-8-9921 DV 02",
    telefono: "+507 6555-4321",
    direccion: "Costa del Este, Parque Industrial",
    comentario: "Remolque liviano solicitado por daño de motor secundario.",
    ubicacion_servicio: "Costa del Este",
    vendedor: "Héctor Guardia",
    forma_pago: "Transferencia Bancaria",
    subtotal: 80.00,
    itbms: 5.60,
    total: 85.60,
    estado: "Completado",
    motorizado_id: "carlos_mendoza",
    imagen_original: "",
    imagen_procesada: "",
    ocr_json: {
      numero_factura: "FAC-99112",
      fecha: "2026-06-10",
      subtotal: 80.00,
      itbms: 5.60,
      total: 85.60
    },
    created_at: "2026-06-10T14:15:00.000Z"
  },
  {
    id: "AST-1004",
    fecha: "2026-06-09",
    hora: "11:55",
    numero_factura: "FAC-98711",
    cliente: "Supermercados Rey S.A.",
    ruc_cliente: "9-441-2290 DV 14",
    telefono: "+507 6900-2139",
    direccion: "Calle 50, Plaza Magna",
    comentario: "Apertura técnica de puerta de vehículo, llaves olvidadas adentro.",
    ubicacion_servicio: "Calle 50, Bella Vista",
    vendedor: "Héctor Guardia",
    forma_pago: "Efectivo",
    subtotal: 40.00,
    itbms: 2.80,
    total: 42.80,
    estado: "Completado",
    motorizado_id: "diego_torres",
    imagen_original: "",
    imagen_procesada: "",
    ocr_json: {
      numero_factura: "FAC-98711",
      fecha: "2026-06-09",
      subtotal: 40.00,
      itbms: 2.80,
      total: 42.80
    },
    created_at: "2026-06-09T11:55:00.000Z"
  },
  {
    id: "AST-1005",
    fecha: "2026-06-08",
    hora: "09:30",
    numero_factura: "FAC-98604",
    cliente: "Farmacias Arrocha",
    ruc_cliente: "8-111-2222 DV 00",
    telefono: "+507 6443-1288",
    direccion: "Vía España, Sucursal Principal",
    comentario: "Abastecimiento de combustible (2 galones de gasolina de 95 octanos).",
    ubicacion_servicio: "Vía España, Carrasquilla",
    vendedor: "Patricia Domínguez",
    forma_pago: "Tarjeta de Débito",
    subtotal: 15.00,
    itbms: 1.05,
    total: 16.05,
    estado: "Completado",
    motorizado_id: "sofia_ruiz",
    imagen_original: "",
    imagen_procesada: "",
    ocr_json: {
      numero_factura: "FAC-98604",
      fecha: "2026-06-08",
      subtotal: 15.00,
      itbms: 1.05,
      total: 16.05
    },
    created_at: "2026-06-08T09:30:00.000Z"
  }
];

// ----------------------------------------------------
// FIREBASE FIRESTORE INTEGRATION & INITIALIZATION
// ----------------------------------------------------
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp);

// Helper to get all motorizados from Firestore, with seed fallback
async function getMotorizados(): Promise<Motorizado[]> {
  try {
    const colRef = collection(firestoreDb, "motorizados");
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.log("Firestore 'motorizados' is empty. Seeding fallback data...");
      for (const m of initialMotorizados) {
        await setDoc(doc(firestoreDb, "motorizados", m.id), m);
      }
      return initialMotorizados;
    }
    const list: Motorizado[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Motorizado);
    });
    return list;
  } catch (err) {
    console.error("Error reading motorizados from Firestore:", err);
    return initialMotorizados;
  }
}

// Helper to get all asistencias from Firestore, with seed fallback
async function getAsistencias(): Promise<Asistencia[]> {
  try {
    const colRef = collection(firestoreDb, "asistencias");
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.log("Firestore 'asistencias' is empty. Seeding fallback data...");
      for (const a of initialAsistencias) {
        await setDoc(doc(firestoreDb, "asistencias", a.id), a);
      }
      return initialAsistencias;
    }
    const list: Asistencia[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Asistencia);
    });
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.error("Error reading asistencias from Firestore:", err);
    return initialAsistencias;
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Get List of Motorizados & Indicators
app.get("/api/motorizados", async (req, res) => {
  try {
    const list = await getMotorizados();
    res.json(list);
  } catch (err) {
    console.error("Error in GET /api/motorizados:", err);
    res.status(500).json({ error: "Error al obtener motorizados de Firestore." });
  }
});

// 2. Add / Update Motorizado
app.post("/api/motorizados", async (req, res) => {
  try {
    const moto = req.body;
    
    if (!moto.nombre || !moto.telefono) {
      return res.status(400).json({ error: "Nombre y teléfono son obligatorios" });
    }

    const id = moto.id || moto.nombre.toLowerCase().replace(/\s+/g, "_") + "_" + Math.floor(Math.random() * 1000);
    const docRef = doc(firestoreDb, "motorizados", id);
    const docSnap = await getDoc(docRef);

    let updatedMoto: Motorizado;
    if (docSnap.exists()) {
      updatedMoto = { ...docSnap.data() as Motorizado, ...moto };
    } else {
      updatedMoto = {
        id,
        nombre: moto.nombre,
        telefono: moto.telefono,
        estado: moto.estado || "Activo",
        fecha_ingreso: moto.fecha_ingreso || new Date().toISOString().split("T")[0],
        asistencias_realizadas: 0,
        total_facturado: 0,
        promedio_diario: 0,
        ultima_asistencia: "Ninguna"
      };
    }

    await setDoc(docRef, updatedMoto);
    const motorizadosList = await getMotorizados();
    res.json({ success: true, motorizados: motorizadosList });
  } catch (err) {
    console.error("Error in POST /api/motorizados:", err);
    res.status(500).json({ error: "Error al registrar motorizado en Firestore." });
  }
});

// 3. Get List of Asistencias
app.get("/api/asistencias", async (req, res) => {
  try {
    const list = await getAsistencias();
    res.json(list);
  } catch (err) {
    console.error("Error in GET /api/asistencias:", err);
    res.status(500).json({ error: "Error al obtener asistencias de Firestore." });
  }
});

// 4. Save/register Asistencia & Update Motorizado Statistics
app.post("/api/asistencias", async (req, res) => {
  try {
    const ast: Asistencia = req.body;

    if (!ast.cliente || !ast.numero_factura || !ast.motorizado_id) {
      return res.status(400).json({ error: "Varios campos requeridos están vacíos." });
    }

    // Generate ID if not present
    if (!ast.id) {
      const currentList = await getAsistencias();
      const nextAstVal = 1000 + currentList.length + 1;
      ast.id = `AST-${nextAstVal}`;
    }
    if (!ast.created_at) {
      ast.created_at = new Date().toISOString();
    }

    // Save/update the asistencia document
    const astRef = doc(firestoreDb, "asistencias", ast.id);
    await setDoc(astRef, ast);

    // Recalculate and update motorizado indicators in real-time
    const motoRef = doc(firestoreDb, "motorizados", ast.motorizado_id);
    const motoSnap = await getDoc(motoRef);
    if (motoSnap.exists()) {
      const targetMoto = motoSnap.data() as Motorizado;
      
      const allAsistencias = await getAsistencias();
      const mAsistencias = allAsistencias.filter(a => a.motorizado_id === targetMoto.id && a.estado === "Completado");
      
      targetMoto.asistencias_realizadas = mAsistencias.length;
      const sumTotal = mAsistencias.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
      targetMoto.total_facturado = Number(sumTotal.toFixed(2));
      
      const daysSince = Math.max(1, Math.ceil((Date.now() - new Date(targetMoto.fecha_ingreso).getTime()) / (1000 * 60 * 60 * 24)));
      targetMoto.promedio_diario = Number((targetMoto.total_facturado / daysSince).toFixed(2));
      targetMoto.ultima_asistencia = `${ast.fecha} ${ast.hora}`;

      await setDoc(motoRef, targetMoto);
    }

    res.json({ success: true, asistencia: ast });
  } catch (err) {
    console.error("Error in POST /api/asistencias:", err);
    res.status(500).json({ error: "Error de Firestore al guardar asistencia." });
  }
});

// 5. OCR Analysis Route with Gemini API Integration (Server-side)
app.post("/api/ocr-process", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "No se proporcionó la imagen de la factura." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY no configurada. Edite Settings > Secrets en la barra lateral para agregarla."
      });
    }

    // Initialize modern @google/genai client with proper User-Agent header
    const aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Remove data URL prefix if present for binary matching
    const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Clean,
      },
    };

    const promptText = `
Analiza la imagen de la factura adjunta de asistencia vial. Tu prioridad es extraer y transcribir con precisión total cada dato visible.
Importante: No te limites. Si encuentras datos contractuales al pie de la página, números de cuentas de bancos para pago, firmas, notas escritas a mano o comentarios, debes extraerlos sin importar el formato.

Reglas del formato de salida:
- Devuelve un JSON estructurado que siga el esquema exacto provisto.
- En los campos numéricos como subtotal, itbms y total, extrae únicamente los valores decimales como números reales (ej: 42.15). Si tiene el símbolo $, elimínalo.
- Si no encuentras un campo, rellenalo con una cadena vacía "" o 0 para números.

Retorna un objeto JSON con los siguientes campos obligatorios.
`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            numero_factura: { type: Type.STRING, description: "Número de factura o serie visible, ej. FAC-10023" },
            fecha: { type: Type.STRING, description: "Fecha de emisión de factura en formato YYYY-MM-DD" },
            hora: { type: Type.STRING, description: "Hora de emisión de factura en formato HH:MM" },
            cliente: { type: Type.STRING, description: "Nombre completo del cliente o empresa" },
            ruc_cliente: { type: Type.STRING, description: "RUC, cédula, DV o NIT del cliente" },
            receptor: { type: Type.STRING, description: "Nombre de la persona o receptor del servicio" },
            telefono: { type: Type.STRING, description: "Teléfono o celular del cliente" },
            direccion: { type: Type.STRING, description: "Dirección física detallada" },
            comentario: { type: Type.STRING, description: "Notas, observaciones o detalles adicionales manuales" },
            descripcion_servicio: { type: Type.STRING, description: "Descripción detallada del servicio prestado, repuestos, combustible, etc." },
            forma_pago: { type: Type.STRING, description: "Efectivo, Tarjeta, Yappy, Transferencia, ACH, etc." },
            vendedor: { type: Type.STRING, description: "Nombre del vendedor, caja o receptor del pago" },
            cuenta: { type: Type.STRING, description: "Cuentas bancarias citadas al pie para transferencias" },
            factura_interna: { type: Type.STRING, description: "Número de orden, cotización o documento de referencia interno" },
            sucursal: { type: Type.STRING, description: "Nombre de la sucursal o patio de despacho" },
            punto_facturacion: { type: Type.STRING, description: "Dispositivo o punto de facturación" },
            subtotal: { type: Type.NUMBER, description: "Subtotal antes de impuestos" },
            itbms: { type: Type.NUMBER, description: "Impuesto ITBMS (impuesto del 7% panameño u otro aplicable)" },
            total: { type: Type.NUMBER, description: "Total general de la factura" },
            ubicacion_servicio: { type: Type.STRING, description: "Ubicación del evento o destino del servicio" },
            pie_factura: { type: Type.STRING, description: "Información contractual, cuentas bancarias, pie de página o teléfonos adicionales" },
            datos_adicionales: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Cualquier otra información adicional relevante detectada" }
          }
        }
      }
    });

    const bodyText = response.text;
    if (!bodyText) {
      throw new Error("No se pudo obtener el texto analizado por la inteligencia artificial.");
    }

    const ocrData = JSON.parse(bodyText);
    res.json(ocrData);
  } catch (error: any) {
    console.error("Error en ocr-process API:", error);
    res.status(500).json({ error: error?.message || "Error procesando el OCR de la factura" });
  }
});


// ----------------------------------------------------
// FULL-STACK VITE ROUTING IN EXPRESS
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // DEV MODE: Integrate Vite's Dev Server as a middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware attached in development mode.");
  } else {
    // PRODUCTION MODE: Serve compiled static bundle
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MotoAssist is running at http://localhost:${PORT}`);
  });
}

startServer();
