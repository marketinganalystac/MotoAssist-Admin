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
  FileClock,
  Menu,
  X
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"scan" | "tickets" | "motorizados" | "charts">("scan");
  const [motorizados, setMotorizados] = useState<Motorizado[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [currentMotorizado, setCurrentMotorizado] = useState<string>("diego_torres");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Sync API States
  const fetchData = async () => {
    try {
      const [motoRes, astRes] = await Promise.all([
        fetch("/api/motorizados"),
        fetch("/api/asistencias")
      ]);
      
      if (!motoRes.ok || !astRes.ok) {
        throw new Error("No se pudo obtener la información de asistencia vial del servidor.");
      }
      
      const [motoData, astData] = await Promise.all([
        motoRes.json(),
        astRes.json()
      ]);

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

  const handleAsistenciaDeleted = async (id: string) => {
    try {
      const res = await fetch(`/api/asistencias/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setAsistencias(prev => prev.filter(a => a.id !== id));
        fetchData();
        setErrorText(null);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorText(errJson.error || "No se pudo eliminar el registro de asistencia del servidor.");
        console.error("No se pudo eliminar el registro de asistencia del servidor:", errJson);
      }
    } catch (err: any) {
      setErrorText("Error al borrar asistencia: " + (err?.message || String(err)));
      console.error("Error al borrar asistencia de forma remota:", err);
    }
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col md:flex-row antialiased selection:bg-amber-500 selection:text-navi-950">
      
      {/* MOBILE HEADER (Only visible on small devices) */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 bg-navi-950 text-white sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            id="btn-toggle-mobile-menu"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 hover:bg-navi-900 rounded-lg transition-colors focus:outline-none"
            title="Abrir menú"
          >
            <Menu className="h-5.5 w-5.5 text-white" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-white">MotoAssist</span>
            <span className="text-[8px] uppercase font-mono tracking-widest bg-amber-500 text-navi-950 px-1 rounded font-extrabold">
              PRO
            </span>
          </div>
        </div>
        <div className="text-[10px] text-amber-500 font-mono font-bold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
          IA ACTIVA
        </div>
      </div>

      {/* MOBILE DRAWER SIDEBAR OVERLAY */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Drawer Panel */}
          <div 
            className="w-72 max-w-[80vw] bg-navi-950 text-white h-full flex flex-col shadow-2xl relative border-r border-navi-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Close */}
            <div className="p-5 flex items-center justify-between border-b border-navi-900">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center shadow-md">
                  <Zap className="h-4.5 w-4.5 text-navi-950 stroke-[2.5]" />
                </div>
                <span className="text-base font-bold text-white">MotoAssist</span>
              </div>
              <button
                id="btn-close-mobile-menu"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 hover:bg-navi-900 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Navigation Actions */}
            <nav className="flex-1 py-5 px-4 space-y-1.5 overflow-y-auto">
              <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Principal
              </div>
              
              <button
                id="mob-tab-scan"
                onClick={() => {
                  setActiveTab("scan");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "scan"
                    ? "bg-amber-500 text-navi-950 shadow-lg"
                    : "text-slate-400 hover:bg-navi-900 hover:text-white"
                }`}
              >
                <Camera className="h-4 w-4" />
                <span>Digitalizar Factura (IA)</span>
              </button>

              <button
                id="mob-tab-tickets"
                onClick={() => {
                  setActiveTab("tickets");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "tickets"
                    ? "bg-amber-500 text-navi-950 shadow-lg"
                    : "text-slate-400 hover:bg-navi-900 hover:text-white"
                }`}
              >
                <ListTodo className="h-4 w-4" />
                <span>Control de Asistencias</span>
              </button>

              <button
                id="mob-tab-motorizados"
                onClick={() => {
                  setActiveTab("motorizados");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "motorizados"
                    ? "bg-amber-500 text-navi-950 shadow-lg"
                    : "text-slate-400 hover:bg-navi-900 hover:text-white"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Flota Motorizados</span>
              </button>

              <button
                id="mob-tab-charts"
                onClick={() => {
                  setActiveTab("charts");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "charts"
                    ? "bg-amber-500 text-navi-950 shadow-lg"
                    : "text-slate-400 hover:bg-navi-900 hover:text-white"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Reportes & Tendencias</span>
              </button>
            </nav>

            {/* Operator selector inside mobile drawer */}
            <div className="p-4 border-t border-navi-900 bg-navi-950/40">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-2 px-1">
                Operador de Turno
              </div>
              <select
                value={currentMotorizado}
                onChange={(e) => {
                  setCurrentMotorizado(e.target.value);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-navi-900 border border-navi-800 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500 font-sans text-white"
              >
                <option value="">-- Sin Conductor --</option>
                {motorizados.map(m => (
                  <option key={m.id} value={m.id} className="text-slate-800">{m.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT DESKTOP SIDEBAR NAVIGATION PANEL (Only visible on md screens & up) */}
      <aside className="hidden md:flex w-64 bg-navi-950 text-white flex-col shrink-0 border-r border-navi-900 min-h-screen">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-navi-900">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Zap className="h-5 w-5 text-navi-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white">MotoAssist</span>
              <span className="text-[9px] uppercase font-mono tracking-widest bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/25">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Asistencia & Facturas IA</p>
          </div>
        </div>

        {/* Navigation Actions */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 font-sans">
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Principal
          </div>
          
          <button
            id="tab-scan"
            onClick={() => {
              if (activeTab !== "scan") {
                setActiveTab("scan");
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "scan"
                ? "bg-amber-500 text-navi-950 shadow-lg shadow-amber-500/10"
                : "text-slate-400 hover:bg-navi-900 hover:text-white"
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Digitalizar Factura (IA)</span>
          </button>

          <button
            id="tab-tickets"
            onClick={() => {
              if (activeTab !== "tickets") {
                setActiveTab("tickets");
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "tickets"
                ? "bg-amber-500 text-navi-950 shadow-lg shadow-amber-500/10"
                : "text-slate-400 hover:bg-navi-900 hover:text-white"
            }`}
          >
            <ListTodo className="h-4 w-4" />
            <span>Control de Asistencias</span>
          </button>

          <button
            id="tab-motorizados"
            onClick={() => {
              if (activeTab !== "motorizados") {
                setActiveTab("motorizados");
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "motorizados"
                ? "bg-amber-500 text-navi-950 shadow-lg shadow-amber-500/10"
                : "text-slate-400 hover:bg-navi-900 hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Flota Motorizados</span>
          </button>

          <button
            id="tab-charts"
            onClick={() => {
              if (activeTab !== "charts") {
                setActiveTab("charts");
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "charts"
                ? "bg-amber-500 text-navi-950 shadow-lg shadow-amber-500/10"
                : "text-slate-400 hover:bg-navi-900 hover:text-white"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Reportes & Tendencias</span>
          </button>
        </nav>

        {/* Desktop Sidebar Footer Session Control */}
        <div className="p-4 border-t border-navi-900 bg-navi-950/40">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-2 px-1">
            Operador de Turno
          </div>
          <select
            value={currentMotorizado}
            onChange={(e) => {
              setCurrentMotorizado(e.target.value);
            }}
            className="w-full bg-navi-900 border border-navi-800 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500 font-sans cursor-pointer text-white"
          >
            <option value="" className="text-slate-800">-- Sin Conductor --</option>
            {motorizados.map(m => (
              <option key={m.id} value={m.id} className="text-slate-800">{m.nombre}</option>
            ))}
          </select>
          {currentMotorizado && (
            <div className="mt-3 flex items-center gap-2 px-1 text-[11px] text-amber-500">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
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
          onSelectMotorizado={(id) => {
            setCurrentMotorizado(id);
          }}
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
                <span className="text-[10px] bg-navi-50 text-navi-700 font-bold px-2 py-0.5 rounded-full">Actualizado</span>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-navi-50 rounded-full -mr-12 -mt-12 -z-0 opacity-10 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition-all relative overflow-hidden group">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Recaudado</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-950">B/. {summaryMetrics.totalFacturado.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full">En USD</span>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 -z-0 opacity-10 group-hover:scale-110 transition-transform"></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow transition-all relative overflow-hidden group">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Tickets Completados</span>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-920">{summaryMetrics.completados}</span>
                <span className="text-[10px] bg-navi-50 text-navi-700 font-bold px-2 py-0.5 rounded-full">Archivados</span>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-navi-50 rounded-full -mr-12 -mt-12 -z-0 opacity-10 group-hover:scale-110 transition-transform"></div>
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
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <div className="w-12 h-12 border-4 border-navi-100 border-t-amber-500 rounded-full animate-spin"></div>
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
                    onDeleteAsistencia={handleAsistenciaDeleted}
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

      </div>

    </div>
  );
}
