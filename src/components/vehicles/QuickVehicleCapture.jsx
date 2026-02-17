import React, { useState, useRef } from "react";
import { Camera, Loader2, CheckCircle2, XCircle, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function QuickVehicleCapture({ open, onOpenChange, onVehicleFound, onVehicleNotFound, theme }) {
  const [step, setStep] = useState("initial"); // initial, uploading, processing, success, error
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [extractedData, setExtractedData] = useState(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const resetState = () => {
    setStep("initial");
    setLoading(false);
    setMessage("");
    setExtractedData(null);
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    try {
      setLoading(true);
      setStep("uploading");
      setMessage("Subiendo imagen...");

      // Upload the image
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setStep("processing");
      setMessage("Analizando imagen con IA...");

      // Use AI to extract vehicle identification
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Analiza esta imagen de un vehículo y extrae la siguiente información si está visible:
        - Patente/Matrícula del vehículo
        - Número interno (calco identificatorio)
        - Marca del vehículo (si es claramente visible)
        - Modelo del vehículo (si es claramente visible)
        
        Responde SOLO con los datos que puedas identificar con certeza. Si no ves algo claramente, no lo incluyas.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            plate: { type: "string", description: "Patente del vehículo" },
            internal_number: { type: "string", description: "Número interno del vehículo" },
            manufacturer: { type: "string", description: "Marca del vehículo" },
            model: { type: "string", description: "Modelo del vehículo" }
          }
        }
      });

      const extracted = aiResponse || {};
      setExtractedData(extracted);

      // Check if we got at least plate or internal_number
      if (!extracted.plate && !extracted.internal_number) {
        setStep("error");
        setMessage("No se pudo detectar patente ni número interno en la imagen. Por favor, intenta con una foto más clara.");
        setLoading(false);
        return;
      }

      setMessage("Buscando vehículo en la base de datos...");

      // Search for the vehicle in the database
      const vehicles = await base44.entities.Vehicle.list();
      
      let foundVehicle = null;
      if (extracted.plate) {
        foundVehicle = vehicles.find(v => 
          v.plate && v.plate.toLowerCase().replace(/\s/g, '') === extracted.plate.toLowerCase().replace(/\s/g, '')
        );
      }
      
      if (!foundVehicle && extracted.internal_number) {
        foundVehicle = vehicles.find(v => 
          v.internal_number && v.internal_number.toLowerCase().replace(/\s/g, '') === extracted.internal_number.toLowerCase().replace(/\s/g, '')
        );
      }

      if (foundVehicle) {
        // Vehicle exists
        setStep("success");
        setMessage(`Vehículo encontrado: ${foundVehicle.plate || foundVehicle.internal_number}`);
        setLoading(false);
        
        // Notify parent component
        setTimeout(() => {
          onVehicleFound(foundVehicle);
          onOpenChange(false);
          resetState();
        }, 1500);
      } else {
        // Vehicle doesn't exist - prepare for new registration
        setStep("success");
        setMessage("Vehículo no registrado. Abriendo formulario con datos detectados...");
        setLoading(false);
        
        setTimeout(() => {
          onVehicleNotFound(extracted);
          onOpenChange(false);
          resetState();
        }, 1500);
      }

    } catch (error) {
      console.error("Error processing image:", error);
      setStep("error");
      setMessage("Error al procesar la imagen. Por favor, intenta nuevamente.");
      setLoading(false);
    }
  };

  const handleCameraChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
      e.target.value = '';
    }
  };

  const handleGalleryChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
      e.target.value = '';
    }
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogContent className={cn("sm:max-w-md", theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200')}>
        <DialogHeader>
          <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
            Captura Rápida de Vehículo
          </DialogTitle>
          <DialogDescription className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>
            Toma una foto de la patente o número interno del vehículo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "initial" && (
            <>
              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraChange}
                style={{ display: 'none' }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleGalleryChange}
                style={{ display: 'none' }}
              />
              
              <div className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center",
                theme === 'dark' ? 'border-zinc-700 bg-zinc-800/50' : 'border-gray-300 bg-gray-50'
              )}>
                <Camera className={cn("w-12 h-12 mx-auto mb-3", theme === 'dark' ? 'text-zinc-500' : 'text-gray-400')} />
                <p className={cn("text-sm mb-4", theme === 'dark' ? 'text-zinc-400' : 'text-gray-600')}>
                  Asegúrate de que la patente o número interno sean claramente visibles
                </p>
                <Button
                  onClick={triggerCamera}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Tomar Foto
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className={cn("w-full border-t", theme === 'dark' ? 'border-zinc-700' : 'border-gray-300')} />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className={cn("px-2", theme === 'dark' ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-gray-500')}>
                    o
                  </span>
                </div>
              </div>

              <Button
                onClick={triggerGallery}
                variant="outline"
                className={cn("w-full", theme === 'dark' ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100')}
              >
                <Upload className="w-4 h-4 mr-2" />
                Subir desde Galería
              </Button>
            </>
          )}

          {(step === "uploading" || step === "processing") && (
            <Alert className={theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-blue-50 border-blue-200'}>
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription className={theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {step === "success" && (
            <Alert className={theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className={theme === 'dark' ? 'text-green-300' : 'text-green-700'}>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {step === "error" && (
            <>
              <Alert className={theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}>
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className={theme === 'dark' ? 'text-red-300' : 'text-red-700'}>
                  {message}
                </AlertDescription>
              </Alert>
              <Button
                onClick={resetState}
                variant="outline"
                className={cn("w-full", theme === 'dark' ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100')}
              >
                Intentar Nuevamente
              </Button>
            </>
          )}

          {extractedData && step === "success" && (
            <div className={cn("rounded-lg p-3 text-sm space-y-1", theme === 'dark' ? 'bg-zinc-800 border border-zinc-700' : 'bg-gray-50 border border-gray-200')}>
              <p className={cn("font-medium", theme === 'dark' ? 'text-white' : 'text-gray-900')}>Datos detectados:</p>
              {extractedData.plate && (
                <p className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>
                  <span className="font-medium">Patente:</span> {extractedData.plate}
                </p>
              )}
              {extractedData.internal_number && (
                <p className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>
                  <span className="font-medium">N° Interno:</span> {extractedData.internal_number}
                </p>
              )}
              {extractedData.manufacturer && (
                <p className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>
                  <span className="font-medium">Marca:</span> {extractedData.manufacturer}
                </p>
              )}
              {extractedData.model && (
                <p className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>
                  <span className="font-medium">Modelo:</span> {extractedData.model}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}