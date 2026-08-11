import React, { useState, useMemo, useEffect } from 'react';
import { InventoryGrid, InventoryItem } from './components/InventoryGrid';
import { AddItemDialog } from './components/AddItemDialog';
import { InventoryFilters } from './components/InventoryFilters';
import { OutfitRemix } from './components/OutfitRemix';
import { Settings } from './components/Settings';
import { SectionSwitcher } from './components/SectionSwitcher';
import { Section } from './components/Sections';
import { Auth } from './components/Auth';
import ErrorBoundary from './components/ErrorBoundary';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Plus, Eye, Edit3, LogOut, Share } from 'lucide-react';
import { 
  getUserData, 
  updatePreferences, 
  updateCurrentSection,
  addItem as apiAddItem,
  updateItem as apiUpdateItem,
  deleteItem as apiDeleteItem,
  reorderItems,
  addSection as apiAddSection,
  updateSection as apiUpdateSection,
  deleteSection as apiDeleteSection,
  getCurrentSession,
  signOut,
  onAuthStateChange,
  healthCheck,
  createShareToken,
  getSharedInventory,
  UserData,
  SharedInventoryData
} from './utils/api';
import { projectId } from './utils/supabase/info';

// Theme configuration
const themeStyles = {
  light: {
    '--theme-bg': '#ffffff',
    '--theme-fg': '#000000',
    '--theme-accent': '#f8f9fa',
    '--theme-muted': '#6c757d',
    '--theme-border': '#dee2e6',
    '--theme-hover': '#f8f9fa'
  },
  dark: {
    '--theme-bg': '#0a0a0a',
    '--theme-fg': '#ffffff',
    '--theme-accent': '#1a1a1a',
    '--theme-muted': '#888888',
    '--theme-border': '#2a2a2a',
    '--theme-hover': '#1a1a1a'
  },
  midnight: {
    '--theme-bg': '#1a1b26',
    '--theme-fg': '#c0caf5',
    '--theme-accent': '#7aa2f7',
    '--theme-muted': '#565f89',
    '--theme-border': '#414868',
    '--theme-hover': '#7aa2f7'
  },
  sage: {
    '--theme-bg': '#f7f9f7',
    '--theme-fg': '#2d3748',
    '--theme-accent': '#68d391',
    '--theme-muted': '#718096',
    '--theme-border': '#e2e8f0',
    '--theme-hover': '#68d391'
  },
  sunset: {
    '--theme-bg': '#fef7f0',
    '--theme-fg': '#744210',
    '--theme-accent': '#f56500',
    '--theme-muted': '#a0640a',
    '--theme-border': '#fed7aa',
    '--theme-hover': '#f56500'
  }
};

export default function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  const [currentTheme, setCurrentTheme] = useState('light');
  const [gridSize, setGridSize] = useState<4 | 8>(4);
  const [customTheme, setCustomTheme] = useState<{main: string, accent: string} | null>(null);
  const [showValues, setShowValues] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'GBP'>('USD');
  
  // Title editing state
  const [appTitle, setAppTitle] = useState('INVENTORY');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('INVENTORY');
  
  // Sections state
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSectionId, setCurrentSectionId] = useState('clothing');
  
  // Items state
  const [items, setItems] = useState<InventoryItem[]>([]);
  
  // Drag and drop state
  const [pendingReorder, setPendingReorder] = useState<{
    sectionId: string;
    itemIds: string[];
  } | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);

  // Function to generate custom theme variables
  const generateCustomTheme = (main: string, accent: string) => {
    // Convert hex to RGB for transparency calculations
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Determine if color is light or dark
    const isLightColor = (hex: string) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return false;
      const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
      return brightness > 155;
    };

    // Convert hex to rgba with opacity
    const hexToRgba = (hex: string, opacity: number) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return hex;
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    };

    const mainIsLight = isLightColor(main);

    return {
      '--theme-bg': main,
      '--theme-fg': mainIsLight ? '#000000' : '#ffffff',
      '--theme-accent': hexToRgba(accent, 0.15), // Use accent color with 15% opacity for subtle backgrounds
      '--theme-muted': mainIsLight ? '#666666' : '#999999',
      '--theme-border': mainIsLight ? '#e2e8f0' : '#374151',
      '--theme-hover': accent // Full accent color for interactive states and icon outlines
    };
  };

  // Initialize auth state and load user data
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if this is a shared URL
        const urlParams = new URLSearchParams(window.location.search);
        const shareToken = urlParams.get('share');
        
        if (shareToken) {
          // This is a shared view - load shared data
          try {
            console.log('Loading shared inventory data for token:', shareToken);
            const sharedData = await getSharedInventory(shareToken);
            
            // Set up shared view state
            setIsSharedView(true);
            setIsPreviewMode(true); // Always show preview for shared links
            
            // Apply shared data
            setAppTitle(sharedData.userProfile.appTitle);
            setCurrentSectionId(sharedData.section.id);
            setSections([{
              id: sharedData.section.id,
              name: sharedData.section.name,
              createdAt: new Date(sharedData.sharedAt)
            }]);
            
            // Convert date strings to Date objects for items
            const sharedItems = sharedData.items.map(item => ({
              ...item,
              dateAdded: new Date(item.dateAdded)
            }));
            setItems(sharedItems);
            
            console.log(`Loaded shared inventory: ${sharedItems.length} items from section "${sharedData.section.name}"`);
            
          } catch (sharedError) {
            console.error('Error loading shared inventory:', sharedError);
            // Show error state for shared view
            setIsSharedView(true);
            setIsPreviewMode(true);
            setAppTitle('SHARED INVENTORY - ERROR');
            setSections([]);
            setItems([]);
          }
          
          setIsLoading(false);
          return;
        }

        // Test API connectivity first
        try {
          await healthCheck();
          console.log('API is accessible');
        } catch (healthError) {
          console.error('API health check failed:', healthError);
        }
        
        const session = await getCurrentSession();
        if (session) {
          setIsAuthenticated(true);
          await loadUserData();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: authListener } = onAuthStateChange(async (session) => {
      if (session) {
        setIsAuthenticated(true);
        await loadUserData();
      } else {
        setIsAuthenticated(false);
        setUserData(null);
        // Reset state when user logs out
        resetToDefaults();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Empty dependency array is correct here since we only want this to run once

  // Load user data from backend
  const loadUserData = async () => {
    try {
      const data = await getUserData();
      setUserData(data);
      
      // Apply user preferences
      setCurrentTheme(data.preferences.theme);
      setGridSize(data.preferences.gridSize as 4 | 8);
      setAppTitle(data.preferences.appTitle);
      setCustomTheme(data.preferences.customTheme);
      setShowValues(data.preferences.showValues);
      setCurrency(data.preferences.currency || 'USD');
      
      // Set sections and items
      setSections(data.sections.map(section => ({
        ...section,
        createdAt: new Date(section.createdAt)
      })));
      setCurrentSectionId(data.currentSectionId);
      
      // Ensure all items have valid Date objects for dateAdded
      setItems(data.items.map(item => {
        let dateAdded;
        try {
          dateAdded = new Date(item.dateAdded);
          // Check if the date is valid
          if (isNaN(dateAdded.getTime())) {
            console.warn(`Invalid date for item ${item.id}, using current date`);
            dateAdded = new Date();
          }
        } catch (dateError) {
          console.warn(`Date parsing error for item ${item.id}:`, dateError);
          dateAdded = new Date();
        }
        
        return {
          ...item,
          dateAdded
        };
      }));
    } catch (error) {
      console.error('Error loading user data:', error);
      
      // If data loading fails completely, provide a default working state
      // This ensures the app doesn't break and the user can still use it
      console.log('Providing default state for user to start fresh');
      
      // Set safe defaults
      const defaultSections = [
        { id: 'clothing', name: 'Clothing', createdAt: new Date() },
        { id: 'skincare', name: 'Skincare', createdAt: new Date() },
        { id: 'haircare', name: 'Haircare', createdAt: new Date() }
      ];
      
      setSections(defaultSections);
      setCurrentSectionId('clothing');
      setItems([]);
      setCurrentTheme('light');
      setGridSize(4);
      setAppTitle('INVENTORY');
      setCustomTheme(null);
      setShowValues(false);
      setCurrency('USD');
      
      // Try to create user data in the background
      // This will help for subsequent visits
      setTimeout(async () => {
        try {
          console.log('Attempting background user data creation...');
          await getUserData(); // This will trigger the fallback
        } catch (bgError) {
          console.log('Background user data creation failed:', bgError);
          // Don't throw - we already have a working state
        }
      }, 1000);
    }
  };

  // Reset to default state
  const resetToDefaults = () => {
    setCurrentTheme('light');
    setGridSize(4);
    setAppTitle('INVENTORY');
    setCustomTheme(null);
    setSections([]);
    setCurrentSectionId('clothing');
    setItems([]);
    setPendingReorder(null);
    setSearchTerm('');
    setSelectedCategory('');
    setIsPreviewMode(false);
    setIsDragMode(false);
    setIsSyncing(false);
    setShowValues(false);
    setCurrency('USD');
  };

  // Sync preferences with backend
  const syncPreferences = async (prefs: Partial<UserData['preferences']>) => {
    try {
      await updatePreferences(prefs);
    } catch (error) {
      console.error('Error syncing preferences:', error);
    }
  };

  // Sync item order with backend
  const commitItemReorder = async () => {
    if (!pendingReorder) return;

    const { itemIds, sectionId } = pendingReorder;
    
    try {
      setIsSyncing(true);
      
      // Get current items for this section to validate
      const currentSectionItems = items.filter(item => item.sectionId === sectionId);
      const currentItemIds = currentSectionItems.map(item => item.id);
      
      // Validate the reorder request
      if (itemIds.length !== currentItemIds.length) {
        console.warn('Cancelling reorder - item count mismatch:', {
          expected: currentItemIds.length,
          received: itemIds.length,
          sectionId
        });
        setPendingReorder(null);
        return;
      }
      
      // Check if all items exist
      const invalidIds = itemIds.filter(id => !currentItemIds.includes(id));
      if (invalidIds.length > 0) {
        console.warn('Cancelling reorder - invalid items:', { invalidIds, sectionId });
        setPendingReorder(null);
        return;
      }
      
      // Send to backend
      await reorderItems(itemIds, sectionId);
      console.log('Successfully synced item reorder for section:', sectionId);
      
      // Clear pending reorder
      setPendingReorder(null);
      
    } catch (error) {
      console.error('Failed to sync item reorder:', error);
      // Don't clear pending reorder on error - we'll retry later
    } finally {
      setIsSyncing(false);
    }
  };

  // Debounced commit function
  const debouncedCommitReorder = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        commitItemReorder();
      }, 1000); // 1 second after user stops dragging
    };
  }, []); // No dependencies needed since we use pendingReorder state

  // Effect to commit pending reorders
  useEffect(() => {
    if (pendingReorder) {
      debouncedCommitReorder();
    }
  }, [pendingReorder, debouncedCommitReorder]);

  // Sync item order with backend
  const syncItemOrder = async (itemIds: string[], sectionId: string, currentItems?: InventoryItem[]) => {
    try {
      // Use provided currentItems or get fresh items from state
      const itemsToValidate = currentItems || items;
      
      // Validate that all items exist and belong to the section before syncing
      const sectionItems = itemsToValidate.filter(item => item.sectionId === sectionId);
      const sectionItemIds = sectionItems.map(item => item.id);
      
      // Check if all provided item IDs exist in the current section
      const invalidIds = itemIds.filter(id => !sectionItemIds.includes(id));
      if (invalidIds.length > 0) {
        console.warn('Skipping reorder - some items not found in section:', { invalidIds, sectionId });
        return;
      }
      
      // Check if all current section items are included in the reorder
      if (itemIds.length !== sectionItemIds.length) {
        console.warn('Skipping reorder - item count mismatch:', { 
          expected: sectionItemIds.length, 
          received: itemIds.length,
          sectionId 
        });
        return;
      }
      
      await reorderItems(itemIds, sectionId);
      console.log('Successfully reordered items for section:', sectionId);
    } catch (error) {
      console.error('Error syncing item order:', error);
    }
  };

  // Debounced version for rapid drag operations
  const debouncedSyncItemOrder = useMemo(() => {
    let timeout: NodeJS.Timeout;
    let latestItems: InventoryItem[] = [];
    
    // Update latest items reference whenever items change
    latestItems = items;
    
    return (itemIds: string[], sectionId: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Use the latest items state when the debounced function executes
        syncItemOrder(itemIds, sectionId, latestItems);
      }, 300); // 300ms debounce
    };
  }, [items]); // Include items as dependency so latestItems stays fresh

  // Auth handlers
  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    await loadUserData();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUserData(null);
      resetToDefaults();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Theme handlers with backend sync
  const handleThemeChange = async (theme: string) => {
    setCurrentTheme(theme);
    await syncPreferences({ theme });
  };

  const handleGridSizeChange = async (size: 4 | 8) => {
    setGridSize(size);
    await syncPreferences({ gridSize: size });
  };

  const handleCustomThemeChange = async (main: string, accent: string) => {
    setCustomTheme({ main, accent });
    setCurrentTheme('custom');
    await syncPreferences({ 
      theme: 'custom',
      customTheme: { main, accent }
    });
  };

  const handleResetCustomTheme = async () => {
    setCustomTheme(null);
    setCurrentTheme('light');
    await syncPreferences({ 
      theme: 'light',
      customTheme: null
    });
  };

  // Title handlers with backend sync
  const handleTitleSave = async () => {
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle && trimmedTitle.length <= 20) {
      setAppTitle(trimmedTitle);
      setIsEditingTitle(false);
      await syncPreferences({ appTitle: trimmedTitle });
    }
  };

  // ShowValues handlers with backend sync
  const handleShowValuesChange = async (show: boolean) => {
    setShowValues(show);
    await syncPreferences({ showValues: show });
  };

  // Currency handlers with backend sync
  const handleCurrencyChange = async (newCurrency: 'USD' | 'GBP') => {
    setCurrency(newCurrency);
    await syncPreferences({ currency: newCurrency });
  };

  // Share handler
  const handleShare = async () => {
    if (!userData) return;
    
    try {
      // Create a proper share token via the backend
      const shareToken = await createShareToken(currentSectionId);
      
      // Get the project ID for the HTML export URL
      const htmlExportUrl = `https://${projectId}.supabase.co/functions/v1/make-server-550b27f4/share/${shareToken}/html`;
      
      // Create a simple sharing message
      const shareMessage = `${htmlExportUrl}`;
      
      // Check if clipboard API is available and allowed
      const canUseClipboard = !!(navigator.clipboard && window.isSecureContext);
      
      if (canUseClipboard) {
        try {
          await navigator.clipboard.writeText(shareMessage);
          console.log('✓ Share link copied to clipboard');
          // TODO: Show success toast notification
          return;
        } catch (clipboardError) {
          // Don't log this as an error since we have fallbacks
          console.info('Clipboard API blocked, using fallback method');
        }
      }
      
      // Use legacy fallback method
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareMessage;
        
        // Make the textarea invisible but still focusable
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        textArea.setAttribute('readonly', '');
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        textArea.setSelectionRange(0, textArea.value.length); // For mobile
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          console.log('✓ Share link copied to clipboard (legacy method)');
          // TODO: Show success toast notification
          return;
        } else {
          throw new Error('Legacy copy command failed');
        }
      } catch (fallbackError) {
        console.info('Legacy clipboard method also failed, showing manual copy option');
        
        // Final fallback: show the URL for manual copying
        if (typeof window !== 'undefined') {
          try {
            // Try using prompt first (better UX - user can select all)
            if (window.prompt) {
              const result = window.prompt(
                'Clipboard access is restricted. Please copy this link manually:',
                shareMessage
              );
              // User pressed OK or Cancel, either way they saw the URL
              console.log('Share link displayed for manual copying');
              return;
            }
          } catch (promptError) {
            // Prompt failed, fall back to alert
            console.info('Prompt failed, using alert');
          }
          
          // Last resort: alert (less ideal but still works)
          alert(`Share Link:\n\n${shareMessage}`);
          console.log('Share link displayed in alert for manual copying');
        }
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      // Show user-friendly error
      alert('Sorry, there was an error creating the share link. Please try again.');
    }
  };

  // Section management with backend sync
  const addSection = async (name: string) => {
    try {
      const newSection = await apiAddSection(name);
      setSections(prev => [...prev, {
        ...newSection,
        createdAt: new Date(newSection.createdAt)
      }]);
    } catch (error) {
      console.error('Error adding section:', error);
    }
  };

  const editSection = async (id: string, name: string) => {
    try {
      await apiUpdateSection(id, name);
      setSections(prev => prev.map(section => 
        section.id === id ? { ...section, name } : section
      ));
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const deleteSection = async (id: string) => {
    if (sections.length > 1) {
      try {
        const result = await apiDeleteSection(id);
        setSections(prev => prev.filter(section => section.id !== id));
        
        // Move items from deleted section to first remaining section
        const remainingSection = sections.find(s => s.id !== id);
        if (remainingSection) {
          setItems(prev => prev.map(item => 
            item.sectionId === id ? { ...item, sectionId: remainingSection.id } : item
          ));
          
          // Update current section if it was deleted
          if (currentSectionId === id) {
            setCurrentSectionId(result.newCurrentSectionId || remainingSection.id);
          }
        }
      } catch (error) {
        console.error('Error deleting section:', error);
      }
    }
  };

  // Section switching with backend sync
  const handleSectionChange = async (sectionId: string) => {
    setCurrentSectionId(sectionId);
    
    try {
      await updateCurrentSection(sectionId);
    } catch (error) {
      console.error('Error updating current section:', error);
    }
  };

  // Item management with backend sync
  const addItem = async (newItemData: Omit<InventoryItem, 'id' | 'dateAdded'>) => {
    try {
      const newItem = await apiAddItem(newItemData);
      
      // Ensure the new item has a valid Date object
      let dateAdded;
      try {
        dateAdded = new Date(newItem.dateAdded);
        if (isNaN(dateAdded.getTime())) {
          dateAdded = new Date();
        }
      } catch (dateError) {
        console.warn('Date parsing error for new item:', dateError);
        dateAdded = new Date();
      }
      
      const itemWithDate = {
        ...newItem,
        dateAdded
      };
      
      setItems(prev => [...prev, itemWithDate]);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const editItem = async (id: string, updatedItemData: Omit<InventoryItem, 'id' | 'dateAdded'>) => {
    try {
      const updatedItem = await apiUpdateItem(id, updatedItemData);
      
      // Ensure the updated item has a valid Date object
      let dateAdded;
      try {
        dateAdded = new Date(updatedItem.dateAdded);
        if (isNaN(dateAdded.getTime())) {
          // If the date is invalid, keep the original date from the existing item
          const existingItem = items.find(item => item.id === id);
          dateAdded = existingItem?.dateAdded || new Date();
        }
      } catch (dateError) {
        console.warn('Date parsing error for updated item:', dateError);
        const existingItem = items.find(item => item.id === id);
        dateAdded = existingItem?.dateAdded || new Date();
      }
      
      const itemWithDate = { ...updatedItem, dateAdded };
      
      setItems(prev => prev.map(item => 
        item.id === id ? itemWithDate : item
      ));
      
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await apiDeleteItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Item reordering with new simplified approach
  const moveItem = (dragIndex: number, hoverIndex: number) => {
    // Only allow reordering when no filters are applied
    const hasFilters = searchTerm.trim() !== '' || selectedCategory !== '';
    if (hasFilters) {
      console.warn('Cannot reorder items while filters are applied');
      return;
    }

    // Get current section items in their current order
    const currentSectionItems = items.filter(item => item.sectionId === currentSectionId);
    
    if (dragIndex < 0 || hoverIndex < 0 || dragIndex >= currentSectionItems.length || hoverIndex >= currentSectionItems.length) {
      console.error('Invalid drag/drop indices');
      return;
    }

    // Create new ordered array
    const reorderedItems = [...currentSectionItems];
    const [draggedItem] = reorderedItems.splice(dragIndex, 1);
    reorderedItems.splice(hoverIndex, 0, draggedItem);
    
    // Update the full items array by replacing current section items with reordered items
    const otherSectionItems = items.filter(item => item.sectionId !== currentSectionId);
    const newItems = [...otherSectionItems, ...reorderedItems];
    
    // Update local state immediately for responsive UI
    setItems(newItems);
    
    // Set up pending reorder (this will trigger the debounced sync via useEffect)
    const reorderedItemIds = reorderedItems.map(item => item.id);
    setPendingReorder({
      sectionId: currentSectionId,
      itemIds: reorderedItemIds
    });
    
    console.log(`Queued reorder for ${reorderedItemIds.length} items in section ${currentSectionId}`);
  };

  // Other handlers
  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingItem(null);
    }
  };

  const handleTitleTripleClick = () => {
    if (!isPreviewMode) {
      setEditTitle(appTitle);
      setIsEditingTitle(true);
    }
  };

  const handleTitleCancel = () => {
    setEditTitle(appTitle);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  // Filter items by current section
  const currentSectionItems = useMemo(() => {
    return items.filter(item => item.sectionId === currentSectionId);
  }, [items, currentSectionId]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(currentSectionItems.map(item => item.category)));
    return uniqueCategories.sort();
  }, [currentSectionItems]);

  const filteredItems = useMemo(() => {
    return currentSectionItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [currentSectionItems, searchTerm, selectedCategory]);

  // In preview mode, show all items from current section without filters
  const displayItems = isPreviewMode ? currentSectionItems : filteredItems;

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    let theme;
    
    if (currentTheme === 'custom' && customTheme) {
      theme = generateCustomTheme(customTheme.main, customTheme.accent);
    } else {
      theme = themeStyles[currentTheme as keyof typeof themeStyles];
    }
    
    Object.entries(theme).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [currentTheme, customTheme]);

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-fg)' }}>
        <div className="text-center">
          <h1 className="text-2xl tracking-wide mb-2">INVENTORY</h1>
          <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show shared view for shared URLs
  if (isSharedView) {
    return (
      <ErrorBoundary>
        <div 
          className="min-h-screen transition-colors duration-300"
          style={{ 
            backgroundColor: 'var(--theme-bg)',
            color: 'var(--theme-fg)'
          }}
        >
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <header className="mb-12">
              <div className="text-center mb-8">
                <h1 
                  className="text-3xl tracking-wide mb-2" 
                  style={{ color: 'var(--theme-fg)' }}
                >
                  {appTitle}
                </h1>
                <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>
                  {sections.length > 0 ? (
                    <>Shared section: {sections[0].name}</>
                  ) : (
                    appTitle.includes('ERROR') ? 'Share not found or expired' : 'Loading shared inventory...'
                  )}
                </p>
              </div>
            </header>

            {/* Shared inventory grid */}
            {items.length > 0 ? (
              <InventoryGrid
                items={items}
                onDeleteItem={() => {}} // No-op for shared view
                onEditItem={() => {}} // No-op for shared view
                isPreviewMode={true}
                gridSize={4}
                isDragMode={false}
                onToggleDragMode={() => {}} // No-op for shared view
                showValues={false}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-lg" style={{ color: 'var(--theme-muted)' }}>
                  {appTitle.includes('ERROR') ? (
                    'This shared link is invalid or has expired'
                  ) : (
                    'No items in this shared section'
                  )}
                </p>
                {appTitle.includes('ERROR') && (
                  <p className="text-sm mt-4" style={{ color: 'var(--theme-muted)' }}>
                    Please check the link or ask for a new one
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <ErrorBoundary>
      <div 
        className="min-h-screen transition-colors duration-300"
        style={{ 
          backgroundColor: 'var(--theme-bg)',
          color: 'var(--theme-fg)'
        }}
      >
        {/* Top Navigation Bar */}
        <div className="w-full px-4 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            {/* Section Switcher and Share - Top Left */}
            <div className="flex items-center gap-3">
              <SectionSwitcher
                sections={sections}
                currentSectionId={currentSectionId}
                onSectionChange={handleSectionChange}
                onAddSection={addSection}
                onEditSection={editSection}
                onDeleteSection={deleteSection}
                isPreviewMode={isPreviewMode}
              />
              
              {/* Share Button - only show when authenticated and not in shared view */}
              {!isSharedView && userData && (
                <Button
                  onClick={handleShare}
                  variant="ghost"
                  size="sm"
                  style={{ color: 'var(--theme-muted)' }}
                  className="hover:opacity-80 transition-opacity"
                  title="Share this section"
                >
                  <Share className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* User info and logout - Top Right */}
            <div className="flex items-center gap-4">
              {userData && (
                <span className="text-sm" style={{ color: 'var(--theme-muted)' }}>
                  {userData.profile.name}
                </span>
              )}
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                style={{ color: 'var(--theme-muted)' }}
                className="hover:opacity-80"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <Settings 
                currentTheme={currentTheme}
                onThemeChange={handleThemeChange}
                gridSize={gridSize}
                onGridSizeChange={handleGridSizeChange}
                customTheme={customTheme}
                onCustomThemeChange={handleCustomThemeChange}
                onResetCustomTheme={handleResetCustomTheme}
                showValues={showValues}
                onShowValuesChange={handleShowValuesChange}
              />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-8">
          {/* Header */}
          <header className="mb-12">
            <div className="text-center mb-8">
              {isEditingTitle ? (
                <div className="flex justify-center items-center">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value.slice(0, 20))}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleTitleCancel}
                    autoFocus
                    style={{
                      backgroundColor: 'var(--theme-accent)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-fg)',
                      fontSize: '1.875rem',
                      textAlign: 'center',
                      fontWeight: '500',
                      letterSpacing: '0.025em'
                    }}
                    className="max-w-xs text-center text-3xl tracking-wide border transition-colors duration-300"
                    placeholder="Enter title..."
                  />
                  <div className="ml-2 text-xs" style={{ color: 'var(--theme-muted)' }}>
                    {editTitle.length}/20
                  </div>
                </div>
              ) : (
                <h1 
                  className="text-3xl tracking-wide mb-2 cursor-pointer hover:opacity-80 transition-opacity" 
                  style={{ color: 'var(--theme-fg)' }}
                  onClick={handleTitleTripleClick}
                  onMouseDown={(e) => {
                    if (e.detail === 3) {
                      e.preventDefault();
                      handleTitleTripleClick();
                    }
                  }}
                  title={!isPreviewMode ? "Triple-click to edit title" : undefined}
                >
                  {appTitle}
                </h1>
              )}
            </div>
            
            <div className="flex justify-center gap-4">
              {/* Preview Mode Toggle */}
              <Button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                variant="outline"
                style={{ 
                  borderColor: 'var(--theme-fg)',
                  color: isPreviewMode ? 'var(--theme-bg)' : 'var(--theme-fg)',
                  backgroundColor: isPreviewMode ? 'var(--theme-fg)' : 'transparent'
                }}
                className="transition-all duration-300"
                onMouseEnter={(e) => {
                  if (!isPreviewMode) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = 'var(--theme-fg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPreviewMode) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--theme-fg)';
                    e.currentTarget.style.color = 'var(--theme-fg)';
                  }
                }}
              >
                {isPreviewMode ? (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Mode
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>

              {/* Show action buttons only when not in preview mode */}
              {!isPreviewMode && (
                <>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    variant="outline"
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
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                  
                  <OutfitRemix items={items} />
                </>
              )}
            </div>
          </header>

          {/* Filters - only show when not in preview mode */}
          {!isPreviewMode && (
            <InventoryFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
              totalItems={filteredItems.length}
              items={filteredItems}
              currentTheme={currentTheme}
              currency={currency}
              onCurrencyChange={handleCurrencyChange}
            />
          )}

          {/* Product Grid */}
          <InventoryGrid
            items={displayItems}
            onDeleteItem={deleteItem}
            onEditItem={handleEditItem}
            onMoveItem={!isPreviewMode && searchTerm.trim() === '' && selectedCategory === '' ? moveItem : undefined}
            isPreviewMode={isPreviewMode}
            gridSize={gridSize}
            isDragMode={isDragMode && searchTerm.trim() === '' && selectedCategory === ''}
            onToggleDragMode={() => setIsDragMode(!isDragMode)}
            showValues={showValues}
          />

          {/* Add/Edit Item Dialog */}
          <AddItemDialog
            onAddItem={addItem}
            onEditItem={editItem}
            editingItem={editingItem}
            sections={sections}
            currentSectionId={currentSectionId}
            isOpen={isDialogOpen}
            onOpenChange={handleCloseDialog}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}