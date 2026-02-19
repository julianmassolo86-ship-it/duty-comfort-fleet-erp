import React, { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ArrowUpDown, FileSpreadsheet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";
import StatusBadge from "../common/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import jsPDF from "jspdf";

export default function VehicleTable({ vehicles, locations, companies, drivers, vehicleStatuses, isSuperAdmin, onEdit, onDelete }) {
  const { theme } = useTheme();
  const [deleteVehicle, setDeleteVehicle] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

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

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedVehicles = useMemo(() => {
    if (!sortColumn) return vehicles;
    
    return [...vehicles].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortColumn) {
        case "internal_number":
          aValue = a.internal_number || "";
          bValue = b.internal_number || "";
          break;
        case "plate":
          aValue = a.plate || "";
          bValue = b.plate || "";
          break;
        case "manufacturer":
          aValue = `${a.manufacturer} ${a.model}`;
          bValue = `${b.manufacturer} ${b.model}`;
          break;
        case "location":
          aValue = getLocationName(a.location_id);
          bValue = getLocationName(b.location_id);
          break;
        case "company":
          aValue = getCompanyName(a.company_id);
          bValue = getCompanyName(b.company_id);
          break;
        case "driver":
          aValue = a.assigned_driver_id ? getDriverName(a.assigned_driver_id) : (a.assigned_driver_ids?.length > 0 ? a.assigned_driver_ids.map(id => getDriverName(id)).join(", ") : "-");
          bValue = b.assigned_driver_id ? getDriverName(b.assigned_driver_id) : (b.assigned_driver_ids?.length > 0 ? b.assigned_driver_ids.map(id => getDriverName(id)).join(", ") : "-");
          break;
        case "status":
          aValue = getStatusLabel(a.status);
          bValue = getStatusLabel(b.status);
          break;
        default:
          return 0;
      }
      
      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [vehicles, sortColumn, sortDirection, locations, companies, drivers, vehicleStatuses]);

  const exportToExcel = () => {
    const headers = ["#", "Matrícula", "Marca/Modelo", "Locación", ...(isSuperAdmin ? ["Empresa"] : []), "Conductor", "Estado"];
    const data = sortedVehicles.map(v => [
      v.internal_number || "-",
      v.plate || "-",
      `${v.manufacturer} ${v.model}`,
      getLocationName(v.location_id),
      ...(isSuperAdmin ? [getCompanyName(v.company_id)] : []),
      v.assigned_driver_id ? getDriverName(v.assigned_driver_id) : (v.assigned_driver_ids?.length > 0 ? v.assigned_driver_ids.map(id => getDriverName(id)).join(", ") : "-"),
      getStatusLabel(v.status)
    ]);

    let csv = headers.join(",") + "\n";
    data.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `vehiculos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    
    doc.setFontSize(18);
    doc.text("Lista de Vehículos", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 28);
    
    const headers = ["#", "Matrícula", "Marca/Modelo", "Locación", ...(isSuperAdmin ? ["Empresa"] : []), "Conductor", "Estado"];
    const data = sortedVehicles.map(v => [
      v.internal_number || "-",
      v.plate || "-",
      `${v.manufacturer} ${v.model}`,
      getLocationName(v.location_id),
      ...(isSuperAdmin ? [getCompanyName(v.company_id)] : []),
      v.assigned_driver_id ? getDriverName(v.assigned_driver_id) : (v.assigned_driver_ids?.length > 0 ? v.assigned_driver_ids.map(id => getDriverName(id)).join(", ") : "-"),
      getStatusLabel(v.status)
    ]);

    let y = 40;
    const colWidths = isSuperAdmin ? [15, 25, 45, 35, 40, 40, 30] : [20, 30, 55, 45, 50, 35];
    let x = 14;
    
    // Headers
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += colWidths[i];
    });
    
    y += 7;
    doc.setFont(undefined, "normal");
    
    // Data
    data.forEach((row) => {
      if (y > 190) {
        doc.addPage();
        y = 20;
      }
      x = 14;
      row.forEach((cell, i) => {
        const cellText = String(cell).substring(0, 30);
        doc.text(cellText, x, y);
        x += colWidths[i];
      });
      y += 7;
    });

    doc.save(`vehiculos_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const SortableHeader = ({ children, column }) => (
    <TableHead 
      className={cn("font-semibold cursor-pointer hover:bg-opacity-80", sortColumn === column && "text-yellow-500")}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="w-3 h-3" />
      </div>
    </TableHead>
  );

  return (
    <>
      {/* Export Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Exportar Excel
        </Button>
        <Button
          onClick={exportToPDF}
          className="bg-red-600 hover:bg-red-700 text-white"
          size="sm"
        >
          <FileText className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

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
              <SortableHeader column="internal_number">#</SortableHeader>
              <SortableHeader column="plate">Matrícula</SortableHeader>
              <SortableHeader column="manufacturer">Marca / Modelo</SortableHeader>
              <SortableHeader column="location">Locación</SortableHeader>
              {isSuperAdmin && <SortableHeader column="company">Empresa</SortableHeader>}
              <SortableHeader column="driver">Conductor</SortableHeader>
              <SortableHeader column="status">Estado</SortableHeader>
              <TableHead className="font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedVehicles.map(vehicle => (
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
        {sortedVehicles.map(vehicle => (
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