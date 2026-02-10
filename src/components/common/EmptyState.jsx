import { cn } from "@/lib/utils";

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center",
      className
    )}>
      {Icon && (
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-4">
          <Icon className="w-10 h-10 text-slate-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-slate-400 max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}