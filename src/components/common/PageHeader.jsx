import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeWrapper";

export default function PageHeader({ title, description, actions, className }) {
  const { theme } = useTheme();
  
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8", className)}>
      <div>
        <h1 className={cn("text-2xl sm:text-3xl font-bold tracking-tight", theme === 'dark' ? 'text-white' : 'text-gray-900')}>{title}</h1>
        {description && (
          <p className={cn("mt-1", theme === 'dark' ? 'text-slate-400' : 'text-gray-600')}>{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}