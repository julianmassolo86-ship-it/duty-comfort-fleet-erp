import React, { useState, useEffect } from "react";
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
import { Loader2, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState = {
  email: "",
  company_id: "",
  phone: "",
  status: "active",
  user_role: "company_admin",
};

export default function AdminDialog({ 
  open, 
  onOpenChange, 
  admin, 
  companies = [],
  onSave, 
  isLoading,
  isSuperAdmin = false
}) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (admin) {
      setForm({ 
        email: admin.email || "",
        company_id: admin.company_id || "",
        phone: admin.phone || "",
        status: admin.status || "active",
        user_role: "company_admin",
      });
    } else {
      setForm(initialState);
    }
  }, [admin, open]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación
    if (!form.email || !form.company_id) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    if (admin) {
      // Editar: enviar company_id, phone, status
      const updateData = { 
        company_id: form.company_id,
        phone: form.phone, 
        status: form.status,
        user_role: "company_admin",
      };
      onSave(updateData);
    } else {
      // Crear: enviar datos para invitar
      const inviteData = {
        email: form.email,
        company_id: form.company_id,
      };
      onSave(inviteData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>{admin ? "Editar Administrador" : "Invitar Administrador"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!admin && (
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Mail className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                Se enviará una invitación por email para que el usuario se registre en el sistema.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="bg-slate-800 border-slate-700"
              required
              disabled={!!admin}
            />
          </div>

          <div className="space-y-2">
            <Label>Empresa *</Label>
            <Select value={form.company_id} onValueChange={(v) => handleChange("company_id", v)} required>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Seleccionar empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {admin && (
            <>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800 w-full sm:w-auto">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !form.email || !form.company_id} 
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {admin ? "Guardar" : "Enviar Invitación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}