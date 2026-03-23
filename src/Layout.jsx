import React, { useState, useEffect, createContext, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard, Car, Users, Wrench, FileText,
  BarChart3, Menu, X, LogOut, ChevronRight, ChevronDown, Building2, MapPin, UserCog, Sun, Moon, Upload, Settings, Factory, MapPinned, Cog, ArrowLeft, Wind } from
"lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger } from
"@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";

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
    if (savedTheme) return savedTheme;
    
    // Auto-detect system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContextValue.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContextValue.Provider>);

};

function LayoutContent({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [pageDirection, setPageDirection] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Solo intentar cargar el usuario si no estamos en la LandingPage
    if (currentPageName !== "LandingPage") {
      base44.auth.me().then(setUser).catch(() => {});
    }
    
    // Listen for profile updates
    const handleProfileUpdate = () => {
      base44.auth.me().then(setUser).catch(() => {});
    };
    
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('userProfileUpdated', handleProfileUpdate);
  }, [currentPageName]);

  // Track page changes for transitions
  const prevPageRef = React.useRef(currentPageName);
  useEffect(() => {
    if (prevPageRef.current !== currentPageName) {
      const pageOrder = ['Dashboard', 'Vehicles', 'Drivers', 'Companies', 'Locations', 'Manufacturers', 'VehicleTypes', 'VehicleStatuses', 'Maintenance', 'Documents', 'Reports', 'CompanyAdmins'];
      const prevIndex = pageOrder.indexOf(prevPageRef.current);
      const currentIndex = pageOrder.indexOf(currentPageName);
      setPageDirection(currentIndex > prevIndex ? 1 : -1);
      prevPageRef.current = currentPageName;
    }
  }, [currentPageName]);

  const handleLogout = () => {
    base44.auth.logout(window.location.origin + createPageUrl("LandingPage"));
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

  // Si el usuario no tiene company_id O tiene user_role = 'super_admin', es super admin
  const isSuperAdmin = !user?.company_id || user?.user_role === 'super_admin';

  // Detect if current page is a sub-page
  const subPages = ['Manufacturers', 'VehicleTypes', 'VehicleStatuses', 'VehicleCategories'];
  const isSubPage = subPages.includes(currentPageName);

  const handleBackClick = () => {
    navigate(-1);
  };

  // Si estamos en la landing page, no mostrar el layout
  if (currentPageName === "LandingPage") {
    return <>{children}</>;
  }

  // Menú para Super Admin - Organizado por módulos
  const superAdminMenu = [
  {
    section: null,
    items: [
    { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" }]

  },
  {
    section: "Administración",
    items: [
    { name: "Empresas", icon: Building2, page: "Companies" },
    { name: "Locaciones", icon: MapPin, page: "Locations" },
    { name: "Vehículos", icon: Car, page: "Vehicles" }]

  },
  {
    section: "Personal",
    items: [
    { name: "Administradores", icon: UserCog, page: "CompanyAdmins" },
    { name: "Conductores", icon: Users, page: "Drivers" }]

  },
  {
    section: "Mantenimiento",
    items: [
    { name: "Programas", icon: Wrench, page: "MaintenancePrograms" },
    { name: "Registros", icon: FileText, page: "Maintenance" },
    { name: "Dashboard A/C", icon: Wind, page: "ACDashboard" }]

  },
  {
    section: "Operaciones",
    items: [
    { name: "Documentos", icon: FileText, page: "Documents" },
    { name: "Reportes", icon: BarChart3, page: "Reports" }]

  },
  {
    section: "Configuración",
    items: [
    {
      name: "Empresas",
      icon: Factory,
      isSubmenu: true,
      subItems: [
      { name: "Tipo de industria" }]

    },
    {
      name: "Ubicación",
      icon: MapPinned,
      isSubmenu: true,
      subItems: [
      { name: "Tipo de ubicación" }]

    },
    {
      name: "Vehículos",
      icon: Cog,
      isSubmenu: true,
      subItems: [
      { name: "Categorías", page: "VehicleCategories" },
      { name: "Tipos", page: "VehicleTypes" },
      { name: "Marcas", page: "Manufacturers" },
      { name: "Estados", page: "VehicleStatuses" }]

    }]

  }];


  // Menú para Admin de Empresa - Organizado por módulos
  const companyAdminMenu = [
  {
    section: null,
    items: [
    { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" }]

  },
  {
    section: "Administración",
    items: [
    { name: "Locaciones", icon: MapPin, page: "Locations" },
    { name: "Vehículos", icon: Car, page: "Vehicles" }]

  },
  {
    section: "Personal",
    items: [
    { name: "Conductores", icon: Users, page: "Drivers" }]

  },
  {
    section: "Mantenimiento",
    items: [
    { name: "Programas", icon: Wrench, page: "MaintenancePrograms" },
    { name: "Registros", icon: FileText, page: "Maintenance" },
    { name: "Dashboard A/C", icon: Wind, page: "ACDashboard" }]

  },
  {
    section: "Operaciones",
    items: [
    { name: "Documentos", icon: FileText, page: "Documents" },
    { name: "Reportes", icon: BarChart3, page: "Reports" }]

  }];


  const menuSections = isSuperAdmin ? superAdminMenu : companyAdminMenu;

  return (
    <div className={cn("min-h-screen transition-colors", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
      {/* Desktop Top Bar */}
      <header className="hidden lg:fixed lg:top-0 lg:right-0 lg:left-72 lg:z-50 lg:flex lg:items-center lg:justify-end lg:h-16 lg:px-6 lg:border-b"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderColor: theme === 'dark' ? 'rgb(39, 39, 42)' : 'rgb(229, 231, 235)'
      }}>
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>

            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* User Menu */}
          {user &&
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                "flex items-center gap-3 p-2 rounded-xl transition-colors",
                theme === 'dark' ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-100'
              )}>
                  <Avatar className="w-9 h-9 border-2" style={{ borderColor: theme === 'dark' ? 'rgb(63, 63, 70)' : 'rgb(229, 231, 235)' }}>
                    {user.profile_photo && <AvatarImage src={user.profile_photo} />}
                    <AvatarFallback className={theme === 'dark' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-500/20 text-yellow-600'}>
                      {(user.display_name || user.full_name)?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden xl:block">
                    <p className={cn("text-sm font-medium truncate max-w-32", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                      {user.display_name || user.full_name || 'Usuario'}
                    </p>
                    <p className={cn("text-xs truncate max-w-32", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                      {user.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
              align="end"
              className={cn("w-64", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200')}>

                <div className="px-3 py-2">
                  <p className={cn("text-sm font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                    {user.display_name || user.full_name || 'Usuario'}
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
                    disabled={uploadingPhoto} />

                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingPhoto ? "Subiendo..." : "Cambiar Foto"}
                  </label>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                  to={createPageUrl("Profile")}
                  className={cn("cursor-pointer", theme === 'dark' ? 'text-zinc-300 focus:bg-zinc-700 focus:text-white' : 'text-gray-700 focus:bg-gray-100 focus:text-gray-900')}>

                    <UserCog className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className={theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'} />
                <DropdownMenuItem
                className={cn("cursor-pointer", theme === 'dark' ? 'text-zinc-300 focus:bg-zinc-700 focus:text-white' : 'text-gray-700 focus:bg-gray-100 focus:text-gray-900')}
                onClick={handleLogout}>

                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderColor: theme === 'dark' ? 'rgb(39, 39, 42)' : 'rgb(229, 231, 235)'
      }}>
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            {isSubPage ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackClick}
                className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <>
                {user?.logo_url ?
                <img
                  src={user.logo_url}
                  alt="Logo"
                  className="w-8 h-8 rounded-lg object-contain" /> :


                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
                    <Car className="w-5 h-5 text-black" />
                  </div>
                }
                <span className={cn("text-lg font-bold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                  Mass Soluciones
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>

              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            {!isSubPage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>

                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            )}
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
            {user?.logo_url ?
            <img
              src={user.logo_url}
              alt="Logo"
              className="w-10 h-10 rounded-xl object-contain" /> :


            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Car className="w-6 h-6 text-black" />
              </div>
            }
            <div>
              <span className="text-lg font-bold text-white">Mass Soluciones</span>
              <p className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                {isSuperAdmin ? "Super Admin" : "Gestión de Flotas"}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            {menuSections.map((section, sectionIndex) =>
            <div key={sectionIndex} className={sectionIndex > 0 ? "mt-6" : ""}>
                {section.section &&
              <h3 className={cn(
                "px-4 mb-2 text-xs font-bold uppercase tracking-wider",
                theme === 'dark' ? 'text-zinc-600' : 'text-gray-400'
              )}>
                    {section.section}
                  </h3>
              }
                <div className="space-y-1">
                  {section.items.map((item) => {
                  if (item.isSubmenu) {
                    const isAnySubActive = item.subItems?.some((sub) => sub.page === currentPageName);
                    return (
                      <Collapsible key={item.name} open={configOpen} onOpenChange={setConfigOpen}>
                          <CollapsibleTrigger asChild>
                            <button
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full",
                              theme === 'dark' ?
                              isAnySubActive ? "bg-yellow-500/10 text-yellow-400 shadow-sm" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50" :
                              isAnySubActive ? "bg-yellow-500/10 text-yellow-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            )}>

                              <item.icon className={cn(
                              "w-5 h-5 transition-colors",
                              theme === 'dark' ?
                              isAnySubActive ? "text-yellow-400" : "text-zinc-500" :
                              isAnySubActive ? "text-yellow-600" : "text-gray-500"
                            )} />
                              <span>{item.name}</span>
                              <ChevronDown className={cn(
                              "w-4 h-4 ml-auto transition-transform",
                              configOpen && "rotate-180",
                              theme === 'dark' ?
                              isAnySubActive ? "text-yellow-400" : "text-zinc-500" :
                              isAnySubActive ? "text-yellow-600" : "text-gray-500"
                            )} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-1 space-y-1">
                            {item.subItems?.map((subItem, subIdx) => {
                            if (!subItem.page) {
                              return (
                                <div
                                  key={subIdx}
                                  className={cn(
                                    "flex items-center gap-3 pl-12 pr-4 py-2 rounded-xl text-sm font-medium",
                                    theme === 'dark' ? "text-zinc-500" : "text-gray-400"
                                  )}>

                                    <span>{subItem.name}</span>
                                  </div>);

                            }
                            const isSubActive = currentPageName === subItem.page;
                            return (
                              <Link
                                key={subItem.page}
                                to={createPageUrl(subItem.page)}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  "flex items-center gap-3 pl-12 pr-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                                  theme === 'dark' ?
                                  isSubActive ? "bg-yellow-500/10 text-yellow-400" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50" :
                                  isSubActive ? "bg-yellow-500/10 text-yellow-600" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                )}>

                                  <span>{subItem.name}</span>
                                  {isSubActive &&
                                <ChevronRight className={cn(
                                  "w-4 h-4 ml-auto",
                                  theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                                )} />
                                }
                                </Link>);

                          })}
                          </CollapsibleContent>
                        </Collapsible>);

                  }

                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                        theme === 'dark' ?
                        isActive ? "bg-yellow-500/10 text-yellow-400 shadow-sm" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50" :
                        isActive ? "bg-yellow-500/10 text-yellow-600 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      )}>

                        <item.icon className={cn(
                        "w-5 h-5 transition-colors",
                        theme === 'dark' ?
                        isActive ? "text-yellow-400" : "text-zinc-500" :
                        isActive ? "text-yellow-600" : "text-gray-500"
                      )} />
                        <span>{item.name}</span>
                        {isActive &&
                      <ChevronRight className={cn(
                        "w-4 h-4 ml-auto",
                        theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                      )} />
                      }
                      </Link>);

                })}
                </div>
              </div>
            )}
          </nav>

          {/* User Menu - Mobile Only */}
          {user &&
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
                        {(user.display_name || user.full_name)?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className={cn("text-sm font-medium truncate", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                        {user.display_name || user.full_name || 'Usuario'}
                      </p>
                      <p className={cn("text-xs truncate", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
                        {user.email}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                align="end"
                className={cn("w-56", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200')}>

                  <DropdownMenuItem asChild>
                    <label className={cn("cursor-pointer", theme === 'dark' ? 'text-zinc-300 focus:bg-zinc-700 focus:text-white' : 'text-gray-700 focus:bg-gray-100 focus:text-gray-900')}>
                      <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(e.target.files[0])}
                      disabled={uploadingPhoto} />

                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingPhoto ? "Subiendo..." : "Cambiar Foto"}
                    </label>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                    to={createPageUrl("Profile")}
                    className={cn("cursor-pointer", theme === 'dark' ? 'text-zinc-300 focus:bg-zinc-700 focus:text-white' : 'text-gray-700 focus:bg-gray-100 focus:text-gray-900')}>

                      <UserCog className="w-4 h-4 mr-2" />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200'} />
                  <DropdownMenuItem
                  className={cn("cursor-pointer", theme === 'dark' ? 'text-zinc-300 focus:bg-zinc-700 focus:text-white' : 'text-gray-700 focus:bg-gray-100 focus:text-gray-900')}
                  onClick={handleLogout}>

                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen &&
      <div
        className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        onClick={() => setSidebarOpen(false)} />

      }

      {/* Main Content */}
      <main className={cn(
        "lg:pl-72 pt-16 lg:pt-16 pb-20 lg:pb-0 min-h-screen transition-all duration-300 overflow-hidden"
      )} style={{
        paddingTop: 'max(4rem, env(safe-area-inset-top))',
        paddingBottom: 'max(5rem, env(safe-area-inset-bottom))'
      }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, x: pageDirection > 0 ? 300 : -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: pageDirection > 0 ? -300 : 300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderColor: theme === 'dark' ? 'rgb(39, 39, 42)' : 'rgb(229, 231, 235)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
        <div className="flex items-center justify-around h-16 px-2">
          <button
            onClick={() => {
              if (currentPageName === "Dashboard") {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate(createPageUrl("Dashboard"));
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              currentPageName === "Dashboard"
                ? theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                : theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
            )}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-medium">Inicio</span>
          </button>
          <button
            onClick={() => {
              if (currentPageName === "Vehicles") {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate(createPageUrl("Vehicles"));
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              currentPageName === "Vehicles"
                ? theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                : theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
            )}>
            <Car className="w-5 h-5" />
            <span className="text-xs font-medium">Vehículos</span>
          </button>
          <button
            onClick={() => {
              if (currentPageName === "Drivers") {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate(createPageUrl("Drivers"));
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              currentPageName === "Drivers"
                ? theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                : theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
            )}>
            <Users className="w-5 h-5" />
            <span className="text-xs font-medium">Conductores</span>
          </button>
          <button
            onClick={() => {
              if (currentPageName === "Maintenance") {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate(createPageUrl("Maintenance"));
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              currentPageName === "Maintenance"
                ? theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                : theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
            )}>
            <Wrench className="w-5 h-5" />
            <span className="text-xs font-medium">Mantenimiento</span>
          </button>
        </div>
      </nav>
    </div>);

}

export default function Layout({ children, currentPageName }) {
  return (
    <ThemeProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </ThemeProvider>);

}