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
import { Settings, Plus, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubtaskData {
  id: string;
  name: string;
  workType: string;
  timesheetPath: string;
  assignToMe: boolean;
}

const Dashboard = () => {
  const [username, setUsername] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdSubtasksCount, setCreatedSubtasksCount] = useState(0);
  const [subtasks, setSubtasks] = useState<SubtaskData[]>([
    {
      id: '1',
      name: '',
      workType: '',
      timesheetPath: '',
      assignToMe: false
    }
  ]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const workTypes = [
    "Development",
    "Testing",
    "Bug Fix",
    "Code Review",
    "Documentation",
    "Research"
  ];

  const timesheetPaths = [
    "Frontend Development",
    "Backend Development",
    "QA Testing",
    "DevOps",
    "UI/UX Design",
    "Project Management"
  ];

  useEffect(() => {
    const storedUsername = localStorage.getItem('jira-username');
    if (!storedUsername) {
      navigate('/');
      return;
    }
    setUsername(storedUsername);
  }, [navigate]);

  const addSubtask = () => {
    const newSubtask: SubtaskData = {
      id: Date.now().toString(),
      name: '',
      workType: '',
      timesheetPath: '',
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
    setSubtasks(subtasks.map(subtask => 
      subtask.id === id ? { ...subtask, [field]: value } : subtask
    ));
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
    setShowSuccessModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('jira-username');
    localStorage.removeItem('jira-credentials');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold">J</span>
              </div>
              <span className="ml-3 text-xl font-bold text-foreground">Jira Task Manager</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, {username}</span>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configuration
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <Avatar className="w-6 h-6 mr-2">
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Subtasks</h1>
            <p className="text-muted-foreground">Add subtasks to your Jira tickets</p>
          </div>

          {/* Ticket Number */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="ticket">Ticket Number</Label>
                <Input
                  id="ticket"
                  placeholder="e.g., PROJ-123"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Subtasks */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Subtasks</CardTitle>
              <Button onClick={addSubtask} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Subtask
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">#</th>
                      <th className="text-left p-2 font-medium">Subtask Name</th>
                      <th className="text-left p-2 font-medium">Work Type</th>
                      <th className="text-left p-2 font-medium">Timesheet Path</th>
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
                          <Select
                            value={subtask.timesheetPath}
                            onValueChange={(value) => updateSubtask(subtask.id, 'timesheetPath', value)}
                          >
                            <SelectTrigger className="min-w-[150px]">
                              <SelectValue placeholder="Select timesheet path" />
                            </SelectTrigger>
                            <SelectContent>
                              {timesheetPaths.map((path) => (
                                <SelectItem key={path} value={path}>
                                  {path}
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
                  window.open(`https://your-jira-instance.atlassian.net/browse/${ticketNumber}`, '_blank');
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