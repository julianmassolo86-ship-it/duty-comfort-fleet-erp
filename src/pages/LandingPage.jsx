import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, BarChart3, Shield, Clock, ArrowRight, CheckCircle2, Zap, TrendingUp, Users, Wrench, FileText, MapPin } from 'lucide-react';
import MassLogo from '@/components/common/MassLogo';

export default function LandingPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simplemente verificar si hay sesión sin hacer llamadas que generen 401
    setCheckingAuth(false);
  }, [navigate]);

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.origin + createPageUrl('Dashboard'));
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698ba23f75eb60d9d1b501ef/48afb028d_1.png" 
                alt="Duty Comfort Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <span className="text-xl font-bold text-gray-900">Duty Comfort</span>
                <p className="text-xs text-gray-500">Gestión de Flotas</p>
              </div>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Iniciar Sesión
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-24">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=2070&auto=format&fit=crop" 
            alt="Fleet Management" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40 relative">
          <div className="text-center space-y-8">
            {/* Main Heading */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-full text-yellow-400 font-semibold text-sm shadow-lg">
                <Zap className="w-4 h-4" />
                Sistema de Gestión Integral de Flotas
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight drop-shadow-2xl">
                Control Total
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500 mt-2">
                  de tu Flota
                </span>
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
              Plataforma profesional para gestionar vehículos, conductores, ubicaciones y mantenimiento. 
              <span className="block mt-2 text-yellow-400 font-semibold">Optimiza operaciones y reduce costos en tiempo real.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black text-lg px-12 py-7 rounded-xl shadow-2xl shadow-yellow-500/30 transition-all duration-300 transform hover:scale-105 font-bold"
              >
                Acceder al Sistema
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-20 max-w-5xl mx-auto">
              <div className="text-center backdrop-blur-sm bg-black/30 rounded-2xl p-6 border border-white/10">
                <div className="text-5xl font-bold text-yellow-400 mb-2">+15</div>
                <div className="text-sm text-gray-300 font-medium">Años de Experiencia</div>
              </div>
              <div className="text-center backdrop-blur-sm bg-black/30 rounded-2xl p-6 border border-white/10">
                <div className="text-5xl font-bold text-yellow-400 mb-2">24/7</div>
                <div className="text-sm text-gray-300 font-medium">Monitoreo Continuo</div>
              </div>
              <div className="text-center backdrop-blur-sm bg-black/30 rounded-2xl p-6 border border-white/10">
                <div className="text-5xl font-bold text-yellow-400 mb-2">100%</div>
                <div className="text-sm text-gray-300 font-medium">Control Total</div>
              </div>
              <div className="text-center backdrop-blur-sm bg-black/30 rounded-2xl p-6 border border-white/10">
                <div className="text-5xl font-bold text-yellow-400 mb-2">-35%</div>
                <div className="text-sm text-gray-300 font-medium">Reducción de Costos</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-700 font-medium text-sm mb-6">
              <TrendingUp className="w-4 h-4" />
              Soluciones Integrales
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Gestión Profesional de Flotas
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Herramientas especializadas para el control total de vehículos, conductores, ubicaciones y mantenimiento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Benefit 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-2xl transform group-hover:scale-105 transition-transform" />
              <div className="relative p-8 bg-white border border-gray-200 rounded-2xl hover:border-yellow-500/50 hover:shadow-2xl transition-all h-full">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/30">
                  <Car className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Gestión de Vehículos</h3>
                <p className="text-gray-600 leading-relaxed">
                  Registro completo de tu flota con control de estados, documentación y asignaciones en tiempo real.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl transform group-hover:scale-105 transition-transform" />
              <div className="relative p-8 bg-white border border-gray-200 rounded-2xl hover:border-blue-500/50 hover:shadow-2xl transition-all h-full">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Control de Conductores</h3>
                <p className="text-gray-600 leading-relaxed">
                  Administra licencias, vencimientos y asignaciones de conductores con alertas automáticas.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent rounded-2xl transform group-hover:scale-105 transition-transform" />
              <div className="relative p-8 bg-white border border-gray-200 rounded-2xl hover:border-orange-500/50 hover:shadow-2xl transition-all h-full">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Mantenimiento Preventivo</h3>
                <p className="text-gray-600 leading-relaxed">
                  Planifica servicios, registra inspecciones y evita paradas imprevistas con seguimiento continuo.
                </p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl transform group-hover:scale-105 transition-transform" />
              <div className="relative p-8 bg-white border border-gray-200 rounded-2xl hover:border-green-500/50 hover:shadow-2xl transition-all h-full">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Reportes y Análisis</h3>
                <p className="text-gray-600 leading-relaxed">
                  Toma decisiones basadas en datos con reportes detallados de operación y rendimiento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section with Image */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl blur-3xl" />
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" 
                alt="Sistema de Gestión de Flotas" 
                className="relative rounded-2xl shadow-2xl border-4 border-white"
              />
            </div>

            {/* Right: Features */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-700 font-medium text-sm mb-6">
                <CheckCircle2 className="w-4 h-4" />
                Funcionalidades Completas
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Todo lo que necesitas en una sola plataforma
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Sistema integral diseñado para la gestión profesional de flotas con todas las herramientas esenciales
              </p>

              <div className="space-y-4">
                {[
                  { icon: Car, text: 'Registro completo de vehículos con historial detallado' },
                  { icon: Users, text: 'Gestión de conductores y licencias con alertas' },
                  { icon: Wrench, text: 'Control de mantenimientos preventivos y correctivos' },
                  { icon: FileText, text: 'Documentación centralizada y control de vencimientos' },
                  { icon: BarChart3, text: 'Reportes y análisis en tiempo real' },
                  { icon: MapPin, text: 'Gestión de múltiples ubicaciones y empresas' },
                  { icon: Clock, text: 'Alertas automáticas de vencimientos' },
                  { icon: Shield, text: 'Seguimiento de estados y novedades diarias' }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 flex items-center justify-center flex-shrink-0 group-hover:from-yellow-500/20 group-hover:to-yellow-600/20 transition-all">
                      <feature.icon className="w-5 h-5 text-yellow-600" />
                    </div>
                    <span className="text-gray-700 font-medium pt-2">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 rounded-full text-yellow-400 font-medium text-sm mb-8">
            <Zap className="w-4 h-4" />
            Comienza Hoy
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Transforma la gestión de tu flota
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Únete a las empresas que confían en nuestra plataforma para optimizar sus operaciones y reducir costos
          </p>
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black text-lg px-12 py-7 rounded-xl shadow-2xl shadow-yellow-500/30 transition-all duration-300 transform hover:scale-105 font-bold"
          >
            Acceder al Sistema
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
          <p className="text-gray-400 mt-8 text-sm">
            ¿Necesitas acceso? Contacta al administrador de tu empresa
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698ba23f75eb60d9d1b501ef/48afb028d_1.png" 
                alt="Duty Comfort Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <span className="text-lg font-bold text-gray-900">Duty Comfort</span>
                <p className="text-xs text-gray-500">Gestión de Flotas</p>
              </div>
            </div>
            <div className="text-center md:text-right text-gray-600">
              <p>© 2026 Duty Comfort. Sistema de Gestión de Flotas.</p>
              <p className="text-sm text-gray-500 mt-1">Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}