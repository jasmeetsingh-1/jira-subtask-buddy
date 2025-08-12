import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Plus, Trash2, User, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { authActions } from '@/store/store';
import config from "../config/default.json";
import { createSubtask } from '../api/jiraSubTask'

interface SubtaskData {
  id: string;
  name: string;
  workType: string;
  timesheetPath: string;
  assignToMe: boolean;
}

const Dashboard = () => {
  const [ticketNumber, setTicketNumber] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSubtasksCount, setCreatedSubtasksCount] = useState(0);
  const [subtasks, setSubtasks] = useState<SubtaskData[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  
  // Get data from Redux store
  const { isLoggedIn, authToken, userData } = useAppSelector(state => state.auth);
  const { timesheets } = useAppSelector(state => state.timesheet);
  const { workTypes: workTypeConfigs } = useAppSelector(state => state.workTypes);
  
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [timesheetPaths, setTimesheetPaths] = useState<Array<{label: string, path: string}>>([]);
  const [defaultWorkType, setDefaultWorkType] = useState<string>("");

  useEffect(() => {
    if (!isLoggedIn || !authToken) {
      navigate('/');
      return;
    }

    // Load configured timesheets and work types from Redux store
    console.log("time sheets >>>>>", timesheets);
    const pathsWithLabels = timesheets.flatMap(ts => ts.entries.map(entry => ({
      label: entry.label,
      path: entry.path
    })));
    setTimesheetPaths(pathsWithLabels);

    const types = workTypeConfigs.map(wt => wt.name);
    setWorkTypes(types);
    
    const defaultType = workTypeConfigs.find(wt => wt.isDefault);
    if (defaultType) {
      setDefaultWorkType(defaultType.name);
    }

  }, [navigate, isLoggedIn, authToken, timesheets, workTypeConfigs]);

  // Track last selected work type for new subtasks
  const [lastSelectedWorkType, setLastSelectedWorkType] = useState<string>("");

  // Initialize first subtask when data is loaded
  useEffect(() => {
    if (subtasks.length === 0 && workTypes.length > 0 && timesheetPaths.length > 0 && defaultWorkType) {
      const meetingsWorkType = workTypes.find(type => type.toLowerCase().includes('meetings')) || defaultWorkType;
      const initialSubtasks: SubtaskData[] = [
        {
          id: '1',
          name: 'Feature discussion',
          workType: meetingsWorkType,
          timesheetPath: findMeetingTimesheet() || '',
          assignToMe: false
        },
        {
          id: '2',
          name: '',
          workType: defaultWorkType,
          timesheetPath: '',
          assignToMe: false
        }
      ];
      setSubtasks([...initialSubtasks]);
      setLastSelectedWorkType(defaultWorkType);
    }
  }, [workTypes, timesheetPaths, defaultWorkType]);

  const findMeetingTimesheet = () => {
    const timesheetItem = timesheetPaths.find((item) => item.label.toLowerCase().includes("meeting"));
    return timesheetItem?.path || '';
  }

  // Auto-select work type based on timesheet path
  const getWorkTypeFromPath = (selectedPath: string): string => {
    const selectedItem = timesheetPaths.find(item => item.path === selectedPath);
    if (!selectedItem) return defaultWorkType;
    
    const lowercaseLabel = selectedItem.label.toLowerCase();
    if (lowercaseLabel.includes('development')) {
      return workTypes.find(type => type.toLowerCase() === 'development') || defaultWorkType;
    }
    if (lowercaseLabel.includes('bugfixing')) {
      return workTypes.find(type => type.toLowerCase() === 'bug fixing') || defaultWorkType;
    }
    if (lowercaseLabel.includes('meeting')) {
      return workTypes.find(type => type.toLowerCase() === 'meetings') || defaultWorkType;
    }
    return defaultWorkType;
  };

  const addSubtask = () => {
    const lastSubtask = subtasks[subtasks.length - 1];
    const newSubtask: SubtaskData = {
      id: Date.now().toString(),
      name: '',
      workType: lastSelectedWorkType || lastSubtask?.workType || defaultWorkType,
      timesheetPath: lastSubtask?.timesheetPath || '',
      assignToMe: false
    };
    setSubtasks([...subtasks, newSubtask]);
  };

  const removeSubtask = (id: string) => {
    if (subtasks.length > 1) {
      setSubtasks(subtasks.filter(subtask => subtask.id !== id));
    }
  };

  const updateSubtask = (id: string, field: keyof SubtaskData, value: string | boolean) => {
    setSubtasks(subtasks.map(subtask => {
      if (subtask.id === id) {
        const updatedSubtask = { ...subtask, [field]: value };
        
        // Auto-select work type when timesheet path changes
        if (field === 'timesheetPath' && typeof value === 'string') {
          updatedSubtask.workType = getWorkTypeFromPath(value);
        }
        
        // Track last selected work type for future subtasks
        if (field === 'workType' && typeof value === 'string') {
          setLastSelectedWorkType(value);
        }
        
        return updatedSubtask;
      }
      return subtask;
    }));
  };

  const handleSubmit = () => {
    if (!ticketNumber) {
      toast({
        title: "Missing ticket number",
        description: "Please enter a ticket number",
        variant: "destructive",
      });
      return;
    }

    // Check for missing fields in subtasks
    const missingFields: string[] = [];
    const validSubtasks = subtasks.filter((subtask, index) => {
      const errors: string[] = [];
      
      if (!subtask.name.trim()) {
        errors.push(`Subtask ${index + 1}: Name is required`);
      }
      if (!subtask.workType) {
        errors.push(`Subtask ${index + 1}: Work Type is required`);
      }
      if (!subtask.timesheetPath) {
        errors.push(`Subtask ${index + 1}: Timesheet Path is required`);
      }
      
      if (errors.length > 0) {
        missingFields.push(...errors);
        return false;
      }
      return true;
    });

    if (missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: missingFields.join(", "),
        variant: "destructive",
      });
      return;
    }

    if (validSubtasks.length === 0) {
      toast({
        title: "No subtasks",
        description: "Please add at least one subtask",
        variant: "destructive",
      });
      return;
    }

    // TODO: Submit to Jira API
    setCreatedSubtasksCount(validSubtasks.length);
    createSubtaskmaker(validSubtasks);
    setShowSuccessModal(true);
  };

  const createSubtaskmaker = (validSubtasks: SubtaskData[]) => {
    const subtaskArray = validSubtasks.map(subtask => {
      const workTypeConfig = workTypeConfigs.find(wt => wt.name === subtask.workType);
      const task =  {
        parentKey: ticketNumber,
        summary: subtask.name,
        workTypeId: workTypeConfig?.value || '',
        timesheetPath: subtask.timesheetPath
      };
      if (subtask.assignToMe) {
        task.username = userData.name ;
      }

      return task;
    });
    createSubtask(authToken, subtaskArray)
    console.log("subtask array to create >>>>", userData);
  }

  const handleLogout = () => {
    dispatch(authActions.logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 dark:from-background dark:to-background/95">
      {/* Header */}
      <header className="bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      {(userData as any)?.displayName?.charAt(0) || 'U'}
                    </div>
                </span>
              </div>
              <span className="ml-3 text-xl text-foreground">Welcome, <span className="font-bold">{(userData as any)?.displayName || 'User'}</span></span>
            </div>
            <div className="flex items-center space-x-4">
              {/* <span className="text-sm text-muted-foreground"></span> */}
              <Button variant="outline" size="sm" onClick={() => {
                navigate("/configuration")
              }}>
                <Settings className="w-4 h-4 mr-2" />
                Configuration
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                navigate("/logTime")
              }}>
                Log Time
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2"/>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">Create Subtasks</h1>
            <p className="text-muted-foreground dark:text-gray-300">Add subtasks to your Jira tickets</p>
          </div>

          {/* Ticket Number */}
          <Card className="shadow-card">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="shrink-0">Ticket Information</CardTitle>
                <Input
                  id="ticket"
                  placeholder="e.g., SU-0000"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Enter the main parent ticket under which you want to create subtasks
              </p>
            </CardContent>
          </Card>

          {/* Subtasks */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Subtasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">#</th>
                      <th className="text-left p-2 font-medium">Subtask Name</th>
                      <th className="text-left p-2 font-medium">Timesheet Path</th>
                      <th className="text-left p-2 font-medium">Work Type</th>
                      <th className="text-left p-2 font-medium">Assign to Me</th>
                      <th className="text-left p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subtasks.map((subtask, index) => (
                      <tr key={subtask.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </td>
                        <td className="p-2">
                          <Input
                            placeholder="Enter subtask name"
                            value={subtask.name}
                            onChange={(e) => updateSubtask(subtask.id, 'name', e.target.value)}
                            className="min-w-[200px]"
                          />
                        </td>
                        <td className="p-2">
                          <Select
                            value={subtask.timesheetPath}
                            onValueChange={(value) => updateSubtask(subtask.id, 'timesheetPath', value)}
                          >
                            <SelectTrigger className="min-w-[150px]">
                              <SelectValue placeholder="Select timesheet path" />
                            </SelectTrigger>
                            <SelectContent>
                              {timesheetPaths.map((item) => (
                                <SelectItem key={item.path} value={item.path}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Select
                            value={subtask.workType}
                            onValueChange={(value) => updateSubtask(subtask.id, 'workType', value)}
                          >
                            <SelectTrigger className="min-w-[150px]">
                              <SelectValue placeholder="Select work type" />
                            </SelectTrigger>
                            <SelectContent>
                              {workTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              id={`assign-${subtask.id}`}
                              checked={subtask.assignToMe}
                              onCheckedChange={(checked) => 
                                updateSubtask(subtask.id, 'assignToMe', checked as boolean)
                              }
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          {subtasks.length > 1 && (
                            <Button
                              onClick={() => removeSubtask(subtask.id)}
                              variant="outline"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={addSubtask} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subtask
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button onClick={handleSubmit} size="lg">
              Create Subtasks
            </Button>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-green-600">
              🎉 Subtasks Successfully Created!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-6">
            <div className="text-lg">
              <span className="font-semibold">{createdSubtasksCount}</span> subtask(s) have been created for ticket{" "}
              <button 
                className="font-mono bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 transition-colors cursor-pointer underline"
                onClick={() => {
                  // TODO: Open Jira ticket in new tab
                  window.open(`${config.jiraBaseUrl}/browse/${ticketNumber}`, '_blank');
                }}
              >
                {ticketNumber}
              </button>
            </div>
            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full"
              size="lg"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;