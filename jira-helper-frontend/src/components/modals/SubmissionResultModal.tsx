import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";

interface SubmissionResult {
  success: boolean;
  message: string;
  totalEntries: number;
  successfulEntries: number;
  failedEntries: number;
  results?: Array<{
    id: string;
    time: string;
    subtaskKey: string;
    minutes: number;
  }>;
  errors?: Array<{
    index: number;
    subtaskKey: string;
    error: string;
  }>;
}

interface SubmissionResultModalProps {
  show: boolean;
  onHide: () => void;
  result: SubmissionResult | null;
  totalMinutes: number;
}

const SubmissionResultModal: React.FC<SubmissionResultModalProps> = ({
  show,
  onHide,
  result,
  totalMinutes
}) => {
  if (!result) return null;

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (mins <= 0) return "0m";
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Work Log Submission Results</span>
            <Badge 
              variant={result.success ? "default" : "destructive"}
              className="ml-2"
            >
              {result.success ? "Success" : "Failed"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Review the results of your work log submission
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary */}
          <Alert variant={result.success ? "default" : "destructive"}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className="font-medium">
                {result.success ? "✅ Submission Successful!" : "❌ Submission Failed"}
              </AlertDescription>
            </div>
            <AlertDescription className="mt-2">
              {result.message}
            </AlertDescription>
          </Alert>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="border rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600 mb-1">{result.totalEntries}</div>
              <div className="text-sm text-muted-foreground">Total Entries</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600 mb-1">{result.successfulEntries}</div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600 mb-1">{result.failedEntries}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>

          {/* Total Time */}
          {totalMinutes > 0 && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="h-5 w-5 text-blue-600" />
                <div className="text-xl font-bold text-blue-600">{formatMinutes(totalMinutes)}</div>
              </div>
              <div className="text-sm text-muted-foreground">Total Time Logged</div>
            </div>
          )}

          {/* Successful Entries */}
          {result.results && result.results.length > 0 && (
            <div>
              <h4 className="text-green-600 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Successfully Logged ({result.results.length})
              </h4>
              <div className="space-y-2">
                {result.results.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{entry.subtaskKey}</div>
                      <div className="text-sm text-muted-foreground">ID: {entry.id}</div>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {entry.time}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed Entries */}
          {result.errors && result.errors.length > 0 && (
            <div>
              <h4 className="text-red-600 mb-3 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Failed Entries ({result.errors.length})
              </h4>
              <div className="space-y-2">
                {result.errors.map((error, index) => (
                  <div key={index} className="flex justify-between items-start p-3 border border-red-200 rounded-lg">
                    <div>
                      <div className="font-medium">{error.subtaskKey}</div>
                      <div className="text-sm text-red-600">{error.error}</div>
                    </div>
                    <Badge variant="destructive">Failed</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onHide}>
            Close
          </Button>
          {result.success && (
            <Button onClick={onHide} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Great!
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionResultModal;
