import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-zinc-800/50 p-6",
      "backdrop-blur-xl shadow-2xl shadow-black/20",
      "transition-all duration-500 hover:bg-zinc-900 hover:border-yellow-500/30",
      "hover:shadow-yellow-500/10 hover:shadow-2xl hover:-translate-y-1",
      "group",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-black text-white tracking-tight bg-gradient-to-br from-white to-zinc-300 bg-clip-text text-transparent">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-zinc-600 font-medium">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-semibold",
              trendUp ? "text-emerald-400" : "text-rose-400"
            )}>
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/10 text-yellow-400 group-hover:from-yellow-500/20 group-hover:to-yellow-600/10 group-hover:border-yellow-500/20 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-yellow-500/5">
            <Icon className="w-7 h-7" />
          </div>
        )}
      </div>
      
      <div className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500/5 to-transparent blur-2xl group-hover:from-yellow-500/10 transition-all duration-500" />
    </div>
  );
}