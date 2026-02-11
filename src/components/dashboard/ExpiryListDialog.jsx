import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AlertTriangle, Car, Users, Calendar } from "lucide-react";
import { useTheme } from "../common/ThemeWrapper";

export default function ExpiryListDialog({ open, onOpenChange, vehicles = [], drivers = [] }) {
  const { theme } = useTheme();
  
  // Generar todas las alertas
  const getAllExpiryItems = () => {
    const items = [];
    const today = new Date();

    // Documentos de vehículos
    const vehicleFields = [
      { key: 'insurance_expiry', label: 'Seguro' },
      { key: 'technical_inspection_expiry', label: 'VTV' },
      { key: 'circulation_permit_expiry', label: 'Permiso de circulación' },
      { key: 'vehicle_card_front_expiry', label: 'Cédula del vehículo' },
      { key: 'title_expiry', label: 'Título automotor' },
      { key: 'license_plate_expiry', label: 'Patente' },
      { key: 'parts_engraving_expiry', label: 'Grabado de autopartes' },
      { key: 'fire_extinguisher_expiry', label: 'Extintor' },
      { key: 'next_service_date', label: 'Próximo service' }
    ];

    vehicles.forEach(v => {
      vehicleFields.forEach(({ key, label }) => {
        if (v[key]) {
          const expiryDate = new Date(v[key]);
          const days = differenceInDays(expiryDate, today);
          
          items.push({
            id: `${v.id}-${key}`,
            type: 'vehicle',
            title: label,
            subtitle: `${v.plate} - ${v.manufacturer} ${v.model}`,
            date: v[key],
            daysRemaining: days,
            severity: days < 0 ? 'expired' : days <= 7 ? 'critical' : days <= 30 ? 'warning' : 'ok'
          });
        }
      });
    });

    // Documentos de conductores
    const driverFields = [
      { key: 'license_expiry', label: 'Licencia de conducir' }
    ];

    drivers.forEach(d => {
      driverFields.forEach(({ key, label }) => {
        if (d[key]) {
          const expiryDate = new Date(d[key]);
          const days = differenceInDays(expiryDate, today);
          
          items.push({
            id: `${d.id}-${key}`,
            type: 'driver',
            title: label,
            subtitle: d.full_name,
            date: d[key],
            daysRemaining: days,
            severity: days < 0 ? 'expired' : days <= 7 ? 'critical' : days <= 30 ? 'warning' : 'ok'
          });
        }
      });
    });

    // Ordenar por fecha de vencimiento (más próximo primero)
    return items.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const allItems = getAllExpiryItems();
  
  // Agrupar por severidad
  const expiredItems = allItems.filter(i => i.severity === 'expired');
  const criticalItems = allItems.filter(i => i.severity === 'critical');
  const warningItems = allItems.filter(i => i.severity === 'warning');
  const okItems = allItems.filter(i => i.severity === 'ok');

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'expired':
        return theme === 'dark' 
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : 'bg-red-50 border-red-200 text-red-700';
      case 'critical':
        return theme === 'dark'
          ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
          : 'bg-orange-50 border-orange-200 text-orange-700';
      case 'warning':
        return theme === 'dark'
          ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
          : 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return theme === 'dark'
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700';
    }
  };

  const getDaysText = (days) => {
    if (days < 0) return `Vencido hace ${Math.abs(days)} días`;
    if (days === 0) return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    return `Vence en ${days} días`;
  };

  const renderGroup = (items, title, icon) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className={cn("text-sm font-semibold", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            {title} ({items.length})
          </h3>
        </div>
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                getSeverityColor(item.severity)
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {item.type === 'vehicle' ? (
                  <Car className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Users className="w-4 h-4 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  <p className="text-xs opacity-75 truncate">{item.subtitle}</p>
                </div>
              </div>
              <div className="text-right ml-3 flex-shrink-0">
                <p className="text-xs font-medium">{getDaysText(item.daysRemaining)}</p>
                <p className="text-xs opacity-60">
                  {format(new Date(item.date), "dd/MM/yyyy", { locale: es })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-3xl max-h-[80vh] overflow-y-auto",
        theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
      )}>
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            <Calendar className="w-5 h-5" />
            Listado Completo de Vencimientos ({allItems.length})
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {allItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 inline-block mb-4">
                <Calendar className="w-8 h-8 text-emerald-400" />
              </div>
              <p className={theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}>
                No hay documentos registrados
              </p>
            </div>
          ) : (
            <>
              {renderGroup(
                expiredItems,
                "Vencidos",
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              {renderGroup(
                criticalItems,
                "Críticos (próximos 7 días)",
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              )}
              {renderGroup(
                warningItems,
                "Próximos (8-30 días)",
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
              {renderGroup(
                okItems,
                "Vigentes (más de 30 días)",
                <Calendar className="w-4 h-4 text-emerald-500" />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}