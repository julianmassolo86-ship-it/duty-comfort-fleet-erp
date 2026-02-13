import { cn } from "@/lib/utils";
import { useTheme } from "../common/ThemeWrapper";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  const { theme } = useTheme();
  
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-6 h-36",
      "backdrop-blur-xl shadow-2xl hover:-translate-y-1",
      "transition-all duration-500 group",
      theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800/50 shadow-black/20 hover:bg-zinc-900 hover:border-yellow-500/30 hover:shadow-yellow-500/10 hover:shadow-2xl' : 'bg-white border-gray-200 shadow-gray-200/50 hover:shadow-xl hover:border-yellow-500/30',
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 flex flex-col">
          <p className={cn("text-xs font-semibold uppercase tracking-wider", theme === 'dark' ? 'text-zinc-500' : 'text-gray-500')}>{title}</p>
          <p className={cn("text-4xl font-black tracking-tight mt-2", theme === 'dark' ? 'text-white bg-gradient-to-br from-white to-zinc-300 bg-clip-text text-transparent' : 'text-gray-900')}>
            {value}
          </p>
          {subtitle && (
            <p className={cn("text-sm font-medium mt-2 line-clamp-2", theme === 'dark' ? 'text-zinc-600' : 'text-gray-500')}>{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-semibold mt-2",
              trendUp ? "text-emerald-400" : "text-rose-400"
            )}>
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="flex-shrink-0 p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/10 text-yellow-400 group-hover:from-yellow-500/20 group-hover:to-yellow-600/10 group-hover:border-yellow-500/20 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-yellow-500/5">
            <Icon className="w-7 h-7" />
          </div>
        )}
      </div>
      
      <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500/5 to-transparent blur-2xl group-hover:from-yellow-500/10 transition-all duration-500" />
    </div>
  );
}