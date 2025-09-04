import { Dialog, DialogContent } from "@/components/ui/dialog";

const ExtensionModal = () => {
  return (
    <Dialog open={true}>
      <DialogContent className="max-w-md mx-auto p-8 text-center" hideCloseButton>
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Access Required</h2>
            <p className="text-muted-foreground">
              Please access this application through the Jira extension to continue.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExtensionModal;