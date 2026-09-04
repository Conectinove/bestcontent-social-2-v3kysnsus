import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'

export type MenuLayoutType = 'sidebar' | 'topbar'

export interface ColorSwatch {
  id: string
  name: string
  colorHex: string
  hslPrimary: string
  hslRing: string
}

export const APP_COLOR_PALETTES: ColorSwatch[] = [
  {
    id: 'blue',
    name: 'Azul',
    colorHex: '#2563eb',
    hslPrimary: '221 83% 53%',
    hslRing: '221 83% 53%',
  },
  {
    id: 'indigo',
    name: 'Roxo Escuro',
    colorHex: '#4f46e5',
    hslPrimary: '243 75% 59%',
    hslRing: '243 75% 59%',
  },
  {
    id: 'purple',
    name: 'Roxo BestContent',
    colorHex: '#8b5cf6',
    hslPrimary: '262 83% 58%',
    hslRing: '262 83% 58%',
  },
  {
    id: 'magenta',
    name: 'Magenta',
    colorHex: '#d946ef',
    hslPrimary: '292 84% 61%',
    hslRing: '292 84% 61%',
  },
  {
    id: 'red',
    name: 'Vermelho',
    colorHex: '#ef4444',
    hslPrimary: '0 84% 60%',
    hslRing: '0 84% 60%',
  },
  {
    id: 'orange',
    name: 'Laranja',
    colorHex: '#f97316',
    hslPrimary: '24 95% 53%',
    hslRing: '24 95% 53%',
  },
  {
    id: 'green',
    name: 'Verde',
    colorHex: '#10b981',
    hslPrimary: '160 84% 39%',
    hslRing: '160 84% 39%',
  },
  {
    id: 'teal',
    name: 'Teal',
    colorHex: '#14b8a6',
    hslPrimary: '173 80% 40%',
    hslRing: '173 80% 40%',
  },
]

interface CustomizationContextType {
  menuLayout: MenuLayoutType
  setMenuLayout: (layout: MenuLayoutType) => void
  appColor: string
  setAppColor: (colorId: string) => void
  customHex: string | null
  setCustomHex: (hex: string) => void
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined)

function applyColorToDom(colorId: string, customHex?: string | null) {
  const root = document.documentElement
  if (colorId === 'custom' && customHex) {
    // Convert hex to HSL roughly or set CSS variable directly
    root.style.setProperty('--primary', customHex)
    root.style.setProperty('--sidebar-primary', customHex)
    root.style.setProperty('--ring', customHex)
    return
  }

  const found = APP_COLOR_PALETTES.find((c) => c.id === colorId) || APP_COLOR_PALETTES[2]
  root.style.setProperty('--primary', found.hslPrimary)
  root.style.setProperty('--sidebar-primary', found.hslPrimary)
  root.style.setProperty('--ring', found.hslRing)
}

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const { user, updateProfile } = useAuth()

  const [menuLayout, setMenuLayoutState] = useState<MenuLayoutType>(() => {
    return (user?.menu_layout as MenuLayoutType) || 'sidebar'
  })

  const [appColor, setAppColorState] = useState<string>(() => {
    return user?.app_color || 'purple'
  })

  const [customHex, setCustomHexState] = useState<string | null>(() => {
    return localStorage.getItem('bc_custom_color_hex') || '#8b5cf6'
  })

  // Sync state if user loads later
  useEffect(() => {
    if (user?.menu_layout) {
      setMenuLayoutState(user.menu_layout as MenuLayoutType)
    }
    if (user?.app_color) {
      setAppColorState(user.app_color)
    }
  }, [user?.menu_layout, user?.app_color])

  // Apply color to DOM whenever appColor or customHex changes
  useEffect(() => {
    applyColorToDom(appColor, customHex)
  }, [appColor, customHex])

  const setMenuLayout = (layout: MenuLayoutType) => {
    setMenuLayoutState(layout)
    if (user) {
      updateProfile({ menu_layout: layout }).catch(console.error)
    }
  }

  const setAppColor = (colorId: string) => {
    setAppColorState(colorId)
    applyColorToDom(colorId, customHex)
    if (user) {
      updateProfile({ app_color: colorId }).catch(console.error)
    }
  }

  const setCustomHex = (hex: string) => {
    setCustomHexState(hex)
    localStorage.setItem('bc_custom_color_hex', hex)
    setAppColorState('custom')
    applyColorToDom('custom', hex)
    if (user) {
      updateProfile({ app_color: 'custom' }).catch(console.error)
    }
  }

  return (
    <CustomizationContext.Provider
      value={{
        menuLayout,
        setMenuLayout,
        appColor,
        setAppColor,
        customHex,
        setCustomHex,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  )
}

export function useCustomization() {
  const context = useContext(CustomizationContext)
  if (!context) {
    throw new Error('useCustomization must be used within a CustomizationProvider')
  }
  return context
}
