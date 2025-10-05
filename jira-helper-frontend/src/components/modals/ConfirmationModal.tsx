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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Info } from "lucide-react";

interface ConfirmationModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  onHide,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          alertVariant: 'destructive' as const,
          buttonVariant: 'destructive' as const,
          icon: AlertTriangle,
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          alertVariant: 'default' as const,
          buttonVariant: 'default' as const,
          icon: AlertTriangle,
          iconColor: 'text-yellow-600'
        };
      case 'success':
        return {
          alertVariant: 'default' as const,
          buttonVariant: 'default' as const,
          icon: Info,
          iconColor: 'text-green-600'
        };
      default:
        return {
          alertVariant: 'default' as const,
          buttonVariant: 'default' as const,
          icon: Info,
          iconColor: 'text-blue-600'
        };
    }
  };

  const { alertVariant, buttonVariant, icon: Icon, iconColor } = getVariantStyles();

  return (
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Please confirm your action
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant={alertVariant}>
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconColor}`} />
            <AlertDescription>
              {message}
            </AlertDescription>
          </div>
        </Alert>
        
        <DialogFooter>
          <Button variant="outline" onClick={onHide} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button 
            variant={buttonVariant} 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
