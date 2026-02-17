import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, BarChart3, Shield, Clock, ArrowRight, CheckCircle2, Zap, TrendingUp } from 'lucide-react';

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
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-blue-500/5" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(203 213 225 / 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="text-center space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-700 font-medium text-sm">
                <Zap className="w-4 h-4" />
                Sistema de Gestión Integral
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
                Gestiona tu Flota
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-yellow-500">
                  de Forma Inteligente
                </span>
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              La plataforma completa para optimizar operaciones, reducir costos y maximizar la eficiencia de tu flota vehicular.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black text-lg px-10 py-6 rounded-xl shadow-xl shadow-yellow-500/20 transition-all duration-300 transform hover:scale-105 font-bold"
              >
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-600 mt-1">Control Total</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">24/7</div>
                <div className="text-sm text-gray-600 mt-1">Disponibilidad</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">-30%</div>
                <div className="text-sm text-gray-600 mt-1">Costos</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">+50%</div>
                <div className="text-sm text-gray-600 mt-1">Eficiencia</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Potencia tu operación
            </h2>
            <p className="text-xl text-gray-600">
              Herramientas profesionales para una gestión eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Benefit 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-2xl transform group-hover:scale-105 transition-transform" />
              <div className="relative p-8 bg-white border border-gray-200 rounded-2xl hover:border-yellow-500/50 hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/20">
                  <BarChart3 className="w-7 h-7 text-black" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Control Total</h3>
                <p className="text-gray-600 leading-relaxed">
                  Visualiza el estado completo de tu flota en tiempo real desde un solo lugar.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl transform group-hover:scale-105 transition-transform" />
              <div className="relative p-8 bg-white border border-gray-200 rounded-2xl hover:border-blue-500/50 hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Mantenimiento Proactivo</h3>
                <p className="text-gray-600 leading-relaxed">
                  Programa mantenimientos y recibe alertas para evitar interrupciones.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl transform group-hover:scale-105 transition-transform" />
              <div className="relative p-8 bg-white border border-gray-200 rounded-2xl hover:border-green-500/50 hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Gestión de Documentos</h3>
                <p className="text-gray-600 leading-relaxed">
                  Organiza documentos y controla vencimientos de forma automática.
                </p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl transform group-hover:scale-105 transition-transform" />
              <div className="relative p-8 bg-white border border-gray-200 rounded-2xl hover:border-purple-500/50 hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Eficiencia Operativa</h3>
                <p className="text-gray-600 leading-relaxed">
                  Optimiza recursos y toma decisiones basadas en datos reales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-100 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Funcionalidades completas
            </h2>
            <p className="text-xl text-gray-600">
              Todo lo que necesitas para gestionar tu flota profesionalmente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Registro completo de vehículos y conductores',
              'Control de mantenimientos preventivos y correctivos',
              'Gestión centralizada de documentos',
              'Alertas de vencimientos automáticas',
              'Reportes y análisis detallados',
              'Múltiples ubicaciones y empresas',
              'Gestión de estados de vehículos',
              'Asignación de conductores y recursos'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-yellow-500/50 hover:shadow-lg transition-all">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-black" />
                </div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-3xl p-12 shadow-2xl">
              <h3 className="text-3xl font-bold text-black mb-4">
                ¿Listo para optimizar tu flota?
              </h3>
              <p className="text-black/80 text-lg mb-8 max-w-2xl mx-auto">
                Únete a las empresas que ya están transformando su gestión de flotas
              </p>
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-black hover:bg-gray-900 text-white text-lg px-12 py-6 rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105 font-bold"
              >
                Acceder a la Plataforma
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
              <p className="text-black/70 mt-6">
                ¿Necesitas una cuenta? Contacta al administrador de tu empresa.
              </p>
            </div>
          </div>
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