import React from 'react';
import { Palette } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeName } from '../../types';

export interface ThemeOption {
  id: ThemeName;
  name: string;
  color: string;
  colorName: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'corporate-light',
    name: 'Corporate Light',
    color: '#0284c7',
    colorName: 'Sky Blue / Light',
    description: 'Bright high-clarity enterprise white',
  },
  {
    id: 'corporate-dark',
    name: 'Corporate Dark',
    color: '#38bdf8',
    colorName: 'Cyan / Deep Slate',
    description: 'Modern executive dark theme with cyan highlights',
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    color: '#2563eb',
    colorName: 'Royal Blue',
    description: 'Deep professional corporate blue',
  },
  {
    id: 'emerald-green',
    name: 'Emerald Green',
    color: '#059669',
    colorName: 'Forest Green',
    description: 'Fresh agricultural seed emerald green',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    color: '#7c3aed',
    colorName: 'Imperial Violet',
    description: 'Rich royal purple & indigo accents',
  },
  {
    id: 'modern-teal',
    name: 'Modern Teal',
    color: '#0d9488',
    colorName: 'Teal & Mint',
    description: 'Fresh modern teal & cold-storage aqua',
  },
  {
    id: 'executive-navy',
    name: 'Executive Navy',
    color: '#1e3a8a',
    colorName: 'Deep Navy',
    description: 'Prestigious maritime navy palette',
  },
  {
    id: 'slate-gray',
    name: 'Slate Gray',
    color: '#475569',
    colorName: 'Neutral Slate',
    description: 'Subtle, balanced neutral slate palette',
  },
  {
    id: 'warm-sand',
    name: 'Warm Sand',
    color: '#b45309',
    colorName: 'Harvest Amber',
    description: 'Warm agricultural harvest amber tones',
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    color: '#000000',
    colorName: 'Monochrome High-Vis',
    description: 'Maximum contrast for high visibility',
  },
];

interface ThemeDropdownProps {
  onOpenThemeModal?: () => void;
  className?: string;
}

export const ThemeDropdown: React.FC<ThemeDropdownProps> = ({
  onOpenThemeModal,
  className = '',
}) => {
  const { themeName } = useTheme();
  const currentTheme = THEME_OPTIONS.find((t) => t.id === themeName) || THEME_OPTIONS[0];

  return (
    <div className={`relative ${className}`}>
      {/* Theme Icon Button - Shows only theme palette icon and active color dot; clicking directly opens Theme Modal */}
      <button
        type="button"
        onClick={onOpenThemeModal}
        className="flex items-center gap-1.5 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors border border-transparent hover:border-slate-600/60 cursor-pointer shadow-2xs"
        title={`Theme Palette: ${currentTheme.name}. Click to open Theme Settings.`}
        aria-label="Open Theme Settings Modal"
      >
        <Palette className="w-4 h-4 text-sky-400 shrink-0" />
        <span
          className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0 shadow-2xs"
          style={{ backgroundColor: currentTheme.color }}
        />
      </button>
    </div>
  );
};
