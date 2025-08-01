import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch } from '@/hooks/useRedux';
import { authActions } from '@/store/store';

import { loginToJira } from '../api/jiraLogin';

const Login = () => {
  const [username, setUsername] = useState("jasmeet.singh1");
  const [password, setPassword] = useState("Jirapassword@123");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Replace with actual Jira API call
      // const response = await fetch('/api/jira/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, password })
      // });

      // Simulate API call for now
      // await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await loginToJira(username, password);

      if (result.success) {
        // Save auth data to Redux store
        const token = result.token;
        dispatch(authActions.login({ token }));
        
        toast({
          title: "Login successful",
          description: "Welcome to Jira Task Manager",
        });
        navigate('/dashboard');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your username and password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
              {/* <span className="text-primary-foreground font-bold text-xl">J</span> */}
              <span>
                  <svg width="23.213" height="24" viewBox="0 0 23.213 24">
                    <defs>
                      <linearGradient id="linear-gradient" x1="0.335" y1="0.303" x2="0.002" y2="0.519" gradientUnits="objectBoundingBox">
                        <stop offset="0" stop-color="#0052cc"/>
                        <stop offset="1" stop-color="#2684ff"/>
                      </linearGradient>
                      <linearGradient id="linear-gradient-2" x1="-0.413" y1="-0.033" x2="-0.081" y2="-0.248" />
                    </defs>
                    <g id="Group_5806" data-name="Group 5806" transform="translate(-9732.77 -1412)">
                      <path id="path8005" d="M22.935,11.328,12.607,1l-1-1L.278,11.328a.951.951,0,0,0,0,1.343l7.1,7.1L11.606,24,22.935,12.671a.95.95,0,0,0,0-1.343ZM11.606,15.547,8.058,12l3.547-3.549L15.154,12Z" transform="translate(9732.77 1412)" fill="#2684ff"/>
                      <path id="path8015" d="M26.7,8.561A5.975,5.975,0,0,1,26.676.138L18.911,7.9l4.226,4.226Z" transform="translate(9717.675 1411.89)" fill="url(#linear-gradient)"/>
                      <path id="path8025" d="M61.068,59.414,57.51,62.971a5.974,5.974,0,0,1,0,8.453l7.783-7.784Z" transform="translate(9686.865 1364.576)" fill="url(#linear-gradient-2)"/>
                    </g>
                  </svg>
              </span>
            <span className="ml-3 text-2xl font-bold text-foreground">Log in to Grazitti Jira</span>
          </div>
          <p className="text-muted-foreground">Sign in to your Jira account</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your Jira credentials to access the task manager
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;