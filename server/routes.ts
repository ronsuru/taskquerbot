import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tonService } from "./tonService";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertUserSchema, insertCampaignSchema, insertTaskSubmissionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Object storage endpoints
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Test wallet endpoint
  app.post("/api/test-wallet", async (req, res) => {
    try {
      const result = await tonService.testWallet();
      res.json(result);
    } catch (error) {
      console.error("Error testing wallet:", error);
      res.status(500).json({ error: "Failed to test wallet" });
    }
  });

  // Admin settings endpoints
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const adminId = req.headers["x-user-id"] as string;
      if (!adminId) {
        return res.status(401).json({ error: "Admin access required" });
      }

      const adminUser = await storage.getUserByTelegramId(adminId);
      if (!adminUser?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    try {
      const adminId = req.headers["x-user-id"] as string;
      if (!adminId) {
        return res.status(401).json({ error: "Admin access required" });
      }

      const adminUser = await storage.getUserByTelegramId(adminId);
      if (!adminUser?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { minWithdrawal, withdrawalFee, campaignCreationFee, minCampaignSlots, minRewardAmount } = req.body;

      // Update each setting individually
      if (minWithdrawal) {
        await storage.setSystemSetting("min_withdrawal_amount", minWithdrawal, "Minimum withdrawal amount (USDT)", adminUser.id);
      }
      if (withdrawalFee) {
        await storage.setSystemSetting("withdrawal_fee", withdrawalFee, "Withdrawal fee (USDT)", adminUser.id);
      }
      if (campaignCreationFee) {
        await storage.setSystemSetting("campaign_creation_fee", campaignCreationFee, "Campaign creation fee (USDT)", adminUser.id);
      }
      if (minCampaignSlots) {
        await storage.setSystemSetting("min_slots", minCampaignSlots, "Minimum campaign slots", adminUser.id);
      }
      if (minRewardAmount) {
        await storage.setSystemSetting("min_reward_amount", minRewardAmount, "Minimum reward per task (USDT)", adminUser.id);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating system settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // User endpoints
  app.get("/api/users/:telegramId", async (req, res) => {
    try {
      const user = await storage.getUserByTelegramId(req.params.telegramId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByTelegramId(userData.telegramId);
      
      if (existingUser) {
        return res.json(existingUser);
      }

      // Convert wallet address to bounceable format if provided
      if (userData.walletAddress) {
        userData.walletAddress = tonService.toBounceable(userData.walletAddress);
      }

      const user = await storage.createUser(userData);
      
      // Auto-grant admin access to specified Telegram ID
      const adminTelegramId = process.env.ADMIN_TELEGRAM_ID || "5154336054";
      if (user.telegramId === adminTelegramId) {
        await storage.makeUserAdmin(user.id);
        console.log(`Admin access granted to Telegram ID: ${user.telegramId}`);
      }
      
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Campaign endpoints
  app.get("/api/campaigns", async (req, res) => {
    try {
      const platform = req.query.platform as string;
      const campaigns = await storage.getCampaigns(platform);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaignData = insertCampaignSchema.parse(req.body);
      
      // Validate minimum values using system settings
      const minSlotsSettings = await storage.getSystemSetting("min_slots");
      const minRewardSettings = await storage.getSystemSetting("min_reward_amount");
      
      const minSlots = minSlotsSettings ? parseInt(minSlotsSettings.settingValue) : 5;
      const minReward = minRewardSettings ? parseFloat(minRewardSettings.settingValue) : 0.015;
      
      if (campaignData.totalSlots < minSlots) {
        return res.status(400).json({ error: `Minimum ${minSlots} slots required` });
      }
      
      if (parseFloat(campaignData.rewardAmount) < minReward) {
        return res.status(400).json({ error: `Minimum reward amount is ${minReward} USDT` });
      }

      // Calculate costs
      const baseAmount = parseFloat(campaignData.rewardAmount) * campaignData.totalSlots;
      const costs = await tonService.calculateTotalCost(baseAmount.toString());

      const campaign = await storage.createCampaign({
        ...campaignData,
        availableSlots: campaignData.totalSlots,
        escrowAmount: costs.subtotal,
        fee: costs.fee,
      });

      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid campaign data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Transaction verification
  app.post("/api/transactions/verify", async (req, res) => {
    try {
      const { hash } = req.body;
      if (!hash) {
        return res.status(400).json({ error: "Transaction hash required" });
      }

      const verification = await tonService.verifyTransaction(hash);
      res.json(verification);
    } catch (error) {
      console.error("Error verifying transaction:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Fund campaign
  app.post("/api/campaigns/:id/fund", async (req, res) => {
    try {
      const { hash, userId } = req.body;
      if (!hash || !userId) {
        return res.status(400).json({ error: "Transaction hash and user ID required" });
      }

      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }

      // Verify transaction
      const verification = await tonService.verifyTransaction(hash);
      if (!verification.valid) {
        return res.status(400).json({ error: "Invalid transaction" });
      }

      // Create funding transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        amount: verification.amount || "0",
        fee: await tonService.calculateFee(verification.amount || "0"),
        status: "completed",
        hash,
        campaignId: campaign.id,
      });

      res.json({ success: true, transaction });
    } catch (error) {
      console.error("Error funding campaign:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Task submission endpoints
  app.post("/api/submissions", async (req, res) => {
    try {
      const submissionData = insertTaskSubmissionSchema.parse(req.body);
      
      // Check if campaign exists and has available slots
      const campaign = await storage.getCampaign(submissionData.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      if (campaign.availableSlots <= 0) {
        return res.status(400).json({ error: "No available slots" });
      }

      const submission = await storage.createTaskSubmission(submissionData);
      
      // Update campaign slots
      await storage.updateCampaignSlots(campaign.id, campaign.availableSlots - 1);

      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid submission data", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Handle proof file upload
  app.put("/api/submissions/:id/proof", async (req, res) => {
    try {
      const { proofImageURL } = req.body;
      if (!proofImageURL) {
        return res.status(400).json({ error: "Proof image URL required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(proofImageURL);

      // Update submission with proof URL
      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      res.json({ objectPath, success: true });
    } catch (error) {
      console.error("Error updating proof:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Approve/reject submissions
  app.put("/api/submissions/:id/review", async (req, res) => {
    try {
      const { status, userId } = req.body; // status: approved/rejected
      
      const submission = await storage.updateSubmissionStatus(req.params.id, status);
      
      if (status === "approved") {
        // Get campaign details for reward
        const campaign = await storage.getCampaign(submission.campaignId);
        if (campaign) {
          // Create reward transaction
          await storage.createTransaction({
            userId: submission.userId,
            type: "reward",
            amount: campaign.rewardAmount,
            fee: "0",
            status: "completed",
            campaignId: campaign.id,
          });

          // Update user balance
          const user = await storage.getUser(submission.userId);
          if (user) {
            const newBalance = (parseFloat(user.balance) + parseFloat(campaign.rewardAmount)).toString();
            await storage.updateUserBalance(user.id, newBalance);
          }
        }
      }

      res.json(submission);
    } catch (error) {
      console.error("Error reviewing submission:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user submissions
  app.get("/api/users/:userId/submissions", async (req, res) => {
    try {
      const submissions = await storage.getUserSubmissions(req.params.userId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching user submissions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Withdrawal endpoints
  app.post("/api/withdrawals", async (req, res) => {
    try {
      const { userId, amount, destinationWallet } = req.body;
      
      if (!userId || !amount || !destinationWallet) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate wallet address
      if (!tonService.validateAddress(destinationWallet)) {
        return res.status(400).json({ error: "Invalid TON wallet address" });
      }

      // Check minimum withdrawal amount using system settings
      const minWithdrawalSettings = await storage.getSystemSetting("min_withdrawal_amount");
      const withdrawalFeeSettings = await storage.getSystemSetting("withdrawal_fee");
      
      const minWithdrawal = minWithdrawalSettings ? parseFloat(minWithdrawalSettings.settingValue) : 0.020;
      const withdrawalFee = withdrawalFeeSettings ? parseFloat(withdrawalFeeSettings.settingValue) : 0.50;

      if (parseFloat(amount) < minWithdrawal) {
        return res.status(400).json({ error: `Minimum withdrawal amount is ${minWithdrawal} USDT` });
      }

      // Check user balance
      const user = await storage.getUser(userId);
      if (!user || parseFloat(user.balance) < parseFloat(amount)) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Use configurable withdrawal fee
      const fee = withdrawalFee.toString();
      const finalAmount = (parseFloat(amount) - withdrawalFee).toString();

      const withdrawal = await storage.createWithdrawal({
        userId,
        amount: finalAmount,
        fee,
        destinationWallet,
        status: "pending",
      });

      // Update user balance
      const newBalance = (parseFloat(user.balance) - parseFloat(amount)).toString();
      await storage.updateUserBalance(userId, newBalance);

      // Use reliable TON service directly (has working seqno functions)
      const result = await tonService.processWithdrawal(destinationWallet, finalAmount);
      
      if (result.success) {
        await storage.updateWithdrawalStatus(withdrawal.id, "completed", result.hash);
      } else {
        await storage.updateWithdrawalStatus(withdrawal.id, "failed");
        // Refund balance on failure
        await storage.updateUserBalance(userId, user.balance);
      }

      res.status(201).json(withdrawal);
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user transactions
  app.get("/api/users/:userId/transactions", async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.params.userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user campaigns
  app.get("/api/users/:userId/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getUserCampaigns(req.params.userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching user campaigns:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // Admin middleware
  const requireAdmin = async (req: any, res: any, next: any) => {
    const telegramId = req.headers['x-user-id'];
    if (!telegramId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // Check if the user is the admin by Telegram ID
    const adminTelegramId = process.env.ADMIN_TELEGRAM_ID || "5154336054";
    if (telegramId !== adminTelegramId) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const user = await storage.getUserByTelegramId(telegramId);
    req.user = user;
    next();
  };

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/campaigns", requireAdmin, async (req, res) => {
    try {
      const campaigns = await storage.getAllCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching all campaigns:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/transactions", requireAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching all transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/users/:userId/balance/set", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount } = req.body;
      
      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: "Valid amount required" });
      }

      const user = await storage.setUserBalance(userId, amount.toString());
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error setting user balance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/users/:userId/balance/add", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Valid positive amount required" });
      }

      const user = await storage.addToUserBalance(userId, amount.toString());
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error adding to user balance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/users/:userId/balance/deduct", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount } = req.body;
      
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Valid positive amount required" });
      }

      const user = await storage.deductFromUserBalance(userId, amount.toString());
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error deducting from user balance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/users/:userId/make-admin", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.makeUserAdmin(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error making user admin:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // TonKeeper automated transfer endpoints
  app.post("/api/tonkeeper/transfer", requireAdmin, async (req, res) => {
    try {
      const { destinationAddress, amount, userId } = req.body;
      
      if (!destinationAddress || !amount || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { tonKeeperService } = await import("./tonKeeperService");
      const result = await tonKeeperService.automatedTransfer(destinationAddress, amount, userId);
      
      res.json(result);
    } catch (error) {
      console.error("Error processing automated transfer:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/tonkeeper/batch-transfer", requireAdmin, async (req, res) => {
    try {
      const { transfers } = req.body;
      
      if (!transfers || !Array.isArray(transfers)) {
        return res.status(400).json({ error: "Invalid transfers array" });
      }

      const { tonKeeperService } = await import("./tonKeeperService");
      const results = await tonKeeperService.batchTransfer(transfers);
      
      res.json({ results });
    } catch (error) {
      console.error("Error processing batch transfer:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/tonkeeper/process-pending", requireAdmin, async (req, res) => {
    try {
      const { tonKeeperService } = await import("./tonKeeperService");
      const result = await tonKeeperService.processAllPendingWithdrawals();
      
      res.json(result);
    } catch (error) {
      console.error("Error processing pending withdrawals:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/tonkeeper/status", requireAdmin, async (req, res) => {
    try {
      const { tonKeeperService } = await import("./tonKeeperService");
      const status = await tonKeeperService.healthCheck();
      
      res.json(status);
    } catch (error) {
      console.error("Error checking TonKeeper status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // System Settings endpoints
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const { settings } = req.body;
      const userId = req.headers["x-user-id"] as string;
      
      if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({ error: "Settings array is required" });
      }

      const updatedSettings = [];
      for (const setting of settings) {
        if (!setting.key || setting.value === undefined) {
          continue;
        }
        const updated = await storage.setSystemSetting(
          setting.key,
          setting.value.toString(),
          setting.description,
          userId
        );
        updatedSettings.push(updated);
      }
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating system settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
