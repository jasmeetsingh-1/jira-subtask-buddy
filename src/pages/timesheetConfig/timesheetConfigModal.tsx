import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimesheetEntry } from './timesheetConfigPage';
import { useToast } from '@/hooks/use-toast';

interface TimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entries: TimesheetEntry[]) => void;
}

const TimesheetModal: React.FC<TimesheetModalProps> = ({ isOpen, onClose, onSave }) => {
  const [entries, setEntries] = useState<TimesheetEntry[]>([
    { id: '1', label: '', path: '' }
  ]);
  const { toast } = useToast();

  const addEntry = () => {
    const newEntry: TimesheetEntry = {
      id: Date.now().toString(),
      label: '',
      path: '',
    };
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(entry => entry.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof TimesheetEntry, value: string) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const handleReset = () => {
    setEntries([{ id: '1', label: '', path: '' }]);
  };

  const handleSave = () => {
    // Validate that all entries have both label and path
    const validEntries = entries.filter(entry => entry.label.trim() && entry.path.trim());
    
    if (validEntries.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in at least one complete entry (both label and path)",
        variant: "destructive",
      });
      return;
    }

    if (validEntries.length !== entries.length) {
      toast({
        title: "Warning",
        description: `${entries.length - validEntries.length} incomplete entries were excluded`,
      });
    }

    onSave(validEntries);
    handleReset();
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setTimeout(() => {
      handleReset();
    }, 200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Create New Timesheet
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Add multiple timesheet entries with labels and paths
          </p>
        </DialogHeader>

        {/* Scrollable content area */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="p-4 border border-border rounded-lg bg-card space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">
                    Entry {index + 1}
                  </h4>
                  {entries.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry(entry.id)}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`label-${entry.id}`} className="text-sm font-medium">
                      Label
                    </Label>
                    <Input
                      id={`label-${entry.id}`}
                      placeholder="e.g., Development, Testing, Meeting"
                      value={entry.label}
                      onChange={(e) => updateEntry(entry.id, 'label', e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`path-${entry.id}`} className="text-sm font-medium">
                      Timesheet Path
                    </Label>
                    <Input
                      id={`path-${entry.id}`}
                      placeholder="e.g., /projects/app/timesheet.xlsx"
                      value={entry.path}
                      onChange={(e) => updateEntry(entry.id, 'path', e.target.value)}
                      className="w-full font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add more button */}
            <Button
              variant="outline"
              onClick={addEntry}
              className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:border-primary/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Entry
            </Button>
          </div>
        </ScrollArea>

        {/* Fixed footer with action buttons */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              Save Timesheet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimesheetModal;