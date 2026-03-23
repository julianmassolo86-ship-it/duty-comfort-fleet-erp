import React, { useState } from "react";
import { LayoutDashboard, Car, Users, Wrench, MoreHorizontal, FileText, BarChart3, Wind, MapPin, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPageUrl } from "@/utils";
import BottomSheet from "./BottomSheet";

const PRIMARY_TABS = [
  { name: "Dashboard", label: "Inicio", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Vehicles", label: "Vehículos", icon: Car, page: "Vehicles" },
  { name: "Drivers", label: "Conductores", icon: Users, page: "Drivers" },
  { name: "Maintenance", label: "Mantenim.", icon: Wrench, page: "Maintenance" },
];

const MORE_ITEMS_SUPER = [
  { label: "Empresas", icon: Building2, page: "Companies" },
  { label: "Locaciones", icon: MapPin, page: "Locations" },
  { label: "Dashboard A/C", icon: Wind, page: "ACDashboard" },
  { label: "Documentos", icon: FileText, page: "Documents" },
  { label: "Reportes", icon: BarChart3, page: "Reports" },
];

const MORE_ITEMS_COMPANY = [
  { label: "Dashboard A/C", icon: Wind, page: "ACDashboard" },
  { label: "Documentos", icon: FileText, page: "Documents" },
  { label: "Reportes", icon: BarChart3, page: "Reports" },
];

export default function MobileBottomNav({ currentPageName, theme, navigate, isSuperAdmin }) {
  const [moreOpen, setMoreOpen] = useState(false);

  const moreItems = isSuperAdmin ? MORE_ITEMS_SUPER : MORE_ITEMS_COMPANY;
  const isMoreActive = moreItems.some(i => i.page === currentPageName);

  const handleNav = (page) => {
    setMoreOpen(false);
    if (currentPageName === page) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(createPageUrl(page));
    }
  };

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: theme === 'dark' ? 'rgb(39, 39, 42)' : 'rgb(229, 231, 235)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch justify-around" style={{ minHeight: '60px' }}>
          {PRIMARY_TABS.map(tab => {
            const isActive = currentPageName === tab.page;
            const Icon = tab.icon;
            return (
              <button
                key={tab.page}
                onClick={() => handleNav(tab.page)}
                style={{ minHeight: '60px', minWidth: '44px' }}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-0.5 px-1 transition-colors relative",
                  isActive
                    ? theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                    : theme === 'dark' ? 'text-zinc-500 active:text-zinc-300' : 'text-gray-500 active:text-gray-700'
                )}
              >
                {isActive && (
                  <span
                    className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full",
                      theme === 'dark' ? 'bg-yellow-400' : 'bg-yellow-500'
                    )}
                  />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            style={{ minHeight: '60px', minWidth: '44px' }}
            className={cn(
              "flex flex-col items-center justify-center flex-1 gap-0.5 px-1 transition-colors relative",
              isMoreActive
                ? theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                : theme === 'dark' ? 'text-zinc-500 active:text-zinc-300' : 'text-gray-500 active:text-gray-700'
            )}
          >
            {isMoreActive && (
              <span
                className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full",
                  theme === 'dark' ? 'bg-yellow-400' : 'bg-yellow-500'
                )}
              />
            )}
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">Más</span>
          </button>
        </div>
      </nav>

      {/* "Más" Bottom Sheet */}
      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Más secciones">
        <div className="grid grid-cols-3 gap-3 pb-4">
          {moreItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                style={{ minHeight: '80px' }}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 transition-colors",
                  isActive
                    ? theme === 'dark'
                      ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700'
                    : theme === 'dark'
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300 active:bg-zinc-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 active:bg-gray-100'
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}