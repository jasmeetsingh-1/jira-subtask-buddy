import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface JiraViewerProps {
  ticketId: string;
  onClose: () => void;
}

const JiraViewer = ({ ticketId, onClose }: JiraViewerProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[90vh] bg-background border rounded-lg shadow-lg flex flex-col animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Viewing Ticket: {ticketId}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            src={`https://jira.grazitti.com/browse/${ticketId}`}
            className="w-full h-full border-0"
            title={`Jira Ticket ${ticketId}`}
          />
        </div>
      </div>
    </div>
  );
};

export default JiraViewer;