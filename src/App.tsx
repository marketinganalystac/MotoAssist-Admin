import { useState, useEffect } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import InvoiceScanner from "./components/InvoiceScanner";
import TicketsTable from "./components/TicketsTable";
import MotorizadosCatalog from "./components/MotorizadosCatalog";
import { Asistencia, Motorizado } from "./types";
import { 
  Camera, 
  Layers, 
  Users, 
  BarChart3, 
  ListTodo,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Calendar,
  Coins,
  FileCheck,
  FileClock
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"scan" | "tickets" | "motorizados" | "charts">("scan");
  const [motorizados, setMotorizados] = useState<Motorizado[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [currentMotorizado, setCurrentMotorizado] = useState<string>("diego_torres");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Sync API States
  const fetchData = async () => {
    try {
      const motoRes = await fetch("/api/motorizados");
      const astRes = await fetch("/api/asistencias");
      if (!motoRes.ok || !astRes.ok) {
        throw new Error("No se pudo obtener la información de asistencia vial del servidor.");
      }
      const motoData = await motoRes.json();
      const astData = await astRes.json();

      setMotorizados(motoData);
      setAsistencias(astData);
      setErrorText(null);
    } catch (err: any) {
      console.error(err);
      setErrorText("Error de sincronización con la base de datos local. Verifique la consola.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup micro polling loop to simulate beautiful Supabase Realtime updates perfectly
    const pollInterval = setInterval(() => {
      fetchData();
    }, 6000);

    return () => clearInterval(pollInterval);
  }, []);

  // Update on creation
  const handleAsistenciaCreated = (newAst: Asistencia) => {
    // Optimistic fast refresh
    setAsistencias(prev => [newAst, ...prev]);
    fetchData(); // pull verified recalculations from backend
  };

  const handleAddMotorizado = (newMoto: Motorizado) => {
    setMotorizados(prev => [...prev, newMoto]);
    fetchData();
  };

  // Pre-calculations for Top-Level Metrics
  const summaryMetrics = (() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const hoyCount = asistencias.filter(a => a.fecha === todayStr).length;
    
    // total amount
    const totalFacturado = asistencias
      .filter(a => a.estado === "Completado")
      .reduce((sum, a) => sum + (Number(a.total) || 0), 0);
    
    const completados = asistencias.filter(a => a.estado === "Completado").length;
    const pendientes = asistencias.filter(a => a.estado === "Pendiente").length;

    return {
      hoyCount,
      totalFacturado,
      completados,
      pendientes
    };
  })();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 md:min-h-screen">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Zap className="h-5 w-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white">MotoAssist</span>
              <span className="text-[9px] uppercase font-mono tracking-widest bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Asistencia & Facturas IA</p>
          </div>
        </div>

        {/* Navigation Actions */}
        <nav className="flex-1 py-6 px-4 space-y-1.5">
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Principal
          </div>
          
          <button
            id="tab-scan"
            onClick={() => setActiveTab("scan")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "scan"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Digitalizar Factura (IA)</span>
          </button>

          <button
            id="tab-tickets"
            onClick={() => setActiveTab("tickets")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "tickets"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span>Control de Asistencias</span>
          </button>

          <button
            id="tab-motorizados"
            onClick={() => setActiveTab("motorizados")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "motorizados"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Flota Motorizados</span>
          </button>

          <button
            id="tab-charts"
            onClick={() => setActiveTab("charts")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "charts"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Reportes & Tendencias</span>
          </button>
        </nav>

        {/* Sidebar Footer Session Control */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-2 px-1">
            Operador de Turno
          </div>
          <select
            value={currentMotorizado}
            onChange={(e) => setCurrentMotorizado(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-blue-500 font-sans"
          >
            <option value="">-- Sin Conductor --</option>
            {motorizados.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
          {currentMotorizado && (
            <div className="mt-3 flex items-center gap-2 px-1 text-[11px] text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>Sesión Activa</span>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN LAYOUT CANVAS */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Header bar */}
        <Header 
          currentMotorizado={currentMotorizado}
          onSelectMotorizado={(id) => setCurrentMotorizado(id)}
          motorizados={motorizados}
        />

        {/* Content Container */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">

          {/* Database Status fallback */}
          {errorText && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex items-center gap-3 font-medium animate-fade-in shadow-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <span>Sincronizando estado remoto: {errorText}</span>
            </div>
          )}

          {/* 2. CORPORATE CORE INDICATORS BAR (Professional light-mode shadow bento grid) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition-all relative overflow-hidden group">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Servicios del Día</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-950">{summaryMetrics.hoyCount}</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full">Actualizado</span>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 -z-0 opacity-10 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition-all relative overflow-hidden group">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Recaudado</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-950">B/. {summaryMetrics.totalFacturado.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">En USD</span>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 -z-0 opacity-10 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition-all relative overflow-hidden group">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Tickets Completados</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-920">{summaryMetrics.completados}</span>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">Archivados</span>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 rounded-full -mr-12 -mt-12 -z-0 opacity-10 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition-all relative overflow-hidden group">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Estado de Auditoría</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-amber-600">{summaryMetrics.pendientes} pendientes</span>
                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full">OCR</span>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 -z-0 opacity-10 group-hover:scale-110 transition-transform"></div>
            </div>

          </section>

          {/* 4. ACTIVE VIEWPORT */}
          <section className="min-h-[520px]">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="relative">
                  <span className="flex h-3 w-3 absolute top-0 right-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-xs text-slate-500 font-mono tracking-wide">Cargando base de datos Firestore y sincronizando tablas...</p>
              </div>
            ) : (
              <div className="transition-all duration-200">
                
                {activeTab === "scan" && (
                  <InvoiceScanner 
                    motorizados={motorizados}
                    currentMotorizado={currentMotorizado}
                    onAsistenciaCreated={handleAsistenciaCreated}
                  />
                )}

                {activeTab === "tickets" && (
                  <TicketsTable 
                    asistencias={asistencias}
                    motorizados={motorizados}
                  />
                )}

                {activeTab === "motorizados" && (
                  <MotorizadosCatalog 
                    motorizados={motorizados}
                    onAddMotorizado={handleAddMotorizado}
                  />
                )}

                {activeTab === "charts" && (
                  <Dashboard 
                    asistencias={asistencias}
                    motorizados={motorizados}
                  />
                )}

              </div>
            )}

          </section>

        </main>

        {/* FOOTER STATEMENTS */}
        <footer className="border-t border-slate-200 py-6 mt-12 bg-white text-slate-500 font-sans text-[11px] text-center space-y-1 block relative">
          <p className="font-medium text-slate-600">&copy; 2026 MotoAssist Corporation S.A. Todos los derechos reservados.</p>
          <p className="max-w-md mx-auto text-slate-400 leading-normal">
            Motor de extracción automatizada de facturas y control vial impulsado por Google Gemini 3.5 Flash en español, integrado con Firebase Firestore.
          </p>
        </footer>

      </div>

    </div>
  );
}
