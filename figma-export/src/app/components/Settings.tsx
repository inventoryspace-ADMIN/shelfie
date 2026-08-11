import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Settings as SettingsIcon, Check, Palette, RotateCcw } from 'lucide-react';

export interface Theme {
  id: string;
  name: string;
  background: string;
  foreground: string;
  accent: string;
  muted: string;
  border: string;
}

const themes: Theme[] = [
  {
    id: 'light',
    name: 'Light',
    background: '#ffffff',
    foreground: '#000000',
    accent: '#f8f9fa',
    muted: '#6c757d',
    border: '#dee2e6'
  },
  {
    id: 'dark',
    name: 'Dark',
    background: '#0a0a0a',
    foreground: '#ffffff',
    accent: '#1a1a1a',
    muted: '#888888',
    border: '#2a2a2a'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    background: '#1a1b26',
    foreground: '#c0caf5',
    accent: '#7aa2f7',
    muted: '#565f89',
    border: '#414868'
  },
  {
    id: 'sage',
    name: 'Sage',
    background: '#f7f9f7',
    foreground: '#2d3748',
    accent: '#68d391',
    muted: '#718096',
    border: '#e2e8f0'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    background: '#fef7f0',
    foreground: '#744210',
    accent: '#f56500',
    muted: '#a0640a',
    border: '#fed7aa'
  }
];

const themeDescriptions = {
  light: 'Clean minimalist • Subtle grey accents on hover',
  dark: 'Deep black • Dark grey highlights and interactions',
  midnight: 'Dark navy • Bright blue accents and active states',
  sage: 'Natural green • Fresh emerald highlights and interactions',
  sunset: 'Warm cream • Bold orange accents and hover effects'
};

interface SettingsProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
  gridSize: 4 | 8;
  onGridSizeChange: (size: 4 | 8) => void;
  customTheme: {main: string, accent: string} | null;
  onCustomThemeChange: (main: string, accent: string) => void;
  onResetCustomTheme: () => void;
  showValues?: boolean;
  onShowValuesChange?: (show: boolean) => void;
}

// Curated color palette for custom themes (reduced to 8 essential colors)
const colorPalette = [
  '#1e40af', // Blue
  '#059669', // Emerald
  '#dc2626', // Red
  '#7c3aed', // Violet
  '#ea580c', // Orange
  '#be185d', // Pink
  '#374151', // Gray
  '#1f2937'  // Gray dark
];

export function Settings({ 
  currentTheme, 
  onThemeChange, 
  gridSize, 
  onGridSizeChange,
  customTheme,
  onCustomThemeChange,
  onResetCustomTheme,
  showValues,
  onShowValuesChange
}: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMainColor, setSelectedMainColor] = useState<string>(customTheme?.main || '#1e40af');
  const [selectedAccentColor, setSelectedAccentColor] = useState<string>(customTheme?.accent || '#059669');

  const currentThemeData = themes.find(theme => theme.id === currentTheme) || themes[0];

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        style={{ 
          borderColor: 'var(--theme-fg)',
          color: 'var(--theme-fg)',
          backgroundColor: 'transparent'
        }}
        className="transition-all duration-300"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.color = 'var(--theme-fg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'var(--theme-fg)';
          e.currentTarget.style.color = 'var(--theme-fg)';
        }}
      >
        <SettingsIcon className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          style={{
            backgroundColor: 'var(--theme-bg)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-fg)'
          }}
          className="sm:max-w-[500px] border transition-colors duration-300"
        >
          <DialogHeader>
            <DialogTitle 
              className="text-xl tracking-wide transition-colors duration-300"
              style={{ color: 'var(--theme-fg)' }}
            >
              Settings
            </DialogTitle>
            <DialogDescription 
              className="text-sm transition-colors duration-300"
              style={{ color: 'var(--theme-muted)' }}
            >
              Configure your theme preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <h3 
                className="text-lg font-medium mb-4 transition-colors duration-300"
                style={{ color: 'var(--theme-fg)' }}
              >
                Color Theme
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => onThemeChange(theme.id)}
                    style={{
                      borderColor: currentTheme === theme.id ? theme.accent : 'var(--theme-border)',
                      color: 'var(--theme-fg)',
                      backgroundColor: currentTheme === theme.id ? `${theme.accent}15` : 'transparent'
                    }}
                    className="group flex items-center justify-between p-4 border rounded-lg hover:scale-[1.02] transition-all duration-300 text-left relative overflow-hidden"
                    onMouseEnter={(e) => {
                      if (currentTheme !== theme.id) {
                        e.currentTarget.style.borderColor = theme.accent;
                        e.currentTarget.style.backgroundColor = `${theme.accent}10`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentTheme !== theme.id) {
                        e.currentTarget.style.borderColor = 'var(--theme-border)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        <div 
                          className="w-8 h-8 rounded border shadow-sm"
                          style={{ 
                            backgroundColor: theme.background,
                            borderColor: theme.border
                          }}
                        />
                        <div 
                          className="w-8 h-8 rounded border shadow-sm"
                          style={{ 
                            backgroundColor: theme.foreground,
                            borderColor: theme.border
                          }}
                        />
                        <div 
                          className="w-8 h-8 rounded border shadow-sm"
                          style={{ 
                            backgroundColor: theme.accent,
                            borderColor: theme.border
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{theme.name}</div>
                        <div 
                          className="text-xs mt-1 transition-colors duration-300"
                          style={{ color: 'var(--theme-muted)' }}
                        >
                          {themeDescriptions[theme.id as keyof typeof themeDescriptions]}
                        </div>
                      </div>
                    </div>
                    {currentTheme === theme.id && (
                      <Check 
                        className="h-5 w-5 transition-colors duration-300" 
                        style={{ color: theme.accent }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 
                  className="text-lg font-medium transition-colors duration-300"
                  style={{ color: 'var(--theme-fg)' }}
                >
                  Grid Size
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onGridSizeChange(4)}
                  style={{
                    borderColor: gridSize === 4 ? 'var(--theme-fg)' : 'var(--theme-border)',
                    color: 'var(--theme-fg)',
                    backgroundColor: gridSize === 4 ? '#0000000a' : 'transparent',
                    borderWidth: gridSize === 4 ? '2px' : '1px'
                  }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:scale-[1.02] transition-all duration-300 text-left"
                  onMouseEnter={(e) => {
                    if (gridSize !== 4) {
                      e.currentTarget.style.borderColor = 'var(--theme-fg)';
                      e.currentTarget.style.backgroundColor = '#0000000a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (gridSize !== 4) {
                      e.currentTarget.style.borderColor = 'var(--theme-border)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div>
                    <div className="font-medium text-sm">4 Columns</div>
                    <div 
                      className="text-xs mt-1 transition-colors duration-300"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Larger items • More detail visible
                    </div>
                  </div>
                  {gridSize === 4 && (
                    <Check 
                      className="h-5 w-5 transition-colors duration-300" 
                      style={{ color: 'var(--theme-fg)' }}
                    />
                  )}
                </button>

                <button
                  onClick={() => onGridSizeChange(8)}
                  style={{
                    borderColor: gridSize === 8 ? 'var(--theme-fg)' : 'var(--theme-border)',
                    color: 'var(--theme-fg)',
                    backgroundColor: gridSize === 8 ? '#0000000a' : 'transparent',
                    borderWidth: gridSize === 8 ? '2px' : '1px'
                  }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:scale-[1.02] transition-all duration-300 text-left"
                  onMouseEnter={(e) => {
                    if (gridSize !== 8) {
                      e.currentTarget.style.borderColor = 'var(--theme-fg)';
                      e.currentTarget.style.backgroundColor = '#0000000a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (gridSize !== 8) {
                      e.currentTarget.style.borderColor = 'var(--theme-border)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div>
                    <div className="font-medium text-sm">8 Columns</div>
                    <div 
                      className="text-xs mt-1 transition-colors duration-300"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Compact view • More items visible
                    </div>
                  </div>
                  {gridSize === 8 && (
                    <Check 
                      className="h-5 w-5 transition-colors duration-300" 
                      style={{ color: 'var(--theme-fg)' }}
                    />
                  )}
                </button>
              </div>
            </div>

            <div>
              <h3 
                className="text-lg font-medium mb-4 transition-colors duration-300"
                style={{ color: 'var(--theme-fg)' }}
              >
                Custom Theme
              </h3>
              
              {/* Custom Theme Preview - Same style as other theme buttons */}
              <button
                onClick={() => onCustomThemeChange(selectedMainColor, selectedAccentColor)}
                style={{
                  borderColor: currentTheme === 'custom' ? 'var(--theme-hover)' : 'var(--theme-border)',
                  color: 'var(--theme-fg)',
                  backgroundColor: currentTheme === 'custom' ? 'var(--theme-accent)' : 'transparent'
                }}
                className="w-full group flex items-center justify-between p-4 border rounded-lg hover:scale-[1.02] transition-all duration-300 text-left relative overflow-hidden mb-4"
                onMouseEnter={(e) => {
                  if (currentTheme !== 'custom') {
                    e.currentTarget.style.borderColor = 'var(--theme-hover)';
                    e.currentTarget.style.backgroundColor = 'var(--theme-accent)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentTheme !== 'custom') {
                    e.currentTarget.style.borderColor = 'var(--theme-border)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    <div 
                      className="w-8 h-8 rounded border shadow-sm"
                      style={{ 
                        backgroundColor: selectedMainColor,
                        borderColor: 'var(--theme-border)'
                      }}
                    />
                    <div 
                      className="w-8 h-8 rounded border shadow-sm"
                      style={{ 
                        backgroundColor: selectedAccentColor,
                        borderColor: 'var(--theme-border)'
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Custom</div>
                    <div 
                      className="text-xs mt-1 transition-colors duration-300"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      Your personalized color theme
                    </div>
                  </div>
                </div>
                {currentTheme === 'custom' && (
                  <Check 
                    className="h-5 w-5 transition-colors duration-300" 
                    style={{ color: 'var(--theme-hover)' }}
                  />
                )}
              </button>

              {/* Compact Color Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label 
                    className="text-xs font-medium mb-1 block" 
                    style={{ color: 'var(--theme-muted)' }}
                  >
                    Main
                  </label>
                  <div className="relative">
                    <input
                      type="color"
                      value={selectedMainColor}
                      onChange={(e) => setSelectedMainColor(e.target.value)}
                      className="w-full h-12 rounded border cursor-pointer transition-all duration-200 hover:scale-105"
                      style={{
                        borderColor: 'var(--theme-border)',
                        borderWidth: '2px'
                      }}
                      title="Select main color"
                    />
                    <div 
                      className="absolute bottom-1 right-1 text-xs px-1 py-0.5 rounded bg-white/90 text-black"
                      style={{ fontSize: '10px' }}
                    >
                      {selectedMainColor.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div>
                  <label 
                    className="text-xs font-medium mb-1 block" 
                    style={{ color: 'var(--theme-muted)' }}
                  >
                    Accent
                  </label>
                  <div className="relative">
                    <input
                      type="color"
                      value={selectedAccentColor}
                      onChange={(e) => setSelectedAccentColor(e.target.value)}
                      className="w-full h-12 rounded border cursor-pointer transition-all duration-200 hover:scale-105"
                      style={{
                        borderColor: 'var(--theme-border)',
                        borderWidth: '2px'
                      }}
                      title="Select accent color"
                    />
                    <div 
                      className="absolute bottom-1 right-1 text-xs px-1 py-0.5 rounded bg-white/90 text-black"
                      style={{ fontSize: '10px' }}
                    >
                      {selectedAccentColor.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              {customTheme && (
                <div className="flex justify-center mt-3">
                  <Button
                    onClick={onResetCustomTheme}
                    variant="outline"
                    size="sm"
                    style={{
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-muted)',
                      backgroundColor: 'transparent'
                    }}
                    className="hover:opacity-80 transition-opacity text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset to Default
                  </Button>
                </div>
              )}
            </div>

            <div 
              className="flex justify-end pt-4 border-t transition-colors duration-300"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              <Button
                onClick={() => setIsOpen(false)}
                style={{
                  backgroundColor: 'var(--theme-fg)',
                  color: 'var(--theme-bg)'
                }}
                className="hover:opacity-90 transition-opacity"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}