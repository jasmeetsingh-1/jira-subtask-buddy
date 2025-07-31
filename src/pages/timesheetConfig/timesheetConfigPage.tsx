import React, { useState, useEffect } from 'react';
import { Plus, Calendar, FolderOpen, Trash2, ArrowLeft, Settings, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TimesheetModal from './timesheetConfigModal';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkTypeConfig[]>([
    { id: '1', name: 'Development', isDefault: true },
    { id: '2', name: 'Testing', isDefault: false },
    { id: '3', name: 'Bug Fix', isDefault: false },
    { id: '4', name: 'Code Review', isDefault: false },
    { id: '5', name: 'Documentation', isDefault: false },
    { id: '6', name: 'Research', isDefault: false }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load timesheets and work types from localStorage on component mount
  useEffect(() => {
    const savedTimesheets = localStorage.getItem('timesheets');
    if (savedTimesheets) {
      try {
        setTimesheets(JSON.parse(savedTimesheets));
      } catch (error) {
        console.error('Error parsing saved timesheets:', error);
        toast({
          title: "Error",
          description: "Failed to load saved timesheets",
          variant: "destructive",
        });
      }
    }

    const savedWorkTypes = localStorage.getItem('workTypes');
    if (savedWorkTypes) {
      try {
        setWorkTypes(JSON.parse(savedWorkTypes));
      } catch (error) {
        console.error('Error parsing saved work types:', error);
      }
    }
  }, [toast]);

  // Save timesheets and work types to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('timesheets', JSON.stringify(timesheets));
  }, [timesheets]);

  useEffect(() => {
    localStorage.setItem('workTypes', JSON.stringify(workTypes));
  }, [workTypes]);

  const handleSaveTimesheet = (entries: TimesheetEntry[]) => {
    const newTimesheets: Timesheet[] = entries.map((entry, index) => ({
      id: `${Date.now() + index}-${entry.id}`,
      title: entry.label,
      entries: [entry],
    }));

    setTimesheets(prev => [...newTimesheets, ...prev]);
    setIsModalOpen(false);
    
    toast({
      title: "Success",
      description: `${newTimesheets.length} timesheet entries saved successfully`,
    });
  };

  const handleDeleteTimesheet = (id: string) => {
    setTimesheets(prev => prev.filter(timesheet => timesheet.id !== id));
    toast({
      title: "Deleted",
      description: "Timesheet deleted successfully",
    });
  };

  const handleSetDefaultWorkType = (id: string) => {
    setWorkTypes(prev => prev.map(wt => ({
      ...wt,
      isDefault: wt.id === id
    })));
    toast({
      title: "Updated",
      description: "Default work type updated successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Timesheet Manager
            </h1>
            <p className="text-muted-foreground">
              Manage your timesheet configurations and paths
            </p>
          </div>
          <div className='flex gap-3'>
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
              New Timesheet
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Timesheets</p>
                  <p className="text-2xl font-bold">{timesheets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                  <p className="text-2xl font-bold">
                    {timesheets.reduce((acc, ts) => acc + ts.entries.length, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Work Types Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Work Type Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workTypes.map((workType) => (
                <div
                  key={workType.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    workType.isDefault 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => handleSetDefaultWorkType(workType.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{workType.name}</span>
                    {workType.isDefault && (
                      <Star className="h-4 w-4 text-primary fill-current" />
                    )}
                  </div>
                  {workType.isDefault && (
                    <p className="text-xs text-muted-foreground mt-1">Default work type</p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Click on a work type to set it as default. The default work type will be pre-selected when creating new subtasks.
            </p>
          </CardContent>
        </Card>

        {/* Timesheets Table */}
        {timesheets.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No timesheets yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first timesheet to get started
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Timesheet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Path</TableHead>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTimesheet(timesheet.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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