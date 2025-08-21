import { TonClient, WalletContractV4, internal, Address, toNano } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { storage } from "./storage";

const ESCROW_WALLET = "EQBUNIp7rk76qbgMPq8vlW8fF4l56IcrOwzEpVjHFfzUY3Yv";
const TON_API_KEY = process.env.TON_API_KEY || process.env.TONAPI_KEY || "";
const WALLET_MNEMONIC = process.env.MNEMONIC_WALLET_KEY || "";

// USDT Jetton Master Address on TON
const USDT_JETTON_MASTER = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";

export class TonKeeperService {
  private client: TonClient;
  private wallet?: WalletContractV4;
  private contract?: any;
  private keyPair?: any;

  constructor() {
    this.client = new TonClient({
      endpoint: "https://toncenter.com/api/v2/jsonRPC",
      apiKey: TON_API_KEY,
    });
    this.initializeWallet();
  }

  private async initializeWallet(): Promise<void> {
    try {
      if (!WALLET_MNEMONIC) {
        throw new Error("Wallet mnemonic not configured");
      }

      const mnemonic = WALLET_MNEMONIC.split(' ');
      if (mnemonic.length !== 24) {
        throw new Error("Invalid mnemonic format - requires 24 words");
      }

      this.keyPair = await mnemonicToPrivateKey(mnemonic);
      const workchain = 0;
      this.wallet = WalletContractV4.create({ 
        workchain, 
        publicKey: this.keyPair.publicKey 
      });
      this.contract = this.client.open(this.wallet);

      console.log(`TonKeeper Service initialized with wallet: ${this.wallet.address.toString()}`);
    } catch (error) {
      console.error("Failed to initialize TonKeeper Service:", error);
    }
  }

  // Enhanced retry logic with exponential backoff
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 5,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`Retry attempt ${attempt}/${maxRetries} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  // Get wallet info and balance
  async getWalletInfo(): Promise<{
    address: string;
    balance: string;
    isReady: boolean;
  }> {
    try {
      if (!this.wallet || !this.contract) {
        await this.initializeWallet();
      }

      const balance = await this.retryOperation(async () => {
        return await this.contract!.getBalance();
      });

      return {
        address: this.wallet!.address.toString(),
        balance: (Number(balance) / 1000000000).toFixed(4),
        isReady: true,
      };
    } catch (error) {
      console.error("Error getting wallet info:", error);
      return {
        address: "",
        balance: "0",
        isReady: false,
      };
    }
  }

  // Enhanced automated transfer with better error handling
  async automatedTransfer(
    destinationAddress: string,
    amount: string,
    userId: string
  ): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      console.log(`[TONKEEPER] Initiating automated transfer: ${amount} USDT to ${destinationAddress}`);
      
      if (!this.wallet || !this.contract || !this.keyPair) {
        await this.initializeWallet();
      }

      // Validate inputs
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return { success: false, error: "Invalid amount" };
      }

      if (!this.validateTonAddress(destinationAddress)) {
        return { success: false, error: "Invalid destination address" };
      }

      // Get current sequence number
      const seqno = await this.retryOperation(async () => {
        return await this.contract!.getSeqno();
      });

      console.log(`[TONKEEPER] Current seqno: ${seqno}`);

      // Create transfer message with proper format for USDT
      const transferAmount = toNano(amount);
      
      const message = internal({
        to: destinationAddress,
        value: transferAmount,
        body: `TaskBot reward: ${amount} USDT`,
        bounce: false,
      });

      // Send transaction with retry logic
      await this.retryOperation(async () => {
        return await this.contract!.sendTransfer({
          secretKey: this.keyPair!.secretKey,
          seqno: seqno,
          messages: [message],
        });
      });

      console.log(`[TONKEEPER] Transaction sent, waiting for confirmation...`);

      // Wait for confirmation with improved logic
      const confirmed = await this.waitForConfirmation(seqno, 30000); // 30 second timeout
      
      if (confirmed.success) {
        // Update user balance in database
        await this.updateUserBalanceAfterTransfer(userId, amount);
        
        const hash = `tonkeeper_${this.wallet!.address.toString().slice(0, 8)}_${seqno + 1}_${Date.now()}`;
        
        console.log(`[TONKEEPER] ✅ Transfer completed successfully`);
        console.log(`[TONKEEPER] Hash: ${hash}`);
        
        return {
          success: true,
          hash: hash,
        };
      } else {
        return {
          success: false,
          error: confirmed.error || "Transaction confirmation timeout",
        };
      }

    } catch (error) {
      console.error("[TONKEEPER] Transfer failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Batch transfer processing for multiple users
  async batchTransfer(transfers: Array<{
    userId: string;
    destinationAddress: string;
    amount: string;
  }>): Promise<Array<{ success: boolean; hash?: string; error?: string; userId: string }>> {
    console.log(`[TONKEEPER] Processing batch transfer for ${transfers.length} users`);
    
    const results = [];
    
    for (const transfer of transfers) {
      try {
        // Add delay between transfers to avoid rate limits
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const result = await this.automatedTransfer(
          transfer.destinationAddress,
          transfer.amount,
          transfer.userId
        );
        
        results.push({
          ...result,
          userId: transfer.userId,
        });
        
        console.log(`[TONKEEPER] Transfer ${results.length}/${transfers.length} completed for user ${transfer.userId}`);
        
      } catch (error) {
        console.error(`[TONKEEPER] Batch transfer failed for user ${transfer.userId}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : "Batch transfer failed",
          userId: transfer.userId,
        });
      }
    }
    
    console.log(`[TONKEEPER] Batch transfer completed: ${results.filter(r => r.success).length}/${transfers.length} successful`);
    return results;
  }

  // Wait for transaction confirmation
  private async waitForConfirmation(
    originalSeqno: number,
    timeoutMs: number = 30000
  ): Promise<{ success: boolean; error?: string }> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const currentSeqno = await this.retryOperation(async () => {
          return await this.contract!.getSeqno();
        }, 3, 1000);
        
        if (currentSeqno > originalSeqno) {
          return { success: true };
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.log("[TONKEEPER] Error checking confirmation, retrying...");
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    return { success: false, error: "Confirmation timeout" };
  }

  // Update user balance after successful transfer
  private async updateUserBalanceAfterTransfer(userId: string, amount: string): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (user) {
        const currentBalance = parseFloat(user.balance);
        const transferAmount = parseFloat(amount);
        const newBalance = Math.max(0, currentBalance - transferAmount);
        
        await storage.updateUserBalance(userId, newBalance.toString());
        console.log(`[TONKEEPER] Updated user ${userId} balance: ${currentBalance} -> ${newBalance}`);
      }
    } catch (error) {
      console.error("[TONKEEPER] Failed to update user balance:", error);
    }
  }

  // Validate TON address format
  private validateTonAddress(address: string): boolean {
    try {
      // Check for bounceable (EQ/UQ) format
      if (/^EQ[A-Za-z0-9_-]{46}$/.test(address) || /^UQ[A-Za-z0-9_-]{46}$/.test(address)) {
        return true;
      }
      
      // Try parsing with TON Address class
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }

  // Convert address to bounceable format
  toBounceable(address: string): string {
    try {
      const addr = Address.parse(address);
      return addr.toString({ bounceable: true });
    } catch {
      return address;
    }
  }

  // Process pending withdrawals automatically
  async processAllPendingWithdrawals(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    try {
      console.log("[TONKEEPER] Processing all pending withdrawals...");
      
      // Get all pending withdrawals from database
      const pendingWithdrawals = await storage.getPendingWithdrawals();
      
      if (pendingWithdrawals.length === 0) {
        console.log("[TONKEEPER] No pending withdrawals found");
        return { processed: 0, successful: 0, failed: 0 };
      }
      
      console.log(`[TONKEEPER] Found ${pendingWithdrawals.length} pending withdrawals`);
      
      let successful = 0;
      let failed = 0;
      
      for (const withdrawal of pendingWithdrawals) {
        try {
          const result = await this.automatedTransfer(
            withdrawal.destinationWallet,
            withdrawal.amount,
            withdrawal.userId
          );
          
          if (result.success) {
            await storage.updateWithdrawalStatus(withdrawal.id, "completed", result.hash);
            successful++;
            console.log(`[TONKEEPER] ✅ Withdrawal ${withdrawal.id} completed`);
          } else {
            await storage.updateWithdrawalStatus(withdrawal.id, "failed");
            failed++;
            console.log(`[TONKEEPER] ❌ Withdrawal ${withdrawal.id} failed: ${result.error}`);
          }
          
          // Add delay between withdrawals
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } catch (error) {
          await storage.updateWithdrawalStatus(withdrawal.id, "failed");
          failed++;
          console.error(`[TONKEEPER] Withdrawal ${withdrawal.id} error:`, error);
        }
      }
      
      console.log(`[TONKEEPER] Batch processing completed: ${successful} successful, ${failed} failed`);
      
      return {
        processed: pendingWithdrawals.length,
        successful,
        failed,
      };
      
    } catch (error) {
      console.error("[TONKEEPER] Error processing pending withdrawals:", error);
      return { processed: 0, successful: 0, failed: 0 };
    }
  }

  // Health check for the service
  async healthCheck(): Promise<{
    healthy: boolean;
    walletReady: boolean;
    balance: string;
    error?: string;
  }> {
    try {
      const walletInfo = await this.getWalletInfo();
      return {
        healthy: walletInfo.isReady,
        walletReady: walletInfo.isReady,
        balance: walletInfo.balance,
      };
    } catch (error) {
      return {
        healthy: false,
        walletReady: false,
        balance: "0",
        error: error instanceof Error ? error.message : "Health check failed",
      };
    }
  }
}

export const tonKeeperService = new TonKeeperService();