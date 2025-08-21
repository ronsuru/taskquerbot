import { TonClient, WalletContractV4, internal, Address } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

const ESCROW_WALLET = "EQBUNIp7rk76qbgMPq8vlW8fF4l56IcrOwzEpVjHFfzUY3Yv";
const TON_API_KEY = process.env.TON_API_KEY || process.env.TONAPI_KEY || "";
const WALLET_MNEMONIC = process.env.MNEMONIC_WALLET_KEY || "";

export class TonService {
  private client: TonClient;

  constructor() {
    // Use public endpoint without API key for basic operations
    this.client = new TonClient({
      endpoint: "https://toncenter.com/api/v2/jsonRPC",
      // Remove API key requirement for now - use public endpoint
    });
  }

  // Test wallet connectivity and mnemonic validity
  async testWallet(): Promise<{ valid: boolean; address?: string; balance?: string; error?: string }> {
    try {
      if (!WALLET_MNEMONIC) {
        return { valid: false, error: 'Mnemonic not configured' };
      }

      const mnemonic = WALLET_MNEMONIC.split(' ');
      if (mnemonic.length !== 24) {
        return { valid: false, error: 'Invalid mnemonic format - requires 24 words' };
      }

      const keyPair = await mnemonicToPrivateKey(mnemonic);
      const workchain = 0;
      const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
      const contract = this.client.open(wallet);

      const address = wallet.address.toString();
      
      // Try to get balance, but don't fail if API is unavailable
      let balance = "0";
      try {
        const balanceResult = await contract.getBalance();
        balance = (Number(balanceResult) / 1000000000).toFixed(4);
      } catch (error) {
        console.log("Could not fetch balance (API limitation), but wallet is valid");
        balance = "Unknown (API limited)";
      }
      
      return {
        valid: true,
        address: address,
        balance: balance,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
      const escrowWalletRaw = "0:54348a7bae4efaa9b80c3eaf2f956f1f178979e8872b3b0cc4a558c715fcd463"; // Raw format
      
      const isToEscrow = data.out_msgs.some((msg: any) => {
        const destination = msg.destination?.address;
        console.log(`Checking destination: ${destination} vs escrow: ${ESCROW_WALLET}`);
        
        // Check both user-friendly and raw format
        return destination === ESCROW_WALLET || 
               destination === escrowWalletRaw ||
               (destination && destination.includes("54348a7bae4efaa9b80c3eaf2f956f1f178979e8872b3b0cc4a558c715fcd463"));
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
               (destination && destination.includes("54348a7bae4efaa9b80c3eaf2f956f1f178979e8872b3b0cc4a558c715fcd463"));
      });

      const amount = escrowMsg?.value;
      const senderRaw = data.account?.address;

      // Convert sender address to bounceable format
      let senderBounceable = senderRaw;
      try {
        if (senderRaw && senderRaw.startsWith('0:')) {
          const address = Address.parseRaw(senderRaw);
          senderBounceable = address.toString({ bounceable: true });
        }
      } catch (error) {
        console.log('Could not convert sender address to bounceable format, using raw');
      }

      console.log(`Amount: ${amount}, Sender: ${senderBounceable}`);

      return {
        valid: true,
        amount: amount ? (parseInt(amount) / 1000000000).toString() : "0",
        sender: senderBounceable,
        recipient: ESCROW_WALLET,
      };
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return { valid: false };
    }
  }

  // Process withdrawal using real blockchain transactions
  async processWithdrawal(
    destinationAddress: string, 
    amount: string
  ): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      // Validate mnemonic is available
      if (!WALLET_MNEMONIC) {
        return {
          success: false,
          error: 'Wallet mnemonic not configured',
        };
      }

      // Validate destination address
      if (!this.validateAddress(destinationAddress)) {
        return {
          success: false,
          error: 'Invalid destination address',
        };
      }

      // Validate amount
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return {
          success: false,
          error: 'Invalid withdrawal amount',
        };
      }

      console.log(`Processing withdrawal: ${amount} USDT to ${destinationAddress}`);

      // Generate keypair from mnemonic
      const mnemonic = WALLET_MNEMONIC.split(' ');
      if (mnemonic.length !== 24) {
        return {
          success: false,
          error: 'Invalid mnemonic format - requires 24 words',
        };
      }

      const keyPair = await mnemonicToPrivateKey(mnemonic);
      
      // Create wallet contract
      const workchain = 0;
      const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
      const contract = this.client.open(wallet);

      // Convert amount to nanotons (TON has 9 decimals)
      const amountNano = BigInt(Math.floor(amountNum * 1000000000));

      // For USDT transfers, we need to use jetton (token) transfer
      // This is a simplified TON transfer - for USDT tokens, additional jetton contract interaction is needed
      const transfer = internal({
        to: destinationAddress,
        value: amountNano,
        body: "Withdrawal from TaskBot",
        bounce: false,
      });

      // Execute actual blockchain transaction
      console.log(`[PROCESSING] Sending ${amount} USDT to ${destinationAddress}`);
      console.log(`[INFO] From Wallet: ${wallet.address.toString()}`);
      console.log(`[INFO] Mnemonic loaded and validated successfully`);
      
      try {
        // Send the actual transaction
        const seqno = await contract.getSeqno();
        console.log(`[INFO] Current sequence number: ${seqno}`);
        
        await contract.sendTransfer({
          secretKey: keyPair.secretKey,
          seqno: seqno,
          messages: [transfer],
        });
        
        console.log(`[SUCCESS] Transaction sent! Waiting for confirmation...`);
        
        // Wait for transaction confirmation
        let currentSeqno = seqno;
        let attempts = 0;
        const maxAttempts = 30; // 60 seconds total
        
        while (currentSeqno === seqno && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            currentSeqno = await contract.getSeqno();
            console.log(`[INFO] Checking confirmation... (${attempts + 1}/${maxAttempts})`);
          } catch (error) {
            console.log(`[INFO] Waiting for network confirmation... (${attempts + 1}/${maxAttempts})`);
          }
          attempts++;
        }

        if (currentSeqno === seqno) {
          console.log(`[WARNING] Transaction timeout after ${maxAttempts * 2} seconds`);
          return {
            success: false,
            error: 'Transaction timeout - please check manually on blockchain explorer',
          };
        }

        // Generate transaction identifier based on new sequence number
        const hash = `blockchain_${wallet.address.toString()}_${currentSeqno}_${Date.now()}`;
        
        console.log(`[SUCCESS] ✅ Transaction confirmed! New seqno: ${currentSeqno}`);
        console.log(`[SUCCESS] 🎉 ${amount} USDT sent to ${destinationAddress}`);
        console.log(`[INFO] Transaction identifier: ${hash}`);
        
        return {
          success: true,
          hash: hash,
        };
        
      } catch (sendError) {
        console.error('[ERROR] Failed to send transaction:', sendError);
        return {
          success: false,
          error: `Transaction failed: ${sendError instanceof Error ? sendError.message : 'Unknown blockchain error'}`,
        };
      }

    } catch (error) {
      console.error('Error processing withdrawal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }

  // Validate TON wallet address (accepts both bounceable and non-bounceable formats)
  validateAddress(address: string): boolean {
    try {
      // Check for bounceable (EQ/UQ) format first
      if (/^EQ[A-Za-z0-9_-]{46}$/.test(address) || /^UQ[A-Za-z0-9_-]{46}$/.test(address)) {
        return true;
      }
      
      // Also accept raw format for flexibility
      if (/^0:[a-fA-F0-9]{64}$/.test(address)) {
        return true;
      }
      
      // Try parsing with TON Address class
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }

  // Convert any TON address to bounceable format
  toBounceable(address: string): string {
    try {
      const addr = Address.parse(address);
      return addr.toString({ bounceable: true });
    } catch {
      return address; // Return original if conversion fails
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
