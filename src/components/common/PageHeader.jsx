import { cn } from "@/lib/utils";

export default function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8", className)}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {description && (
          <p className="text-zinc-500 mt-1">{description}</p>
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