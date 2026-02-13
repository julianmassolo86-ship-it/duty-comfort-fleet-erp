import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function VehicleCategoryDialog({ open, onOpenChange, category, onSave, onDelete }) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({ name: "", icon_name: "", notes: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (category) {
        setFormData(category);
      } else {
        setFormData({ name: "", icon_name: "", notes: "" });
      }
    }
  }, [open, category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(category.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-lg", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white')}>
        <DialogHeader>
          <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            {category ? "Editar Categoría" : "Nueva Categoría"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Nombre *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Automóvil, Pick-up, Camión, Excavadora"
              required
              className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              rows={3}
              className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
            />
          </div>

          <DialogFooter className="gap-2">
            {category && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : ''}>
                  <AlertDialogHeader>
                    <AlertDialogTitle className={theme === 'dark' ? 'text-white' : ''}>¿Eliminar categoría?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className={theme === 'dark' ? 'bg-zinc-800 text-white border-zinc-700' : ''}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={theme === 'dark' ? 'border-zinc-700 text-zinc-300' : ''}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-yellow-500 hover:bg-yellow-600 text-black">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {category ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}