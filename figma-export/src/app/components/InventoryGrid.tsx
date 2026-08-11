import React, { useState } from 'react';
import { Button } from './ui/button';
import { Trash2, Edit, GripVertical } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export interface InventoryItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  sectionId: string;
  dateAdded: Date;
  value?: number;
}

interface InventoryGridProps {
  items: InventoryItem[];
  onDeleteItem: (id: string) => void;
  onEditItem: (item: InventoryItem) => void;
  onMoveItem?: (dragIndex: number, hoverIndex: number) => void;
  isPreviewMode?: boolean;
  gridSize?: 4 | 8;
  isDragMode?: boolean;
  onToggleDragMode?: () => void;
  showValues?: boolean;
}

interface DraggableItemProps {
  item: InventoryItem;
  index: number;
  onDeleteItem: (id: string) => void;
  onEditItem: (item: InventoryItem) => void;
  onMoveItem?: (dragIndex: number, hoverIndex: number) => void;
  isPreviewMode: boolean;
  gridSize: 4 | 8;
  isDraggedOver?: boolean;
  isDragging?: boolean;
  isDragMode?: boolean;
  onToggleDragMode?: () => void;
  showValues?: boolean;
}

function DraggableItem({
  item,
  index,
  onDeleteItem,
  onEditItem,
  onMoveItem,
  isPreviewMode,
  gridSize,
  isDraggedOver = false,
  isDragging = false,
  isDragMode = false,
  onToggleDragMode,
  showValues = false
}: DraggableItemProps) {
  // Adjust spacing and sizing based on grid size
  const getItemSpacing = () => {
    return gridSize === 8 ? "mb-2" : "mb-4";
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!onMoveItem || !isDragMode) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, index }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!onMoveItem || !isDragMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!onMoveItem || !isDragMode) return;
    e.preventDefault();
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (dragData.index !== index) {
        onMoveItem(dragData.index, index);
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };

  return (
    <div 
      className={`group ${isDragging ? 'opacity-50' : ''} ${isDraggedOver ? 'scale-105' : ''}`}
      draggable={!isPreviewMode && onMoveItem && isDragMode ? "true" : "false"}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ cursor: !isPreviewMode && onMoveItem && isDragMode ? 'move' : 'default' }}
    >
      {/* Product Image - Floating Effect with Theme-Adaptive Background */}
      <div 
        className={`aspect-square ${getItemSpacing()} relative overflow-hidden transition-all duration-300 ${
          !isPreviewMode ? 'group-hover:scale-105' : ''
        }`}
        style={{
          backgroundColor: 'var(--theme-bg)',
        }}
      >
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className={`w-full h-full object-contain drop-shadow-lg transition-all duration-300 ${
            !isPreviewMode ? 'group-hover:drop-shadow-xl' : ''
          }`}
          style={{
            filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.08))'
          }}
        />
        
        {/* Action Buttons - Only show when not in preview mode */}
        {!isPreviewMode && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
            {/* Move Button - Only show if onMoveItem is provided */}
            {onMoveItem && onToggleDragMode && (
              <Button
                size="sm"
                variant="ghost"
                style={{
                  backgroundColor: isDragMode ? 'var(--theme-hover)' : 'var(--theme-bg)',
                  borderColor: isDragMode ? 'var(--theme-hover)' : 'var(--theme-border)',
                  color: isDragMode ? 'var(--theme-bg)' : 'var(--theme-muted)'
                }}
                className={`h-8 w-8 p-0 border transition-all duration-300 hover:opacity-80 backdrop-blur-sm ${
                  isDragMode ? 'cursor-move' : 'cursor-pointer'
                }`}
                title={isDragMode ? "Click to exit drag mode" : "Click to enable drag mode"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDragMode();
                }}
              >
                <GripVertical className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-muted)'
              }}
              className="h-8 w-8 p-0 border transition-colors duration-300 hover:opacity-80 backdrop-blur-sm"
              onClick={() => onEditItem(item)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-muted)'
              }}
              className="h-8 w-8 p-0 border transition-colors duration-300 hover:opacity-80 backdrop-blur-sm"
              onClick={() => onDeleteItem(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-1 text-center">
        <h3 
          className="text-sm font-medium tracking-wide transition-colors duration-300"
          style={{ color: 'var(--theme-fg)' }}
        >
          {item.title}
        </h3>
        <p 
          className="text-xs uppercase tracking-wide transition-colors duration-300"
          style={{ color: 'var(--theme-muted)' }}
        >
          {item.category}
        </p>
        <p 
          className="text-xs transition-colors duration-300"
          style={{ color: 'var(--theme-muted)' }}
        >
          {item.description}
        </p>
        {showValues && item.value !== undefined && (
          <p 
            className="text-xs font-medium transition-colors duration-300"
            style={{ color: 'var(--theme-fg)' }}
          >
            ${item.value.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

export function InventoryGrid({ items, onDeleteItem, onEditItem, onMoveItem, isPreviewMode = false, gridSize = 4, isDragMode = false, onToggleDragMode, showValues = false }: InventoryGridProps) {
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Generate grid classes based on gridSize
  const getGridClasses = () => {
    if (gridSize === 8) {
      return "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4";
    }
    return "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8";
  };

  const handleDragStart = (index: number) => {
    if (!isDragMode) return;
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    if (!isDragMode) return;
    setDraggingIndex(null);
    setDraggedOverIndex(null);
  };

  const handleDragEnter = (index: number) => {
    if (!isDragMode || draggingIndex === null || draggingIndex === index) return;
    setDraggedOverIndex(index);
  };

  const handleDragLeave = () => {
    if (!isDragMode) return;
    setDraggedOverIndex(null);
  };

  return (
    <div className={getGridClasses()}>
      {items.map((item, index) => (
        <div
          key={item.id}
          onDragStart={() => handleDragStart(index)}
          onDragEnd={handleDragEnd}
          onDragEnter={() => handleDragEnter(index)}
          onDragLeave={handleDragLeave}
        >
          <DraggableItem
            item={item}
            index={index}
            onDeleteItem={onDeleteItem}
            onEditItem={onEditItem}
            onMoveItem={onMoveItem}
            isPreviewMode={isPreviewMode}
            gridSize={gridSize}
            isDraggedOver={draggedOverIndex === index}
            isDragging={draggingIndex === index}
            isDragMode={isDragMode}
            onToggleDragMode={onToggleDragMode}
            showValues={showValues}
          />
        </div>
      ))}
    </div>
  );
}