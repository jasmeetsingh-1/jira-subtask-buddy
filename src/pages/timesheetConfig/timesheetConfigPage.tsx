import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Edit2, Trash2, Star, Moon, Sun, FolderOpen } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { timesheetActions, workTypesActions, themeActions } from '@/store/store';
import TimesheetModal from './timesheetConfigModal';
import { useToast } from '@/hooks/use-toast';

export interface TimesheetEntry {
  id: string;
  label: string;
  path: string;
}

export interface Timesheet {
  id: string;
  title: string;
  entries: TimesheetEntry[];
}

export interface WorkTypeConfig {
  id: string;
  name: string;
  isDefault: boolean;
}

const TimesheetManager = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get data from Redux store
  const { timesheets } = useAppSelector(state => state.timesheet);
  const { workTypes } = useAppSelector(state => state.workTypes);
  const { isDarkMode } = useAppSelector(state => state.theme);

  const handleSaveTimesheet = (entries: TimesheetEntry[]) => {
    const newTimesheets: Timesheet[] = entries.map((entry, index) => ({
      id: `${Date.now() + index}-${entry.id}`,
      title: entry.label,
      entries: [entry],
    }));

    newTimesheets.forEach(ts => dispatch(timesheetActions.addTimesheet(ts)));
    setIsModalOpen(false);
    
    toast({
      title: "Success",
      description: `${newTimesheets.length} timesheet entries saved successfully`,
    });
  };

  const handleDeleteTimesheet = (id: string) => {
    dispatch(timesheetActions.deleteTimesheet(id));
    toast({
      title: "Deleted",
      description: "Timesheet deleted successfully",
    });
  };

  const handleSetDefaultWorkType = (id: string) => {
    dispatch(workTypesActions.setDefaultWorkType(id));
    toast({
      title: "Updated",
      description: "Default work type updated successfully",
    });
  };

  const handleToggleTheme = () => {
    dispatch(themeActions.toggleTheme());
  };

  const handleEditTimesheet = (id: string) => {
    setEditingTimesheet(id);
    // You can add logic here to open a modal or inline editing
  };

  const defaultWorkType = workTypes.find(wt => wt.isDefault);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Grazitti jira-subtask Configurations
            </h1>
            <p className="text-muted-foreground">
              Manage your timesheet configurations and paths
            </p>
          </div>
          <div className='flex items-center gap-3'>
            {/* Dark Mode Toggle */}
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={isDarkMode}
                onCheckedChange={handleToggleTheme}
              />
              <Moon className="h-4 w-4" />
            </div>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go back
            </Button>
          </div>
        </div>

        {/* Configuration Forms - Vertical Layout */}
        <div className="space-y-6">
          {/* Work Type Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Work Type Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-worktype">Default Work Type</Label>
                <Select
                  value={defaultWorkType?.id.toString() || ""}
                  onValueChange={handleSetDefaultWorkType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default work type" />
                  </SelectTrigger>
                  <SelectContent>
                    {workTypes.map((workType) => (
                      <SelectItem key={workType.id} value={workType.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{workType.name}</span>
                          {workType.isDefault && (
                            <Star className="h-3 w-3 text-primary fill-current" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This work type will be selected by default for new subtasks.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timesheet Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Timesheet Configuration</CardTitle>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add new timesheet path
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {timesheets.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No timesheet paths yet</p>
                  <Button onClick={() => setIsModalOpen(true)} size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Create First Path
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timesheet Path Label</TableHead>
                      <TableHead>Timesheet Path</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheets.map((timesheet) => (
                      <TableRow key={timesheet.id}>
                        <TableCell className="font-medium">{timesheet.title}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {timesheet.entries.map((entry) => (
                              <div key={entry.id} className="text-xs font-mono text-muted-foreground break-all">
                                {entry.path}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTimesheet(timesheet.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTimesheet(timesheet.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal */}
        <TimesheetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTimesheet}
        />
      </div>
    </div>
  );
};

export default TimesheetManager;