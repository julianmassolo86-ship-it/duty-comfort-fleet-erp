import React, { useContext, createContext } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Default to dark if no provider
    return { theme: 'dark' };
  }
  return context;
};

export const ThemeConsumer = ThemeContext.Consumer;
export const ThemeContextValue = ThemeContext;