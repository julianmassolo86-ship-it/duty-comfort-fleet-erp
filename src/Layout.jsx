import React, { useState, useEffect, createContext, useContext } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  LayoutDashboard, Car, Users, Wrench, FileText, 
  BarChart3, Menu, X, LogOut, ChevronRight, Building2, MapPin, UserCog, Sun, Moon, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { ThemeContextValue } from "@/components/common/ThemeWrapper";

const useTheme = () => {
  const context = useContext(ThemeContextValue);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContextValue.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContextValue.Provider>
  );
};

function LayoutContent({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_photo: file_url });
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Si el usuario no tiene company_id, es super admin
  const isSuperAdmin = !user?.company_id;

  // Menú para Super Admin
  const superAdminItems = [
    { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
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
    <div className={cn("min-h-screen transition-colors", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
      {/* Desktop Top Bar */}
      <header className="hidden lg:fixed lg:top-0 lg:right-0 lg:left-72 lg:z-50 lg:flex lg:items-center lg:justify-end lg:h-16 lg:px-6 lg:border-b lg:backdrop-blur" 
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: theme === 'dark' ? 'rgb(39, 39, 42)' : 'rgb(229, 231, 235)'
        }}>
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-3 p-2 rounded-xl transition-colors",
                  theme === 'dark' ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-100'
                )}>
                  <Avatar className="w-9 h-9 border-2" style={{ borderColor: theme === 'dark' ? 'rgb(63, 63, 70)' : 'rgb(229, 231, 235)' }}>
                    {user.profile_photo && <AvatarImage src={user.profile_photo} />}
                    <AvatarFallback className={theme === 'dark' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-500/20 text-yellow-600'}>
                      {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden xl:block">
                    <p className={cn("text-sm font-medium truncate max-w-32", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                      {user.full_name || 'Usuario'}
                    </p>
                    <p className={cn("text-xs truncate max-w-32", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                      {user.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className={cn("w-64", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200')}
              >
                <div className="px-3 py-2">
                  <p className={cn("text-sm font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                    {user.full_name || 'Usuario'}
                  </p>
                  <p className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator className={theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'} />
                <DropdownMenuItem asChild>
                  <label className={cn("cursor-pointer", theme === 'dark' ? 'text-zinc-300 focus:bg-zinc-700 focus:text-white' : 'text-gray-700 focus:bg-gray-100 focus:text-gray-900')}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e.target.files[0])}
                      disabled={uploadingPhoto}
                    />
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingPhoto ? "Subiendo..." : "Cambiar Foto"}
                  </label>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link 
                    to={createPageUrl("Profile")}
                    className={cn("cursor-pointer", theme === 'dark' ? 'text-zinc-300 focus:bg-zinc-700 focus:text-white' : 'text-gray-700 focus:bg-gray-100 focus:text-gray-900')}
                  >
                    <UserCog className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className={theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'} />
                <DropdownMenuItem 
                  className={cn("cursor-pointer", theme === 'dark' ? 'text-zinc-300 focus:bg-zinc-700 focus:text-white' : 'text-gray-700 focus:bg-gray-100 focus:text-gray-900')}
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur border-b" 
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: theme === 'dark' ? 'rgb(39, 39, 42)' : 'rgb(229, 231, 235)'
        }}>
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
            <span className={cn("text-lg font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
              Mass Effect ERP
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 border-r transition-all",
        "transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{
        backgroundColor: theme === 'dark' ? 'rgb(9, 9, 11)' : 'rgb(255, 255, 255)',
        borderColor: theme === 'dark' ? 'rgb(39, 39, 42)' : 'rgb(229, 231, 235)'
      }}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b" style={{
            borderColor: theme === 'dark' ? 'rgb(39, 39, 42)' : 'rgb(229, 231, 235)'
          }}>
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
              <span className={cn("text-lg font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                Mass Effect
              </span>
              <p className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
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
                    theme === 'dark' 
                      ? (isActive ? "bg-yellow-500/10 text-yellow-400 shadow-sm" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50")
                      : (isActive ? "bg-yellow-500/10 text-yellow-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100")
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    theme === 'dark'
                      ? (isActive ? "text-yellow-400" : "text-zinc-500")
                      : (isActive ? "text-yellow-600" : "text-gray-500")
                  )} />
                  <span>{item.name}</span>
                  {isActive && (
                    <ChevronRight className={cn(
                      "w-4 h-4 ml-auto",
                      theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                    )} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Menu - Mobile Only */}
          {user && (
            <div className="lg:hidden p-4 border-t" style={{
              borderColor: theme === 'dark' ? 'rgb(39, 39, 42)' : 'rgb(229, 231, 235)'
            }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-xl transition-colors",
                    theme === 'dark' ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-100'
                  )}>
                    <Avatar className="w-10 h-10 border-2" style={{
                      borderColor: theme === 'dark' ? 'rgb(63, 63, 70)' : 'rgb(229, 231, 235)'
                    }}>
                      {user.profile_photo && <AvatarImage src={user.profile_photo} />}
                      <AvatarFallback className={theme === 'dark' ? 'bg-yellow-500/10 text-yellow-400 font-medium' : 'bg-yellow-500/20 text-yellow-600 font-medium'}>
                        {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className={cn("text-sm font-medium truncate", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                        {user.full_name || 'Usuario'}
                      </p>
                      <p className={cn("text-xs truncate", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                        {user.email}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className={cn("w-56", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200')}
                >
                  <DropdownMenuItem asChild>
                    <label className={cn("cursor-pointer", theme === 'dark' ? 'text-zinc-300 focus:bg-zinc-700 focus:text-white' : 'text-gray-700 focus:bg-gray-100 focus:text-gray-900')}>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e.target.files[0])}
                        disabled={uploadingPhoto}
                      />
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingPhoto ? "Subiendo..." : "Cambiar Foto"}
                    </label>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      to={createPageUrl("Profile")}
                      className={cn("cursor-pointer", theme === 'dark' ? 'text-zinc-300 focus:bg-zinc-700 focus:text-white' : 'text-gray-700 focus:bg-gray-100 focus:text-gray-900')}
                    >
                      <UserCog className="w-4 h-4 mr-2" />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'} />
                  <DropdownMenuItem 
                    className={cn("cursor-pointer", theme === 'dark' ? 'text-zinc-300 focus:bg-zinc-700 focus:text-white' : 'text-gray-700 focus:bg-gray-100 focus:text-gray-900')}
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
        "lg:pl-72 pt-16 lg:pt-16 min-h-screen transition-all duration-300"
      )}>
        {children}
      </main>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </ThemeProvider>
  );
}