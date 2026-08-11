import React, { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { 
  Search, 
  X, 
  Shirt, 
  Footprints, 
  Watch, 
  Briefcase, 
  Crown, 
  Package2, 
  Layers,
  Scissors,
  ShoppingBag,
  ChevronRight
} from 'lucide-react';
import { InventoryItem } from './InventoryGrid';

interface InventoryFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  totalItems: number;
  items: InventoryItem[];
  currentTheme: string;
  currency: 'USD' | 'GBP';
  onCurrencyChange: (currency: 'USD' | 'GBP') => void;
}

const categoryIcons: Record<string, React.ComponentType<any>> = {
  'Outerwear': Layers,
  'Tops': Shirt,
  'Bottoms': Package2,
  'Footwear': Footprints,
  'Accessories': Watch,
  'Denim': Scissors,
  'Knitwear': Shirt,
  'Bags': ShoppingBag,
  'Jewelry': Crown,
  'Other': Package2
};

export function InventoryFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  totalItems,
  items,
  currentTheme,
  currency,
  onCurrencyChange
}: InventoryFiltersProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 500); // 500ms delay before hiding
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange('');
    setIsSearchExpanded(false);
  };

  const handleSearchToggle = () => {
    if (isSearchExpanded && !searchTerm) {
      setIsSearchExpanded(false);
    } else {
      setIsSearchExpanded(true);
    }
  };

  const handleSearchBlur = () => {
    if (!searchTerm) {
      setIsSearchExpanded(false);
    }
  };

  const hasActiveFilters = searchTerm || selectedCategory;

  // Calculate total value of items that have values
  const itemsWithValues = items.filter(item => item.value && item.value > 0);
  const totalValue = itemsWithValues.reduce((sum, item) => sum + (item.value || 0), 0);

  // Get currency symbol and format
  const currencySymbol = currency === 'USD' ? '$' : '£';
  
  // Handle currency toggle
  const handleCurrencyToggle = () => {
    const newCurrency = currency === 'USD' ? 'GBP' : 'USD';
    onCurrencyChange(newCurrency);
  };

  return (
    <div 
      className="mb-8 pb-6 transition-colors duration-300"
      style={{ borderBottom: `1px solid var(--theme-fg)` }}
    >
      <div className="flex flex-col gap-6">
        {/* Search and Results */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search Icon/Input */}
            {isSearchExpanded ? (
              <div className="relative">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors duration-300" 
                  style={{ color: 'var(--theme-muted)' }}
                />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onBlur={handleSearchBlur}
                  autoFocus
                  style={{
                    borderColor: 'var(--theme-fg) !important',
                    backgroundColor: 'var(--theme-bg) !important',
                    color: 'var(--theme-fg) !important',
                    width: '250px'
                  }}
                  className="pl-10 focus:ring-0 transition-all duration-300 placeholder:text-[var(--theme-muted)]"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.setProperty('background-color', 'var(--theme-accent)', 'important');
                    e.currentTarget.style.setProperty('border-color', 'var(--theme-hover)', 'important');
                    e.currentTarget.style.setProperty('color', 'var(--theme-fg)', 'important');
                    // Update icon color on hover
                    const icon = e.currentTarget.previousElementSibling as HTMLElement;
                    if (icon) icon.style.color = 'var(--theme-fg)';
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.currentTarget) {
                      e.currentTarget.style.setProperty('background-color', 'var(--theme-bg)', 'important');
                      e.currentTarget.style.setProperty('border-color', 'var(--theme-fg)', 'important');
                      e.currentTarget.style.setProperty('color', 'var(--theme-fg)', 'important');
                      // Reset icon color
                      const icon = e.currentTarget.previousElementSibling as HTMLElement;
                      if (icon) icon.style.color = 'var(--theme-muted)';
                    }
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.setProperty('background-color', 'var(--theme-accent)', 'important');
                    e.currentTarget.style.setProperty('border-color', 'var(--theme-hover)', 'important');
                    e.currentTarget.style.setProperty('color', 'var(--theme-fg)', 'important');
                    // Update icon color on focus
                    const icon = e.currentTarget.previousElementSibling as HTMLElement;
                    if (icon) icon.style.color = 'var(--theme-fg)';
                  }}
                />
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearchToggle}
                style={{ 
                  borderColor: 'var(--theme-fg)',
                  color: 'var(--theme-fg)',
                  backgroundColor: searchTerm ? 'var(--theme-accent)' : 'transparent'
                }}
                className="transition-all duration-300"
                onMouseEnter={(e) => {
                  if (!searchTerm) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = 'var(--theme-fg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!searchTerm) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--theme-fg)';
                    e.currentTarget.style.color = 'var(--theme-fg)';
                  }
                }}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span 
                className="text-sm"
                style={{ color: 'var(--theme-muted)' }}
              >
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
              {itemsWithValues.length > 0 && (
                <span 
                  className="text-xs mt-1 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--theme-muted)' }}
                  onClick={handleCurrencyToggle}
                  title={`Click to switch to ${currency === 'USD' ? 'GBP (£)' : 'USD ($)'}`}
                >
                  Total: {currencySymbol}{totalValue.toFixed(2)}
                </span>
              )}
            </div>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                style={{ color: 'var(--theme-muted)' }}
                className="hover:opacity-80 transition-opacity"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Sections Navigation */}
        <div className="flex items-center">
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Sections Tab */}
            <Button
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 transition-all duration-300"
              style={{
                backgroundColor: selectedCategory ? 'var(--theme-fg)' : 'transparent',
                color: selectedCategory ? 'var(--theme-bg)' : 'var(--theme-fg)',
                borderColor: 'var(--theme-fg)'
              }}
              onMouseEnter={(e) => {
                if (!selectedCategory) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.color = 'var(--theme-fg)';
                }
              }}
              onMouseLeave={(e) => {
                if (!selectedCategory) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--theme-fg)';
                  e.currentTarget.style.color = 'var(--theme-fg)';
                }
              }}
            >
              <span className="text-sm uppercase tracking-wide">
                {selectedCategory || 'Tags'}
              </span>
              <ChevronRight 
                className={`h-4 w-4 transition-transform duration-200 ${
                  isHovered ? 'rotate-90' : ''
                }`} 
              />
            </Button>

            {/* Expandable Categories */}
            <div
              className={`absolute left-full top-0 z-50 ml-2 transition-all duration-300 ${
                isHovered 
                  ? 'opacity-100 translate-x-0 pointer-events-auto' 
                  : 'opacity-0 -translate-x-2 pointer-events-none'
              }`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div 
                className="flex gap-2 p-3 rounded-lg border shadow-lg"
                style={{
                  backgroundColor: 'var(--theme-bg)',
                  borderColor: 'var(--theme-border)'
                }}
              >
                {/* All Items Option */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCategoryChange('')}
                  className={`flex items-center gap-2 px-3 py-2 transition-all duration-200 ${
                    !selectedCategory ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: !selectedCategory ? 'var(--theme-accent)' : 'transparent',
                    color: 'var(--theme-fg)'
                  }}
                >
                  <Package2 className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wide whitespace-nowrap">All</span>
                </Button>

                {/* Category Options */}
                {categories.map((category) => {
                  const IconComponent = categoryIcons[category] || Package2;
                  const isSelected = selectedCategory === category;
                  
                  return (
                    <Button
                      key={category}
                      variant="ghost"
                      size="sm"
                      onClick={() => onCategoryChange(category)}
                      className={`flex items-center gap-2 px-3 py-2 transition-all duration-200 ${
                        isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-80'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'var(--theme-accent)' : 'transparent',
                        color: 'var(--theme-fg)'
                      }}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-wide whitespace-nowrap">{category}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}