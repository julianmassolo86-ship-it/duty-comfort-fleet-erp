import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";

const predefinedColors = [
  { name: "Verde", value: "#10b981" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Púrpura", value: "#8b5cf6" },
  { name: "Amarillo", value: "#eab308" },
  { name: "Naranja", value: "#f59e0b" },
  { name: "Cian", value: "#06b6d4" },
  { name: "Rojo", value: "#ef4444" },
  { name: "Gris", value: "#6b7280" },
];

export default function VehicleStatusDialog({ open, onOpenChange, status, onSave, onDelete, isLoading, isDeleting }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    color: "#10b981",
    description: "",
    is_active: true,
    order: 0
  });

  useEffect(() => {
    if (status) {
      setFormData(status);
    } else {
      setFormData({
        name: "",
        code: "",
        color: "#10b981",
        description: "",
        is_active: true,
        order: 0
      });
    }
  }, [status, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-md",
        theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'
      )}>
        <DialogHeader>
          <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            {status ? "Editar Estado" : "Nuevo Estado"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
              Nombre del Estado *
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ej: Activo, Disponible, En Mantenimiento"
              required
              className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300'}
            />
          </div>

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
              Código *
            </Label>
            <Input
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="Ej: active, available, maintenance"
              required
              className={cn(
                "font-mono",
                theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300'
              )}
            />
            <p className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>
              Código único para identificar este estado
            </p>
          </div>

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
              Color
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleChange("color", color.value)}
                  className={cn(
                    "h-10 rounded-lg border-2 transition-all flex items-center justify-center",
                    formData.color === color.value 
                      ? "border-yellow-500 ring-2 ring-yellow-500/20" 
                      : theme === 'dark' ? 'border-zinc-700 hover:border-zinc-600' : 'border-gray-300 hover:border-gray-400'
                  )}
                  style={{ backgroundColor: `${color.value}20` }}
                >
                  <Circle 
                    className="w-5 h-5" 
                    style={{ color: color.value }}
                    fill={color.value}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
              Descripción
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Descripción del estado..."
              rows={3}
              className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                Estado
              </Label>
              <Select 
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={(value) => handleChange("is_active", value === "active")}
              >
                <SelectTrigger className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300'}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                Orden
              </Label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) => handleChange("order", parseInt(e.target.value) || 0)}
                className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300'}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            {status && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" disabled={isDeleting} className="mr-auto text-red-500 hover:text-red-600 hover:bg-red-500/10">
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className={theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white'}>
                  <AlertDialogHeader>
                    <AlertDialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      ¿Eliminar estado?
                    </AlertDialogTitle>
                    <AlertDialogDescription className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>
                      Esta acción no se puede deshacer. El estado será eliminado permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className={theme === 'dark' ? 'bg-zinc-800 text-white hover:bg-zinc-700' : ''}>
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-500 hover:bg-red-600 text-white">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? "Guardando..." : (status ? "Guardar" : "Crear")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}