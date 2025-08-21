import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Settings, Users, Wallet, TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";

const ADMIN_USER_ID = "79da10b5-36c3-40b5-a4e1-d4eec60ecd9b";

interface User {
  id: string;
  telegramId: string;
  walletAddress: string;
  balance: string;
  rewards: string;
  completedTasks: number;
  isAdmin: boolean;
  createdAt: string;
}

interface Campaign {
  id: string;
  title: string;
  platform: string;
  totalSlots: number;
  availableSlots: number;
  rewardAmount: string;
  escrowAmount: string;
  status: string;
  createdAt: string;
  creator: User;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  fee: string;
  status: string;
  hash?: string;
  createdAt: string;
  user: User;
  campaign?: Campaign;
}

function AdminPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [operation, setOperation] = useState<"set" | "add" | "deduct">("set");

  // Fetch admin data
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: {
          "X-User-ID": ADMIN_USER_ID,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/campaigns"],
    queryFn: async () => {
      const response = await fetch("/api/admin/campaigns", {
        headers: {
          "X-User-ID": ADMIN_USER_ID,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      return response.json();
    },
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/transactions", {
        headers: {
          "X-User-ID": ADMIN_USER_ID,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  // Balance mutations
  const balanceMutation = useMutation({
    mutationFn: async ({ userId, operation, amount }: { userId: string; operation: string; amount: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/balance/${operation}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": ADMIN_USER_ID,
        },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error("Failed to update balance");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User balance updated successfully",
      });
      setSelectedUser(null);
      setAmount("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const makeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}/make-admin`, {
        method: "POST",
        headers: {
          "X-User-ID": ADMIN_USER_ID,
        },
      });
      if (!response.ok) throw new Error("Failed to make user admin");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User granted admin access",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBalanceUpdate = () => {
    if (!selectedUser || !amount) return;
    balanceMutation.mutate({ userId: selectedUser.id, operation, amount });
  };

  // Calculate stats
  const totalUsers = users?.length || 0;
  const totalBalance = users?.reduce((sum, user) => sum + parseFloat(user.balance), 0) || 0;
  const totalRewards = users?.reduce((sum, user) => sum + parseFloat(user.rewards), 0) || 0;
  const activeCampaigns = campaigns?.filter(c => c.status === "active").length || 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <Badge variant="secondary">System Management</Badge>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBalance.toFixed(4)} USDT</div>
            <p className="text-xs text-muted-foreground">
              Combined user balances
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRewards.toFixed(4)} USDT</div>
            <p className="text-xs text-muted-foreground">
              Rewards distributed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Running campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users Management</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
              <CardDescription>Manage user accounts and balances</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Telegram ID</TableHead>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Rewards</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs">{user.id.slice(0, 8)}...</TableCell>
                        <TableCell>{user.telegramId}</TableCell>
                        <TableCell className="font-mono text-xs">{user.walletAddress.slice(0, 20)}...</TableCell>
                        <TableCell>{parseFloat(user.balance).toFixed(4)} USDT</TableCell>
                        <TableCell>{parseFloat(user.rewards).toFixed(4)} USDT</TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge variant="default">Admin</Badge>
                          ) : (
                            <Badge variant="outline">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Wallet className="h-4 w-4 mr-1" />
                                  Balance
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Manage User Balance</DialogTitle>
                                  <DialogDescription>
                                    Update balance for user {user.telegramId}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Current Balance</Label>
                                    <div className="text-2xl font-bold">{parseFloat(user.balance).toFixed(8)} USDT</div>
                                  </div>
                                  <div>
                                    <Label htmlFor="operation">Operation</Label>
                                    <select 
                                      id="operation"
                                      className="w-full mt-1 p-2 border rounded"
                                      value={operation}
                                      onChange={(e) => setOperation(e.target.value as any)}
                                    >
                                      <option value="set">Set Balance</option>
                                      <option value="add">Add Amount</option>
                                      <option value="deduct">Deduct Amount</option>
                                    </select>
                                  </div>
                                  <div>
                                    <Label htmlFor="amount">Amount (USDT)</Label>
                                    <Input
                                      id="amount"
                                      type="number"
                                      step="0.00000001"
                                      placeholder="0.00000000"
                                      value={amount}
                                      onChange={(e) => setAmount(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={handleBalanceUpdate}
                                    disabled={balanceMutation.isPending || !amount}
                                  >
                                    {balanceMutation.isPending ? "Updating..." : "Update Balance"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            {!user.isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => makeAdminMutation.mutate(user.id)}
                                disabled={makeAdminMutation.isPending}
                              >
                                Make Admin
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaigns Management</CardTitle>
              <CardDescription>Monitor all platform campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="text-center py-8">Loading campaigns...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Slots</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns?.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.title}</div>
                            <div className="text-xs text-muted-foreground">{campaign.id.slice(0, 8)}...</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{campaign.platform.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{campaign.creator.telegramId}</TableCell>
                        <TableCell>
                          {campaign.availableSlots}/{campaign.totalSlots}
                        </TableCell>
                        <TableCell>{parseFloat(campaign.rewardAmount).toFixed(4)} USDT</TableCell>
                        <TableCell>
                          <Badge variant={campaign.status === "active" ? "default" : "outline"}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>Monitor all platform transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div>
                            <div className="font-mono text-xs">{transaction.id.slice(0, 8)}...</div>
                            {transaction.hash && (
                              <div className="text-xs text-muted-foreground">{transaction.hash.slice(0, 16)}...</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.user.telegramId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.type}</Badge>
                        </TableCell>
                        <TableCell>{parseFloat(transaction.amount).toFixed(4)} USDT</TableCell>
                        <TableCell>{parseFloat(transaction.fee).toFixed(4)} USDT</TableCell>
                        <TableCell>
                          <Badge variant={transaction.status === "completed" ? "default" : "outline"}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminPage;