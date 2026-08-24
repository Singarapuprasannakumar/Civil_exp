import React, { createContext, useContext, useState } from 'react';

interface AntigravityContextType {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  animations: boolean;
  rounded: string;
  shadows: string;
  density: string;
}

const AntigravityContext = createContext<AntigravityContextType>({
  theme: 'light',
  setTheme: () => {},
  animations: true,
  rounded: 'xl',
  shadows: 'soft',
  density: 'comfortable'
});

export const useAntigravity = () => useContext(AntigravityContext);

interface AntigravityProviderProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  animations?: boolean;
  rounded?: string;
  shadows?: string;
  density?: string;
}

export const AntigravityProvider: React.FC<AntigravityProviderProps> = ({
  children,
  theme: initialTheme = 'light',
  animations = true,
  rounded = 'xl',
  shadows = 'soft',
  density = 'comfortable'
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);

  return (
    <AntigravityContext.Provider
      value={{
        theme,
        setTheme,
        animations,
        rounded,
        shadows,
        density
      }}
    >
      <div className={`h-screen w-screen${theme === 'dark' ? ' dark' : ''}`}>
        {children}
      </div>
    </AntigravityContext.Provider>
  );
};
