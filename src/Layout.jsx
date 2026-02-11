import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  LayoutDashboard, Car, Users, Wrench, FileText, 
  BarChart3, Menu, X, LogOut, ChevronRight, Building2, MapPin, UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Si el usuario no tiene company_id, es super admin
  const isSuperAdmin = !user?.company_id;

  // Menú para Super Admin
  const superAdminItems = [
    { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
    { name: "Mi Perfil", icon: UserCog, page: "Profile" },
    { name: "Empresas", icon: Building2, page: "Companies" },
    { name: "Administradores", icon: UserCog, page: "CompanyAdmins" },
    { name: "Locaciones", icon: MapPin, page: "Locations" },
    { name: "Vehículos", icon: Car, page: "Vehicles" },
    { name: "Conductores", icon: Users, page: "Drivers" },
    { name: "Mantenimiento", icon: Wrench, page: "Maintenance" },
    { name: "Documentos", icon: FileText, page: "Documents" },
    { name: "Reportes", icon: BarChart3, page: "Reports" },
  ];

  // Menú para Admin de Empresa
  const companyAdminItems = [
    { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
    { name: "Locaciones", icon: MapPin, page: "Locations" },
    { name: "Vehículos", icon: Car, page: "Vehicles" },
    { name: "Conductores", icon: Users, page: "Drivers" },
    { name: "Mantenimiento", icon: Wrench, page: "Maintenance" },
    { name: "Documentos", icon: FileText, page: "Documents" },
    { name: "Reportes", icon: BarChart3, page: "Reports" },
  ];

  const navItems = isSuperAdmin ? superAdminItems : companyAdminItems;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            {user?.logo_url ? (
              <img 
                src={user.logo_url} 
                alt="Logo" 
                className="w-8 h-8 rounded-lg object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                <Car className="w-5 h-5 text-black" />
              </div>
            )}
            <span className="text-lg font-bold text-white">Mass Effect ERP</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800",
        "transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
            {user?.logo_url ? (
              <img 
                src={user.logo_url} 
                alt="Logo" 
                className="w-10 h-10 rounded-xl object-contain"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Car className="w-6 h-6 text-black" />
              </div>
            )}
            <div>
              <span className="text-lg font-bold text-white">Mass Effect</span>
              <p className="text-xs text-slate-500">
                {isSuperAdmin ? "Super Admin" : "Gestión de Flotas"}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-yellow-500/10 text-yellow-400 shadow-sm" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-yellow-400" : "text-slate-500"
                  )} />
                  <span>{item.name}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto text-yellow-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          {user && (
            <div className="p-4 border-t border-slate-800">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                    <Avatar className="w-10 h-10 border-2 border-slate-700">
                      <AvatarFallback className="bg-yellow-500/10 text-yellow-400 font-medium">
                        {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-white truncate">
                        {user.full_name || 'Usuario'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-slate-800 border-slate-700"
                >
                  <DropdownMenuItem 
                    className="text-slate-300 focus:bg-slate-700 focus:text-white cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={cn(
        "lg:pl-72 pt-16 lg:pt-0 min-h-screen transition-all duration-300"
      )}>
        {children}
      </main>
    </div>
  );
}