import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6",
      "backdrop-blur-sm transition-all duration-300 hover:bg-slate-800/70 hover:border-slate-600/50",
      "group",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trendUp ? "text-emerald-400" : "text-rose-400"
            )}>
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
    </div>
  );
}