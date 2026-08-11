import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

export interface Section {
  id: string;
  name: string;
  createdAt: Date;
}

interface SectionsProps {
  sections: Section[];
  currentSectionId: string;
  onSectionChange: (sectionId: string) => void;
  onAddSection: (name: string) => void;
  onEditSection: (id: string, name: string) => void;
  onDeleteSection: (id: string) => void;
  isPreviewMode: boolean;
}

export function Sections({
  sections,
  currentSectionId,
  onSectionChange,
  onAddSection,
  onEditSection,
  onDeleteSection,
  isPreviewMode
}: SectionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      onAddSection(newSectionName.trim());
      setNewSectionName('');
      setIsDialogOpen(false);
    }
  };

  const startEditing = (section: Section) => {
    setEditingSectionId(section.id);
    setEditingName(section.name);
  };

  const handleEditSubmit = () => {
    if (editingName.trim() && editingSectionId) {
      onEditSection(editingSectionId, editingName.trim());
      setEditingSectionId(null);
      setEditingName('');
    }
  };

  const cancelEdit = () => {
    setEditingSectionId(null);
    setEditingName('');
  };

  const currentSection = sections.find(s => s.id === currentSectionId);

  return (
    <div className="mb-8">
      {/* Section Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        {sections.map((section) => (
          <div key={section.id} className="flex items-center">
            {editingSectionId === section.id ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded border" style={{ borderColor: 'var(--theme-border)' }}>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="h-6 text-sm min-w-0 w-24 border-0 p-0 focus:ring-0"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: 'var(--theme-fg)'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSubmit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  autoFocus
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleEditSubmit}
                    className="p-0.5 rounded hover:opacity-60 transition-opacity"
                    style={{ color: 'var(--theme-hover)' }}
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-0.5 rounded hover:opacity-60 transition-opacity"
                    style={{ color: 'var(--theme-muted)' }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="group flex items-center">
                <button
                  onClick={() => onSectionChange(section.id)}
                  style={{
                    backgroundColor: currentSectionId === section.id ? 'var(--theme-hover)' : 'transparent',
                    color: currentSectionId === section.id ? 'white' : 'var(--theme-fg)',
                    borderColor: currentSectionId === section.id ? 'var(--theme-hover)' : 'var(--theme-border)'
                  }}
                  className="px-4 py-2 text-sm border rounded-l transition-all duration-300 hover:opacity-80"
                  onMouseEnter={(e) => {
                    if (currentSectionId !== section.id) {
                      e.currentTarget.style.backgroundColor = 'var(--theme-hover)';
                      e.currentTarget.style.borderColor = 'var(--theme-hover)';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentSectionId !== section.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'var(--theme-border)';
                      e.currentTarget.style.color = 'var(--theme-fg)';
                    }
                  }}
                >
                  {section.name}
                </button>
                
                {!isPreviewMode && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex">
                    <button
                      onClick={() => startEditing(section)}
                      style={{
                        borderColor: currentSectionId === section.id ? 'var(--theme-hover)' : 'var(--theme-border)',
                        color: 'var(--theme-muted)'
                      }}
                      className="px-2 py-2 text-sm border-t border-b border-r hover:opacity-60 transition-opacity"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    {sections.length > 1 && (
                      <button
                        onClick={() => onDeleteSection(section.id)}
                        style={{
                          borderColor: currentSectionId === section.id ? 'var(--theme-hover)' : 'var(--theme-border)',
                          color: 'var(--theme-muted)'
                        }}
                        className="px-2 py-2 text-sm border-t border-b border-r rounded-r hover:opacity-60 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {!isPreviewMode && (
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="outline"
            size="sm"
            style={{
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-muted)',
              backgroundColor: 'transparent'
            }}
            className="ml-2 hover:opacity-60 transition-opacity"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Section
          </Button>
        )}
      </div>

      {/* Current Section Display */}
      {currentSection && (
        <div className="text-center">
          <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>
            {currentSection.name}
          </p>
        </div>
      )}

      {/* Add Section Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          style={{
            backgroundColor: 'var(--theme-bg)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-fg)'
          }}
          className="sm:max-w-[400px] border transition-colors duration-300"
        >
          <DialogHeader>
            <DialogTitle 
              className="text-xl tracking-wide transition-colors duration-300"
              style={{ color: 'var(--theme-fg)' }}
            >
              Add New Section
            </DialogTitle>
            <DialogDescription 
              className="text-sm transition-colors duration-300"
              style={{ color: 'var(--theme-muted)' }}
            >
              Create a new section to organize your items
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label 
                htmlFor="section-name"
                className="text-sm mb-2 block"
                style={{ color: 'var(--theme-fg)' }}
              >
                Section Name
              </Label>
              <Input
                id="section-name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="e.g., Clothing, Skincare, Haircare"
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-fg)'
                }}
                className="transition-colors duration-300"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSection();
                }}
              />
            </div>

            <div 
              className="flex justify-end gap-3 pt-4 border-t transition-colors duration-300"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
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
                onClick={handleAddSection}
                disabled={!newSectionName.trim()}
                style={{
                  backgroundColor: 'var(--theme-fg)',
                  color: 'var(--theme-bg)'
                }}
                className="hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Add Section
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}