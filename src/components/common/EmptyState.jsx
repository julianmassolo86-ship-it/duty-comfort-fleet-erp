import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeWrapper";

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  const { theme } = useTheme();
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center",
      className
    )}>
      {Icon && (
        <div className={cn("p-4 rounded-2xl border mb-4", theme === 'dark' ? 'bg-slate-800/50 border-slate-700/50' : 'bg-gray-100 border-gray-200')}>
          <Icon className={cn("w-10 h-10", theme === 'dark' ? 'text-slate-500' : 'text-gray-400')} />
        </div>
      )}
      <h3 className={cn("text-lg font-semibold mb-2", theme === 'dark' ? 'text-white' : 'text-gray-900')}>{title}</h3>
      {description && (
        <p className={cn("max-w-sm mb-6", theme === 'dark' ? 'text-slate-400' : 'text-gray-600')}>{description}</p>
      )}
      {action}
    </div>
  );
}