import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, X } from "lucide-react";
import PageHeader from "../components/common/PageHeader";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    logo_url: "",
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      setForm({
        full_name: userData.full_name || "",
        phone: userData.phone || "",
        logo_url: userData.logo_url || "",
      });
    });
  }, []);

  const isSuperAdmin = !user?.company_id;

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, logo_url: file_url }));
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Error al subir el logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(form);
      alert("Perfil actualizado correctamente");
      // Reload user data
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error al guardar el perfil");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <PageHeader 
          title="Mi Perfil" 
          description="Administra tu información personal"
        />

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={user.email}
                disabled
                className="bg-slate-700/50 border-slate-600 text-slate-400"
              />
              <p className="text-xs text-slate-500">El email no se puede modificar</p>
            </div>

            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-slate-800 border-slate-700"
              />
            </div>

            {isSuperAdmin && (
              <div className="space-y-2 pt-4 border-t border-slate-700">
                <Label>Logo Personalizado (Super Admin)</Label>
                <p className="text-xs text-slate-500 mb-2">
                  Este logo aparecerá en el menú lateral
                </p>
                {form.logo_url ? (
                  <div className="flex items-center gap-4">
                    <img 
                      src={form.logo_url} 
                      alt="Logo" 
                      className="w-24 h-24 object-contain bg-slate-700 rounded-lg p-2"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setForm(prev => ({ ...prev, logo_url: "" }))}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e.target.files[0])}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("logo-upload").click()}
                      disabled={uploadingLogo}
                      className="border-slate-700"
                    >
                      {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      Cargar Logo
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}