import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { 
  Car, Shield, BarChart3, Clock, Users, Wrench, 
  CheckCircle, ArrowRight, Zap, TrendingUp 
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Welcome() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.isAuthenticated().then((auth) => {
      if (auth) {
        window.location.href = createPageUrl("Dashboard");
      } else {
        setLoading(false);
      }
    });
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("Dashboard"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const benefits = [
    {
      icon: Car,
      title: "Gestión Completa de Flotas",
      description: "Administra todos tus vehículos, conductores y locaciones desde un único lugar centralizado."
    },
    {
      icon: Clock,
      title: "Mantenimiento Preventivo",
      description: "Programa y monitorea el mantenimiento de tu flota para evitar costosas reparaciones y tiempos de inactividad."
    },
    {
      icon: Shield,
      title: "Control de Documentación",
      description: "Mantén al día todos los documentos: seguros, VTV, licencias y permisos con alertas de vencimiento."
    },
    {
      icon: BarChart3,
      title: "Reportes en Tiempo Real",
      description: "Toma decisiones informadas con dashboards y reportes detallados sobre el rendimiento de tu flota."
    },
    {
      icon: Users,
      title: "Gestión de Conductores",
      description: "Administra tu equipo de conductores, asignaciones, licencias y documentación personal en un solo sistema."
    },
    {
      icon: Zap,
      title: "Eficiencia Operativa",
      description: "Optimiza costos, reduce tiempos muertos y maximiza la productividad de tu operación vehicular."
    }
  ];

  const features = [
    "Control total de vehículos y equipamiento",
    "Seguimiento de mantenimiento y costos",
    "Alertas automáticas de vencimientos",
    "Múltiples locaciones y empresas",
    "Roles y permisos personalizados",
    "Reportes y estadísticas detalladas"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-24 sm:pb-32">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-12"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-2xl shadow-yellow-500/30">
                <Car className="w-8 h-8 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Mass Effect
                </h1>
                <p className="text-sm text-zinc-500">Fleet Management System</p>
              </div>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center max-w-4xl mx-auto mb-12"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Revoluciona la gestión de tu{" "}
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                flota vehicular
              </span>
            </h2>
            <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
              El sistema ERP más completo para administrar vehículos, conductores, mantenimiento y documentación. 
              Todo lo que necesitas para optimizar tu operación en una sola plataforma.
            </p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handleLogin}
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold text-lg px-8 py-6 rounded-xl shadow-2xl shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105"
              >
                Iniciar Sesión
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-16"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-center gap-2 text-sm text-zinc-400"
              >
                <CheckCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="relative py-20 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl sm:text-4xl font-bold mb-4">
              Todo lo que necesitas para tu flota
            </h3>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Herramientas profesionales diseñadas para maximizar la eficiencia y reducir costos operativos
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
                <div className="relative bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 rounded-2xl p-6 hover:border-yellow-500/50 transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="w-6 h-6 text-yellow-500" />
                  </div>
                  <h4 className="text-xl font-semibold mb-3 text-white group-hover:text-yellow-400 transition-colors">
                    {benefit.title}
                  </h4>
                  <p className="text-zinc-400 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-3xl p-12"
          >
            <TrendingUp className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
            <h3 className="text-3xl sm:text-4xl font-bold mb-4">
              ¿Listo para optimizar tu flota?
            </h3>
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              Únete a las empresas que ya están transformando su gestión vehicular con Mass Effect
            </p>
            <Button
              onClick={handleLogin}
              size="lg"
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold text-lg px-10 py-6 rounded-xl shadow-2xl shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105"
            >
              Acceder al Sistema
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-zinc-500 text-sm">
            © 2026 Mass Effect Fleet Management. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}