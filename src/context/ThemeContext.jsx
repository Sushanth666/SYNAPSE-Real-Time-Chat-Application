import React, { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(undefined);
export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        try {
            const saved = localStorage.getItem('pulsechat_theme');
            const explicit = localStorage.getItem('synapse_theme_explicit');
            // Only honor dark if user explicitly chose it via toggle/settings
            if (explicit && (saved === 'light' || saved === 'dark')) {
                return saved;
            }
            if (saved === 'light') {
                return 'light';
            }
        } catch {}
        // Default theme is light across all devices
        return 'light';
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
        try {
            localStorage.setItem('pulsechat_theme', theme);
        } catch {}
    }, [theme]);

    const toggleTheme = () => {
        setThemeState(prev => {
            const next = prev === 'dark' ? 'light' : 'dark';
            try {
                localStorage.setItem('synapse_theme_explicit', 'true');
                localStorage.setItem('pulsechat_theme', next);
            } catch {}
            return next;
        });
    };

    const setTheme = (t) => {
        try {
            localStorage.setItem('synapse_theme_explicit', 'true');
            localStorage.setItem('pulsechat_theme', t);
        } catch {}
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
