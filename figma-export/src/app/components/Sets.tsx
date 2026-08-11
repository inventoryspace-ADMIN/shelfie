import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Grid3X3, X, Save, Trash2 } from 'lucide-react';
import { InventoryItem } from './InventoryGrid';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface Set {
  id: string;
  name: string;
  items: { [position: string]: InventoryItem };
  createdAt: Date;
}

interface SetsProps {
  items: InventoryItem[];
}

interface DraggableItemProps {
  item: InventoryItem;
  isInGrid?: boolean;
  onRemove?: () => void;
}

interface DropGridSlotProps {
  position: string;
  item: InventoryItem | null;
  onDrop: (item: InventoryItem, position: string) => void;
  onRemove: (position: string) => void;
}

// Draggable item component
function DraggableItem({ item, isInGrid = false, onRemove }: DraggableItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'inventory-item',
    item: () => ({ item }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [item]);

  return (
    <div
      ref={drag}
      className={`relative cursor-move transition-opacity ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div
        className="relative bg-white rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
        style={{
          borderColor: 'var(--theme-border)',
          backgroundColor: 'var(--theme-bg)'
        }}
      >
        <div className="aspect-square relative">
          <ImageWithFallback
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          
          {/* Remove button for items in grid */}
          {isInGrid && onRemove && (
            <button
              onClick={onRemove}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              style={{ fontSize: '10px' }}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        
        {/* Only show title when not in grid */}
        {!isInGrid && (
          <div className="p-2">
            <p 
              className="text-xs truncate"
              style={{ color: 'var(--theme-fg)' }}
            >
              {item.title}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Drop target grid slot
function DropGridSlot({ position, item, onDrop, onRemove }: DropGridSlotProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'inventory-item',
    drop: (draggedItem: { item: InventoryItem }) => {
      if (draggedItem?.item) {
        onDrop(draggedItem.item, position);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [position, onDrop]);

  return (
    <div
      ref={drop}
      className={`aspect-square rounded-lg border-2 border-dashed transition-all group ${
        isOver 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300'
      } ${item ? 'border-solid' : ''}`}
      style={{
        borderColor: isOver ? 'var(--theme-hover)' : 'var(--theme-border)',
        backgroundColor: isOver ? 'var(--theme-accent)' : item ? 'transparent' : 'var(--theme-accent)'
      }}
    >
      {item ? (
        <DraggableItem 
          item={item} 
          isInGrid={true} 
          onRemove={() => onRemove(position)} 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div 
            className="text-xs text-center opacity-0 group-hover:opacity-60 transition-opacity"
            style={{ 
              color: 'var(--theme-muted)'
            }}
          >
            Drop here
          </div>
        </div>
      )}
    </div>
  );
}

export function Sets({ items }: SetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sets, setSets] = useState<Set[]>([]);
  const [currentSet, setCurrentSet] = useState<{ [position: string]: InventoryItem }>({});
  const [setName, setSetName] = useState('');

  // Fixed grid size for simplicity
  const gridCols = 4;
  const gridRows = 4;
  const gridPositions = Array.from({ length: gridCols * gridRows }, (_, i) => `pos-${i}`);

  // Filter items to ensure we only show valid items
  const validItems = items.filter(item => item && item.id && item.title && item.image);

  const handleOpenSets = () => {
    setIsOpen(true);
  };

  const handleDrop = useCallback((item: InventoryItem, position: string) => {
    if (!item || !position) return;
    
    setCurrentSet(prev => ({
      ...prev,
      [position]: item
    }));
  }, []);

  const handleRemove = useCallback((position: string) => {
    if (!position) return;
    
    setCurrentSet(prev => {
      const newSet = { ...prev };
      delete newSet[position];
      return newSet;
    });
  }, []);

  const handleSaveSet = () => {
    if (!setName.trim() || Object.keys(currentSet).length === 0) return;

    const newSet: Set = {
      id: Date.now().toString(),
      name: setName.trim(),
      items: { ...currentSet },
      createdAt: new Date()
    };

    setSets(prev => [newSet, ...prev]);
    setCurrentSet({});
    setSetName('');
  };

  const handleClearSet = () => {
    setCurrentSet({});
  };

  const handleDeleteSet = (setId: string) => {
    setSets(prev => prev.filter(set => set.id !== setId));
  };

  const handleLoadSet = (set: Set) => {
    setCurrentSet(set.items);
    setSetName(set.name);
  };

  return (
    <>
      <Button
        onClick={handleOpenSets}
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
        <Grid3X3 className="h-4 w-4 mr-2" />
        Sets
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="sm:max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
          style={{
            backgroundColor: 'var(--theme-bg)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-fg)'
          }}
        >
          <DialogHeader>
            <DialogTitle 
              className="text-xl tracking-wide transition-colors duration-300"
              style={{ color: 'var(--theme-fg)' }}
            >
              Create Item Sets
            </DialogTitle>
            <DialogDescription 
              className="transition-colors duration-300"
              style={{ color: 'var(--theme-muted)' }}
            >
              Drag items from your inventory to create visual arrangements and save your favorite combinations.
            </DialogDescription>
          </DialogHeader>

          <DndProvider backend={HTML5Backend}>
            <div className="flex gap-6 flex-1 min-h-0">
              {/* Inventory Panel */}
              <div className="w-1/3 flex flex-col min-h-0">
                <h3 
                  className="font-medium mb-3"
                  style={{ color: 'var(--theme-fg)' }}
                >
                  Your Items
                </h3>
                <div 
                  className="flex-1 overflow-y-auto border rounded-lg p-3 min-h-0"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {validItems.map((item) => (
                      <DraggableItem key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid Panel */}
              <div className="w-1/2 flex flex-col min-h-0">
                <div className="flex items-center gap-3 mb-3">
                  <h3 
                    className="font-medium"
                    style={{ color: 'var(--theme-fg)' }}
                  >
                    Set Grid (4×4)
                  </h3>
                  <input
                    type="text"
                    placeholder="Set name..."
                    value={setName}
                    onChange={(e) => setSetName(e.target.value)}
                    className="px-2 py-1 text-sm border rounded flex-1 focus:outline-none focus:ring-1"
                    style={{
                      borderColor: 'var(--theme-border)',
                      backgroundColor: 'var(--theme-bg)',
                      color: 'var(--theme-fg)',
                      '--tw-ring-color': 'var(--theme-hover)'
                    }}
                    maxLength={30}
                  />
                </div>

                <div 
                  className="flex-1 border rounded-lg p-4 overflow-y-auto min-h-0"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  <div 
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${gridCols}, 1fr)`
                    }}
                  >
                    {gridPositions.map((position) => (
                      <DropGridSlot
                        key={position}
                        position={position}
                        item={currentSet[position] || null}
                        onDrop={handleDrop}
                        onRemove={handleRemove}
                      />
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3 flex-shrink-0">
                  <Button
                    onClick={handleSaveSet}
                    disabled={!setName.trim() || Object.keys(currentSet).length === 0}
                    className="flex-1"
                    style={{
                      backgroundColor: 'var(--theme-fg)',
                      color: 'var(--theme-bg)'
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Set
                  </Button>
                  <Button
                    onClick={handleClearSet}
                    variant="outline"
                    style={{
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-muted)',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>

              {/* Saved Sets Panel */}
              <div className="w-1/6 flex flex-col min-h-0">
                <h3 
                  className="font-medium mb-3"
                  style={{ color: 'var(--theme-fg)' }}
                >
                  Saved Sets
                </h3>
                <div 
                  className="flex-1 overflow-y-auto border rounded-lg p-2 min-h-0"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  <div className="space-y-2">
                    {sets.map((set) => (
                      <div
                        key={set.id}
                        className="border rounded-lg p-2 cursor-pointer hover:shadow-sm transition-shadow group"
                        style={{
                          borderColor: 'var(--theme-border)',
                          backgroundColor: 'var(--theme-accent)'
                        }}
                        onClick={() => handleLoadSet(set)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p 
                            className="text-xs font-medium truncate"
                            style={{ color: 'var(--theme-fg)' }}
                          >
                            {set.name}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSet(set.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p 
                          className="text-xs"
                          style={{ color: 'var(--theme-muted)' }}
                        >
                          {Object.keys(set.items).length} items
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DndProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}