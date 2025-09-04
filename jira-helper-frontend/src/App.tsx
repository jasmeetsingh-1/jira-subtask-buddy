import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { authActions } from "@/store/store";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import TimesheetManager from "./pages/timesheetConfig/timesheetConfigPage";
import LogTime from "./pages/LogTime";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isDarkMode } = useAppSelector(state => state.theme);
  const { jsid } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // Apply dark mode globally
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check for jsid in URL params and redirect to dashboard
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jsidFromUrl = urlParams.get('jsid');
    
    if (jsidFromUrl) {
      dispatch(authActions.setJsid(jsidFromUrl));
      navigate('/dashboard');
    }
  }, [dispatch, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/configuration" element={<TimesheetManager />} />
      <Route path="/logTime" element={<LogTime />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
