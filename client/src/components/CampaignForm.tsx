import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertCampaign } from "@shared/schema";

interface CampaignFormProps {
  userId: string;
}

export default function CampaignForm({ userId }: CampaignFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    platform: "",
    taskType: "",
    totalSlots: 5,
    rewardAmount: "0.015",
    proofType: "image",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCampaignMutation = useMutation({
    mutationFn: async (data: InsertCampaign) => {
      const response = await apiRequest("POST", "/api/campaigns", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Created",
        description: "Your campaign has been created successfully. Fund it to make it active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      // Reset form
      setFormData({
        title: "",
        description: "",
        platform: "",
        taskType: "",
        totalSlots: 5,
        rewardAmount: "0.015",
        proofType: "image",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const calculateCosts = () => {
    const subtotal = parseFloat(formData.rewardAmount) * formData.totalSlots;
    const fee = subtotal * 0.01;
    const total = subtotal + fee;
    
    return {
      subtotal: subtotal.toFixed(8),
      fee: fee.toFixed(8),
      total: total.toFixed(8),
    };
  };

  const costs = calculateCosts();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.platform || !formData.title || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.totalSlots < 5) {
      toast({
        title: "Validation Error",
        description: "Minimum 5 slots required",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(formData.rewardAmount) < 0.015) {
      toast({
        title: "Validation Error", 
        description: "Minimum reward amount is 0.015 USDT",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate({
      ...formData,
      creatorId: userId,
      taskType: formData.taskType || formData.platform,
      availableSlots: formData.totalSlots,
      escrowAmount: costs.subtotal,
      fee: costs.fee,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Campaign</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Follow our Instagram account"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proofType">Required Proof Type *</Label>
            <Select value={formData.proofType} onValueChange={(value) => setFormData(prev => ({ ...prev, proofType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select proof type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">📸 Image/Screenshot - Users upload proof images</SelectItem>
                <SelectItem value="link">🔗 Link/Profile URL - Users submit profile or task links</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-600">
              {formData.proofType === "image" ? 
                "Users will submit screenshots or images showing task completion" : 
                "Users will submit links to their profiles or task URLs as proof"
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Campaign Description *</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Describe what users need to do to complete this task..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="slots">Number of Slots *</Label>
              <Input
                id="slots"
                type="number"
                min="5"
                placeholder="Minimum 5"
                value={formData.totalSlots}
                onChange={(e) => setFormData(prev => ({ ...prev, totalSlots: parseInt(e.target.value) || 5 }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reward">Reward per Task (USDT) *</Label>
              <Input
                id="reward"
                type="number"
                step="0.001"
                min="0.015"
                placeholder="Minimum 0.015"
                value={formData.rewardAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, rewardAmount: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Total Cost (USDT)</Label>
              <div className="relative">
                <Input
                  readOnly
                  value={costs.total}
                  className="bg-slate-50 font-medium"
                />
                <div className="absolute right-3 top-3 text-xs text-slate-500">
                  +1% fee
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-3">Funding Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Slots × Reward:</span>
                <span className="font-medium text-slate-900">{costs.subtotal} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Platform Fee (1%):</span>
                <span className="font-medium text-slate-900">{costs.fee} USDT</span>
              </div>
              <div className="h-px bg-slate-200 my-2"></div>
              <div className="flex justify-between text-base">
                <span className="font-semibold text-slate-900">Total Required:</span>
                <span className="font-bold text-telegram-blue">{costs.total} USDT</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <i className="fas fa-shield-alt text-telegram-blue mt-0.5"></i>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Escrow Protection:</p>
                <p className="text-blue-700">
                  Funds will be held in escrow (EQBUNIp7rk76qbgMPq8vlW8fF4l56IcrOwzEpVjHFfzUY3Yv) until tasks are completed and approved. 
                  You cannot withdraw these funds once the campaign is active.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button type="button" variant="outline" className="flex-1">
              Save Draft
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-telegram-blue hover:bg-blue-600"
              disabled={createCampaignMutation.isPending}
            >
              {createCampaignMutation.isPending ? "Creating..." : "Fund & Publish Campaign"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
