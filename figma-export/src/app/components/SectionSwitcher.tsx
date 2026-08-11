import React, { useState } from 'react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ChevronDown, Plus, Edit2, Trash2, Check, X, FileText } from 'lucide-react';
import { Section } from './Sections';

interface SectionSwitcherProps {
  sections: Section[];
  currentSectionId: string;
  onSectionChange: (sectionId: string) => void;
  onAddSection: (name: string) => void;
  onEditSection: (id: string, name: string) => void;
  onDeleteSection: (id: string) => void;
  isPreviewMode: boolean;
}

export function SectionSwitcher({
  sections,
  currentSectionId,
  onSectionChange,
  onAddSection,
  onEditSection,
  onDeleteSection,
  isPreviewMode
}: SectionSwitcherProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const currentSection = sections.find(s => s.id === currentSectionId);

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      onAddSection(newSectionName.trim());
      setNewSectionName('');
      setIsAddDialogOpen(false);
    }
  };

  const handleEditSection = () => {
    if (editingName.trim() && editingSectionId) {
      onEditSection(editingSectionId, editingName.trim());
      setEditingName('');
      setEditingSectionId(null);
      setIsEditDialogOpen(false);
    }
  };

  const startEditing = (section: Section) => {
    setEditingSectionId(section.id);
    setEditingName(section.name);
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            style={{
              borderColor: 'var(--theme-fg)',
              backgroundColor: 'var(--theme-bg)',
              color: 'var(--theme-fg)'
            }}
            className="flex items-center gap-2 text-sm transition-all duration-300"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.color = 'var(--theme-fg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--theme-bg)';
              e.currentTarget.style.borderColor = 'var(--theme-fg)';
              e.currentTarget.style.color = 'var(--theme-fg)';
            }}
          >
            <FileText className="h-4 w-4" />
            <span className="font-medium">{currentSection?.name || 'Select Section'}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent
          align="start"
          style={{
            backgroundColor: 'var(--theme-bg)',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-fg)'
          }}
          className="min-w-48 w-auto border transition-colors duration-300"
        >
          {sections.map((section) => (
            <DropdownMenuItem
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              style={{
                backgroundColor: currentSectionId === section.id ? 'var(--theme-accent)' : 'transparent',
                color: 'var(--theme-fg)'
              }}
              className="group flex items-center justify-between cursor-pointer hover:opacity-80 transition-all duration-300"
              onMouseEnter={(e) => {
                if (currentSectionId !== section.id) {
                  e.currentTarget.style.backgroundColor = 'var(--theme-hover)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (currentSectionId !== section.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--theme-fg)';
                }
              }}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                {section.name}
                {currentSectionId === section.id && (
                  <Check className="h-3 w-3" style={{ color: 'var(--theme-hover)' }} />
                )}
              </span>
              
              {!isPreviewMode && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(section);
                    }}
                    className="p-1 rounded hover:opacity-60"
                    style={{ color: 'var(--theme-muted)' }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  {sections.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSection(section.id);
                      }}
                      className="p-1 rounded hover:opacity-60"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </DropdownMenuItem>
          ))}
          
          {!isPreviewMode && (
            <>
              <DropdownMenuSeparator style={{ backgroundColor: 'var(--theme-border)' }} />
              <DropdownMenuItem
                onClick={() => setIsAddDialogOpen(true)}
                className="cursor-pointer hover:opacity-80 transition-opacity group flex items-center"
                style={{ color: 'var(--theme-muted)' }}
                title="Add Section"
              >
                <span className="flex items-center gap-2">
                  <Plus className="h-3 w-3" />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs">
                    Add Section
                  </span>
                </span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Section Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                onClick={() => setIsAddDialogOpen(false)}
                style={{
                  borderColor: 'var(--theme-fg)',
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

      {/* Edit Section Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
              Edit Section
            </DialogTitle>
            <DialogDescription 
              className="text-sm transition-colors duration-300"
              style={{ color: 'var(--theme-muted)' }}
            >
              Update the section name
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label 
                htmlFor="edit-section-name"
                className="text-sm mb-2 block"
                style={{ color: 'var(--theme-fg)' }}
              >
                Section Name
              </Label>
              <Input
                id="edit-section-name"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-fg)'
                }}
                className="transition-colors duration-300"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSection();
                }}
              />
            </div>

            <div 
              className="flex justify-end gap-3 pt-4 border-t transition-colors duration-300"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                style={{
                  borderColor: 'var(--theme-fg)',
                  color: 'var(--theme-fg)',
                  backgroundColor: 'transparent'
                }}
                className="hover:opacity-80 transition-opacity"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSection}
                disabled={!editingName.trim()}
                style={{
                  backgroundColor: 'var(--theme-fg)',
                  color: 'var(--theme-bg)'
                }}
                className="hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}