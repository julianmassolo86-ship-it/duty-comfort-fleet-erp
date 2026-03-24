import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";
import PageHeader from "@/components/common/PageHeader";
import NovedadForm from "@/components/novedades/NovedadForm";
import { ClipboardList, CheckSquare } from "lucide-react";

const TABS = [
  { id: "novedades", label: "Registro de Novedades", icon: ClipboardList },
  // Futuros formularios se agregan aquí:
  // { id: "checklist", label: "Checklist Diario", icon: CheckSquare },
];

export default function MantenimientoForms() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("novedades");

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === "dark" ? "bg-black" : "bg-gray-50")}>
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="Formularios de Mantenimiento"
          description="Registrá novedades, inspecciones y otros reportes operativos"
        />

        {/* Tabs */}
        <div className={cn(
          "flex gap-1 p-1 rounded-xl mb-6 w-fit",
          theme === "dark" ? "bg-zinc-900 border border-zinc-800" : "bg-gray-100 border border-gray-200"
        )}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? theme === "dark"
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    : "bg-white text-yellow-600 shadow border border-yellow-500/20"
                  : theme === "dark"
                    ? "text-zinc-400 hover:text-white"
                    : "text-gray-500 hover:text-gray-900"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "novedades" && <NovedadForm />}
      </div>
    </div>
  );
}