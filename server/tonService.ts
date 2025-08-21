import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

const ESCROW_WALLET = "EQBUNIp7rk76qbgMPq8vlW8fF4l56IcrOwzEpVjHFfzUY3Yv";
const TON_API_KEY = process.env.TON_API_KEY || process.env.TONAPI_KEY || "";

export class TonService {
  private client: TonClient;

  constructor() {
    this.client = new TonClient({
      endpoint: "https://toncenter.com/api/v2/jsonRPC",
      apiKey: TON_API_KEY,
    });
  }

  // Verify transaction hash using TonAPI
  async verifyTransaction(hash: string): Promise<{
    valid: boolean;
    amount?: string;
    sender?: string;
    recipient?: string;
  }> {
    try {
      console.log(`Verifying transaction: ${hash}`);
      console.log(`Using API key: ${TON_API_KEY ? 'Present' : 'Missing'}`);
      
      const response = await fetch(`https://tonapi.io/v2/blockchain/transactions/${hash}`, {
        headers: {
          'Authorization': `Bearer ${TON_API_KEY}`,
        },
      });

      console.log(`TonAPI response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TonAPI error:', errorText);
        return { valid: false };
      }

      const data = await response.json();
      console.log('Transaction data:', JSON.stringify(data, null, 2));
      
      // Check if transaction has out_msgs (outgoing messages)
      if (!data.out_msgs || data.out_msgs.length === 0) {
        console.log('No outgoing messages found');
        return { valid: false };
      }

      // Check if any message goes to escrow wallet
      const escrowWalletRaw = "0:543482bb7e4afaa9b80c3eafb6956f1f178979e8872b3b0cc4a558c715fcd4637"; // Raw format
      
      const isToEscrow = data.out_msgs.some((msg: any) => {
        const destination = msg.destination?.address;
        console.log(`Checking destination: ${destination} vs escrow: ${ESCROW_WALLET}`);
        
        // Check both user-friendly and raw format
        return destination === ESCROW_WALLET || 
               destination === escrowWalletRaw ||
               (destination && destination.includes("543482bb7e4afaa9b80c3eafb6956f1f178979e8872b3b0cc4a558c715fcd4637"));
      });

      if (!isToEscrow) {
        console.log('Transaction not sent to escrow wallet');
        return { valid: false };
      }

      // Get the message sent to escrow
      const escrowMsg = data.out_msgs.find((msg: any) => {
        const destination = msg.destination?.address;
        return destination === ESCROW_WALLET || 
               destination === escrowWalletRaw ||
               (destination && destination.includes("543482bb7e4afaa9b80c3eafb6956f1f178979e8872b3b0cc4a558c715fcd4637"));
      });

      const amount = escrowMsg?.value;
      const sender = data.account?.address;

      console.log(`Amount: ${amount}, Sender: ${sender}`);

      return {
        valid: true,
        amount: amount ? (parseInt(amount) / 1000000000).toString() : "0",
        sender,
        recipient: ESCROW_WALLET,
      };
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return { valid: false };
    }
  }

  // Process withdrawal (this would typically require private key access)
  async processWithdrawal(
    destinationAddress: string, 
    amount: string
  ): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      // In a real implementation, you would:
      // 1. Use the escrow wallet's private key
      // 2. Create and send the transaction
      // 3. Return the transaction hash
      
      // For now, we'll simulate the transaction
      // In production, implement actual TON wallet integration
      
      const mockHash = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        hash: mockHash,
      };
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Validate TON wallet address
  validateAddress(address: string): boolean {
    try {
      // Basic TON address validation
      return /^EQ[A-Za-z0-9_-]{46}$/.test(address) || /^UQ[A-Za-z0-9_-]{46}$/.test(address);
    } catch {
      return false;
    }
  }

  // Calculate fee (1% of amount)
  calculateFee(amount: string): string {
    const amountNum = parseFloat(amount);
    const fee = amountNum * 0.01;
    return fee.toFixed(8);
  }

  // Calculate total cost including fee
  calculateTotalCost(baseAmount: string): { subtotal: string; fee: string; total: string } {
    const subtotal = parseFloat(baseAmount);
    const fee = subtotal * 0.01;
    const total = subtotal + fee;

    return {
      subtotal: subtotal.toFixed(8),
      fee: fee.toFixed(8),
      total: total.toFixed(8),
    };
  }
}

export const tonService = new TonService();
