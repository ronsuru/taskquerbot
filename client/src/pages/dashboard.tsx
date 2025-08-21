import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskCard from "@/components/TaskCard";
import CampaignForm from "@/components/CampaignForm";
import WithdrawalForm from "@/components/WithdrawalForm";
import TaskSubmissionModal from "@/components/TaskSubmissionModal";
import { User, Wallet, Trophy, CheckCircle, Search, Plus, Filter, Settings } from "lucide-react";
import type { Campaign, User as UserType, Transaction } from "@shared/schema";

export default function Dashboard() {
  const [selectedTask, setSelectedTask] = useState<Campaign | null>(null);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [userId] = useState("TG789012"); // In real app, get from auth context

  // Fetch user data
  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns", platformFilter],
    enabled: true,
  });

  // Fetch user transactions
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/users", userId, "transactions"],
    enabled: !!userId,
  });

  const platformIcons = {
    twitter: "fab fa-twitter",
    tiktok: "fab fa-tiktok", 
    facebook: "fab fa-facebook",
    telegram: "fab fa-telegram"
  };

  const filteredCampaigns = campaigns.filter(campaign => 
    platformFilter === "all" || campaign.platform === platformFilter
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-telegram-blue rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">TaskBot</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user?.isAdmin && (
                <a href="/admin" className="text-slate-600 hover:text-telegram-blue transition-colors">
                  <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700">
                    <Settings className="w-4 h-4 mr-2" />
                    ADMIN ACCESS
                  </Button>
                </a>
              )}
              <div className="hidden sm:flex items-center space-x-2 bg-slate-100 rounded-lg px-3 py-2">
                <Wallet className="w-4 h-4 text-telegram-blue" />
                <span className="text-sm font-medium text-slate-700">
                  {user?.balance || "0.00"} USDT
                </span>
              </div>
              <Button variant="ghost" size="sm">
                <User className="w-5 h-5 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-telegram-blue to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome to TaskBot</h2>
              <p className="text-blue-100 mb-4 max-w-2xl">
                Complete social media tasks and earn USDT rewards. Create campaigns to promote your content with our escrow system.
              </p>
            </div>
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-400 opacity-20 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute right-8 bottom-0 w-20 h-20 bg-blue-300 opacity-20 rounded-full translate-y-4"></div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">User ID</p>
                    <p className="text-xl font-bold text-slate-900">#{userId}</p>
                  </div>
                  <div className="w-10 h-10 bg-telegram-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-telegram-blue" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Balance</p>
                    <p className="text-xl font-bold text-slate-900">{user?.balance || "0.00"} USDT</p>
                  </div>
                  <div className="w-10 h-10 bg-success-green bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-success-green" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Rewards</p>
                    <p className="text-xl font-bold text-slate-900">{user?.rewards || "0.00"} USDT</p>
                  </div>
                  <div className="w-10 h-10 bg-warning-amber bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-warning-amber" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Tasks Completed</p>
                    <p className="text-xl font-bold text-slate-900">{user?.completedTasks || 0}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main Content */}
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse">Browse Tasks</TabsTrigger>
            <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          {/* Browse Tasks Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Platform Filter */}
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Filter by Platform:</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              <Button 
                variant={platformFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setPlatformFilter("all")}
              >
                All Platforms
              </Button>
              {["twitter", "tiktok", "facebook", "telegram"].map((platform) => (
                <Button
                  key={platform}
                  variant={platformFilter === platform ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlatformFilter(platform)}
                  className="capitalize"
                >
                  <i className={`${platformIcons[platform as keyof typeof platformIcons]} mr-2`} />
                  {platform}
                </Button>
              ))}
            </div>

            {/* Task Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <TaskCard
                  key={campaign.id}
                  campaign={campaign}
                  onStartTask={() => setSelectedTask(campaign)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <CampaignForm userId={userId} />
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === "reward" ? "bg-success-green bg-opacity-10" :
                        transaction.type === "withdrawal" ? "bg-error-red bg-opacity-10" : 
                        "bg-telegram-blue bg-opacity-10"
                      }`}>
                        {transaction.type === "reward" && <Plus className="w-5 h-5 text-success-green" />}
                        {transaction.type === "withdrawal" && <Wallet className="w-5 h-5 text-error-red" />}
                        {transaction.type === "deposit" && <Plus className="w-5 h-5 text-telegram-blue" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 capitalize">
                          {transaction.type === "reward" ? "Task Reward" : 
                           transaction.type === "withdrawal" ? "Withdrawal" : "Deposit"}
                        </p>
                        <p className="text-sm text-slate-600">
                          {formatDate(transaction.createdAt.toString())}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === "withdrawal" ? "text-error-red" : "text-success-green"
                      }`}>
                        {transaction.type === "withdrawal" ? "-" : "+"}
                        {transaction.amount} USDT
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw">
            <WithdrawalForm userId={userId} userBalance={user?.balance || "0"} />
          </TabsContent>
        </Tabs>

        {/* Support Section */}
        <section className="mt-8">
          <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Need Help?</h3>
                <p className="text-slate-600 text-sm">Contact our support team for assistance with tasks, payments, or campaigns.</p>
              </div>
              <Button className="bg-telegram-blue hover:bg-blue-600">
                <i className="fab fa-telegram mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Task Submission Modal */}
      {selectedTask && (
        <TaskSubmissionModal
          campaign={selectedTask}
          userId={userId}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
