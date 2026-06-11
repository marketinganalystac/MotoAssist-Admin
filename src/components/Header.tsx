import { LogIn, LogOut, Zap, CheckCircle2 } from "lucide-react";

interface HeaderProps {
  currentMotorizado: string;
  onSelectMotorizado: (id: string) => void;
  motorizados: Array<{ id: string; nombre: string; estado: string }>;
}


export default function Header({
  currentMotorizado,
  onSelectMotorizado,
  motorizados,
}: HeaderProps) {
  const currentMotoObj = motorizados.find((m) => m.id === currentMotorizado);

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 md:px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      
      {/* Dynamic Title */}
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight font-sans flex items-center gap-2">
          Monitoreo Vial Activo
        </h1>
        <p className="text-[11px] text-slate-500 font-sans tracking-wide">
          Automatización de Cuentas por Cobrar & Rendición de Gastos
        </p>
      </div>

      {/* Realtime Connection status of Firestore DB */}
      <div className="flex items-center gap-4">
        
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-100 px-3.5 py-1.5 rounded-xl text-xs font-semibold">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>Google Firestore Conectado</span>
        </div>

        {currentMotoObj ? (
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                Despachador
              </span>
              <span className="text-xs font-bold text-slate-800 block leading-tight">
                {currentMotoObj.nombre}
              </span>
            </div>
            <button
              id="header-logout"
              onClick={() => onSelectMotorizado("")}
              title="Cerrar sesión"
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl italic">
            Sin conductor asignado
          </div>
        )}

      </div>

    </header>
  );
}
