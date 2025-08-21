import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Remove apiRequest import since we're using fetch directly
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Plus, Minus, Settings } from "lucide-react";

interface AdminBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function AdminBalanceModal({ isOpen, onClose, userId }: AdminBalanceModalProps) {
  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [systemSettings, setSystemSettings] = useState({
    minWithdrawal: "",
    withdrawalFee: "",
    campaignCreationFee: "",
    minCampaignSlots: "",
    minRewardAmount: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing system settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadSettings = async () => {
        try {
          const res = await fetch("/api/admin/settings", {
            headers: { "x-user-id": "5154336054" }
          });
          if (res.ok) {
            const settings = await res.json();
            const settingsMap = settings.reduce((acc: any, setting: any) => {
              acc[setting.settingKey] = setting.settingValue;
              return acc;
            }, {});

            setSystemSettings({
              minWithdrawal: settingsMap["min_withdrawal_amount"] || "",
              withdrawalFee: settingsMap["withdrawal_fee"] || "",
              campaignCreationFee: settingsMap["campaign_creation_fee"] || "",
              minCampaignSlots: settingsMap["min_slots"] || "",
              minRewardAmount: settingsMap["min_reward_amount"] || ""
            });
          }
        } catch (error) {
          console.error("Failed to load settings:", error);
        }
      };
      loadSettings();
    }
  }, [isOpen]);

  const setBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/balance/set`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": "5154336054" 
        },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to set balance");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Balance set successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setAmount("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error setting balance", 
        description: error.message || "Failed to set balance",
        variant: "destructive" 
      });
    }
  });

  const addBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/balance/add`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": "5154336054" 
        },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to add balance");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Balance added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setAmount("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error adding balance", 
        description: error.message || "Failed to add balance",
        variant: "destructive" 
      });
    }
  });

  const deductBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/balance/deduct`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": "5154336054" 
        },
        body: JSON.stringify({ amount })
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to deduct balance");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Balance deducted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setAmount("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deducting balance", 
        description: error.message || "Failed to deduct balance",
        variant: "destructive" 
      });
    }
  });

  const updateSystemSettingsMutation = useMutation({
    mutationFn: async (settings: typeof systemSettings) => {
      const res = await fetch(`/api/admin/settings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": "5154336054" 
        },
        body: JSON.stringify(settings)
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to update system settings");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "System settings updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating settings", 
        description: error.message || "Failed to update system settings",
        variant: "destructive" 
      });
    }
  });

  const handleSetBalance = () => {
    if (!targetUserId || !amount) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setBalanceMutation.mutate({ userId: targetUserId, amount });
  };

  const handleAddBalance = () => {
    if (!targetUserId || !amount) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    addBalanceMutation.mutate({ userId: targetUserId, amount });
  };

  const handleDeductBalance = () => {
    if (!targetUserId || !amount) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    deductBalanceMutation.mutate({ userId: targetUserId, amount });
  };

  const handleUpdateSystemSettings = () => {
    if (!systemSettings.minWithdrawal || !systemSettings.withdrawalFee) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    updateSystemSettingsMutation.mutate(systemSettings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Balance Administration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetUserId">Target User Telegram ID</Label>
            <Input
              id="targetUserId"
              placeholder="e.g., 5154336054"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDT)</Label>
            <Input
              id="amount"
              placeholder="e.g., 10.50"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <Tabs defaultValue="set" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="set">Set Balance</TabsTrigger>
              <TabsTrigger value="add">Add Balance</TabsTrigger>
              <TabsTrigger value="deduct">Deduct Balance</TabsTrigger>
              <TabsTrigger value="advanced">
                <Settings className="w-4 h-4 mr-1" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="set" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set the user's balance to the exact amount specified.
              </p>
              <Button 
                onClick={handleSetBalance} 
                disabled={setBalanceMutation.isPending}
                className="w-full"
              >
                {setBalanceMutation.isPending ? "Setting..." : "Set Balance"}
              </Button>
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add the specified amount to the user's current balance.
              </p>
              <Button 
                onClick={handleAddBalance} 
                disabled={addBalanceMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {addBalanceMutation.isPending ? "Adding..." : "Add Balance"}
              </Button>
            </TabsContent>

            <TabsContent value="deduct" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Deduct the specified amount from the user's current balance.
              </p>
              <Button 
                onClick={handleDeductBalance} 
                disabled={deductBalanceMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Minus className="w-4 h-4 mr-2" />
                {deductBalanceMutation.isPending ? "Deducting..." : "Deduct Balance"}
              </Button>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800 font-medium">⚙️ System Configuration</p>
                <p className="text-xs text-amber-700">Adjust global platform settings and limits</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minWithdrawal">Minimum Withdrawal Amount (USDT)</Label>
                  <Input
                    id="minWithdrawal"
                    placeholder="e.g., 5.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={systemSettings.minWithdrawal}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, minWithdrawal: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdrawalFee">Withdrawal Fee (USDT)</Label>
                  <Input
                    id="withdrawalFee"
                    placeholder="e.g., 0.50"
                    type="number"
                    step="0.01"
                    min="0"
                    value={systemSettings.withdrawalFee}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, withdrawalFee: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaignCreationFee">Campaign Creation Fee (USDT)</Label>
                  <Input
                    id="campaignCreationFee"
                    placeholder="e.g., 1.00"
                    type="number"
                    step="0.01"
                    min="0"
                    value={systemSettings.campaignCreationFee}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, campaignCreationFee: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minCampaignSlots">Minimum Campaign Slots</Label>
                  <Input
                    id="minCampaignSlots"
                    placeholder="e.g., 5"
                    type="number"
                    min="1"
                    value={systemSettings.minCampaignSlots}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, minCampaignSlots: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minRewardAmount">Minimum Reward per Task (USDT)</Label>
                  <Input
                    id="minRewardAmount"
                    placeholder="e.g., 0.015"
                    type="number"
                    step="0.001"
                    min="0"
                    value={systemSettings.minRewardAmount}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, minRewardAmount: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleUpdateSystemSettings} 
                disabled={updateSystemSettingsMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                {updateSystemSettingsMutation.isPending ? "Updating..." : "Update System Settings"}
              </Button>

              <div className="text-xs text-slate-500 bg-slate-50 rounded p-2">
                <strong>Note:</strong> These settings affect the entire platform. Changes take effect immediately for new transactions/campaigns.
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}