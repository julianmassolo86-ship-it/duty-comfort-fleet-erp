import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X, Upload, Eye, Download as DownloadIcon, FileText } from "lucide-react";

export default function VehicleCardDocument({ 
  title,
  document_front_url,
  document_back_url,
  document_expiry,
  expiry_field,
  front_url_field,
  back_url_field,
  uploading,
  onExpiryChange,
  onFrontFileChange,
  onBackFileChange,
  onDelete,
  uploadFrontId,
  uploadBackId
}) {
  const handleDownload = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-700 hover:border-yellow-500/30 transition-all">
      <div className="mb-3">
        <Label className="text-base font-semibold text-white">{title}</Label>
        {document_expiry && (
          <p className="text-xs text-zinc-500 mt-1">Vence: {new Date(document_expiry).toLocaleDateString()}</p>
        )}
      </div>

      {expiry_field && (
        <Input
          type="date"
          value={document_expiry || ""}
          onChange={(e) => onExpiryChange(expiry_field, e.target.value)}
          className="bg-zinc-800 border-zinc-700 focus:border-yellow-500/50 mb-3 text-sm"
          placeholder="Fecha de vencimiento"
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Lado A */}
        <div className="space-y-2">
          <Label className="text-sm text-zinc-400">Lado A (Frente)</Label>
          {document_front_url ? (
            <div className="space-y-2">
              <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-zinc-700 bg-zinc-800">
                <img 
                  src={document_front_url} 
                  alt={`${title} - Frente`} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(document_front_url, '_blank')}
                  className="border-zinc-700 hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all flex-1 text-black bg-white"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">Ver</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(document_front_url, `${title.toLowerCase().replace(/\s+/g, '_')}_frente.jpg`)}
                  className="border-zinc-700 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all flex-1 text-black bg-white"
                >
                  <DownloadIcon className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">Descargar</span>
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onDelete(front_url_field, "")}
                className="w-full hover:bg-red-700 text-xs text-white"
              >
                <X className="w-3 h-3 mr-1" />
                <span className="font-medium">Eliminar</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-full h-32 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 flex flex-col items-center justify-center gap-2">
                <FileText className="w-6 h-6 text-zinc-600" />
                <p className="text-xs text-zinc-500">Sin documento</p>
              </div>
              <input
                type="file"
                id={uploadFrontId}
                accept="image/*,application/pdf"
                className="hidden"
                onChange={onFrontFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(uploadFrontId).click()}
                disabled={uploading}
                className="border-zinc-700 hover:bg-zinc-800 w-full text-black bg-white text-xs"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                <span className="font-medium">Cargar Lado A</span>
              </Button>
            </div>
          )}
        </div>

        {/* Lado B */}
        <div className="space-y-2">
          <Label className="text-sm text-zinc-400">Lado B (Dorso)</Label>
          {document_back_url ? (
            <div className="space-y-2">
              <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-zinc-700 bg-zinc-800">
                <img 
                  src={document_back_url} 
                  alt={`${title} - Dorso`} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(document_back_url, '_blank')}
                  className="border-zinc-700 hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all flex-1 text-black bg-white"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">Ver</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(document_back_url, `${title.toLowerCase().replace(/\s+/g, '_')}_dorso.jpg`)}
                  className="border-zinc-700 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all flex-1 text-black bg-white"
                >
                  <DownloadIcon className="w-3 h-3 mr-1" />
                  <span className="text-xs font-medium">Descargar</span>
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onDelete(back_url_field, "")}
                className="w-full hover:bg-red-700 text-xs text-white"
              >
                <X className="w-3 h-3 mr-1" />
                <span className="font-medium">Eliminar</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-full h-32 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 flex flex-col items-center justify-center gap-2">
                <FileText className="w-6 h-6 text-zinc-600" />
                <p className="text-xs text-zinc-500">Sin documento</p>
              </div>
              <input
                type="file"
                id={uploadBackId}
                accept="image/*,application/pdf"
                className="hidden"
                onChange={onBackFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(uploadBackId).click()}
                disabled={uploading}
                className="border-zinc-700 hover:bg-zinc-800 w-full text-black bg-white text-xs"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                <span className="font-medium">Cargar Lado B</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}