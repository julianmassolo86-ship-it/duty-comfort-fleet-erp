import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X, Upload, ZoomIn, Download, FileText } from "lucide-react";

export default function DocumentCard({ 
  title,
  document_url,
  document_expiry,
  expiry_field,
  url_field,
  uploading,
  onExpiryChange,
  onFileChange,
  onDelete,
  uploadId
}) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = document_url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.jpg`;
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

      {document_url ? (
        <div className="space-y-3">
          <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-zinc-700 bg-zinc-800">
            <img 
              src={document_url} 
              alt={title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => window.open(document_url, '_blank')}
              className="border-zinc-700 hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all w-full"
            >
              <ZoomIn className="w-4 h-4 mr-2" />
              Ver
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="border-zinc-700 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => onDelete(url_field, "")}
            className="w-full hover:bg-red-700"
          >
            <X className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-full h-32 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 flex flex-col items-center justify-center gap-2">
            <FileText className="w-8 h-8 text-zinc-600" />
            <p className="text-xs text-zinc-500">Sin documento</p>
          </div>
          <input
            type="file"
            id={uploadId}
            accept="image/*,application/pdf"
            className="hidden"
            onChange={onFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(uploadId).click()}
            disabled={uploading}
            className="border-zinc-700 hover:bg-zinc-800 w-full"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Cargar Documento
          </Button>
        </div>
      )}
    </div>
  );
}