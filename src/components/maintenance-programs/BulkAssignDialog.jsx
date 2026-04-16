import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, CheckCircle2, CheckCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function BulkAssignDialog({ open, onOpenChange, programs, isSuperAdmin, currentUser }) {
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const queryClient = useQueryClient();

  const companyId = isSuperAdmin ? selectedCompanyId : currentUser?.company_id;

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', companyId],
    queryFn: () => base44.entities.Vehicle.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    enabled: isSuperAdmin,
  });

  // Cargar todos los schedules de la empresa para saber qué vehículos ya tienen asignado el programa
  const { data: allSchedules = [] } = useQuery({
    queryKey: ['vehicleMaintenanceSchedules', 'byCompany', companyId],
    queryFn: () => base44.entities.VehicleMaintenanceSchedule.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  // Resolver recursivamente todos los programas incluidos (cadena parent_program_id)
  const resolveChain = (programId, allPrograms, visited = new Set()) => {
    if (!programId || visited.has(programId)) return [];
    visited.add(programId);
    const prog = allPrograms.find(p => p.id === programId);
    if (!prog) return [];
    const chain = [prog];
    if (prog.parent_program_id) {
      chain.push(...resolveChain(prog.parent_program_id, allPrograms, visited));
    }
    return chain;
  };

  // Vehículos que ya tienen asignado el programa seleccionado
  const alreadyAssignedVehicleIds = useMemo(() => {
    if (!selectedProgramId) return new Set();
    return new Set(
      allSchedules
        .filter(s => s.maintenance_task_definition_id === selectedProgramId)
        .map(s => s.vehicle_id)
    );
  }, [allSchedules, selectedProgramId]);

  const assignMutation = useMutation({
    mutationFn: async ({ programId, vehicleIds }) => {
      const chain = resolveChain(programId, programs);

      for (const vehicleId of vehicleIds) {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        const existingSchedules = await base44.entities.VehicleMaintenanceSchedule.filter({ vehicle_id: vehicleId });
        const existingDefIds = new Set(existingSchedules.map(s => s.maintenance_task_definition_id));

        for (const prog of chain) {
          if (existingDefIds.has(prog.id)) continue;

          const scheduleData = {
            vehicle_id: vehicleId,
            maintenance_task_definition_id: prog.id,
            company_id: vehicle.company_id,
            status: "on_track",
          };

          if (prog.interval_mileage) scheduleData.next_due_mileage = (vehicle.mileage || 0) + prog.interval_mileage;
          if (prog.interval_hours) scheduleData.next_due_hours = (vehicle.hours || 0) + prog.interval_hours;
          if (prog.interval_months) {
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + prog.interval_months);
            scheduleData.next_due_date = nextDate.toISOString().split('T')[0];
          }

          await base44.entities.VehicleMaintenanceSchedule.create(scheduleData);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicleMaintenanceSchedules'] });
      setSelectedVehicleIds([]);
      setSelectedProgramId("");
      onOpenChange(false);
    },
  });

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v =>
      v.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.internal_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm]);

  // Separar en ya asignados y disponibles
  const assignedVehicles = filteredVehicles.filter(v => alreadyAssignedVehicleIds.has(v.id));
  const availableVehicles = filteredVehicles.filter(v => !alreadyAssignedVehicleIds.has(v.id));

  const toggleVehicle = (vehicleId) => {
    if (alreadyAssignedVehicleIds.has(vehicleId)) return; // no permitir desmarcar ya asignados
    if (selectedVehicleIds.includes(vehicleId)) {
      setSelectedVehicleIds(selectedVehicleIds.filter(id => id !== vehicleId));
    } else {
      setSelectedVehicleIds([...selectedVehicleIds, vehicleId]);
    }
  };

  const toggleAll = () => {
    const available = availableVehicles.map(v => v.id);
    if (selectedVehicleIds.length === available.length) {
      setSelectedVehicleIds([]);
    } else {
      setSelectedVehicleIds(available);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedProgramId && selectedVehicleIds.length > 0) {
      assignMutation.mutate({ programId: selectedProgramId, vehicleIds: selectedVehicleIds });
    }
  };

  const VehicleRow = ({ vehicle, alreadyAssigned }) => (
    <label
      key={vehicle.id}
      className={cn(
        "flex items-center gap-3 p-3 transition-colors",
        alreadyAssigned ? "opacity-60 cursor-default bg-zinc-900/40" : "hover:bg-zinc-900 cursor-pointer"
      )}
    >
      {alreadyAssigned ? (
        <CheckCheck className="w-4 h-4 text-green-400 shrink-0" />
      ) : (
        <input
          type="checkbox"
          checked={selectedVehicleIds.includes(vehicle.id)}
          onChange={() => toggleVehicle(vehicle.id)}
          className="w-4 h-4"
        />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium text-white">
          {vehicle.internal_number && <span className="text-yellow-400">#{vehicle.internal_number}</span>}
          {vehicle.internal_number && vehicle.plate && " - "}
          {vehicle.plate && <span>{vehicle.plate}</span>}
        </p>
        <p className="text-xs text-zinc-400">{vehicle.manufacturer} {vehicle.model}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-right text-xs text-zinc-500">
          {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : ""}
          {vehicle.hours ? ` / ${vehicle.hours} hs` : ""}
        </span>
        {alreadyAssigned && (
          <Badge className="text-xs bg-green-500/20 text-green-400 border border-green-500/30">Ya asignado</Badge>
        )}
      </div>
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar Programa a Vehículos</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Select value={selectedCompanyId} onValueChange={(v) => { setSelectedCompanyId(v); setSelectedVehicleIds([]); }} required>
                <SelectTrigger className="bg-zinc-900 border-zinc-700">
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Programa de Mantenimiento *</Label>
            <Select value={selectedProgramId} onValueChange={(v) => { setSelectedProgramId(v); setSelectedVehicleIds([]); }} required>
              <SelectTrigger className="bg-zinc-900 border-zinc-700">
                <SelectValue placeholder="Seleccionar programa" />
              </SelectTrigger>
              <SelectContent>
                {programs.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Vehículos ({selectedVehicleIds.length} seleccionados
                {assignedVehicles.length > 0 && `, ${assignedVehicles.length} ya asignados`})
              </Label>
              {availableVehicles.length > 0 && (
                <Button type="button" size="sm" variant="outline" onClick={toggleAll} className="border-zinc-700">
                  {selectedVehicleIds.length === availableVehicles.length ? "Deseleccionar todos" : "Seleccionar todos"}
                </Button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Buscar vehículos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-700"
              />
            </div>

            <div className="border border-zinc-800 rounded-lg max-h-80 overflow-y-auto">
              {filteredVehicles.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  {!companyId ? "Selecciona una empresa primero" : "No hay vehículos disponibles"}
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {/* Vehículos disponibles primero */}
                  {availableVehicles.map(vehicle => (
                    <VehicleRow key={vehicle.id} vehicle={vehicle} alreadyAssigned={false} />
                  ))}
                  {/* Separador si hay de ambos tipos */}
                  {availableVehicles.length > 0 && assignedVehicles.length > 0 && (
                    <div className="px-3 py-2 bg-zinc-900/60 text-xs text-zinc-500 flex items-center gap-2">
                      <CheckCheck className="w-3 h-3 text-green-400" />
                      Ya tienen este programa asignado
                    </div>
                  )}
                  {/* Vehículos ya asignados al final */}
                  {assignedVehicles.map(vehicle => (
                    <VehicleRow key={vehicle.id} vehicle={vehicle} alreadyAssigned={true} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedVehicleIds.length > 0 && selectedProgramId && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-yellow-400">
                Se asignará el programa a {selectedVehicleIds.length} vehículo{selectedVehicleIds.length > 1 ? "s" : ""}.
                Los próximos vencimientos se calcularán automáticamente.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={assignMutation.isPending} className="border-zinc-700 text-zinc-300">
              Cancelar
            </Button>
            <Button type="submit" disabled={assignMutation.isPending || !selectedProgramId || selectedVehicleIds.length === 0} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Asignar Programa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}