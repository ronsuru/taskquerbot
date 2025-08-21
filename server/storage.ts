import { 
  users, 
  campaigns, 
  transactions, 
  taskSubmissions, 
  withdrawals,
  type User, 
  type InsertUser,
  type Campaign,
  type InsertCampaign,
  type Transaction,
  type InsertTransaction,
  type TaskSubmission,
  type InsertTaskSubmission,
  type Withdrawal,
  type InsertWithdrawal
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: string, amount: string): Promise<User>;
  
  // Campaigns
  getCampaigns(platform?: string): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaignSlots(id: string, availableSlots: number): Promise<Campaign>;
  getUserCampaigns(userId: string): Promise<Campaign[]>;
  
  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
  updateTransactionStatus(id: string, status: string, hash?: string): Promise<Transaction>;
  
  // Task Submissions
  createTaskSubmission(submission: InsertTaskSubmission): Promise<TaskSubmission>;
  getCampaignSubmissions(campaignId: string): Promise<TaskSubmission[]>;
  getUserSubmissions(userId: string): Promise<TaskSubmission[]>;
  updateSubmissionStatus(id: string, status: string): Promise<TaskSubmission>;
  getSubmission(id: string): Promise<TaskSubmission | undefined>;
  getTaskSubmissionByCampaignAndUser(campaignId: string, userId: string): Promise<TaskSubmission | undefined>;
  updateSubmissionProof(id: string, proofUrl: string, notes?: string): Promise<TaskSubmission>;
  expireTaskSubmissions(): Promise<void>;
  
  // Withdrawals
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getUserWithdrawals(userId: string): Promise<Withdrawal[]>;
  updateWithdrawalStatus(id: string, status: string, hash?: string): Promise<Withdrawal>;

  // Admin functions
  makeUserAdmin(userId: string): Promise<User | undefined>;
  setUserBalance(userId: string, newBalance: string): Promise<User | undefined>;
  addToUserBalance(userId: string, amount: string): Promise<User | undefined>;
  deductFromUserBalance(userId: string, amount: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getAllCampaigns(): Promise<(Campaign & { creator: User })[]>;
  getAllTransactions(): Promise<(Transaction & { user: User, campaign?: Campaign })[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserBalance(id: string, amount: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ balance: amount })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getCampaigns(platform?: string): Promise<Campaign[]> {
    if (platform && platform !== 'all') {
      return db.select().from(campaigns).where(eq(campaigns.platform, platform));
    }
    return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async updateCampaignSlots(id: string, availableSlots: number): Promise<Campaign> {
    const [campaign] = await db
      .update(campaigns)
      .set({ availableSlots })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async getUserCampaigns(userId: string): Promise<Campaign[]> {
    return db.select().from(campaigns).where(eq(campaigns.creatorId, userId));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async updateTransactionStatus(id: string, status: string, hash?: string): Promise<Transaction> {
    const updateData: any = { status };
    if (hash) updateData.hash = hash;
    
    const [transaction] = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async createTaskSubmission(insertSubmission: InsertTaskSubmission): Promise<TaskSubmission> {
    const [submission] = await db
      .insert(taskSubmissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getCampaignSubmissions(campaignId: string): Promise<TaskSubmission[]> {
    return await db.select().from(taskSubmissions)
      .where(eq(taskSubmissions.campaignId, campaignId))
      .orderBy(desc(taskSubmissions.createdAt));
  }

  async getUserSubmissions(userId: string): Promise<TaskSubmission[]> {
    return db.select().from(taskSubmissions)
      .where(eq(taskSubmissions.userId, userId))
      .orderBy(desc(taskSubmissions.createdAt));
  }

  async updateSubmissionStatus(id: string, status: string): Promise<TaskSubmission> {
    const [submission] = await db
      .update(taskSubmissions)
      .set({ 
        status,
        reviewedAt: new Date()
      })
      .where(eq(taskSubmissions.id, id))
      .returning();
    return submission;
  }

  async getSubmission(id: string): Promise<TaskSubmission | undefined> {
    const [submission] = await db.select().from(taskSubmissions).where(eq(taskSubmissions.id, id));
    return submission || undefined;
  }

  async getTaskSubmissionByCampaignAndUser(campaignId: string, userId: string): Promise<TaskSubmission | undefined> {
    const [submission] = await db.select().from(taskSubmissions)
      .where(and(eq(taskSubmissions.campaignId, campaignId), eq(taskSubmissions.userId, userId)));
    return submission || undefined;
  }

  async updateSubmissionProof(id: string, proofUrl: string, notes?: string): Promise<TaskSubmission> {
    const [submission] = await db
      .update(taskSubmissions)
      .set({ 
        proofUrl,
        notes,
        status: 'submitted',
        submittedAt: new Date()
      })
      .where(eq(taskSubmissions.id, id))
      .returning();
    return submission;
  }

  async expireTaskSubmissions(): Promise<void> {
    await db
      .update(taskSubmissions)
      .set({ status: 'expired' })
      .where(and(
        eq(taskSubmissions.status, 'claimed'),
        sql`expires_at < now()`
      ));
  }

  async createWithdrawal(insertWithdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const [withdrawal] = await db
      .insert(withdrawals)
      .values(insertWithdrawal)
      .returning();
    return withdrawal;
  }

  async getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
    return db.select().from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(desc(withdrawals.createdAt));
  }

  async updateWithdrawalStatus(id: string, status: string, hash?: string): Promise<Withdrawal> {
    const updateData: any = { status };
    if (hash) updateData.hash = hash;
    
    const [withdrawal] = await db
      .update(withdrawals)
      .set(updateData)
      .where(eq(withdrawals.id, id))
      .returning();
    return withdrawal;
  }

  // Admin functions
  async makeUserAdmin(userId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async setUserBalance(userId: string, newBalance: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async addToUserBalance(userId: string, amount: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const newBalance = (parseFloat(user.balance) + parseFloat(amount)).toString();
    return await this.setUserBalance(userId, newBalance);
  }

  async deductFromUserBalance(userId: string, amount: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const newBalance = Math.max(0, parseFloat(user.balance) - parseFloat(amount)).toString();
    return await this.setUserBalance(userId, newBalance);
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllCampaigns(): Promise<(Campaign & { creator: User })[]> {
    return await db
      .select()
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .orderBy(desc(campaigns.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.campaigns,
          creator: row.users!
        }))
      );
  }

  async getAllTransactions(): Promise<(Transaction & { user: User, campaign?: Campaign })[]> {
    return await db
      .select()
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(campaigns, eq(transactions.campaignId, campaigns.id))
      .orderBy(desc(transactions.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.transactions,
          user: row.users!,
          campaign: row.campaigns || undefined
        }))
      );
  }

  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals)
      .where(eq(withdrawals.status, "pending"))
      .orderBy(desc(withdrawals.createdAt));
  }
}

export const storage = new DatabaseStorage();
