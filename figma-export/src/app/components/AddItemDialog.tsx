import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { X, Upload, Link, Image as ImageIcon, Wand2, Sparkles } from 'lucide-react';
import { InventoryItem } from './InventoryGrid';
import { Section } from './Sections';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { removeBackground, isBackgroundRemovalSupported } from '../utils/backgroundRemoval';

interface AddItemDialogProps {
  onAddItem: (item: Omit<InventoryItem, 'id' | 'dateAdded'>) => void;
  onEditItem?: (id: string, item: Omit<InventoryItem, 'id' | 'dateAdded'>) => void;
  editingItem?: InventoryItem | null;
  sections: Section[];
  currentSectionId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Suggested core categories - users can type their own
const suggestedCategories = [
  'Tops',
  'Bottoms', 
  'Footwear',
  'Accessories',
  'Other'
];

export function AddItemDialog({ 
  onAddItem, 
  onEditItem, 
  editingItem, 
  sections, 
  currentSectionId, 
  isOpen, 
  onOpenChange 
}: AddItemDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [originalImage, setOriginalImage] = useState(''); // Store original image
  const [category, setCategory] = useState('');
  const [value, setValue] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [imageMode, setImageMode] = useState<'url' | 'file'>('file');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [removeBackgroundEnabled, setRemoveBackgroundEnabled] = useState(false);
  const [processingStage, setProcessingStage] = useState<'analyzing' | 'removing' | 'finalizing'>('analyzing');
  const [backgroundRemovalSupported, setBackgroundRemovalSupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if background removal is supported
  useEffect(() => {
    const supported = isBackgroundRemovalSupported();
    console.log('🔧 Background removal supported:', supported);
    setBackgroundRemovalSupported(supported);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        // Editing an existing item - populate form with item data
        setTitle(editingItem.title);
        setDescription(editingItem.description);
        setImage(editingItem.image);
        setOriginalImage(editingItem.image); // Store original
        setCategory(editingItem.category);
        setValue(editingItem.value ? editingItem.value.toString() : '');
        // Determine mode based on image type
        setImageMode(editingItem.image.startsWith('data:') ? 'file' : 'url');
        console.log('📝 Editing item - image set:', editingItem.image.substring(0, 50) + '...');
      } else {
        // Adding a new item - reset form to defaults
        setTitle('');
        setDescription('');
        setImage('');
        setOriginalImage('');
        setCategory('');
        setValue('');
        setImageMode('file');
        console.log('➕ Adding new item - form reset');
      }
      setUploadError('');
      setRemoveBackgroundEnabled(false);
      setIsProcessing(false);
    }
  }, [editingItem, isOpen]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a PNG, JPG, or WebP image.');
      return;
    }

    // Validate file size (max 10MB for background removal processing)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setImage(result);
          setOriginalImage(result); // Store original
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Error reading file. Please try again.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setUploadError('Error uploading file. Please try again.');
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setImage('');
    setOriginalImage('');
    setUploadError('');
    setRemoveBackgroundEnabled(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBackgroundRemoval = async () => {
    if (!originalImage || isProcessing) return;
    
    setIsProcessing(true);
    setProcessingStage('analyzing');

    try {
      // Small delay to show analyzing stage
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessingStage('removing');

      // Use our simple Canvas-based background removal
      const processedImageDataUrl = await removeBackground(originalImage);

      setProcessingStage('finalizing');
      await new Promise(resolve => setTimeout(resolve, 300));

      setImage(processedImageDataUrl);
      setRemoveBackgroundEnabled(true);
      
      console.log('Background removed successfully');
    } catch (error) {
      console.error('Background removal failed:', error);
      
      // Provide user-friendly error message
      let errorMessage = 'Background removal failed. The original image will be used.';
      if (error instanceof Error) {
        errorMessage = `Background removal failed: ${error.message}`;
      }
      
      setUploadError(errorMessage);
      
      // Keep original image on error
      setImage(originalImage);
      setRemoveBackgroundEnabled(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const restoreOriginalImage = () => {
    if (originalImage) {
      setImage(originalImage);
      setRemoveBackgroundEnabled(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category) return;

    const itemData: any = {
      title: title.trim(),
      description: description.trim(),
      image: image || `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop`,
      category,
      sectionId: editingItem ? editingItem.sectionId : currentSectionId
    };

    // Add value if provided
    if (value && !isNaN(parseFloat(value))) {
      itemData.value = parseFloat(value);
    }

    if (editingItem && onEditItem) {
      onEditItem(editingItem.id, itemData);
    } else {
      onAddItem(itemData);
    }

    // Reset form
    setTitle('');
    setDescription('');
    setImage('');
    setOriginalImage('');
    setCategory('');
    setValue('');
    setRemoveBackgroundEnabled(false);
    onOpenChange(false);
  };

  const getRandomUnsplashImage = () => {
    const queries = ['fashion', 'clothing', 'accessories', 'shoes', 'jewelry', 'streetwear'];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    const randomId = Math.random().toString(36).substring(2, 15);
    return `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&q=80&auto=format&sig=${randomId}`;
  };

  const getProcessingMessage = () => {
    switch (processingStage) {
      case 'analyzing':
        return 'Analyzing image...';
      case 'removing':
        return 'Removing background...';
      case 'finalizing':
        return 'Finalizing...';
      default:
        return 'Processing...';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
          <DialogDescription 
            className="transition-colors duration-300"
            style={{ color: 'var(--theme-muted)' }}
          >
            {editingItem ? 'Edit the item details below.' : 'Add a new item to your inventory.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label 
              htmlFor="title"
              style={{ color: 'var(--theme-fg)' }}
              className="transition-colors duration-300"
            >
              Item Name
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter item name..."
              style={{
                borderColor: 'var(--theme-border)',
                backgroundColor: 'var(--theme-bg)',
                color: 'var(--theme-fg)'
              }}
              className="focus:ring-0 transition-colors duration-300"
              required
            />
          </div>

          <div className="space-y-2 relative">
            <Label 
              htmlFor="category"
              style={{ color: 'var(--theme-fg)' }}
              className="transition-colors duration-300"
            >
              Category
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Delay hiding suggestions to allow clicking
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder="Enter category (e.g., Tops, Bottoms, Footwear...)"
              style={{
                borderColor: 'var(--theme-border)',
                backgroundColor: 'var(--theme-bg)',
                color: 'var(--theme-fg)'
              }}
              className="focus:ring-0 transition-colors duration-300"
              required
            />
            
            {/* Category Suggestions */}
            {showSuggestions && category.length === 0 && (
              <div
                className="absolute z-10 w-full mt-1 rounded border shadow-lg transition-colors duration-300"
                style={{
                  backgroundColor: 'var(--theme-bg)',
                  borderColor: 'var(--theme-border)'
                }}
              >
                <div className="py-1">
                  {suggestedCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-opacity-80 transition-colors duration-200"
                      style={{
                        color: 'var(--theme-fg)',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--theme-accent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => {
                        setCategory(cat);
                        setShowSuggestions(false);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-xs" style={{ color: 'var(--theme-muted)' }}>
              Use suggested categories or create your own custom category
            </p>
          </div>

          <div className="space-y-2">
            <Label 
              htmlFor="description"
              style={{ color: 'var(--theme-fg)' }}
              className="transition-colors duration-300"
            >
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the item..."
              style={{
                borderColor: 'var(--theme-border)',
                backgroundColor: 'var(--theme-bg)',
                color: 'var(--theme-fg)'
              }}
              className="focus:ring-0 resize-none transition-colors duration-300"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label 
              htmlFor="value"
              style={{ color: 'var(--theme-fg)' }}
              className="transition-colors duration-300"
            >
              Value (Optional)
            </Label>
            <Input
              id="value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter item value..."
              style={{
                borderColor: 'var(--theme-border)',
                backgroundColor: 'var(--theme-bg)',
                color: 'var(--theme-fg)'
              }}
              className="focus:ring-0 transition-colors duration-300 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              step="0.01"
              min="0"
            />
            <p className="text-xs" style={{ color: 'var(--theme-muted)' }}>
              Set a value to track your item's worth
            </p>
          </div>

          <div className="space-y-3">
            <Label 
              style={{ color: 'var(--theme-fg)' }}
              className="transition-colors duration-300"
            >
              Image
            </Label>
            
            {/* Mode Selector */}
            <div className="flex gap-1 p-1 rounded" style={{ backgroundColor: 'var(--theme-accent)' }}>
              <button
                type="button"
                className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-all duration-200 ${
                  imageMode === 'file' ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: imageMode === 'file' ? 'var(--theme-bg)' : 'transparent',
                  color: 'var(--theme-fg)',
                  opacity: imageMode === 'file' ? 1 : 0.8
                }}
                onClick={() => {
                  setImageMode('file');
                  setUploadError('');
                }}
                onMouseEnter={(e) => {
                  if (imageMode !== 'file') {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (imageMode !== 'file') {
                    e.currentTarget.style.opacity = '0.8';
                  }
                }}
              >
                <Upload className="h-3 w-3 mr-1 inline-block" />
                Upload
              </button>
              <button
                type="button"
                className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-all duration-200 ${
                  imageMode === 'url' ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: imageMode === 'url' ? 'var(--theme-bg)' : 'transparent',
                  color: 'var(--theme-fg)',
                  opacity: imageMode === 'url' ? 1 : 0.8
                }}
                onClick={() => {
                  setImageMode('url');
                  setUploadError('');
                }}
                onMouseEnter={(e) => {
                  if (imageMode !== 'url') {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (imageMode !== 'url') {
                    e.currentTarget.style.opacity = '0.8';
                  }
                }}
              >
                <Link className="h-3 w-3 mr-1 inline-block" />
                URL
              </button>
            </div>

            {/* URL Input */}
            {imageMode === 'url' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={image}
                    onChange={(e) => {
                      const url = e.target.value;
                      setImage(url);
                      if (url && url.startsWith('http')) {
                        setOriginalImage(url); // Store original URL for background removal
                      }
                    }}
                    placeholder="Enter image URL or leave empty for placeholder"
                    style={{
                      borderColor: 'var(--theme-border)',
                      backgroundColor: 'var(--theme-bg)',
                      color: 'var(--theme-fg)'
                    }}
                    className="focus:ring-0 transition-colors duration-300"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    style={{
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-fg)',
                      backgroundColor: 'transparent'
                    }}
                    className="hover:opacity-80 transition-opacity"
                    onClick={() => {
                      const randomUrl = getRandomUnsplashImage();
                      setImage(randomUrl);
                      setOriginalImage(randomUrl);
                    }}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                  Background removal works best with images from Unsplash and other CORS-enabled sources
                </p>
              </div>
            )}

            {/* File Upload */}
            {imageMode === 'file' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleFileUpload}
                      style={{
                        borderColor: 'var(--theme-border)',
                        backgroundColor: 'var(--theme-bg)',
                        color: 'var(--theme-fg)'
                      }}
                      className="focus:ring-0 transition-colors duration-300 file:mr-2 file:py-1 file:px-2 file:rounded-sm file:border-0 file:text-xs file:bg-accent file:text-accent-foreground"
                      disabled={isUploading}
                      ref={fileInputRef}
                    />
                  </div>
                  {image && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearImage}
                      style={{
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-fg)',
                        backgroundColor: 'transparent'
                      }}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {uploadError && (
                  <p className="text-xs" style={{ color: 'var(--destructive)' }}>
                    {uploadError}
                  </p>
                )}
                
                {isUploading && (
                  <p className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                    Uploading image...
                  </p>
                )}
                
                <p className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                  Supports PNG, JPG, and WebP files up to 10MB
                </p>
              </div>
            )}
          </div>

          {image && (
            <div className="space-y-2">
              <Label 
                style={{ color: 'var(--theme-fg)' }}
                className="transition-colors duration-300"
              >
                Preview
              </Label>
              <div 
                className="w-24 h-24 border rounded overflow-hidden transition-colors duration-300"
                style={{
                  borderColor: 'var(--theme-border)',
                  backgroundColor: 'var(--theme-accent)'
                }}
              >
                <ImageWithFallback
                  src={image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop';
                  }}
                />
              </div>
            </div>
          )}

          {/* Background Removal Tools */}
          {(() => {
            const shouldShow = image && originalImage && backgroundRemovalSupported;
            console.log('🔍 Background removal section conditions:', {
              image: !!image,
              originalImage: !!originalImage,
              backgroundRemovalSupported,
              shouldShow
            });
            return shouldShow;
          })() && (
            <div className="space-y-3">
              <Label 
                style={{ color: 'var(--theme-fg)' }}
                className="transition-colors duration-300"
              >
                Image Enhancement
              </Label>
              
              {isProcessing && (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center mb-2">
                    <Wand2 className="h-5 w-5 animate-spin mr-2" style={{ color: 'var(--theme-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--theme-muted)' }}>
                      {getProcessingMessage()}
                    </span>
                  </div>
                  <div 
                    className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700"
                    style={{ backgroundColor: 'var(--theme-accent)' }}
                  >
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: 'var(--theme-fg)',
                        width: processingStage === 'analyzing' ? '33%' : 
                               processingStage === 'removing' ? '66%' : '100%' 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {!isProcessing && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackgroundRemoval}
                    disabled={!originalImage || isProcessing}
                    style={{
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-fg)',
                      backgroundColor: 'transparent'
                    }}
                    className="hover:opacity-80 transition-opacity flex-1"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Remove Background
                  </Button>
                  
                  {removeBackgroundEnabled && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={restoreOriginalImage}
                      style={{
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-fg)',
                        backgroundColor: 'transparent'
                      }}
                      className="hover:opacity-80 transition-opacity flex-1"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Restore Original
                    </Button>
                  )}
                </div>
              )}
              
              <p className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                {removeBackgroundEnabled 
                  ? '✨ Background removed! Your image now has a transparent background.'
                  : imageMode === 'url' 
                    ? 'Remove the background from your image. Works best with CORS-enabled sources like Unsplash.'
                    : 'Remove the background to create a transparent PNG perfect for inventory items.'
                }
              </p>
            </div>
          )}

          <div 
            className="flex justify-end gap-3 pt-4 border-t transition-colors duration-300"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              style={{
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-fg)',
                backgroundColor: 'transparent'
              }}
              className="hover:opacity-80 transition-opacity"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              style={{
                backgroundColor: 'var(--theme-fg)',
                color: 'var(--theme-bg)'
              }}
              className="hover:opacity-90 transition-opacity"
            >
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}