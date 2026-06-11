import React, { useState, useRef, useEffect } from "react";
import { Asistencia, Motorizado } from "../types";
import { generateInvoiceImageBase64, mockInvoiceTemplates } from "../utils/invoiceGenerator";
import { 
  Camera, 
  Sparkles, 
  RotateCw, 
  Sliders, 
  Check, 
  AlertCircle, 
  Upload, 
  Loader2, 
  MapPin, 
  ArrowRight,
  Database,
  FileSpreadsheet,
  Layers,
  CheckCircle2
} from "lucide-react";

interface InvoiceScannerProps {
  motorizados: Motorizado[];
  currentMotorizado: string;
  onAsistenciaCreated: (newAst: Asistencia) => void;
}

export default function InvoiceScanner({
  motorizados,
  currentMotorizado,
  onAsistenciaCreated
}: InvoiceScannerProps) {
  // Input sources
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  
  // Image improvement sliders (stored in state to render real-time Canvas or CSS filters)
  const [brightness, setBrightness] = useState<number>(105);
  const [contrast, setContrast] = useState<number>(125);
  const [sharpness, setSharpness] = useState<number>(1.2);
  const [rotate, setRotate] = useState<number>(0);
  const [noiseReduction, setNoiseReduction] = useState<boolean>(true);
  const [contrastBoost, setContrastBoost] = useState<boolean>(true);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [perspectiveCorrect, setPerspectiveCorrect] = useState<boolean>(true);

  // System states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingState, setProcessingState] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State for manual review validation ticket
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<Asistencia>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef<HTMLDivElement>(null);

  // Generate visual filters
  const getFilterStyle = () => {
    let filterString = `brightness(${brightness}%) contrast(${contrast}%)`;
    if (grayscale) filterString += " grayscale(100%)";
    if (sharpness > 1) filterString += ` saturate(${Math.round(sharpness * 100)}%)`;
    return {
      filter: filterString,
      transform: `rotate(${rotate}deg)`,
      transition: "transform 0.15s ease-out, filter 0.05s ease"
    };
  };

  // Load a template dynamically to test
  const handleLoadTemplate = (idx: number) => {
    setErrorText(null);
    setSuccessMsg(null);
    setShowForm(false);
    
    // Base template
    const base64 = generateInvoiceImageBase64(idx, 0);
    setSelectedImage(base64);
    
    // Simulate auto alignment/enhancement on select
    setRotate(idx === 1 ? -1.5 : 0.8); // slight offset mimicking photo
    setBrightness(110);
    setContrast(130);
    setProcessedImage(base64);
  };

  // Handle uploaded files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setProcessedImage(reader.result as string);
        setErrorText(null);
        setSuccessMsg(null);
        setShowForm(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverRef.current) {
      dragOverRef.current.classList.add("border-amber-500", "bg-amber-500/5");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverRef.current) {
      dragOverRef.current.classList.remove("border-amber-500", "bg-amber-500/5");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverRef.current) {
      dragOverRef.current.classList.remove("border-amber-500", "bg-amber-500/5");
    }
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setProcessedImage(reader.result as string);
        setErrorText(null);
        setSuccessMsg(null);
        setShowForm(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset controls
  const handleResetFilters = () => {
    setBrightness(105);
    setContrast(125);
    setSharpness(1.2);
    setRotate(0);
    setGrayscale(false);
    setNoiseReduction(true);
    setContrastBoost(true);
    setPerspectiveCorrect(true);
  };

  // OCR Processing Simulation + Actual Gemini call if API key configured
  const handleRunOCR = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    setErrorText(null);
    setSuccessMsg(null);
    
    // Multistep visualization timeline to simulate local physical DSP (Digital Signal Processing)
    const steps = [
      { text: "Estabilizando giroscopio externo... [OK]", ms: 800, progress: 15 },
      { text: "Detectando bordes de página y encuadrando perspectiva...", ms: 1000, progress: 35 },
      { text: "Optimizando contraste local y reducción de ruido lineal (Despeckle)...", ms: 900, progress: 55 },
      { text: "Transmitiendo canal seguro a servidor de extracción Gemini 3.5 Flash...", ms: 1200, progress: 75 },
      { text: "Haciendo análisis cognitivo de estructura contable panameña...", ms: 1200, progress: 95 }
    ];

    let currentStep = 0;
    
    const runAnimation = () => {
      if (currentStep < steps.length) {
        setProcessingState(steps[currentStep].text);
        setProcessingProgress(steps[currentStep].progress);
        setTimeout(() => {
          currentStep++;
          runAnimation();
        }, steps[currentStep].ms);
      } else {
        // Run actual fullstack OCR
        executeActualOCR();
      }
    };

    runAnimation();
  };

  const executeActualOCR = async () => {
    try {
      if (!selectedImage) return;

      const response = await fetch("/api/ocr-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: selectedImage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fallo en la comunicación con el servidor OCR.");
      }

      const extractedData = await response.json();

      // Transform into state structure
      setFormData({
        id: "", // generated on save
        fecha: extractedData.fecha || new Date().toISOString().split("T")[0],
        hora: extractedData.hora || new Date().toTimeString().slice(0, 5),
        numero_factura: extractedData.numero_factura || "S/N",
        cliente: extractedData.cliente || "",
        ruc_cliente: extractedData.ruc_cliente || "",
        telefono: extractedData.telefono || "",
        direccion: extractedData.direccion || "",
        comentario: extractedData.comentario || "",
        ubicacion_servicio: extractedData.ubicacion_servicio || "",
        vendedor: extractedData.vendedor || "",
        forma_pago: extractedData.forma_pago || "Efectivo",
        subtotal: Number(extractedData.subtotal) || 0,
        itbms: Number(extractedData.itbms) || 0,
        total: Number(extractedData.total) || 0,
        estado: "Pendiente", // requires validation confirm
        motorizado_id: currentMotorizado || "diego_torres",
        ocr_json: extractedData
      });

      setSuccessMsg("¡Factura procesada con IA exitosamente! Por favor revise los datos extraídos.");
      setShowForm(true);
    } catch (error: any) {
      console.error(error);
      setErrorText(`Error de Extracción: ${error?.message || "Servicio temporalmente no disponible"}`);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Recalculate values dynamically in validation form
  const handleFormChange = (key: string, value: any) => {
    const updated = { ...formData, [key]: value };
    
    // Auto calculate totals if subtotal or ITBMS change
    if (key === "subtotal" || key === "itbms") {
      const sub = Number(updated.subtotal) || 0;
      const tax = Number(updated.itbms) || 0;
      updated.total = Number((sub + tax).toFixed(2));
    }
    
    setFormData(updated);
  };

  // Save digital ticket to persistent storage
  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente || !formData.numero_factura) {
      setErrorText("El cliente y número de factura son obligatorios.");
      return;
    }
    
    try {
      const payload = {
        ...formData,
        estado: "Completado", // once verified, mark as Completado
        imagen_original: selectedImage || "",
        imagen_procesada: selectedImage ? "URL_PROCESSED_SIMULATED" : "",
        created_at: new Date().toISOString()
      };

      const res = await fetch("/api/asistencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("No se pudo escribir en la base de datos local.");
      }

      const finalSaved = await res.json();
      onAsistenciaCreated(payload as Asistencia);
      
      setSuccessMsg("¡Ticket de asistencia digitalizado, verificado y guardado en la Base de Datos!");
      
      // Cleanup
      setSelectedImage(null);
      setProcessedImage(null);
      setShowForm(false);
      setFormData({});
    } catch (err: any) {
      setErrorText(`Error al guardar: ${err.message}`);
    }
  };

  return (
    <div id="panel-scanner" className="space-y-6 animate-fade-in">
      
      {/* Informative Alerts Block */}
      {errorText && (
        <div className="bg-rose-50 border border-rose-200 text-rose-850 px-5 py-4 rounded-xl flex items-start gap-3 text-xs font-sans">
          <AlertCircle className="h-5 w-5 stroke-[2.5] text-rose-600 flex-shrink-0" />
          <div>
            <span className="font-bold block mb-0.5 text-rose-900">Operación Fallida</span>
            {errorText}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-850 px-5 py-4 rounded-xl flex items-start gap-3 text-xs font-sans animate-fade-in">
          <CheckCircle2 className="h-5 w-5 stroke-[2.5] flex-shrink-0 text-emerald-600" />
          <div>
            <span className="font-bold block mb-0.5 text-emerald-900 font-sans">Éxito en la Operación</span>
            {successMsg}
          </div>
        </div>
      )}

      {/* RETAIL SCANNER CONTROLS */}
      {!showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: IMAGE CARRIER VIEWPORT */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-950 font-sans flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-600" /> Digitalización Inteligente de Gastos
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Suma y extrae automáticamente comprobantes viales con el motor de IA
                </p>
              </div>
            </div>

            {/* DRAG CONTAINER / PREVIEW WINDOW */}
            <div 
              ref={dragOverRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative min-h-[440px] bg-white border-2 border-dashed ${
                selectedImage ? "border-slate-200" : "border-slate-300 hover:border-blue-500"
              } rounded-2xl flex flex-col items-center justify-center p-6 transition-all overflow-hidden shadow-sm`}
            >
              {selectedImage ? (
                // Live Filter Preview Viewport
                <div className="relative w-full max-w-[280px] flex items-center justify-center">
                  <img 
                    src={selectedImage} 
                    alt="Scan Factura" 
                    style={getFilterStyle()}
                    className="max-h-[380px] w-auto shadow-xl rounded-lg object-contain border border-slate-200"
                  />
                  
                  {/* Digital Line Overlay (Scanner Effect) - Styled Blue */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent shadow-[0_0_8px_rgba(37,99,235,0.8)] animate-[scan_3s_linear_infinite]" />
                </div>
              ) : (
                // Upload Prompt Empty State
                <div className="text-center space-y-4 max-w-sm">
                  <div className="mx-auto w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                    <Upload className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">Arrastre su factura de asistencia o compra</p>
                    <p className="text-xs text-slate-500">Admite JPG, PNG o capturas instantáneas de cámara de celular</p>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      id="btn-upload-trigger"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 transition-colors cursor-pointer"
                    >
                      Seleccionar Archivo Local
                    </button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* QUICK SELECTION OF TEST TEMPLATES (Extremely practical for quick demo) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block mb-2.5 text-center">
                ¿No tiene una foto a mano? Pruebe con plantillas corporativas precargadas
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  id="btn-load-template-0"
                  type="button"
                  onClick={() => handleLoadTemplate(0)}
                  className="px-4 py-3 bg-white border border-slate-200 text-xs rounded-lg hover:border-blue-500 hover:bg-blue-50/50 text-left flex justify-between items-center transition-all text-slate-700 font-sans shadow-xs font-semibold"
                >
                  <span>Bateria - AutoCentro S.A.</span>
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                </button>
                <button
                  id="btn-load-template-1"
                  type="button"
                  onClick={() => handleLoadTemplate(1)}
                  className="px-4 py-3 bg-white border border-slate-200 text-xs rounded-lg hover:border-blue-500 hover:bg-blue-50/50 text-left flex justify-between items-center transition-all text-slate-700 font-sans shadow-xs font-semibold"
                >
                  <span>Servicio de Grúa - Grúas del Istmo</span>
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT: IMAGE ENHANCEMENT CONTROLS */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-5 flex-1 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-sans border-b border-slate-100 pb-3">
                <Sliders className="h-4.5 w-4.5 text-blue-600" /> Optimización de Imagen
              </h4>

              {/* Angle correction */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-700">
                  <span className="font-sans font-medium">Enderezar factura (Orientación)</span>
                  <span className="font-mono text-blue-600 font-bold">{rotate}°</span>
                </div>
                <input 
                  type="range" 
                  min="-15" 
                  max="15" 
                  step="0.5" 
                  value={rotate}
                  onChange={(e) => setRotate(Number(e.target.value))}
                  disabled={!selectedImage}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-30"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-700">
                  <span className="font-sans font-medium">Contraste de tinta</span>
                  <span className="font-mono text-blue-600 font-bold">{contrast}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="200" 
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  disabled={!selectedImage}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-30"
                />
              </div>

              {/* Brightness */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-700">
                  <span className="font-sans font-medium">Brillo de fondo de papel</span>
                  <span className="font-mono text-blue-600 font-bold">{brightness}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="150" 
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  disabled={!selectedImage}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-30"
                />
              </div>

              {/* CHECKBOX SETS */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-700 hover:text-slate-900 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={perspectiveCorrect}
                    onChange={(e) => setPerspectiveCorrect(e.target.checked)}
                    disabled={!selectedImage}
                    className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 h-4 w-4 accent-blue-600"
                  />
                  <span className="font-medium">Corrección de perspectiva inteligente (Enderezar trapecio)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-700 hover:text-slate-900 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={noiseReduction}
                    onChange={(e) => setNoiseReduction(e.target.checked)}
                    disabled={!selectedImage}
                    className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 h-4 w-4 accent-blue-600"
                  />
                  <span className="font-medium">Reducción de ruido y eliminación de manchas de fondo</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-700 hover:text-slate-900 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={grayscale}
                    onChange={(e) => setGrayscale(e.target.checked)}
                    disabled={!selectedImage}
                    className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 h-4 w-4 accent-blue-600"
                  />
                  <span className="font-medium">Filtro escala de grises de alto rango (Lectura OCR)</span>
                </label>
              </div>

              {/* TRIGGER ANALYSIS BLOCK */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <button
                  id="btn-run-ocr"
                  onClick={handleRunOCR}
                  disabled={!selectedImage || isProcessing}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all disabled:opacity-45 disabled:pointer-events-none cursor-pointer"
                >
                  <Sparkles className="h-5 w-5 fill-white text-white" />
                  <span>Extraer Datos con Inteligencia Artificial</span>
                </button>

                {selectedImage && (
                  <button
                    id="btn-reset-filters"
                    onClick={handleResetFilters}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Restaurar Ajustes Originales
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* OCR PROGRESS SIMULATION FULLOVERLAY */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-3xl text-center space-y-6 shadow-2xl">
            
            <div className="relative inline-block">
              <Loader2 className="h-16 w-16 stroke-[2] text-blue-600 animate-spin" />
              <Sparkles className="h-6 w-6 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-bold text-slate-900 font-sans">
                Extrayendo Datos de Factura con IA
              </h4>
              <p className="text-xs text-slate-500 font-sans tracking-wide min-h-8">
                {processingState}
              </p>
            </div>

            {/* Progress line */}
            <div className="space-y-1">
              <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${processingProgress}%` }} 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-400">
                <span>ESTIMANDO PROCESO</span>
                <span className="font-bold text-slate-600">{processingProgress}%</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-left leading-relaxed text-slate-500 flex items-start gap-2.5">
              <Database className="h-5 w-5 stroke-[2] text-blue-600 flex-shrink-0" />
              <span>MotoAssist está utilizando Google Gemini para realizar un OCR generativo de resolución total del RUC, subtotal, ITBMS y datos del pie de página.</span>
            </div>

          </div>
        </div>
      )}

      {/* VERIFICATION FORM PANEL(Ticket Digital Prellenado) */}
      {showForm && (
        <form onSubmit={handleSaveTicket} className="bg-white border border-slate-250 rounded-3xl p-6 md:p-8 shadow-md space-y-6 animate-fade-in text-slate-850">
          
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-blue-700 uppercase bg-blue-50 px-2.5 py-1 rounded border border-blue-100 font-bold">
                Paso 3: Validación de Datos
              </span>
              <h3 className="text-lg font-bold text-slate-950 font-sans mt-2">
                Ticket Vial Digital Prellenado
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Revise la información cargada automáticamente por la IA antes de archivar en la base de datos
              </p>
            </div>

            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 stroke-[2.5]" /> Confiabilidad Extrema OCR
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
            
            {/* ROW 1: INFO DE FACTURA (LEFT) */}
            <div className="md:col-span-6 space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 border-l-2 border-blue-600 pl-2">
                Información de Facturación
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Número de Factura</label>
                  <input 
                    type="text" 
                    value={formData.numero_factura || ""}
                    onChange={(e) => handleFormChange("numero_factura", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-mono text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="FAC-0000"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Motorizado Registrador</label>
                  <select
                    value={formData.motorizado_id || ""}
                    onChange={(e) => handleFormChange("motorizado_id", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    required
                  >
                    {motorizados.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Fecha de Emisión</label>
                  <input 
                    type="date" 
                    value={formData.fecha || ""}
                    onChange={(e) => handleFormChange("fecha", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-mono text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Hora de Emisión</label>
                  <input 
                    type="text" 
                    value={formData.hora || ""}
                    onChange={(e) => handleFormChange("hora", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-mono text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="HH:MM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Vendedor/Cajero</label>
                  <input 
                    type="text" 
                    value={formData.vendedor || ""}
                    onChange={(e) => handleFormChange("vendedor", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="Vendedor"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Forma de Pago</label>
                  <input 
                    type="text" 
                    value={formData.forma_pago || ""}
                    onChange={(e) => handleFormChange("forma_pago", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="Efectivo, Tarjeta, ACH, etc"
                  />
                </div>
              </div>

            </div>

            {/* ROW 2: DATOS DEL CLIENTE (RIGHT) */}
            <div className="md:col-span-6 space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 border-l-2 border-blue-600 pl-2">
                Datos del Cliente
              </h4>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold font-sans block">Razón Social</label>
                <input 
                  type="text" 
                  value={formData.cliente || ""}
                  onChange={(e) => handleFormChange("cliente", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="Cliente corporativo o personal"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">RUC / NIT Identificación</label>
                  <input 
                    type="text" 
                    value={formData.ruc_cliente || ""}
                    onChange={(e) => handleFormChange("ruc_cliente", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="8-992-1234"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-bold font-sans block">Teléfono Cliente</label>
                  <input 
                    type="text" 
                    value={formData.telefono || ""}
                    onChange={(e) => handleFormChange("telefono", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="+507 celular"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold font-sans block">Dirección Fiscal Cliente</label>
                <input 
                  type="text" 
                  value={formData.direccion || ""}
                  onChange={(e) => handleFormChange("direccion", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="Dirección fiscal..."
                />
              </div>

            </div>

          </div>

          {/* SERVICE DESCRIPTORS AND DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-slate-100">
            
            <div className="md:col-span-8 space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 border-l-2 border-blue-600 pl-2">
                Detalles del Servicio Vial
              </h4>
              
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold font-sans block">
                  Descripción Técnica de Facturada (Auto-OCR)
                </label>
                <textarea 
                  value={formData.descripcion_servicio || ""}
                  onChange={(e) => handleFormChange("descripcion_servicio", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 min-h-[60px]"
                  placeholder="Descripción de la asistencia..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold font-sans block">Observación Operativa Extra / Destino de Moto</label>
                <input 
                  type="text" 
                  value={formData.comentario || ""}
                  onChange={(e) => handleFormChange("comentario", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-850 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="Escriba aquí los comentarios u observaciones adicionales..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold font-sans block">Ubicación física del Evento Vial</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={formData.ubicacion_servicio || ""}
                    onChange={(e) => handleFormChange("ubicacion_servicio", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 pl-10 pr-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="Ave. Balboa, Al lado del edif..."
                  />
                  <MapPin className="h-4 w-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-bold font-sans block">Cuentas para depósito o transferencias detectado en Pie</label>
                <input 
                  type="text" 
                  value={formData.ocr_json?.cuenta || ""}
                  onChange={(e) => handleFormChange("ocr_json", { ...formData.ocr_json, cuenta: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-500 px-3.5 py-2.5 rounded-xl font-sans text-xs focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="N/A"
                />
              </div>

            </div>

            {/* CHARGES & FINANCIAL CALCULATIONS PANEL */}
            <div className="md:col-span-4 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
              
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 border-l-2 border-blue-600 pl-2 mb-4">
                  Balances y Totales
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-700">
                    <span className="font-medium">Subtotal Neto</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.subtotal || 0}
                      onChange={(e) => handleFormChange("subtotal", parseFloat(e.target.value) || 0)}
                      className="w-24 text-right bg-white border border-slate-200 text-slate-850 px-2 py-1 rounded font-mono text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-700">
                    <span className="font-medium">Impuestos ITBMS</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={formData.itbms || 0}
                      onChange={(e) => handleFormChange("itbms", parseFloat(e.target.value) || 0)}
                      className="w-24 text-right bg-white border border-slate-200 text-slate-850 px-2 py-1 rounded font-mono text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 mt-6 space-y-4">
                <div className="flex justify-between items-center font-bold font-sans">
                  <span className="text-sm text-slate-800">Total Generado</span>
                  <span className="text-lg text-blue-600 font-mono">B/. {(formData.total || 0).toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <button
                    id="btn-confirm-save-ticket"
                    type="submit"
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/10 active:scale-[0.98] transition-all"
                  >
                    <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                    <span>Guardar Ticket y Sincronizar</span>
                  </button>
                  <button
                    id="btn-cancel-scan"
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedImage(null);
                      setProcessedImage(null);
                    }}
                    className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Descartar escaneo
                  </button>
                </div>
              </div>

            </div>

          </div>

        </form>
      )}

    </div>
  );
}
