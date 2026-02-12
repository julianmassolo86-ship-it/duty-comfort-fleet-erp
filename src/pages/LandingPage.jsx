import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Car, BarChart3, Shield, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-2xl shadow-yellow-500/30">
                <Car className="w-12 h-12 text-black" />
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Gestiona tu Flota
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                de Forma Inteligente
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto">
              La plataforma completa para optimizar operaciones, reducir costos y maximizar la eficiencia de tu flota vehicular.
            </p>

            {/* CTA Button */}
            <div className="pt-8">
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black text-lg px-12 py-6 rounded-full shadow-2xl shadow-yellow-500/30 transition-all duration-300 transform hover:scale-105 font-bold"
              >
                Iniciar Sesión
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Benefit 1 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative p-8 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl hover:border-yellow-500/50 transition-all">
              <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Control Total</h3>
              <p className="text-slate-400 leading-relaxed">
                Visualiza el estado completo de tus vehículos, conductores y documentos en tiempo real desde un solo lugar.
              </p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative p-8 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl hover:border-yellow-500/50 transition-all">
              <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Mantenimiento Proactivo</h3>
              <p className="text-slate-400 leading-relaxed">
                Programa mantenimientos preventivos y recibe alertas automáticas para evitar costosas interrupciones.
              </p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative p-8 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl hover:border-yellow-500/50 transition-all">
              <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Gestión de Documentos</h3>
              <p className="text-slate-400 leading-relaxed">
                Mantén todos tus documentos organizados y nunca pierdas una fecha de vencimiento importante.
              </p>
            </div>
          </div>

          {/* Benefit 4 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative p-8 bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl hover:border-yellow-500/50 transition-all">
              <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-6">
                <Car className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Eficiencia Operativa</h3>
              <p className="text-slate-400 leading-relaxed">
                Optimiza recursos, reduce costos operativos y toma decisiones basadas en datos reales.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Todo lo que necesitas en un solo lugar
          </h2>
          <p className="text-xl text-slate-400">
            Potencia tu gestión de flotas con herramientas profesionales
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div key={index} className="flex items-center gap-4 p-4 bg-slate-900/30 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-6 h-6 text-yellow-400 flex-shrink-0" />
              <span className="text-slate-300 text-lg">{feature}</span>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16">
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black text-lg px-12 py-6 rounded-full shadow-2xl shadow-yellow-500/30 transition-all duration-300 transform hover:scale-105 font-bold"
          >
            Acceder a la Plataforma
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
          <p className="text-slate-500 mt-6">
            ¿Necesitas una cuenta? Contacta al administrador de tu empresa.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500">
            <p>© 2026 Mass Effect ERP. Sistema de Gestión de Flotas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}