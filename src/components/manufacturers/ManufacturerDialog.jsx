import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/components/common/ThemeWrapper";
import { cn } from "@/lib/utils";
import { Upload, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
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

export default function ManufacturerDialog({
  open,
  onOpenChange,
  manufacturer,
  onSave,
  onDelete,
  isLoading,
  isDeleting
}) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    notes: ""
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (open) {
      if (manufacturer) {
        setFormData({
          name: manufacturer.name || "",
          logo_url: manufacturer.logo_url || "",
          notes: manufacturer.notes || ""
        });
      } else {
        setFormData({
          name: "",
          logo_url: "",
          notes: ""
        });
      }
    }
  }, [manufacturer, open]);

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, logo_url: file_url }));
    } catch (error) {
      console.error("Error uploading logo:", error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleDelete = () => {
    onDelete(manufacturer.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(
          "max-w-2xl max-h-[90vh] overflow-y-auto",
          theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white'
        )}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              {manufacturer ? "Editar Marca" : "Nueva Marca"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                Nombre de la Marca *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Scania, Volvo, Mercedes-Benz"
                required
                className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
              />
            </div>

            {/* Logo */}
            <div>
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                Logo de la Marca
              </Label>
              <div className="mt-2 space-y-3">
                {formData.logo_url && (
                  <div className="relative inline-block">
                    <img
                      src={formData.logo_url}
                      alt="Logo"
                      className={cn(
                        "w-32 h-32 object-contain rounded-lg border-2",
                        theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-50 border-gray-200'
                      )}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6"
                      onClick={() => setFormData({ ...formData, logo_url: "" })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e.target.files[0])}
                    className="hidden"
                    id="logo-upload"
                    disabled={uploadingLogo}
                  />
                  <label htmlFor="logo-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingLogo}
                      asChild
                      className={theme === 'dark' ? 'border-zinc-700 text-zinc-300' : ''}
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingLogo ? "Subiendo..." : "Cargar Logo"}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <Label className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                Notas
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información adicional sobre la marca"
                rows={3}
                className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : ''}
              />
            </div>

            {/* Acciones */}
            <div className="flex justify-between pt-4">
              {manufacturer ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className={theme === 'dark' ? 'border-zinc-700 text-zinc-300' : ''}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  {isLoading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className={theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : ''}>
          <AlertDialogHeader>
            <AlertDialogTitle className={theme === 'dark' ? 'text-white' : ''}>
              ¿Eliminar marca?
            </AlertDialogTitle>
            <AlertDialogDescription className={theme === 'dark' ? 'text-zinc-400' : ''}>
              Esta acción no se puede deshacer. La marca será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={theme === 'dark' ? 'border-zinc-700 text-zinc-300' : ''}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}