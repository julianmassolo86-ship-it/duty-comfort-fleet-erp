import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";

const categoryOptions = [
  { value: "car", label: "Auto" },
  { value: "truck", label: "Camión" },
  { value: "van", label: "Furgón" },
  { value: "bus", label: "Ómnibus" },
  { value: "motorcycle", label: "Moto" },
  { value: "machinery", label: "Maquinaria" },
  { value: "trailer", label: "Remolque" },
  { value: "pickup", label: "Pickup" },
  { value: "semi_truck", label: "Semi" },
  { value: "crane", label: "Grúa" },
  { value: "excavator", label: "Excavadora" },
  { value: "loader", label: "Cargadora" },
  { value: "grader", label: "Niveladora" },
  { value: "roller", label: "Rodillo" },
  { value: "tractor", label: "Tractor" }
];

export default function VehicleTypeDialog({ open, onOpenChange, vehicleType, onSave, onDelete, isLoading, isDeleting }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    category: "car",
    notes: ""
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (open) {
      if (vehicleType) {
        setFormData({
          name: vehicleType.name || "",
          category: vehicleType.category || "car",
          notes: vehicleType.notes || ""
        });
      } else {
        setFormData({
          name: "",
          category: "car",
          notes: ""
        });
      }
    }
  }, [open, vehicleType]);

  const handleSave = () => {
    onSave(formData);
  };

  const handleDelete = () => {
    onDelete(vehicleType.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(
          "max-w-md",
          theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'
        )}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              {vehicleType ? "Editar Tipo de Vehículo" : "Nuevo Tipo de Vehículo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                Nombre del Tipo *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Camión Compactador, Furgón Mixto"
                className={theme === 'dark' ? 'bg-zinc-800 border-zinc-600 text-white' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                Categoría *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className={theme === 'dark' ? 'bg-zinc-800 border-zinc-600 text-white' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-zinc-800 border-zinc-600' : ''}>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                Notas
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información adicional..."
                className={theme === 'dark' ? 'bg-zinc-800 border-zinc-600 text-white' : ''}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {vehicleType && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="mr-auto"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave} disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isLoading ? "Guardando..." : (vehicleType ? "Guardar Cambios" : "Crear Tipo")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
          <AlertDialogHeader>
            <AlertDialogTitle className={theme === 'dark' ? 'text-white' : ''}>
              ¿Eliminar tipo de vehículo?
            </AlertDialogTitle>
            <AlertDialogDescription className={theme === 'dark' ? 'text-zinc-400' : ''}>
              Esta acción no se puede deshacer. El tipo de vehículo será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}