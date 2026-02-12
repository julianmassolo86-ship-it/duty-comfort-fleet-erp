import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeWrapper";

export default function PullToRefresh({ onRefresh, isRefreshing, children }) {
  const { theme } = useTheme();

  useEffect(() => {
    let startY = 0;
    let scrollTop = 0;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      if (scrollTop === 0 && pullDistance > 100 && !isRefreshing) {
        onRefresh();
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isRefreshing, onRefresh]);

  return (
    <>
      {isRefreshing && (
        <div className={cn(
          "fixed top-16 left-0 right-0 z-50 flex items-center justify-center py-2",
          theme === 'dark' ? 'bg-zinc-900/90' : 'bg-white/90'
        )}>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500" />
          <span className={cn("ml-2 text-sm", theme === 'dark' ? 'text-zinc-300' : 'text-gray-700')}>
            Actualizando...
          </span>
        </div>
      )}
      {children}
    </>
  );
}