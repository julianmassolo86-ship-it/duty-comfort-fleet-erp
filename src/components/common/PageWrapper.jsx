import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeWrapper";

/**
 * Standard page content wrapper.
 *
 * Provides:
 *  - Consistent padding and max-width
 *  - Pull-to-refresh gesture (mobile only) with debounce
 *  - Refresh indicator overlay
 *
 * Usage:
 *   <PageWrapper onRefresh={async () => { ... }}>
 *     ...page content
 *   </PageWrapper>
 *
 * onRefresh: optional async function. If omitted, PTR is disabled.
 */
export default function PageWrapper({ children, onRefresh, className }) {
  const { theme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const startYRef = useRef(0);

  useEffect(() => {
    if (!onRefresh) return;

    const handleTouchStart = (e) => {
      startYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = async (e) => {
      if (refreshingRef.current) return;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop !== 0) return;

      const pullDistance = e.touches[0].clientY - startYRef.current;
      if (pullDistance > 90) {
        refreshingRef.current = true;
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          refreshingRef.current = false;
        }
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [onRefresh]);

  return (
    <>
      {/* Refresh indicator */}
      {isRefreshing && (
        <div
          className={cn(
            "fixed top-16 left-0 right-0 z-50 flex items-center justify-center py-2",
            theme === "dark" ? "bg-zinc-900/90" : "bg-white/90"
          )}
        >
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500" />
          <span className={cn("ml-2 text-sm", theme === "dark" ? "text-zinc-300" : "text-gray-700")}>
            Actualizando...
          </span>
        </div>
      )}

      <div
        className={cn(
          "min-h-screen p-4 sm:p-6 lg:p-8",
          theme === "dark" ? "bg-black" : "bg-gray-50",
          className
        )}
      >
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>
    </>
  );
}