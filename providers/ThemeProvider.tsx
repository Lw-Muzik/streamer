"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeContextType = {
  theme: string;
  colorTheme: string;
  setTheme: (theme: string) => void;
  setColorTheme: (colorTheme: string) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colorTheme: 'green',
  setTheme: () => {},
  setColorTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState('dark');
  const [colorTheme, setColorTheme] = useState('green');
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on component mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedColorTheme = localStorage.getItem('colorTheme') || 'green';
    
    setTheme(savedTheme);
    setColorTheme(savedColorTheme);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;
    
    document.documentElement.classList.remove('light-mode', 'dark-mode');
    document.documentElement.classList.add(`${theme}-mode`);
    document.documentElement.setAttribute('data-color-theme', colorTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('colorTheme', colorTheme);
  }, [theme, colorTheme, mounted]);

  // Avoid rendering with wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, colorTheme, setTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
