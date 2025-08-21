import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Remove apiRequest import since we're using fetch directly
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Plus, Minus } from "lucide-react";

interface AdminBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function AdminBalanceModal({ isOpen, onClose, userId }: AdminBalanceModalProps) {
  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="set">Set Balance</TabsTrigger>
              <TabsTrigger value="add">Add Balance</TabsTrigger>
              <TabsTrigger value="deduct">Deduct Balance</TabsTrigger>
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
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}