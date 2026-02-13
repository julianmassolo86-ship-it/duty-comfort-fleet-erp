import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import PageHeader from "../components/common/PageHeader";
import { useTheme } from "../components/common/ThemeWrapper";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    display_name: "",
    phone: "",
    logo_url: "",
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        console.log("User data loaded:", userData);
        setUser(userData);
        setForm({
          display_name: userData.display_name || "",
          phone: userData.phone || "",
          logo_url: userData.logo_url || "",
        });
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
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

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    
    try {
      const updateData = {
        display_name: form.display_name.trim(),
        phone: form.phone
      };
      
      if (isSuperAdmin) {
        updateData.logo_url = form.logo_url;
      }
      
      await base44.auth.updateMe(updateData);
      
      const userData = await base44.auth.me();
      setUser(userData);
      setForm({
        display_name: userData.display_name || "",
        phone: userData.phone || "",
        logo_url: userData.logo_url || "",
      });
      
      window.dispatchEvent(new CustomEvent('userProfileUpdated'));
      alert("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error al guardar el perfil: " + (error.message || JSON.stringify(error)));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      return;
    }
    
    if (!confirm("ADVERTENCIA: Se eliminarán todos tus datos permanentemente. ¿Confirmas la eliminación?")) {
      return;
    }

    try {
      await base44.entities.User.delete(user.id);
      await base44.auth.logout(window.location.origin);
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Error al eliminar la cuenta. Por favor contacta al soporte.");
    }
  };

  if (!user) {
    return (
      <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen p-4 sm:p-6 lg:p-8", theme === 'dark' ? 'bg-black' : 'bg-gray-50')}>
      <div className="max-w-3xl mx-auto">
        <PageHeader 
          title="Mi Perfil" 
          description="Administra tu información personal"
        />

        <form onSubmit={handleSave}>
          <Card className={cn("backdrop-blur-xl shadow-2xl", theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800 shadow-black/20' : 'bg-white border-gray-200 shadow-gray-200/50')}>
            <CardHeader>
              <CardTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={user.email}
                disabled
                className={theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700 text-zinc-400' : 'bg-gray-100 border-gray-300 text-gray-500'}
              />
              <p className={cn("text-xs", theme === 'dark' ? 'text-slate-500' : 'text-gray-500')}>El email no se puede modificar</p>
            </div>

            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 transition-colors' : 'bg-white border-gray-300 focus:border-yellow-500 transition-colors'}
              />
            </div>

            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                className={theme === 'dark' ? 'bg-zinc-900 border-zinc-700 focus:border-yellow-500/50 transition-colors' : 'bg-white border-gray-300 focus:border-yellow-500 transition-colors'}
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
                      className="w-24 h-24 object-contain bg-zinc-800 rounded-lg p-2 border border-zinc-700"
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
                      className="border-zinc-700 hover:border-yellow-500/50 transition-colors"
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
                type="submit"
                disabled={saving}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>

            <div className={cn(
              "mt-8 pt-6 border-t",
              theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'
            )}>
              <h3 className={cn(
                "text-sm font-semibold mb-3",
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              )}>
                Zona de Peligro
              </h3>
              <Button
                onClick={handleDeleteAccount}
                variant="outline"
                className={cn(
                  "border-red-500 text-red-500 hover:bg-red-500 hover:text-white",
                  theme === 'dark' && 'border-red-500/50 hover:border-red-500'
                )}
              >
                Eliminar Cuenta
              </Button>
            </div>
          </CardContent>
        </Card>
        </form>
      </div>
    </div>
  );
}