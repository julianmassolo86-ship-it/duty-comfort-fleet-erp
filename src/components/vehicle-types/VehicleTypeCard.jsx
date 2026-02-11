import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Truck, Bus, Bike, Wrench, TrendingUp, Forklift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeWrapper";

const categoryIcons = {
  car: Car,
  truck: Truck,
  van: Car,
  bus: Bus,
  motorcycle: Bike,
  machinery: Wrench,
  trailer: TrendingUp,
  pickup: Truck,
  semi_truck: Truck,
  crane: Forklift,
  excavator: Forklift,
  loader: Forklift,
  grader: Forklift,
  roller: Forklift,
  tractor: Forklift
};

const categoryLabels = {
  car: "Auto",
  truck: "Camión",
  van: "Furgón",
  bus: "Ómnibus",
  motorcycle: "Moto",
  machinery: "Maquinaria",
  trailer: "Remolque",
  pickup: "Pickup",
  semi_truck: "Semi",
  crane: "Grúa",
  excavator: "Excavadora",
  loader: "Cargadora",
  grader: "Niveladora",
  roller: "Rodillo",
  tractor: "Tractor"
};

export default function VehicleTypeCard({ vehicleType, onClick }) {
  const { theme } = useTheme();
  const Icon = categoryIcons[vehicleType.category] || Car;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg",
        theme === 'dark' 
          ? 'bg-zinc-900 border-zinc-700 hover:border-yellow-500/50' 
          : 'bg-white border-gray-200 hover:border-yellow-500/50'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'
          )}>
            <Icon className={cn(
              "w-6 h-6",
              theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
            )} />
          </div>
          <Badge variant="outline" className={cn(
            theme === 'dark' 
              ? 'bg-zinc-800 text-zinc-300 border-zinc-600' 
              : 'bg-gray-100 text-gray-700 border-gray-300'
          )}>
            {categoryLabels[vehicleType.category] || vehicleType.category}
          </Badge>
        </div>
        <CardTitle className={cn(
          "text-lg mt-3",
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        )}>
          {vehicleType.name}
        </CardTitle>
      </CardHeader>
      {vehicleType.notes && (
        <CardContent>
          <p className={cn(
            "text-sm line-clamp-2",
            theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
          )}>
            {vehicleType.notes}
          </p>
        </CardContent>
      )}
    </Card>
  );
}