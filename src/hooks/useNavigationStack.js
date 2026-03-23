import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Maintains a persistent navigation stack in sessionStorage so that
 * the browser back button always works predictably, even after hard
 * reloads or when the user navigates via the bottom nav.
 *
 * Returns { canGoBack, goBack } for use in back-button UI.
 */
export function useNavigationStack() {
  const location = useLocation();
  const navigate = useNavigate();
  const stackKey = "nav_stack";

  // Push current path onto the stack whenever the location changes.
  useEffect(() => {
    const raw = sessionStorage.getItem(stackKey);
    const stack = raw ? JSON.parse(raw) : [];

    const last = stack[stack.length - 1];
    const current = location.pathname + location.search;

    if (last !== current) {
      // Cap stack at 50 entries to avoid unbounded growth
      const next = [...stack, current].slice(-50);
      sessionStorage.setItem(stackKey, JSON.stringify(next));
    }
  }, [location]);

  const canGoBack = () => {
    const raw = sessionStorage.getItem(stackKey);
    const stack = raw ? JSON.parse(raw) : [];
    return stack.length > 1;
  };

  const goBack = () => {
    const raw = sessionStorage.getItem(stackKey);
    const stack = raw ? JSON.parse(raw) : [];
    if (stack.length > 1) {
      const next = stack.slice(0, -1);
      sessionStorage.setItem(stackKey, JSON.stringify(next));
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return { canGoBack, goBack };
}