import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";
import StatusBadge from "../common/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function VehicleTable({ vehicles, locations, companies, drivers, vehicleStatuses, isSuperAdmin, onEdit, onDelete }) {
  const { theme } = useTheme();
  const [deleteVehicle, setDeleteVehicle] = useState(null);

  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver?.full_name || "-";
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    return location?.name || "-";
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || "-";
  };

  const getStatusLabel = (status) => {
    const statusObj = vehicleStatuses.find(s => s.code === status);
    return statusObj?.name || status;
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className={cn(
        "hidden md:block rounded-xl border overflow-hidden",
        theme === 'dark' 
          ? 'bg-zinc-900/50 border-zinc-800' 
          : 'bg-white border-gray-200'
      )}>
        <Table className={theme === 'dark' ? '[&_th]:text-zinc-300 [&_td]:text-zinc-400' : '[&_th]:text-gray-600 [&_td]:text-gray-700'}>
          <TableHeader className={theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-50'}>
            <TableRow className={theme === 'dark' ? 'border-zinc-700 hover:bg-transparent' : 'border-gray-200 hover:bg-transparent'}>
              <TableHead className="font-semibold">#</TableHead>
              <TableHead className="font-semibold">Matrícula</TableHead>
              <TableHead className="font-semibold">Marca / Modelo</TableHead>
              <TableHead className="font-semibold">Locación</TableHead>
              {isSuperAdmin && <TableHead className="font-semibold">Empresa</TableHead>}
              <TableHead className="font-semibold">Conductor</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map(vehicle => (
              <TableRow 
                key={vehicle.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  theme === 'dark'
                    ? 'border-zinc-700 hover:bg-zinc-800/30'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <TableCell className="font-semibold">
                  {vehicle.internal_number || "-"}
                </TableCell>
                <TableCell className="font-mono font-semibold">
                  {vehicle.plate || "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {vehicle.manufacturer} {vehicle.model}
                </TableCell>
                <TableCell className="text-sm">
                  {getLocationName(vehicle.location_id)}
                </TableCell>
                {isSuperAdmin && (
                  <TableCell className="text-sm">
                    {getCompanyName(vehicle.company_id)}
                  </TableCell>
                )}
                <TableCell className="text-sm">
                  {vehicle.assigned_driver_id 
                    ? getDriverName(vehicle.assigned_driver_id)
                    : vehicle.assigned_driver_ids?.length > 0
                    ? vehicle.assigned_driver_ids.map(id => getDriverName(id)).join(", ")
                    : "-"
                  }
                </TableCell>
                <TableCell>
                  <StatusBadge 
                    status={vehicle.status} 
                    statusList={vehicleStatuses}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(vehicle);
                      }}
                      className={cn(
                        "h-8 w-8",
                        theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteVehicle(vehicle);
                      }}
                      className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {vehicles.map(vehicle => (
          <div
            key={vehicle.id}
            className={cn(
              "rounded-xl border p-4 cursor-pointer transition-colors",
              theme === 'dark'
                ? 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/30'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            )}
            onClick={() => onEdit(vehicle)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded",
                    theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-100 text-gray-600'
                  )}>
                    {vehicle.internal_number || "-"}
                  </span>
                  <span className="font-mono font-bold text-lg">
                    {vehicle.plate}
                  </span>
                </div>
                <p className={cn(
                  "text-sm",
                  theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                )}>
                  {vehicle.manufacturer} {vehicle.model}
                </p>
              </div>
              <StatusBadge 
                status={vehicle.status} 
                statusList={vehicleStatuses}
              />
            </div>
            <div className={cn(
              "space-y-2 text-sm pt-3 border-t",
              theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'
            )}>
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}>
                  Locación:
                </span>
                <span className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                  {getLocationName(vehicle.location_id)}
                </span>
              </div>
              {isSuperAdmin && (
                <div className="flex justify-between">
                  <span className={theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}>
                    Empresa:
                  </span>
                  <span className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                    {getCompanyName(vehicle.company_id)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}>
                  Conductor:
                </span>
                <span className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                  {vehicle.assigned_driver_id 
                    ? getDriverName(vehicle.assigned_driver_id)
                    : vehicle.assigned_driver_ids?.length > 0
                    ? vehicle.assigned_driver_ids.map(id => getDriverName(id)).join(", ")
                    : "-"
                  }
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(vehicle);
                }}
                className={cn(
                  "flex-1",
                  theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteVehicle(vehicle);
                }}
                className="flex-1 text-red-400 hover:text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteVehicle} onOpenChange={(open) => !open && setDeleteVehicle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar vehículo?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el vehículo <strong>{deleteVehicle?.plate}</strong> ({deleteVehicle?.manufacturer} {deleteVehicle?.model})? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDelete(deleteVehicle.id);
                setDeleteVehicle(null);
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}