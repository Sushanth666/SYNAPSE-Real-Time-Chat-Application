import React, { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(undefined);
export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem('pulsechat_theme');
        if (saved === 'light' || saved === 'dark')
            return saved;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    });
    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
            if (body) {
                body.classList.add('dark');
                body.classList.remove('light');
            }
        }
        else {
            root.classList.remove('dark');
            root.classList.add('light');
            if (body) {
                body.classList.remove('dark');
                body.classList.add('light');
            }
        }
        localStorage.setItem('pulsechat_theme', theme);
    }, [theme]);
    const toggleTheme = () => {
        setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
    };
    const setTheme = (t) => {
        setThemeState(t);
    };
    return (<ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>);
};
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
