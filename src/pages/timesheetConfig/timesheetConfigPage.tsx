import React, { useState, useEffect } from 'react';
import { Plus, Calendar, FolderOpen, Trash2, ArrowLeft, Settings, Star, Moon, Sun, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import TimesheetModal from './timesheetConfigModal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { timesheetActions, workTypesActions, themeActions } from '@/store/store';

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

  // Data is now loaded from Redux store - no need for localStorage loading

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

  const handleCancelEdit = () => {
    setEditingTimesheet(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
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
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Go back
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add new timesheet path
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Timesheets</p>
                  <p className="text-xl font-bold">{timesheets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Entries</p>
                  <p className="text-xl font-bold">
                    {timesheets.reduce((acc, ts) => acc + ts.entries.length, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Work Types</p>
                  <p className="text-xl font-bold">{workTypes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Work Types Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-4 w-4" />
                Work Type Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {workTypes.map((workType) => (
                  <div
                    key={workType.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      workType.isDefault 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => handleSetDefaultWorkType(workType.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{workType.name}</span>
                      {workType.isDefault && (
                        <Star className="h-3 w-3 text-primary fill-current" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Click on a work type to set it as default for new subtasks.
              </p>
            </CardContent>
          </Card>

          {/* Timesheet Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderOpen className="h-4 w-4" />
                  Timesheet Configuration
                </CardTitle>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-3 w-3" />
                  Add Path
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {timesheets.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No timesheet paths yet</p>
                  <Button onClick={() => setIsModalOpen(true)} size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Create First Path
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {timesheets.slice(0, 3).map((timesheet) => (
                    <div key={timesheet.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{timesheet.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {timesheet.entries[0]?.path}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {timesheet.entries.length}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTimesheet(timesheet.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTimesheet(timesheet.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {timesheets.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{timesheets.length - 3} more paths
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Timesheet Paths Table */}
        {timesheets.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  All Timesheet Paths
                </CardTitle>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New Path
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timesheet Path Label</TableHead>
                    <TableHead>Timesheet Path</TableHead>
                    <TableHead className="text-center">Entries</TableHead>
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
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {timesheet.entries.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTimesheet(timesheet.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="h-4 w-4" />
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
            </CardContent>
          </Card>
        )}

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