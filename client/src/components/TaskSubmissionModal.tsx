import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Campaign, InsertTaskSubmission } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

interface TaskSubmissionModalProps {
  campaign: Campaign;
  userId: string;
  onClose: () => void;
}

export default function TaskSubmissionModal({ campaign, userId, onClose }: TaskSubmissionModalProps) {
  const [formData, setFormData] = useState({
    proofLinks: [""],
    notes: "",
    proofUrl: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitTaskMutation = useMutation({
    mutationFn: async (data: InsertTaskSubmission) => {
      const response = await apiRequest("POST", "/api/submissions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task Submitted",
        description: "Your task submission has been sent for review. You'll be notified once it's approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit task",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      
      if (uploadURL) {
        setFormData(prev => ({ ...prev, proofUrl: uploadURL }));
        toast({
          title: "Upload Complete",
          description: "Proof image has been uploaded successfully.",
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate based on campaign's proof type preference
    if (campaign.proofType === "link") {
      if (!formData.proofLinks[0] || formData.proofLinks[0].trim() === "") {
        toast({
          title: "Validation Error",
          description: "Please provide a profile link or URL as proof",
          variant: "destructive",
        });
        return;
      }
    } else if (campaign.proofType === "image") {
      if (!formData.proofUrl) {
        toast({
          title: "Validation Error",
          description: "Please upload a screenshot as proof",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Default behavior for backward compatibility
      if (!formData.proofLinks[0] && !formData.proofUrl) {
        toast({
          title: "Validation Error",
          description: "Please provide either a profile link or upload a screenshot",
          variant: "destructive",
        });
        return;
      }
    }

    submitTaskMutation.mutate({
      campaignId: campaign.id,
      userId,
      proofUrl: formData.proofUrl,
      proofLinks: formData.proofLinks.filter(link => link.trim() !== ""),
      notes: formData.notes,
      status: "pending",
    });
  };

  const addProofLink = () => {
    setFormData(prev => ({ ...prev, proofLinks: [...prev.proofLinks, ""] }));
  };

  const updateProofLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      proofLinks: prev.proofLinks.map((link, i) => i === index ? value : link)
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Task Proof</DialogTitle>
        </DialogHeader>

        <div className="mb-6">
          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-slate-900 mb-2">{campaign.title}</h4>
            <p className="text-slate-600 text-sm mb-3">{campaign.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Reward:</span>
              <span className="font-semibold text-success-green">{campaign.rewardAmount} USDT</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Show link input for link proof type */}
          {(campaign.proofType === "link" || !campaign.proofType) && (
            <div className="space-y-2">
              <Label>Profile Link or Username</Label>
              <div className="text-sm text-slate-600 mb-2">
                {campaign.proofType === "link" 
                  ? "📎 This campaign requires link/URL proof submissions"
                  : "Provide your profile link or username"
                }
              </div>
              {formData.proofLinks.map((link, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    placeholder={`https://${campaign.platform}.com/yourusername or @yourusername`}
                    value={link}
                    onChange={(e) => updateProofLink(index, e.target.value)}
                  />
                  {index === formData.proofLinks.length - 1 && !campaign.proofType && (
                    <Button type="button" variant="outline" size="sm" onClick={addProofLink}>
                      +
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Show image upload for image proof type */}
          {(campaign.proofType === "image" || !campaign.proofType) && (
            <div className="space-y-2">
              <Label>Screenshot Proof</Label>
              <div className="text-sm text-slate-600 mb-2">
                {campaign.proofType === "image" 
                  ? "📸 This campaign requires image/screenshot proof submissions"
                  : "Upload a screenshot showing task completion"
                }
              </div>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={5242880} // 5MB
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="w-full border-2 border-dashed border-slate-300 hover:border-telegram-blue transition-colors p-6 text-center"
              >
                <div className="flex flex-col items-center space-y-2">
                  <i className="fas fa-cloud-upload-alt text-slate-400 text-2xl"></i>
                  <p className="text-slate-600 text-sm">Click to upload screenshot</p>
                  <p className="text-slate-400 text-xs">PNG, JPG up to 5MB</p>
                </div>
              </ObjectUploader>
              {formData.proofUrl && (
                <p className="text-sm text-success-green">✓ Screenshot uploaded successfully</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Any additional information about task completion..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <i className="fas fa-info-circle text-telegram-blue mt-0.5"></i>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Submission Guidelines:</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  {campaign.proofType === "image" ? (
                    <>
                      <li>• Screenshots must clearly show task completion</li>
                      <li>• Images should be clear and readable</li>
                      <li>• Rewards are distributed after approval (usually within 24 hours)</li>
                    </>
                  ) : campaign.proofType === "link" ? (
                    <>
                      <li>• Links must be accessible and valid</li>
                      <li>• Provide your actual profile or content URL</li>
                      <li>• Rewards are distributed after approval (usually within 24 hours)</li>
                    </>
                  ) : (
                    <>
                      <li>• Screenshots must clearly show task completion</li>
                      <li>• Links must be accessible and valid</li>
                      <li>• Rewards are distributed after approval (usually within 24 hours)</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-telegram-blue hover:bg-blue-600"
              disabled={submitTaskMutation.isPending}
            >
              {submitTaskMutation.isPending ? "Submitting..." : "Submit Proof"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
