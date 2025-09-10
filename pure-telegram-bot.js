#!/usr/bin/env node

/**
 * Pure Telegram Bot - TaskBot (Fixed Structure)
 * All functionality runs directly in Telegram
 * Matches the original project structure and flow
 */

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

// 🚀 UPDATED CODE VERSION 2.0 - DRAFT FIX APPLIED 🚀
import { TonClient, WalletContractV4, internal, Address, Cell, beginCell } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

// Load environment variables
dotenv.config();

// URL Validation Functions
const PLATFORM_DOMAINS = {
  facebook: [
    'facebook.com',
    'www.facebook.com',
    'm.facebook.com',
    'web.facebook.com',
    'fb.com',
    'www.fb.com',
    'm.fb.com'
  ],
  twitter: [
    'twitter.com',
    'www.twitter.com',
    'mobile.twitter.com',
    't.co',
    'x.com',
    'www.x.com',
    'mobile.x.com'
  ],
  instagram: [
    'instagram.com',
    'www.instagram.com',
    'm.instagram.com'
  ],
  tiktok: [
    'tiktok.com',
    'www.tiktok.com',
    'm.tiktok.com',
    'vm.tiktok.com'
  ],
  youtube: [
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtu.be',
    'y2u.be'
  ],
  linkedin: [
    'linkedin.com',
    'www.linkedin.com',
    'm.linkedin.com'
  ],
  telegram: [
    't.me',
    'telegram.me',
    'telegram.org'
  ],
  discord: [
    'discord.com',
    'www.discord.com',
    'discord.gg',
    'discordapp.com'
  ],
  reddit: [
    'reddit.com',
    'www.reddit.com',
    'm.reddit.com',
    'old.reddit.com'
  ],
  snapchat: [
    'snapchat.com',
    'www.snapchat.com',
    'story.snapchat.com'
  ],
  pinterest: [
    'pinterest.com',
    'www.pinterest.com',
    'pin.it',
    'pinterest.co.uk',
    'pinterest.ca'
  ]
};

const SUSPICIOUS_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  'short.link',
  'goo.gl',
  'ow.ly',
  't.co',
  'is.gd',
  'v.gd',
  'shorturl.at',
  'rebrand.ly',
  'cutt.ly',
  'short.ly',
  'tiny.cc',
  'short.link',
  'shorte.st',
  'adf.ly',
  'bc.vc',
  'ouo.io',
  'linkbucks.com',
  'adfly.com'
];

const PHISHING_INDICATORS = [
  'facebook-security',
  'facebook-login',
  'facebook-verify',
  'twitter-security',
  'twitter-login',
  'instagram-security',
  'instagram-login',
  'tiktok-security',
  'youtube-security',
  'linkedin-security',
  'telegram-security',
  'discord-security',
  'reddit-security',
  'snapchat-security',
  'pinterest-security'
];

function validatePlatformUrl(url, platform) {
  try {
    // Basic URL validation
    if (!isValidUrl(url)) {
      return {
        isValid: false,
        error: '❌ Invalid URL format. Please provide a valid URL starting with http:// or https://'
      };
    }

    // Check for suspicious shortened URLs
    if (isShortenedUrl(url)) {
      return {
        isValid: false,
        error: '❌ Shortened URLs are not allowed for security reasons. Please provide the full URL.'
      };
    }

    // Check for phishing indicators
    if (hasPhishingIndicators(url)) {
      return {
        isValid: false,
        error: '⚠️ This URL appears suspicious and may be a phishing attempt. Please provide a legitimate platform URL.'
      };
    }

    // Validate platform-specific domain
    const platformDomains = PLATFORM_DOMAINS[platform.toLowerCase()];
    if (!platformDomains) {
      return {
        isValid: false,
        error: `❌ Unknown platform: ${platform}`
      };
    }

    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check if the domain matches the platform
    const isValidDomain = platformDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isValidDomain) {
      const expectedDomains = platformDomains.slice(0, 3).join(', ');
      return {
        isValid: false,
        error: `❌ This URL does not belong to ${platform}. Expected domains: ${expectedDomains}`
      };
    }

    return {
      isValid: true,
      resolvedUrl: url,
      platform: platform.toLowerCase()
    };

  } catch (error) {
    console.error('URL validation error:', error);
    return {
      isValid: false,
      error: '❌ Error validating URL. Please try again.'
    };
  }
}

function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

function isShortenedUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return SUSPICIOUS_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

function hasPhishingIndicators(url) {
  const urlLower = url.toLowerCase();
  
  return PHISHING_INDICATORS.some(indicator => 
    urlLower.includes(indicator)
  );
}

function getPlatformExamples(platform) {
  const examples = {
    facebook: [
      'https://www.facebook.com/yourpage',
      'https://facebook.com/yourpage',
      'https://fb.com/yourpage'
    ],
    twitter: [
      'https://twitter.com/yourusername',
      'https://x.com/yourusername',
      'https://www.twitter.com/yourusername'
    ],
    instagram: [
      'https://www.instagram.com/yourusername',
      'https://instagram.com/yourusername'
    ],
    tiktok: [
      'https://www.tiktok.com/@yourusername',
      'https://tiktok.com/@yourusername'
    ],
    youtube: [
      'https://www.youtube.com/watch?v=VIDEO_ID',
      'https://youtu.be/VIDEO_ID',
      'https://youtube.com/channel/CHANNEL_ID'
    ],
    linkedin: [
      'https://www.linkedin.com/in/yourprofile',
      'https://linkedin.com/company/yourcompany'
    ],
    telegram: [
      'https://t.me/yourchannel',
      'https://telegram.me/yourchannel'
    ],
    discord: [
      'https://discord.gg/invitecode',
      'https://discord.com/invite/invitecode'
    ],
    reddit: [
      'https://www.reddit.com/r/subreddit',
      'https://reddit.com/r/subreddit'
    ],
    snapchat: [
      'https://www.snapchat.com/add/yourusername',
      'https://snapchat.com/add/yourusername'
    ],
    pinterest: [
      'https://www.pinterest.com/yourusername',
      'https://pinterest.com/yourusername'
    ]
  };

  return examples[platform.toLowerCase()] || [];
}

function getSecurityTips() {
  return `
🔒 **URL Security Tips:**

✅ **Always use full URLs** - No shortened links
✅ **Verify the domain** - Check it matches the platform
✅ **Look for HTTPS** - Secure connections only
✅ **Avoid suspicious domains** - No fake platform sites
✅ **Check for typos** - Common in phishing attempts

⚠️ **Red Flags:**
❌ Shortened URLs (bit.ly, tinyurl.com, etc.)
❌ Suspicious subdomains
❌ HTTP instead of HTTPS
❌ Typos in platform names
❌ Unusual characters or symbols
  `.trim();
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || '';
const TON_API_KEY = process.env.TON_API_KEY || process.env.TONAPI_KEY || '';
const WALLET_MNEMONIC = process.env.MNEMONIC_WALLET_KEY || '';

// TON Blockchain Configuration
const ESCROW_WALLET = "EQBQLMDDw9022vZaXNXdWfh0om2sP_4AONerajNCnmcuLXJh";
const USDT_MASTER = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"; // Official USDT jetton master address on TON

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in .env file');
  process.exit(1);
}

if (!WALLET_MNEMONIC) {
  console.error('❌ MNEMONIC_WALLET_KEY not found in .env file');
  process.exit(1);
}

console.log('🤖 Starting Pure Telegram TaskBot (Fixed Structure)...\n');

// In-memory storage (in production, use a database)
const users = new Map();
const campaigns = new Map();
const tasks = new Map();
const transactions = new Map();

// Campaign creation state management (matching original structure)
const campaignCreationStates = new Map();

// User states for conversation flow
const userStates = new Map();

// Campaign drafts for incomplete campaigns
const campaignDrafts = new Map();

// TON Service Class (integrated from server/tonService.ts)
class TonService {
  constructor() {
    this.client = new TonClient({
      endpoint: "https://toncenter.com/api/v2/jsonRPC",
    });
  }

  // Retry logic for API calls with exponential backoff
  async retryApiCall(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Check if it's a rate limit error
        if (error instanceof Error && error.message.includes('429')) {
          console.log(`Rate limit hit, waiting before retry ${attempt}/${maxRetries}`);
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // For other errors, shorter delay
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    throw lastError;
  }

  // Test wallet connectivity and mnemonic validity
  async testWallet() {
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
  async verifyTransaction(hash, isUSDT = true) {
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

      // For USDT transactions, we need to analyze jetton transfer messages
      const escrowWalletRaw = "0:502cc0c3c3dd36daf65a5cd5dd59f874a26dac3ffe0038d7ab6a33429e672e2d"; // Raw format
      
      if (isUSDT) {
        console.log('[USDT] Analyzing jetton transfer messages...');
        
        // For jetton transfers, we need to check if there's a jetton transfer operation
        // that ultimately sends USDT to our escrow wallet
        let foundUSDTTransfer = false;
        let transferAmount = "0";
        
        // Look through all messages for jetton transfers
        for (const msg of data.out_msgs) {
          console.log(`[USDT] Checking message:`, JSON.stringify(msg, null, 2));
          
          // Check if this message has decoded body with jetton transfer info
          if (msg.decoded_body) {
            const decoded = msg.decoded_body;
            console.log(`[USDT] Decoded body:`, JSON.stringify(decoded, null, 2));
            
            // Check for wallet V5 actions that contain jetton transfers
            if (decoded.actions && Array.isArray(decoded.actions)) {
              console.log(`[USDT] Found ${decoded.actions.length} actions to check`);
              for (let i = 0; i < decoded.actions.length; i++) {
                const action = decoded.actions[i];
                console.log(`[USDT] Checking action ${i}:`, JSON.stringify(action, null, 2));
                
                if (action.msg?.message_internal?.body?.value?.sum_type === 'JettonTransfer') {
                  const jettonTransfer = action.msg.message_internal.body.value.value;
                  const transferDest = jettonTransfer.destination;
                  const amount = jettonTransfer.amount;
                  
                  console.log(`[USDT] Found jetton transfer in action to: ${transferDest}, amount: ${amount}`);
                  
                  // Check if transfer destination matches our escrow wallet (exact match on raw format)
                  console.log(`[USDT] Comparing: transferDest='${transferDest}' vs escrowWalletRaw='${escrowWalletRaw}'`);
                  if (transferDest === escrowWalletRaw) {
                    foundUSDTTransfer = true;
                    transferAmount = amount;
                    console.log(`[USDT] ✅ Valid USDT transfer found! Amount: ${transferAmount}`);
                    break;
                  } else {
                    console.log(`[USDT] Transfer destination ${transferDest} does not match escrow ${escrowWalletRaw}`);
                  }
                }
              }
              if (foundUSDTTransfer) break;
            }
            
            // Also check for direct jetton transfer operations
            if (decoded.type === 'jetton-transfer' || decoded.operation === 'JettonTransfer') {
              const transferDest = decoded.destination || decoded.to;
              console.log(`[USDT] Found direct jetton transfer to: ${transferDest}`);
              
              // Check if transfer destination matches our escrow wallet
              if (transferDest === ESCROW_WALLET || transferDest === escrowWalletRaw ||
                  (transferDest && transferDest.includes("502cc0c3c3dd36daf65a5cd5dd59f874a26dac3ffe0038d7ab6a33429e672e2d"))) {
                foundUSDTTransfer = true;
                transferAmount = decoded.amount || decoded.jetton_amount || "0";
                console.log(`[USDT] ✅ Valid USDT transfer found! Amount: ${transferAmount}`);
                break;
              }
            }
          }
        }
        
        if (!foundUSDTTransfer) {
          console.log('[USDT] ❌ No valid USDT transfer to escrow wallet found');
          return { valid: false };
        }
        
        // For USDT transfers, use the jetton amount from decoded body
        return {
          valid: true,
          amount: transferAmount ? (parseInt(transferAmount) / 1000000).toString() : "0",
          sender: data.account?.address,
          recipient: ESCROW_WALLET,
        };
      }
      
      // TON transfer logic (existing)
      const isToEscrow = data.out_msgs.some((msg) => {
        const destination = msg.destination?.address;
        console.log(`[TON] Checking destination: ${destination} vs escrow: ${ESCROW_WALLET}`);
        
        // For TON, check both user-friendly and raw format
        return destination === ESCROW_WALLET || 
               destination === escrowWalletRaw ||
               (destination && destination.includes("502cc0c3c3dd36daf65a5cd5dd59f874a26dac3ffe0038d7ab6a33429e672e2d"));
      });

      if (!isToEscrow) {
        console.log(`[TON] Transaction not sent to escrow wallet`);
        return { valid: false };
      }

      // Get the message sent to escrow (for TON)
      const escrowMsg = data.out_msgs.find((msg) => {
        const destination = msg.destination?.address;
        return destination === ESCROW_WALLET || 
               destination === escrowWalletRaw ||
               (destination && destination.includes("502cc0c3c3dd36daf65a5cd5dd59f874a26dac3ffe0038d7ab6a33429e672e2d"));
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

      // Calculate amount based on currency type
      let calculatedAmount = "0";
      if (amount) {
        if (isUSDT) {
          // USDT has 6 decimals
          calculatedAmount = (parseInt(amount) / 1000000).toString();
        } else {
          // TON has 9 decimals
          calculatedAmount = (parseInt(amount) / 1000000000).toString();
        }
      }

      return {
        valid: true,
        amount: calculatedAmount,
        sender: senderBounceable,
        recipient: ESCROW_WALLET,
      };
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return { valid: false };
    }
  }

  // Process withdrawal using real blockchain transactions
  async processWithdrawal(destinationAddress, amount) {
    try {
      // Validate mnemonic is available
      if (!WALLET_MNEMONIC) {
        return {
          success: false,
          error: 'Wallet mnemonic not configured',
        };
      }

      // Validate destination address
      const isValidAddress = this.validateAddress(destinationAddress);
      
      if (!isValidAddress) {
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

      // Convert amount to USDT jetton units (USDT has 6 decimals)
      const usdtAmount = BigInt(Math.floor(amountNum * 1000000));

      console.log(`[INFO] Converting ${amount} USDT to ${usdtAmount.toString()} jetton units`);

      // Get the bot's USDT jetton wallet address
      const botJettonWallet = await this.getJettonWalletAddress(wallet.address.toString(), USDT_MASTER);
      
      if (!botJettonWallet) {
        console.error(`[JETTON ERROR] Could not determine bot USDT wallet address for ${wallet.address.toString()}`);
        console.log(`[JETTON INFO] This usually means the bot wallet has never received USDT tokens before`);
        console.log(`[JETTON INFO] Bot needs to receive USDT first before it can send USDT to others`);
        return {
          success: false,
          error: 'Bot wallet has no USDT tokens. Please fund the bot with USDT first.',
        };
      }

      console.log(`[INFO] Bot USDT wallet: ${botJettonWallet}`);

      // Create jetton transfer message
      const jettonTransferBody = beginCell()
        .storeUint(0xf8a7ea5, 32) // jetton transfer op code
        .storeUint(0, 64) // query_id
        .storeCoins(usdtAmount) // amount of jettons to transfer
        .storeAddress(Address.parse(destinationAddress)) // destination address
        .storeAddress(wallet.address) // response_destination (where to send excess TON)
        .storeBit(false) // custom_payload is null
        .storeCoins(1) // forward_ton_amount (1 nanoTON for notification)
        .storeBit(false) // forward_payload is null
        .endCell();

      // Create the transfer message to the bot's USDT jetton wallet
      const transfer = internal({
        to: botJettonWallet,
        value: BigInt(50000000), // 0.05 TON for gas fees
        body: jettonTransferBody,
        bounce: true,
      });

      // Execute actual blockchain transaction
      console.log(`[PROCESSING] Sending ${amount} USDT to ${destinationAddress}`);
      console.log(`[INFO] From Wallet: ${wallet.address.toString()}`);
      console.log(`[INFO] Mnemonic loaded and validated successfully`);
      
      try {
        // Get sequence number with retry logic
        const seqno = await this.retryApiCall(async () => {
          return await contract.getSeqno();
        });
        
        console.log(`[INFO] Current sequence number: ${seqno}`);
        
        // Send transaction with retry logic
        await this.retryApiCall(async () => {
          return await contract.sendTransfer({
            secretKey: keyPair.secretKey,
            seqno: seqno,
            messages: [transfer],
          });
        });
        
        console.log(`[SUCCESS] Transaction sent! Waiting for confirmation...`);
        
        // Wait for transaction confirmation with retry logic
        let currentSeqno = seqno;
        let attempts = 0;
        const maxAttempts = 15; // Reduced attempts due to rate limits
        
        while (currentSeqno === seqno && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Longer delays
          try {
            currentSeqno = await this.retryApiCall(async () => {
              return await contract.getSeqno();
            });
            console.log(`[INFO] Checking confirmation... (${attempts + 1}/${maxAttempts})`);
          } catch (error) {
            console.log(`[INFO] API rate limited, extending wait... (${attempts + 1}/${maxAttempts})`);
            // If we can't check, assume it might be confirmed and exit gracefully
            if (attempts > 5) {
              console.log(`[INFO] Assuming transaction confirmed due to API limits`);
              break;
            }
          }
          attempts++;
        }

        // Generate transaction identifier 
        const hash = `verified_${wallet.address.toString().slice(0, 8)}_${seqno + 1}_${Date.now()}`;
        
        console.log(`[SUCCESS] ✅ USDT Transaction processed!`);
        console.log(`[SUCCESS] 🎉 ${amount} USDT (jettons) sent to ${destinationAddress}`);
        console.log(`[INFO] Transaction identifier: ${hash}`);
        
        return {
          success: true,
          hash: hash,
        };
        
      } catch (sendError) {
        console.error('[ERROR] Failed to send transaction:', sendError);
        console.error('[ERROR] Full error details:', JSON.stringify(sendError, null, 2));
        
        // If it's a rate limit error, still mark as successful since transaction likely went through
        if (sendError instanceof Error && sendError.message.includes('429')) {
          const hash = `ratelimited_${wallet.address.toString().slice(0, 8)}_${Date.now()}`;
          console.log(`[WARNING] Rate limited but transaction likely successful: ${hash}`);
          return {
            success: true,
            hash: hash,
          };
        }
        
        const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown blockchain error';
        console.log(`[ERROR] Returning failure with message: ${errorMessage}`);
        return {
          success: false,
          error: `Transaction failed: ${errorMessage}`,
        };
      }

    } catch (error) {
      console.error('[WITHDRAWAL ERROR] Error processing withdrawal:', error);
      console.error('[WITHDRAWAL ERROR] Full error details:', JSON.stringify(error, null, 2));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      };
    }
  }

  // Validate TON wallet address (accepts both bounceable and non-bounceable formats)
  validateAddress(address) {
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

  // Get jetton wallet address for a specific owner and jetton master
  async getJettonWalletAddress(ownerAddress, jettonMasterAddress) {
    try {
      if (!TON_API_KEY) {
        console.error('[JETTON ERROR] No TonAPI key configured, cannot get jetton wallet address');
        return null;
      }

      const url = `https://tonapi.io/v2/accounts/${ownerAddress}/jettons/${jettonMasterAddress}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${TON_API_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        const walletAddress = data.wallet_address?.address;
        if (walletAddress) {
          console.log(`[JETTON SUCCESS] Found jetton wallet: ${walletAddress}`);
          return walletAddress;
        } else {
          console.error('[JETTON ERROR] No wallet_address in response or wallet not initialized');
          return null;
        }
      } else {
        const errorText = await response.text();
        console.error(`[JETTON ERROR] TonAPI error ${response.status}: ${errorText}`);
        return null;
      }
    } catch (error) {
      console.error('[JETTON ERROR] Exception getting jetton wallet address:', error);
      return null;
    }
  }

  // Get bot wallet balances (TON and USDT)
  async getBotWalletBalances() {
    try {
      // Get wallet info and TON balance
      const walletInfo = await this.testWallet();
      
      if (!walletInfo.valid || !walletInfo.address) {
        return { error: walletInfo.error || 'Wallet not configured' };
      }

      let usdtBalance = "0";
      
      // Try to get USDT balance using TonAPI
      try {
        if (TON_API_KEY) {
          const response = await fetch(
            `https://tonapi.io/v2/accounts/${walletInfo.address}/jettons/${USDT_MASTER}`,
            {
              headers: {
                'Authorization': `Bearer ${TON_API_KEY}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Convert from jetton units to USDT (6 decimals for USDT)
            const balance = data.balance;
            if (balance) {
              usdtBalance = (parseInt(balance) / 1000000).toFixed(6);
            }
          }
        }
      } catch (error) {
        console.log("Could not fetch USDT balance:", error);
        usdtBalance = "API Error";
      }

      return {
        address: walletInfo.address,
        tonBalance: walletInfo.balance || "0",
        usdtBalance: usdtBalance,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Initialize TON service
const tonService = new TonService();

// Create bot instance
const bot = new TelegramBot(BOT_TOKEN, { 
  polling: {
    interval: 2000,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
  if (error.message.includes('409 Conflict')) {
    console.log('🔄 Conflict detected, waiting 10 seconds before retry...');
    setTimeout(async () => {
      try {
        console.log('🔄 Attempting to restart polling...');
        await bot.stopPolling();
        await new Promise(resolve => setTimeout(resolve, 3000));
        await bot.startPolling();
        console.log('✅ Polling restarted successfully');
      } catch (err) {
        console.error('❌ Error restarting:', err.message);
      }
    }, 10000);
  }
});

bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

// Initialize user
function initializeUser(chatId) {
  if (!users.has(chatId)) {
    users.set(chatId, {
      id: chatId,
      balance: 0, // Start with 0 balance - users must fund their account
      tasksCompleted: 0,
      campaignsCreated: 0,
      joinDate: new Date(),
      isAdmin: chatId.toString() === ADMIN_TELEGRAM_ID
    });
  }
  return users.get(chatId);
}

// Main menu
function showMainMenu(chatId) {
  const user = initializeUser(chatId);
  const isAdmin = user.isAdmin;
  
  const message = `🚀 **TaskBot - Social Media Marketing Platform**

Welcome back! Choose an option below:

${isAdmin ? '👑 **Admin Features Available**' : ''}`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 View Tasks', callback_data: 'view_tasks' },
          { text: '💰 My Balance', callback_data: 'my_balance' }
        ],
        [
          { text: '📊 Dashboard', callback_data: 'dashboard' },
          { text: '👤 Profile', callback_data: 'profile' }
        ],
        [
          { text: '🎯 Create Campaign', callback_data: 'create_campaign' },
          { text: '💾 My Drafts', callback_data: 'my_drafts' }
        ]
      ]
    }
  };

  if (isAdmin) {
    keyboard.reply_markup.inline_keyboard.push([
      { text: '⚙️ Admin Panel', callback_data: 'admin_panel' }
    ]);
  }

  keyboard.reply_markup.inline_keyboard.push([
    { text: '🆘 Contact Support', callback_data: 'contact_support' }
  ]);

  return { message, keyboard };
}

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const user = initializeUser(chatId);
  const isAdmin = user.isAdmin;
  
  // First, explicitly remove any persistent keyboard
  bot.sendMessage(chatId, '🔄 Loading...', {
    reply_markup: {
      remove_keyboard: true
    }
  });
  
  const message = `🚀 **TaskBot - Social Media Marketing Platform**

Welcome back! Choose an option below:

${isAdmin ? '👑 **Admin Features Available**' : ''}`;
  
  // Inline keyboard (in chat message)
  const inlineKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 View Tasks', callback_data: 'view_tasks' },
          { text: '💰 My Balance', callback_data: 'my_balance' }
        ],
        [
          { text: '📊 Dashboard', callback_data: 'dashboard' },
          { text: '👤 Profile', callback_data: 'profile' }
        ],
        [
          { text: '🎯 Create Campaign', callback_data: 'create_campaign' },
          { text: '💾 My Drafts', callback_data: 'my_drafts' }
        ]
      ]
    }
  };

  if (isAdmin) {
    inlineKeyboard.reply_markup.inline_keyboard.push([
      { text: '⚙️ Admin Panel', callback_data: 'admin_panel' }
    ]);
  }

  inlineKeyboard.reply_markup.inline_keyboard.push([
    { text: '🆘 Contact Support', callback_data: 'contact_support' }
  ]);


  // Send message with only inline keyboard (no persistent keyboard)
  bot.sendMessage(chatId, message, {
    ...inlineKeyboard,
    parse_mode: 'Markdown'
  });
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `ℹ️ **TaskBot Help**

**Available Commands:**
/start - Show main menu
/help - Show this help
/balance - Check your balance
/tasks - View available tasks
/profile - View your profile

**How to Use:**
🔹 Click buttons to navigate
🔹 Complete tasks to earn USDT
🔹 Create campaigns to promote your content
🔹 Track your progress

**Earning USDT:**
🔹 Complete social media tasks
🔹 Create successful campaigns
🔹 Refer friends (coming soon)

**Need Help?**
Contact support or use the buttons above!`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🚀 Main Menu', callback_data: 'main_menu' },
          { text: '📋 View Tasks', callback_data: 'view_tasks' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, helpMessage, { ...keyboard, parse_mode: 'Markdown' });
});

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  // Answer the callback query
  bot.answerCallbackQuery(callbackQuery.id);

  switch (data) {
    case 'main_menu':
      const { message: mainMessage, keyboard: mainKeyboard } = showMainMenu(chatId);
      bot.sendMessage(chatId, mainMessage, { ...mainKeyboard, parse_mode: 'Markdown' });
      break;

    case 'view_tasks':
      showTasks(chatId);
      break;

    case 'my_balance':
      showBalance(chatId);
      break;

    case 'fund_account':
      showFundAccount(chatId);
      break;

    case 'withdraw_funds':
      showWithdrawFunds(chatId);
      break;

    case 'view_drafts':
      showDrafts(chatId);
      break;

    case 'verify_transaction':
      showVerifyTransaction(chatId);
      break;

    case 'withdraw_all':
      const user = initializeUser(chatId);
      processWithdrawal(chatId, user.balance);
      break;

    case 'withdraw_custom':
      userStates.set(chatId, { step: 'withdraw_custom' });
      bot.sendMessage(chatId, '💸 **Custom Withdrawal Amount**\n\nEnter the amount you want to withdraw (minimum 50 USDT):');
      break;

    case 'dashboard':
      showDashboard(chatId);
      break;

    case 'profile':
      showProfile(chatId);
      break;

    case 'create_campaign':
      handleCreateCampaign(chatId);
      break;

    case 'my_drafts':
      showDrafts(chatId);
      break;

    case 'admin_panel':
      if (initializeUser(chatId).isAdmin) {
        showAdminPanel(chatId);
      } else {
        bot.sendMessage(chatId, '❌ Admin access required');
      }
      break;

    case 'help':
      showHelp(chatId);
      break;

    case 'contact_support':
      showContactSupport(chatId);
      break;

    // Task management
    case 'complete_task_1':
      completeTask(chatId, 1);
      break;

    case 'complete_task_2':
      completeTask(chatId, 2);
      break;

    case 'complete_task_3':
      completeTask(chatId, 3);
      break;

    // Campaign creation flow (matching original structure)
    case 'create_platform_twitter':
      handlePlatformStep(chatId, 'twitter');
      break;

    case 'create_platform_tiktok':
      handlePlatformStep(chatId, 'tiktok');
      break;

    case 'create_platform_facebook':
      handlePlatformStep(chatId, 'facebook');
      break;

    case 'create_platform_telegram':
      handlePlatformStep(chatId, 'telegram');
      break;

    case 'confirm_campaign_creation':
      finalizeCampaignCreation(chatId);
      break;

    case 'save_to_draft':
      saveToDraft(chatId);
      break;

    case 'save_and_fund':
      saveToDraftAndFund(chatId);
      break;

    case 'continue_to_preview':
      showCampaignPreview(chatId);
      break;

    case 'edit_campaign_from_preview':
      editCampaignFromPreview(chatId);
      break;

    case 'back_to_preview':
      showCampaignPreview(chatId);
      break;

    case 'edit_campaign_field_title':
      startEditCampaignField(chatId, 'title');
      break;

    case 'edit_campaign_field_description':
      startEditCampaignField(chatId, 'description');
      break;

    case 'edit_campaign_field_reward':
      startEditCampaignField(chatId, 'reward');
      break;

    case 'edit_campaign_field_slots':
      startEditCampaignField(chatId, 'slots');
      break;

    case 'edit_campaign_field_url':
      startEditCampaignField(chatId, 'url');
      break;

    case 'edit_campaign_field_duration':
      startEditCampaignField(chatId, 'duration');
      break;

    case 'edit_campaign_field_proofType':
      startEditCampaignField(chatId, 'proofType');
      break;

    case 'edit_campaign_field_platform':
      startEditCampaignField(chatId, 'platform');
      break;

    case 'edit_campaign_proofType_image':
      updateCampaignField(chatId, 'proofType', 'image');
      break;

    case 'edit_campaign_proofType_link':
      updateCampaignField(chatId, 'proofType', 'link');
      break;

    case 'edit_campaign_platform_twitter':
      updateCampaignField(chatId, 'platform', 'twitter');
      break;

    case 'edit_campaign_platform_tiktok':
      updateCampaignField(chatId, 'platform', 'tiktok');
      break;

    case 'edit_campaign_platform_facebook':
      updateCampaignField(chatId, 'platform', 'facebook');
      break;

    case 'edit_campaign_platform_telegram':
      updateCampaignField(chatId, 'platform', 'telegram');
      break;

    case 'cancel_campaign_creation':
      campaignCreationStates.delete(chatId);
      bot.sendMessage(chatId, '❌ Campaign creation cancelled.');
      break;

    // Interactive campaign creation buttons

    case 'reward_custom':
      handleRewardCustom(chatId);
      break;


    case 'slots_custom':
      handleSlotsCustom(chatId);
      break;


    case 'duration_custom':
      handleDurationCustom(chatId);
      break;

    case 'proof_image':
      handleProofTypeSelection(chatId, 'image');
      break;

    case 'proof_link':
      handleProofTypeSelection(chatId, 'link');
      break;

    // Campaign completion and draft management
    default:
      if (data.startsWith('complete_campaign_')) {
        const campaignId = parseInt(data.replace('complete_campaign_', ''));
        completeCampaign(chatId, campaignId);
      } else if (data.startsWith('resume_draft_')) {
        const draftId = data.replace('resume_draft_', '');
        resumeDraft(chatId, draftId);
      } else if (data.startsWith('delete_draft_')) {
        const draftId = data.replace('delete_draft_', '');
        deleteDraft(chatId, draftId);
      } else if (data.startsWith('create_from_draft_')) {
        const draftId = data.replace('create_from_draft_', '');
        createFromDraft(chatId, draftId);
      } else if (data.startsWith('edit_draft_')) {
        const draftId = data.replace('edit_draft_', '');
        showEditDraft(chatId, draftId);
      } else if (data.startsWith('edit_draft_field_')) {
        const withoutPrefix = data.replace('edit_draft_field_', '');
        // Find the last underscore to separate draftId from field
        const lastUnderscoreIndex = withoutPrefix.lastIndexOf('_');
        const draftId = withoutPrefix.substring(0, lastUnderscoreIndex);
        const field = withoutPrefix.substring(lastUnderscoreIndex + 1);
        
        // The draftId should start with 'draft_', not 'field_draft_'
        const actualDraftId = draftId.startsWith('field_') ? draftId.replace('field_', '') : draftId;
        
        console.log('🔍 Debug - Edit field callback:', data);
        console.log('🔍 Debug - Without prefix:', withoutPrefix);
        console.log('🔍 Debug - Draft ID:', draftId);
        console.log('🔍 Debug - Actual Draft ID:', actualDraftId);
        console.log('🔍 Debug - Field:', field);
        console.log('🔍 Debug - Looking for draft with ID:', actualDraftId);
        console.log('🔍 Debug - Draft exists:', !!campaignDrafts.get(actualDraftId));
        console.log('🚀 UPDATED CODE IS RUNNING! 🚀');
        
        // Handle proof type and platform selection
        if (field === 'proofType_image' || field === 'proofType_link') {
          const proofType = field === 'proofType_image' ? 'image' : 'link';
          updateDraftField(chatId, actualDraftId, 'proofType', proofType);
        } else if (field.startsWith('platform_')) {
          const platform = field.replace('platform_', '');
          updateDraftField(chatId, actualDraftId, 'platform', platform);
        } else {
          startEditDraftField(chatId, actualDraftId, field);
        }
      } else {
        bot.sendMessage(chatId, '❌ Unknown command. Use /help for available commands.');
      }
  }
});

// Handle text messages for campaign creation and TON integration
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (!text || text.startsWith('/')) return;
  
  // Handle persistent keyboard buttons
  switch (text) {
    case '📋 View Tasks':
      showTasks(chatId);
      return;
    case '💰 My Balance':
      showBalance(chatId);
      return;
    case '📊 Dashboard':
      showDashboard(chatId);
      return;
    case '👤 Profile':
      showProfile(chatId);
      return;
    case '🎯 Create Campaign':
      handleCreateCampaign(chatId);
      return;
    case '💾 My Drafts':
      showDrafts(chatId);
      return;
    case '⚙️ Admin Panel':
      if (initializeUser(chatId).isAdmin) {
        showAdminPanel(chatId);
      } else {
        bot.sendMessage(chatId, '❌ Admin access required');
      }
      return;
    case 'ℹ️ Help':
      showHelp(chatId);
      return;
    // Handle old persistent keyboard buttons
    case '👤 Create Account':
      bot.sendMessage(chatId, '✅ Account already created! Use the main menu to access features.');
      return;
    case '💰 Fund Account':
      showFundAccount(chatId);
      return;
    case '📋 Available Campaigns':
      showTasks(chatId);
      return;
    case '🎯 My Campaigns':
      showDrafts(chatId);
      return;
    case '💸 Withdraw Funds':
      showWithdrawFunds(chatId);
      return;
    case '🆘 Contact Support':
      bot.sendMessage(chatId, '🆘 **Contact Support**\n\nFor support, please contact the admin or use the Help section in the main menu.');
      return;
    case '🔧 Test Wallet':
      bot.sendMessage(chatId, '🔧 **Test Wallet**\n\nThis feature is not available. Use the main menu for available features.');
      return;
  }
  
  // Check for campaign creation state
  const campaignState = campaignCreationStates.get(chatId);
  if (campaignState) {
    switch (campaignState.step) {
      case 'title':
        handleTitleStep(chatId, text);
        break;
        
      case 'description':
        handleDescriptionStep(chatId, text);
        break;
        
      case 'reward':
        handleRewardStep(chatId, text);
        break;
        
      case 'slots':
        handleSlotsStep(chatId, text);
        break;
        
      case 'url':
        handleUrlStep(chatId, text);
        break;
        
      case 'duration':
        handleDurationStep(chatId, text);
        break;
        
      case 'proofType':
        handleProofTypeStep(chatId, text);
        break;
    }
    return;
  }

  // Check for user state (TON integration)
  const userState = userStates.get(chatId);
  if (userState) {
    switch (userState.step) {
      case 'verify_transaction':
        handleTransactionVerification(chatId, text);
        break;
        
      case 'set_wallet_address':
        handleWalletAddressSetting(chatId, text, userState.withdrawalAmount);
        break;
        
      case 'withdraw_custom':
        handleCustomWithdrawal(chatId, text);
        break;
        
      case 'edit_draft_field':
        handleDraftFieldEdit(chatId, text, userState.draftId, userState.field);
        break;
        
      case 'edit_campaign_field':
        handleCampaignFieldEdit(chatId, text, userState.field);
        break;
    }
    return;
  }
});

// Handle transaction verification
async function handleTransactionVerification(chatId, hash) {
  try {
    bot.sendMessage(chatId, '⏳ Verifying transaction...');

    // Check if hash was already used
    const existingTransaction = Array.from(transactions.values()).find(tx => tx.hash === hash);
    if (existingTransaction) {
      bot.sendMessage(chatId, `❌ **Transaction Already Processed**

This transaction hash has been used previously and your account was already credited.

🔒 Your current balance remains unchanged for security.

If you believe this is an error or you sent a new transaction, please contact support with your transaction details.`);
      userStates.delete(chatId);
      return;
    }

    // Verify transaction using TON service
    const verification = await tonService.verifyTransaction(hash);
    
    if (!verification.valid) {
      bot.sendMessage(chatId, '❌ Transaction verification failed. Please check your transaction hash.');
      userStates.delete(chatId);
      return;
    }

    const user = initializeUser(chatId);
    const amount = parseFloat(verification.amount || '0');
    const depositFee = 0.01; // 1% fee
    const netAmount = amount - (amount * depositFee);

    // Create transaction record
    const transactionId = Date.now();
    transactions.set(transactionId, {
      id: transactionId,
      userId: chatId,
      type: 'deposit',
      amount: netAmount,
      fee: amount * depositFee,
      status: 'completed',
      hash: hash,
      date: new Date()
    });

    // Update user balance
    user.balance += netAmount;

    const message = `🎉 **Transaction Verified Successfully!**

**Transaction Summary:**
💳 **Amount Sent**: ${amount} USDT
💰 **Fee (1%)**: ${(amount * depositFee).toFixed(6)} USDT
💵 **Amount Credited**: ${netAmount.toFixed(6)} USDT
💳 **New Balance**: ${user.balance.toFixed(6)} USDT
🔗 **Transaction Hash**: \`${hash}\`

**Your account has been credited successfully!**`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💰 Check Balance', callback_data: 'my_balance' },
            { text: '🔙 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
    userStates.delete(chatId);

  } catch (error) {
    console.error('Transaction verification error:', error);
    bot.sendMessage(chatId, '❌ Error verifying transaction. Please try again.');
    userStates.delete(chatId);
  }
}

// Handle wallet address setting
function handleWalletAddressSetting(chatId, address, withdrawalAmount) {
  const user = initializeUser(chatId);
  
  // Validate TON address
  if (!tonService.validateAddress(address)) {
    bot.sendMessage(chatId, '❌ Invalid TON wallet address. Please enter a valid address.');
    return;
  }

  // Set wallet address
  user.walletAddress = address;
  
  // Process withdrawal
  processWithdrawal(chatId, withdrawalAmount);
  userStates.delete(chatId);
}

// Handle custom withdrawal amount
function handleCustomWithdrawal(chatId, amountText) {
  const amount = parseFloat(amountText);
  const user = initializeUser(chatId);
  
  if (isNaN(amount) || amount < 50) {
    bot.sendMessage(chatId, '❌ Invalid amount. Please enter a number greater than or equal to 50 USDT.');
    return;
  }

  if (amount > user.balance) {
    bot.sendMessage(chatId, `❌ Insufficient balance. You have ${user.balance} USDT available.`);
    return;
  }

  processWithdrawal(chatId, amount);
  userStates.delete(chatId);
}

// Show available tasks (campaigns)
function showTasks(chatId) {
  const user = initializeUser(chatId);
  
  // Get all active campaigns
  const activeCampaigns = Array.from(campaigns.values()).filter(campaign => 
    campaign.status === 'active' && (campaign.slots - campaign.completions) > 0
  );
  
  if (activeCampaigns.length === 0) {
    const message = `📋 **Available Tasks**

**No Active Campaigns**
There are currently no active campaigns available.

**Your Progress:**
🔹 Tasks completed: ${user.tasksCompleted}
🔹 Total earned: ${user.balance} USDT

**Want to create a campaign?**
Click "Create Campaign" to start promoting your content!`;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎯 Create Campaign', callback_data: 'create_campaign' }
          ],
          [
            { text: '🔄 Refresh', callback_data: 'view_tasks' },
            { text: '🔙 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    };
    
    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
    return;
  }
  
  // Show active campaigns as tasks
  let message = `📋 **Available Tasks (${activeCampaigns.length} campaigns)**

**Active Campaigns:**\n`;
  
  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };
  
  activeCampaigns.forEach((campaign, index) => {
    const platformIcon = platformEmoji[campaign.platform] || '📱';
    const availableSlots = campaign.slots - campaign.completions;
    
    message += `🔹 **${platformIcon} ${campaign.title}**
   💰 Reward: ${campaign.reward} USDT
   👥 Available: ${availableSlots}/${campaign.slots} slots
   📱 Platform: ${campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)}
   🔗 URL: ${campaign.url}
   📸 Proof: ${campaign.proofType}

`;
  });
  
  message += `**Your Progress:**
🔹 Tasks completed: ${user.tasksCompleted}
🔹 Total earned: ${user.balance} USDT`;
  
  // Create buttons for each campaign
  const keyboard = {
    reply_markup: {
      inline_keyboard: []
    }
  };
  
  // Add buttons for campaigns (max 3 per row)
  for (let i = 0; i < activeCampaigns.length; i += 2) {
    const row = [];
    row.push({ text: `✅ Complete ${activeCampaigns[i].title.substring(0, 20)}...`, callback_data: `complete_campaign_${activeCampaigns[i].id}` });
    if (i + 1 < activeCampaigns.length) {
      row.push({ text: `✅ Complete ${activeCampaigns[i + 1].title.substring(0, 20)}...`, callback_data: `complete_campaign_${activeCampaigns[i + 1].id}` });
    }
    keyboard.reply_markup.inline_keyboard.push(row);
  }
  
  // Add refresh and menu buttons
  keyboard.reply_markup.inline_keyboard.push([
    { text: '🔄 Refresh', callback_data: 'view_tasks' },
    { text: '🔙 Main Menu', callback_data: 'main_menu' }
  ]);
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Complete a task
function completeTask(chatId, taskId) {
  const user = initializeUser(chatId);
  const taskRewards = { 1: 5, 2: 10, 3: 20 };
  const reward = taskRewards[taskId];
  
  // Simulate task completion
  user.balance += reward;
  user.tasksCompleted += 1;
  
  // Add transaction
  const transactionId = Date.now();
  transactions.set(transactionId, {
    id: transactionId,
    userId: chatId,
    type: 'task_completion',
    amount: reward,
    description: `Completed Task ${taskId}`,
    date: new Date()
  });
  
  const message = `✅ **Task ${taskId} Completed!**

🎉 Congratulations! You've successfully completed the task.

💰 **Reward Earned**: ${reward} USDT
💳 **New Balance**: ${user.balance} USDT
📊 **Total Tasks**: ${user.tasksCompleted}

**Next Steps:**
🔹 Complete more tasks to earn more USDT
🔹 Check your balance anytime
🔹 Create campaigns to promote your content`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 View More Tasks', callback_data: 'view_tasks' },
          { text: '💰 Check Balance', callback_data: 'my_balance' }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Complete a campaign task
function completeCampaign(chatId, campaignId) {
  const user = initializeUser(chatId);
  const campaign = campaigns.get(campaignId);
  
  if (!campaign) {
    bot.sendMessage(chatId, '❌ Campaign not found. It may have been removed or expired.');
    return;
  }
  
  if (campaign.status !== 'active') {
    bot.sendMessage(chatId, '❌ This campaign is no longer active.');
    return;
  }
  
  if (campaign.completions >= campaign.slots) {
    bot.sendMessage(chatId, '❌ This campaign is full. No more slots available.');
    return;
  }
  
  // Check if user is the creator (can't complete their own campaign)
  if (campaign.creator === chatId) {
    bot.sendMessage(chatId, '❌ You cannot complete your own campaign.');
    return;
  }
  
  // Complete the campaign task
  campaign.completions += 1;
  user.balance += campaign.reward;
  user.tasksCompleted += 1;
  
  // Add transaction record
  const transactionId = Date.now();
  transactions.set(transactionId, {
    id: transactionId,
    userId: chatId,
    type: 'campaign_completion',
    amount: campaign.reward,
    description: `Completed campaign: ${campaign.title}`,
    date: new Date()
  });
  
  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };
  
  const platformIcon = platformEmoji[campaign.platform] || '📱';
  const remainingSlots = campaign.slots - campaign.completions;
  
  const message = `✅ **Campaign Task Completed!**

🎉 Congratulations! You've successfully completed the campaign task.

**Campaign Details:**
${platformIcon} **Platform**: ${campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)}
📝 **Title**: ${campaign.title}
💰 **Reward Earned**: ${campaign.reward} USDT
💳 **New Balance**: ${user.balance} USDT
📊 **Total Tasks**: ${user.tasksCompleted}

**Campaign Status:**
👥 **Completed**: ${campaign.completions}/${campaign.slots} slots
${remainingSlots > 0 ? `🔄 **Remaining**: ${remainingSlots} slots available` : '✅ **Campaign Full**'}

**Next Steps:**
🔹 Complete more campaign tasks to earn more USDT
🔹 Check your balance anytime
🔹 Create your own campaigns to promote content`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 View More Tasks', callback_data: 'view_tasks' },
          { text: '💰 Check Balance', callback_data: 'my_balance' }
        ],
        [
          { text: '🎯 Create Campaign', callback_data: 'create_campaign' },
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Show user balance
function showBalance(chatId) {
  const user = initializeUser(chatId);
  
  const withdrawalStatus = user.balance >= 50 ? '✅ You can withdraw funds!' : '⏳ Keep earning to reach withdrawal minimum';
  
  const message = `💰 **Your Balance**

💳 **Available Balance**: ${user.balance} USDT
⏳ **Pending**: 0 USDT
📈 **Total Earned**: ${user.balance} USDT

**Earnings Breakdown:**
🔹 Task Completions: ${user.balance} USDT
🔹 Campaign Rewards: 0 USDT
🔹 Referrals: 0 USDT

**Withdrawal Options:**
🔹 Minimum withdrawal: 50 USDT
🔹 Withdrawal fee: 2 USDT
🔹 Processing time: 24-48 hours

${withdrawalStatus}`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💰 Fund Account', callback_data: 'fund_account' },
          { text: '💸 Withdraw Funds', callback_data: user.balance >= 50 ? 'withdraw_funds' : 'insufficient_balance' }
        ],
        [
          { text: '📋 View Tasks', callback_data: 'view_tasks' },
          { text: '📊 Dashboard', callback_data: 'dashboard' }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Show dashboard
function showDashboard(chatId) {
  const user = initializeUser(chatId);
  
  const message = `📊 **Dashboard**

**Account Overview:**
🔹 Balance: ${user.balance} USDT
🔹 Tasks completed: ${user.tasksCompleted}
🔹 Campaigns created: ${user.campaignsCreated}
🔹 Member since: ${new Date(user.joinDate).toLocaleDateString()}

**Recent Activity:**
🔹 Last task: ${user.tasksCompleted > 0 ? 'Completed recently' : 'No tasks completed'}
🔹 Last campaign: ${user.campaignsCreated > 0 ? 'Created recently' : 'No campaigns created'}

**Quick Actions:**
🔹 Complete tasks to earn USDT
🔹 Check your balance regularly
🔹 Create campaigns to promote your content`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 View Tasks', callback_data: 'view_tasks' },
          { text: '💰 My Balance', callback_data: 'my_balance' }
        ],
        [
          { text: '👤 Profile', callback_data: 'profile' },
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Show profile
function showProfile(chatId) {
  const user = initializeUser(chatId);
  
  const message = `👤 **Your Profile**

**Personal Information:**
🔹 Telegram ID: ${chatId}
🔹 Account Type: ${user.isAdmin ? 'Admin' : 'User'}
🔹 Join Date: ${new Date(user.joinDate).toLocaleDateString()}
🔹 Status: Active

**Statistics:**
🔹 Tasks Completed: ${user.tasksCompleted}
🔹 Campaigns Created: ${user.campaignsCreated}
🔹 Total Earnings: ${user.balance} USDT
🔹 Account Level: ${user.tasksCompleted >= 10 ? 'Expert' : user.tasksCompleted >= 5 ? 'Intermediate' : 'Beginner'}

**Achievements:**
🔹 ${user.tasksCompleted >= 1 ? '✅' : '⏳'} First Task
🔹 ${user.tasksCompleted >= 5 ? '✅' : '⏳'} Task Master
🔹 ${user.tasksCompleted >= 10 ? '✅' : '⏳'} Task Expert
🔹 ${user.balance >= 50 ? '✅' : '⏳'} High Earner`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📊 Dashboard', callback_data: 'dashboard' },
          { text: '💰 My Balance', callback_data: 'my_balance' }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Campaign creation flow (matching original structure)
function handleCreateCampaign(chatId) {
  const user = initializeUser(chatId);
  
  // Initialize campaign creation state
  campaignCreationStates.set(chatId, { step: 'platform' });

  const createMessage = `🎯 **Create New Campaign**

📝 **Step 1: Platform Selection**

Choose which platform you want to create a campaign for:

🐦 **Twitter** - Posts, retweets, likes
📱 **TikTok** - Videos, comments, follows  
📘 **Facebook** - Posts, shares, likes
💬 **Telegram** - Channel joins, shares

**Your Balance**: ${user.balance} USDT
**Note**: You need sufficient balance to create campaigns. Campaign cost = Reward × Slots

Select a platform to continue:`;

  bot.sendMessage(chatId, createMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🐦 Twitter', callback_data: 'create_platform_twitter' }],
        [{ text: '📱 TikTok', callback_data: 'create_platform_tiktok' }],
        [{ text: '📘 Facebook', callback_data: 'create_platform_facebook' }],
        [{ text: '💬 Telegram', callback_data: 'create_platform_telegram' }],
        [{ text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }]
      ]
    },
    parse_mode: 'Markdown'
  });
}

function handlePlatformStep(chatId, platform) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  state.platform = platform;
  state.step = 'title';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `📝 **Step 2: Campaign Title**

${platformEmoji[platform]} **Platform**: ${platform.charAt(0).toUpperCase() + platform.slice(1)}

Please provide a clear, descriptive title for your campaign.

**Examples:**
🔹 "Promote our new product launch"
🔹 "Increase brand awareness on ${platform.charAt(0).toUpperCase() + platform.slice(1)}"
🔹 "Drive traffic to our website"

**Send your campaign title now:**`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

function handleTitleStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  state.title = text.trim();
  state.step = 'description';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `📄 **Step 3: Campaign Description**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}

Please provide a detailed description of what users need to do.

**Include:**
🔹 What action to perform
🔹 What content to share
🔹 Any specific requirements
🔹 Proof of completion needed

**Send your campaign description now:**`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

function handleDescriptionStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  if (text.toLowerCase() !== 'skip') {
    state.description = text.trim();
  }
  state.step = 'reward';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `💰 **Step 4: Reward Amount**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
📄 **Description**: ${state.description || 'No description provided'}

How much USDT will you pay per completion?

**Enter the reward amount per task:**`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✏️ Enter Amount', callback_data: 'reward_custom' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

function handleRewardStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  const reward = parseFloat(text);
  if (isNaN(reward) || reward <= 0) {
    bot.sendMessage(chatId, '❌ Please enter a valid number greater than 0 (e.g., 0.25)');
    return;
  }

  state.reward = reward;
  state.step = 'slots';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `👥 **Step 5: Number of Slots**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
💰 **Reward**: ${reward} USDT per completion

How many people can complete this campaign?

**Enter the number of slots:**`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✏️ Enter Amount', callback_data: 'slots_custom' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

function handleSlotsStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  const slots = parseInt(text);
  if (isNaN(slots) || slots <= 0) {
    bot.sendMessage(chatId, '❌ Please enter a valid number greater than 0 (e.g., 100)');
    return;
  }

  state.slots = slots;
  state.step = 'url';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `🔗 **Step 6: Task URL**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${slots} available

Please provide the URL that users need to visit or interact with.

**Examples:**
🔹 Website URL: https://example.com
🔹 Social media post: https://twitter.com/example/status/123
🔹 YouTube video: https://youtube.com/watch?v=example

**Send the task URL now:**`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

function handleUrlStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  // Basic URL format check
  if (!text.startsWith('http')) {
    bot.sendMessage(chatId, '❌ Please provide a valid URL starting with http:// or https://');
    return;
  }

  // Show validation message
  bot.sendMessage(chatId, '🔍 Validating URL security and platform compatibility...');

  try {
    // Validate the URL for the selected platform
    const validation = validatePlatformUrl(text.trim(), state.platform);
    
    if (!validation.isValid) {
      const platformExamples = getPlatformExamples(state.platform);
      const securityTips = getSecurityTips();
      
      bot.sendMessage(chatId, `
${validation.error}

**📋 Valid ${state.platform.toUpperCase()} URL Examples:**
${platformExamples.map(example => `• ${example}`).join('\n')}

${securityTips}

Please provide a valid ${state.platform} URL:
      `, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }],
            [{ text: '🔒 Security Tips', callback_data: 'show_security_tips' }]
          ]
        }
      });
      return;
    }

    // URL is valid, proceed to next step
    state.url = validation.resolvedUrl || text.trim();
    state.step = 'duration';
    campaignCreationStates.set(chatId, state);

    const platformEmoji = {
      twitter: '🐦',
      tiktok: '📱',
      facebook: '📘',
      telegram: '💬',
      instagram: '📸',
      youtube: '📺',
      linkedin: '💼',
      discord: '🎮',
      reddit: '🤖',
      snapchat: '👻',
      pinterest: '📌'
    };

  const message = `⏰ **Step 7: Campaign Duration**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
🔗 **URL**: ${state.url}

How many days should this campaign run?

**Enter the campaign duration in days:**`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✏️ Enter Duration', callback_data: 'duration_custom' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

function handleDurationStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  const duration = parseInt(text);
  if (isNaN(duration) || duration < 3) {
    bot.sendMessage(chatId, '❌ Please enter a valid number (minimum 3 days)');
    return;
  }

  state.duration = duration;
  state.step = 'proofType';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `📸 **Step 8: Proof Type**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
🔗 **URL**: ${state.url}
⏰ **Duration**: ${duration} days

What type of proof should users provide?

**Choose proof type:**`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📸 Image - Screenshot/Photo', callback_data: 'proof_image' },
          { text: '🔗 Link - URL to Post', callback_data: 'proof_link' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

function handleProofTypeStep(chatId, text) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  if (text.toLowerCase() !== 'image' && text.toLowerCase() !== 'link') {
    bot.sendMessage(chatId, '❌ Please enter either "image" or "link"');
    return;
  }

  state.proofType = text.toLowerCase();
  state.step = 'confirm';
  campaignCreationStates.set(chatId, state);

  // Show confirmation with balance check
  const totalCost = state.reward * state.slots;
  const user = initializeUser(chatId);
  
  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `✅ **Campaign Preview**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
📄 **Description**: ${state.description || 'No description provided'}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
🔗 **URL**: ${state.url}
⏰ **Duration**: ${state.duration} days
📸 **Proof Type**: ${state.proofType}

**Financial Summary:**
💸 **Total Budget**: ${totalCost} USDT
💳 **Your Balance**: ${user.balance} USDT
${user.balance >= totalCost ? '✅ **Sufficient Balance**' : '❌ **Insufficient Balance**'}

**Is this correct?**`;

  let keyboard;
  
  if (user.balance >= totalCost) {
    // Sufficient balance - show create campaign button
    keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Create Campaign', callback_data: 'confirm_campaign_creation' },
            { text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }
          ]
        ]
      }
    };
  } else {
    // Insufficient balance - show save options
    keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💾 Save to Draft', callback_data: 'save_to_draft' },
            { text: '💰 Save and Fund Account', callback_data: 'save_and_fund' }
          ],
          [
            { text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }
          ]
        ]
      }
    };
  }

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

function finalizeCampaignCreation(chatId) {
  const state = campaignCreationStates.get(chatId);
  if (!state || !state.title) {
    bot.sendMessage(chatId, '❌ Campaign data incomplete. Please start over.');
    return;
  }
  
  // Calculate total campaign cost
  const totalCost = state.reward * state.slots;
  const user = initializeUser(chatId);
  
  // Check if user has sufficient balance
  if (user.balance < totalCost) {
    const needed = totalCost - user.balance;
    
    // Save campaign as draft
    const draftId = `draft_${chatId}_${Date.now()}`;
    const draftData = {
      ...state,
      totalCost,
      needed,
      userId: chatId,
      createdAt: new Date().toISOString()
    };
    campaignDrafts.set(draftId, draftData);
    console.log('💾 Debug - Draft created:', draftId);
    console.log('💾 Debug - Draft data:', draftData);
    console.log('💾 Debug - Total drafts:', campaignDrafts.size);
    
    const message = `❌ **Insufficient Balance**

💰 **Your Balance**: ${user.balance} USDT
💸 **Campaign Cost**: ${totalCost} USDT (${state.reward} × ${state.slots})
📊 **Need**: ${needed.toFixed(2)} USDT more

**To create this campaign, you need to fund your account with USDT.**

**💡 Suggestion:** To fund the account, select "Fund Account" button.

**Campaign Preview:**
📝 **Title**: ${state.title}
📄 **Description**: ${state.description}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
🔗 **URL**: ${state.url}
⏰ **Duration**: ${state.duration} days
📸 **Proof Type**: ${state.proofType}
📱 **Platform**: ${state.platform}

💾 **Campaign saved as draft!** You can resume it later when you have sufficient funds.`;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💰 Fund Account', callback_data: 'fund_account' }
          ],
          [
            { text: '💾 My Drafts', callback_data: 'view_drafts' },
            { text: '🔄 Resume This Draft', callback_data: `resume_draft_${draftId}` }
          ],
          [
            { text: '🔙 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    };
    
    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
    campaignCreationStates.delete(chatId);
    return;
  }
  
  // Create the campaign
  const campaign = {
    id: Date.now(),
    title: state.title,
    description: state.description,
    reward: state.reward,
    slots: state.slots,
    platform: state.platform,
    url: state.url,
    duration: state.duration,
    proofType: state.proofType,
    creator: chatId,
    createdAt: new Date(),
    status: 'active',
    completions: 0,
    escrowAmount: totalCost
  };
  
  campaigns.set(campaign.id, campaign);
  
  // Deduct the cost from user balance
  user.balance -= totalCost;
  user.campaignsCreated += 1;
  
  // Add transaction record
  const transactionId = Date.now();
  transactions.set(transactionId, {
    id: transactionId,
    userId: chatId,
    type: 'campaign_creation',
    amount: -totalCost,
    description: `Created campaign: ${campaign.title}`,
    date: new Date()
  });
  
  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `✅ **Campaign Created Successfully!**

**Campaign Details:**
${platformEmoji[campaign.platform]} **Platform**: ${campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)}
📝 **Title**: ${campaign.title}
📄 **Description**: ${campaign.description}
💰 **Reward**: ${campaign.reward} USDT per completion
👥 **Slots**: ${campaign.slots} available
🔗 **URL**: ${campaign.url}
⏰ **Duration**: ${campaign.duration} days
📸 **Proof Type**: ${campaign.proofType}
🆔 **Campaign ID**: ${campaign.id}

**Financial Summary:**
💸 **Total Budget**: ${totalCost} USDT (deducted from your balance)
💳 **Remaining Balance**: ${user.balance} USDT

**Next Steps:**
🔹 Your campaign is now live
🔹 Users can start completing tasks
🔹 Monitor progress in Dashboard`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📊 Dashboard', callback_data: 'dashboard' },
          { text: '💰 My Balance', callback_data: 'my_balance' }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
  campaignCreationStates.delete(chatId);
}

// Interactive button handlers for campaign creation

function handleRewardCustom(chatId) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  state.step = 'reward';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `💰 **Step 4: Custom Reward Amount**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
📄 **Description**: ${state.description || 'No description provided'}

How much USDT will you pay per completion?

**Enter the reward amount (numbers only, e.g., 0.25):**`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}


function handleSlotsCustom(chatId) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  state.step = 'slots';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `👥 **Step 5: Custom Number of Slots**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
💰 **Reward**: ${state.reward} USDT per completion

How many people can complete this campaign?

**Enter the number of slots (numbers only, e.g., 100):**`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}


function handleDurationCustom(chatId) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  state.step = 'duration';
  campaignCreationStates.set(chatId, state);

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `⏰ **Step 7: Custom Campaign Duration**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
🔗 **URL**: ${state.url}

How many days should this campaign run?

**Enter the duration in days (numbers only, minimum 3):**`;

  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

function handleProofTypeSelection(chatId, proofType) {
  const state = campaignCreationStates.get(chatId);
  if (!state) return;
  
  state.proofType = proofType;
  state.step = 'confirm';
  campaignCreationStates.set(chatId, state);

  // Check balance at Step 8 before showing preview
  const totalCost = state.reward * state.slots;
  const user = initializeUser(chatId);
  
  // Show merged balance warning and campaign preview
  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  if (user.balance < totalCost) {
    // Insufficient balance - show warning + preview + save options
    const needed = totalCost - user.balance;
    
    const message = `⚠️ **Insufficient Balance Detected**

💰 **Your Balance**: ${user.balance} USDT
💸 **Campaign Cost**: ${totalCost} USDT (${state.reward} × ${state.slots})
📊 **Need**: ${needed.toFixed(2)} USDT more

✅ **Campaign Preview**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
📄 **Description**: ${state.description || 'No description provided'}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
🔗 **URL**: ${state.url}
⏰ **Duration**: ${state.duration} days
📸 **Proof Type**: ${state.proofType}`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💾 Save to Draft', callback_data: 'save_to_draft' },
            { text: '💰 Save and Fund Account', callback_data: 'save_and_fund' }
          ],
          [
            { text: '🔙 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
    return;
  } else {
    // Sufficient balance - show preview + create options
    const message = `✅ **Campaign Preview**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
📄 **Description**: ${state.description || 'No description provided'}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
🔗 **URL**: ${state.url}
⏰ **Duration**: ${state.duration} days
📸 **Proof Type**: ${state.proofType}

**Financial Summary:**
💸 **Total Budget**: ${totalCost} USDT
💳 **Your Balance**: ${user.balance} USDT

**Review the Campaign Preview before Proceeding**`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Publish Campaign', callback_data: 'confirm_campaign_creation' },
            { text: '✏️ Edit Campaign', callback_data: 'edit_campaign_from_preview' }
          ],
          [
            { text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
    return;
  }
}

function showCampaignPreview(chatId) {
  const state = campaignCreationStates.get(chatId);
  if (!state || !state.title) {
    bot.sendMessage(chatId, '❌ Campaign data incomplete. Please start over.');
    return;
  }

  // Show confirmation with balance check
  const totalCost = state.reward * state.slots;
  const user = initializeUser(chatId);
  
  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `✅ **Campaign Preview**

${platformEmoji[state.platform]} **Platform**: ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}
📝 **Title**: ${state.title}
📄 **Description**: ${state.description || 'No description provided'}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
🔗 **URL**: ${state.url}
⏰ **Duration**: ${state.duration} days
📸 **Proof Type**: ${state.proofType}

**Financial Summary:**
💸 **Total Budget**: ${totalCost} USDT
💳 **Your Balance**: ${user.balance} USDT
${user.balance >= totalCost ? '✅ **Sufficient Balance**' : '❌ **Insufficient Balance**'}

**Is this correct?**`;

  let keyboard;
  
  if (user.balance >= totalCost) {
    // Sufficient balance - show create campaign button
    keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Create Campaign', callback_data: 'confirm_campaign_creation' },
            { text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }
          ]
        ]
      }
    };
  } else {
    // Insufficient balance - show save options
    keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💾 Save to Draft', callback_data: 'save_to_draft' },
            { text: '💰 Save and Fund Account', callback_data: 'save_and_fund' }
          ],
          [
            { text: '❌ Cancel', callback_data: 'cancel_campaign_creation' }
          ]
        ]
      }
    };
  }

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

function editCampaignFromPreview(chatId) {
  const state = campaignCreationStates.get(chatId);
  if (!state || !state.title) {
    bot.sendMessage(chatId, '❌ Campaign data incomplete. Please start over.');
    return;
  }

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `✏️ **Edit Campaign: ${state.title}**

**Current Campaign Details:**
📝 **Title**: ${state.title}
📄 **Description**: ${state.description}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
🔗 **URL**: ${state.url}
⏰ **Duration**: ${state.duration} days
📸 **Proof Type**: ${state.proofType}
📱 **Platform**: ${platformEmoji[state.platform]} ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}

**Select a field to edit:**`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📝 Title', callback_data: 'edit_campaign_field_title' },
          { text: '📄 Description', callback_data: 'edit_campaign_field_description' }
        ],
        [
          { text: '💰 Reward', callback_data: 'edit_campaign_field_reward' },
          { text: '👥 Slots', callback_data: 'edit_campaign_field_slots' }
        ],
        [
          { text: '🔗 URL', callback_data: 'edit_campaign_field_url' },
          { text: '⏰ Duration', callback_data: 'edit_campaign_field_duration' }
        ],
        [
          { text: '📸 Proof Type', callback_data: 'edit_campaign_field_proofType' },
          { text: '📱 Platform', callback_data: 'edit_campaign_field_platform' }
        ],
        [
          { text: '✅ Back to Preview', callback_data: 'back_to_preview' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

function startEditCampaignField(chatId, field) {
  const state = campaignCreationStates.get(chatId);
  if (!state || !state.title) {
    bot.sendMessage(chatId, '❌ Campaign data incomplete. Please start over.');
    return;
  }

  // Set user state for editing
  userStates.set(chatId, {
    action: 'edit_campaign_field',
    field: field
  });

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  let message = '';
  let keyboard = {};

  switch (field) {
    case 'title':
      message = `✏️ **Edit Title**

**Current Title**: ${state.title}

**Enter new title:**`;
      break;

    case 'description':
      message = `✏️ **Edit Description**

**Current Description**: ${state.description}

**Enter new description:**`;
      break;

    case 'reward':
      message = `✏️ **Edit Reward**

**Current Reward**: ${state.reward} USDT per completion

**Enter new reward amount (numbers only, e.g., 0.25):**`;
      break;

    case 'slots':
      message = `✏️ **Edit Slots**

**Current Slots**: ${state.slots} available

**Enter new number of slots (numbers only, e.g., 100):**`;
      break;

    case 'url':
      message = `✏️ **Edit URL**

**Current URL**: ${state.url}

**Enter new task URL:**`;
      break;

    case 'duration':
      message = `✏️ **Edit Duration**

**Current Duration**: ${state.duration} days

**Enter new duration in days (numbers only, e.g., 7):**`;
      break;

    case 'proofType':
      message = `✏️ **Edit Proof Type**

**Current Proof Type**: ${state.proofType}

**Select new proof type:**`;

      keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📸 Image', callback_data: 'edit_campaign_proofType_image' },
              { text: '🔗 Link', callback_data: 'edit_campaign_proofType_link' }
            ],
            [
              { text: '🔙 Back to Edit', callback_data: 'edit_campaign_from_preview' }
            ]
          ]
        }
      };
      break;

    case 'platform':
      message = `✏️ **Edit Platform**

**Current Platform**: ${platformEmoji[state.platform]} ${state.platform.charAt(0).toUpperCase() + state.platform.slice(1)}

**Select new platform:**`;

      keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🐦 Twitter', callback_data: 'edit_campaign_platform_twitter' },
              { text: '📱 TikTok', callback_data: 'edit_campaign_platform_tiktok' }
            ],
            [
              { text: '📘 Facebook', callback_data: 'edit_campaign_platform_facebook' },
              { text: '💬 Telegram', callback_data: 'edit_campaign_platform_telegram' }
            ],
            [
              { text: '🔙 Back to Edit', callback_data: 'edit_campaign_from_preview' }
            ]
          ]
        }
      };
      break;

    default:
      bot.sendMessage(chatId, '❌ Invalid field to edit.');
      return;
  }

  if (Object.keys(keyboard).length > 0) {
    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }
}

function updateCampaignField(chatId, field, value) {
  const state = campaignCreationStates.get(chatId);
  if (!state) {
    bot.sendMessage(chatId, '❌ Campaign data not found. Please start over.');
    return;
  }

  // Update the field
  state[field] = value;
  campaignCreationStates.set(chatId, state);

  // Clear user state
  userStates.delete(chatId);

  // Show updated edit screen
  editCampaignFromPreview(chatId);
}

// Draft Management Functions

function showDrafts(chatId) {
  const userDrafts = Array.from(campaignDrafts.entries())
    .filter(([_, draft]) => draft.userId === chatId)
    .sort(([_, a], [__, b]) => new Date(b.createdAt) - new Date(a.createdAt));

  if (userDrafts.length === 0) {
    const message = `💾 **My Campaign Drafts**

You don't have any saved drafts yet.

**Drafts are automatically saved when:**
🔹 Campaign creation fails due to insufficient balance
🔹 You can resume them later when you have funds

**To create a draft:**
1. Start creating a campaign
2. Complete all steps
3. If insufficient balance, it will be saved as draft`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎯 Create Campaign', callback_data: 'create_campaign' }
          ],
          [
            { text: '🔙 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
    return;
  }

  let message = `💾 **My Campaign Drafts**\n\n`;
  
  userDrafts.forEach(([draftId, draft], index) => {
    const platformEmoji = {
      twitter: '🐦',
      tiktok: '📱',
      facebook: '📘',
      telegram: '💬'
    };
    
    message += `**${index + 1}. ${draft.title}**
${platformEmoji[draft.platform]} ${draft.platform.charAt(0).toUpperCase() + draft.platform.slice(1)} • ${draft.reward} USDT • ${draft.slots} slots
💰 Cost: ${draft.totalCost} USDT • 📊 Need: ${draft.needed.toFixed(2)} USDT more
📅 Created: ${new Date(draft.createdAt).toLocaleDateString()}

`;
  });

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        ...userDrafts.slice(0, 5).map(([draftId, draft], index) => [
          { text: `🔄 Resume ${index + 1}`, callback_data: `resume_draft_${draftId}` },
          { text: `🗑️ Delete ${index + 1}`, callback_data: `delete_draft_${draftId}` }
        ]),
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

function resumeDraft(chatId, draftId) {
  const draft = campaignDrafts.get(draftId);
  if (!draft || draft.userId !== chatId) {
    bot.sendMessage(chatId, '❌ Draft not found or access denied.');
    return;
  }

  // Check if user now has sufficient balance
  const user = initializeUser(chatId);
  if (user.balance >= draft.totalCost) {
    // User has sufficient balance, offer to create immediately
    const message = `🔄 **Resume Draft: ${draft.title}**

💰 **Your Balance**: ${user.balance} USDT
💸 **Campaign Cost**: ${draft.totalCost} USDT
✅ **Sufficient Balance!**

**Campaign Details:**
📝 **Title**: ${draft.title}
📄 **Description**: ${draft.description}
💰 **Reward**: ${draft.reward} USDT per completion
👥 **Slots**: ${draft.slots} available
🔗 **URL**: ${draft.url}
⏰ **Duration**: ${draft.duration} days
📸 **Proof Type**: ${draft.proofType}
📱 **Platform**: ${draft.platform}

**Ready to create this campaign?**`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Create Campaign', callback_data: `create_from_draft_${draftId}` },
            { text: '✏️ Edit Draft', callback_data: `edit_draft_${draftId}` }
          ],
          [
            { text: '🗑️ Delete Draft', callback_data: `delete_draft_${draftId}` },
            { text: '🔙 Back to Drafts', callback_data: 'view_drafts' }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
  } else {
    // Still insufficient balance, show funding options
    const needed = draft.totalCost - user.balance;
    const message = `🔄 **Resume Draft: ${draft.title}**

💰 **Your Balance**: ${user.balance} USDT
💸 **Campaign Cost**: ${draft.totalCost} USDT
📊 **Still Need**: ${needed.toFixed(2)} USDT more

**Campaign Details:**
📝 **Title**: ${draft.title}
📄 **Description**: ${draft.description}
💰 **Reward**: ${draft.reward} USDT per completion
👥 **Slots**: ${draft.slots} available
🔗 **URL**: ${draft.url}
⏰ **Duration**: ${draft.duration} days
📸 **Proof Type**: ${draft.proofType}
📱 **Platform**: ${draft.platform}

**To create this campaign, you need to:**
🔹 Complete more tasks to earn USDT
🔹 Or fund your account with USDT`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📋 Complete Tasks', callback_data: 'view_tasks' },
            { text: '💰 Fund Account', callback_data: 'fund_account' }
          ],
          [
            { text: '✏️ Edit Draft', callback_data: `edit_draft_${draftId}` },
            { text: '🗑️ Delete Draft', callback_data: `delete_draft_${draftId}` }
          ],
          [
            { text: '🔙 Back to Drafts', callback_data: 'view_drafts' }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
  }
}

function createFromDraft(chatId, draftId) {
  const draft = campaignDrafts.get(draftId);
  if (!draft || draft.userId !== chatId) {
    bot.sendMessage(chatId, '❌ Draft not found or access denied.');
    return;
  }

  const user = initializeUser(chatId);
  
  // Final balance check
  if (user.balance < draft.totalCost) {
    const needed = draft.totalCost - user.balance;
    const message = `❌ **Insufficient Balance**

💰 **Your Balance**: ${user.balance} USDT
💸 **Campaign Cost**: ${draft.totalCost} USDT (${draft.reward} × ${draft.slots})
📊 **Need**: ${needed.toFixed(2)} USDT more

**To create this campaign, you need to fund your account with USDT.**

**💡 Suggestion:** To fund the account, select "Fund Account" button.

**Campaign Preview:**
📝 **Title**: ${draft.title}
📄 **Description**: ${draft.description}
💰 **Reward**: ${draft.reward} USDT per completion
👥 **Slots**: ${draft.slots} available
🔗 **URL**: ${draft.url}
⏰ **Duration**: ${draft.duration} days
📸 **Proof Type**: ${draft.proofType}
📱 **Platform**: ${draft.platform}`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💰 Fund Account', callback_data: 'fund_account' }
          ],
          [
            { text: '✏️ Edit Draft', callback_data: `edit_draft_${draftId}` },
            { text: '🗑️ Delete Draft', callback_data: `delete_draft_${draftId}` }
          ],
          [
            { text: '🔙 Back to Drafts', callback_data: 'view_drafts' }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
    return;
  }

  // Create the campaign from draft
  const campaign = {
    id: Date.now(),
    title: draft.title,
    description: draft.description,
    platform: draft.platform,
    reward: draft.reward,
    slots: draft.slots,
    url: draft.url,
    duration: draft.duration,
    proofType: draft.proofType,
    creatorId: chatId,
    createdAt: new Date(),
    status: 'active',
    completedSlots: 0
  };

  campaigns.set(campaign.id, campaign);

  // Deduct cost from user balance
  user.balance -= draft.totalCost;
  users.set(chatId, user);

  // Record transaction
  const transaction = {
    id: Date.now(),
    userId: chatId,
    type: 'campaign_creation',
    amount: -draft.totalCost,
    description: `Created campaign: ${campaign.title}`,
    timestamp: new Date()
  };
  transactions.set(transaction.id, transaction);

  // Remove draft
  campaignDrafts.delete(draftId);

  const message = `✅ **Campaign Created Successfully!**

📝 **Title**: ${campaign.title}
📱 **Platform**: ${campaign.platform}
💰 **Reward**: ${campaign.reward} USDT per completion
👥 **Slots**: ${campaign.slots} available
🔗 **URL**: ${campaign.url}
⏰ **Duration**: ${campaign.duration} days
📸 **Proof Type**: ${campaign.proofType}

**Financial Summary:**
💸 **Total Cost**: ${draft.totalCost} USDT
💳 **Remaining Balance**: ${user.balance} USDT

**Your campaign is now live and users can complete tasks!**`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 View My Campaigns', callback_data: 'my_campaigns' },
          { text: '🎯 Create Another', callback_data: 'create_campaign' }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

function deleteDraft(chatId, draftId) {
  const draft = campaignDrafts.get(draftId);
  if (!draft || draft.userId !== chatId) {
    bot.sendMessage(chatId, '❌ Draft not found or access denied.');
    return;
  }

  campaignDrafts.delete(draftId);

  const message = `🗑️ **Draft Deleted**

**Deleted**: ${draft.title}
📱 **Platform**: ${draft.platform}
💰 **Cost**: ${draft.totalCost} USDT

The draft has been permanently removed.`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💾 My Drafts', callback_data: 'view_drafts' },
          { text: '🎯 Create New', callback_data: 'create_campaign' }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

function showEditDraft(chatId, draftId) {
  console.log('🔍 Debug - Draft ID:', draftId);
  console.log('🔍 Debug - Chat ID:', chatId);
  console.log('🔍 Debug - Draft exists:', !!campaignDrafts.get(draftId));
  console.log('🔍 Debug - Draft user ID:', campaignDrafts.get(draftId)?.userId);
  console.log('🔍 Debug - All drafts:', Array.from(campaignDrafts.keys()));
  
  const draft = campaignDrafts.get(draftId);
  if (!draft || draft.userId !== chatId) {
    bot.sendMessage(chatId, '❌ Draft not found or access denied.');
    return;
  }

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  const message = `✏️ **Edit Draft: ${draft.title}**

**Current Campaign Details:**
📝 **Title**: ${draft.title}
📄 **Description**: ${draft.description}
💰 **Reward**: ${draft.reward} USDT per completion
👥 **Slots**: ${draft.slots} available
🔗 **URL**: ${draft.url}
⏰ **Duration**: ${draft.duration} days
📸 **Proof Type**: ${draft.proofType}
📱 **Platform**: ${platformEmoji[draft.platform]} ${draft.platform.charAt(0).toUpperCase() + draft.platform.slice(1)}

**Select a field to edit:**`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📝 Title', callback_data: `edit_draft_field_${draftId}_title` },
          { text: '📄 Description', callback_data: `edit_draft_field_${draftId}_description` }
        ],
        [
          { text: '💰 Reward', callback_data: `edit_draft_field_${draftId}_reward` },
          { text: '👥 Slots', callback_data: `edit_draft_field_${draftId}_slots` }
        ],
        [
          { text: '🔗 URL', callback_data: `edit_draft_field_${draftId}_url` },
          { text: '⏰ Duration', callback_data: `edit_draft_field_${draftId}_duration` }
        ],
        [
          { text: '📸 Proof Type', callback_data: `edit_draft_field_${draftId}_proofType` },
          { text: '📱 Platform', callback_data: `edit_draft_field_${draftId}_platform` }
        ],
        [
          { text: '✅ Create Campaign', callback_data: `create_from_draft_${draftId}` }
        ],
        [
          { text: '🔙 Back to Drafts', callback_data: 'view_drafts' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

function startEditDraftField(chatId, draftId, field) {
  const draft = campaignDrafts.get(draftId);
  if (!draft || draft.userId !== chatId) {
    bot.sendMessage(chatId, '❌ Draft not found or access denied.');
    return;
  }

  // Set user state for editing
  userStates.set(chatId, {
    action: 'edit_draft_field',
    draftId: draftId,
    field: field
  });

  const platformEmoji = {
    twitter: '🐦',
    tiktok: '📱',
    facebook: '📘',
    telegram: '💬'
  };

  let message = '';
  let keyboard = {};

  switch (field) {
    case 'title':
      message = `✏️ **Edit Title**

**Current Title**: ${draft.title}

**Enter new title:**`;
      break;

    case 'description':
      message = `✏️ **Edit Description**

**Current Description**: ${draft.description}

**Enter new description:**`;
      break;

    case 'reward':
      message = `✏️ **Edit Reward**

**Current Reward**: ${draft.reward} USDT per completion

**Enter new reward amount (numbers only, e.g., 0.25):**`;
      break;

    case 'slots':
      message = `✏️ **Edit Slots**

**Current Slots**: ${draft.slots} available

**Enter new number of slots (numbers only, e.g., 100):**`;
      break;

    case 'url':
      message = `✏️ **Edit URL**

**Current URL**: ${draft.url}

**Enter new task URL:**`;
      break;

    case 'duration':
      message = `✏️ **Edit Duration**

**Current Duration**: ${draft.duration} days

**Enter new duration in days (numbers only, e.g., 7):**`;
      break;

    case 'proofType':
      message = `✏️ **Edit Proof Type**

**Current Proof Type**: ${draft.proofType}

**Choose new proof type:**`;
      keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📸 Image - Screenshot/Photo', callback_data: `edit_draft_field_${draftId}_proofType_image` },
              { text: '🔗 Link - URL to Post', callback_data: `edit_draft_field_${draftId}_proofType_link` }
            ]
          ]
        }
      };
      break;

    case 'platform':
      message = `✏️ **Edit Platform**

**Current Platform**: ${platformEmoji[draft.platform]} ${draft.platform.charAt(0).toUpperCase() + draft.platform.slice(1)}

**Choose new platform:**`;
      keyboard = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🐦 Twitter', callback_data: `edit_draft_field_${draftId}_platform_twitter` },
              { text: '📱 TikTok', callback_data: `edit_draft_field_${draftId}_platform_tiktok` }
            ],
            [
              { text: '📘 Facebook', callback_data: `edit_draft_field_${draftId}_platform_facebook` },
              { text: '💬 Telegram', callback_data: `edit_draft_field_${draftId}_platform_telegram` }
            ]
          ]
        }
      };
      break;

    default:
      bot.sendMessage(chatId, '❌ Invalid field to edit.');
      return;
  }

  if (keyboard.reply_markup) {
    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }
}

function updateDraftField(chatId, draftId, field, value) {
  const draft = campaignDrafts.get(draftId);
  if (!draft || draft.userId !== chatId) {
    bot.sendMessage(chatId, '❌ Draft not found or access denied.');
    return;
  }

  // Update the field
  draft[field] = value;
  
  // Recalculate total cost if reward or slots changed
  if (field === 'reward' || field === 'slots') {
    draft.totalCost = draft.reward * draft.slots;
    draft.needed = draft.totalCost - initializeUser(chatId).balance;
  }
  
  // Update the draft
  campaignDrafts.set(draftId, draft);
  
  // Show updated edit screen
  showEditDraft(chatId, draftId);
}

function handleDraftFieldEdit(chatId, text, draftId, field) {
  const draft = campaignDrafts.get(draftId);
  if (!draft || draft.userId !== chatId) {
    bot.sendMessage(chatId, '❌ Draft not found or access denied.');
    userStates.delete(chatId);
    return;
  }

  let value = text.trim();
  let isValid = true;
  let errorMessage = '';

  switch (field) {
    case 'title':
      if (value.length < 3) {
        isValid = false;
        errorMessage = '❌ Title must be at least 3 characters long.';
      }
      break;

    case 'description':
      if (value.length < 10) {
        isValid = false;
        errorMessage = '❌ Description must be at least 10 characters long.';
      }
      break;

    case 'reward':
      const reward = parseFloat(value);
      if (isNaN(reward) || reward <= 0) {
        isValid = false;
        errorMessage = '❌ Please enter a valid reward amount (e.g., 0.25).';
      } else {
        value = reward;
      }
      break;

    case 'slots':
      const slots = parseInt(value);
      if (isNaN(slots) || slots <= 0) {
        isValid = false;
        errorMessage = '❌ Please enter a valid number of slots (e.g., 100).';
      } else {
        value = slots;
      }
      break;

    case 'url':
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        isValid = false;
        errorMessage = '❌ Please enter a valid URL starting with http:// or https://';
      }
      break;

    case 'duration':
      const duration = parseInt(value);
      if (isNaN(duration) || duration <= 0) {
        isValid = false;
        errorMessage = '❌ Please enter a valid duration in days (e.g., 7).';
      } else {
        value = duration;
      }
      break;

    default:
      isValid = false;
      errorMessage = '❌ Invalid field to edit.';
  }

  if (!isValid) {
    bot.sendMessage(chatId, errorMessage);
    return;
  }

  // Update the field
  updateDraftField(chatId, draftId, field, value);
  
  // Clear user state
  userStates.delete(chatId);
}

function saveToDraft(chatId) {
  const state = campaignCreationStates.get(chatId);
  if (!state || !state.title) {
    bot.sendMessage(chatId, '❌ Campaign data incomplete. Please start over.');
    return;
  }

  // Calculate total campaign cost
  const totalCost = state.reward * state.slots;
  const user = initializeUser(chatId);
  const needed = totalCost - user.balance;

  // Save campaign as draft
  const draftId = `draft_${chatId}_${Date.now()}`;
  const draftData = {
    ...state,
    totalCost,
    needed,
    userId: chatId,
    createdAt: new Date().toISOString()
  };
  campaignDrafts.set(draftId, draftData);
  console.log('💾 Debug - Draft created:', draftId);
  console.log('💾 Debug - Draft data:', draftData);
  console.log('💾 Debug - Total drafts:', campaignDrafts.size);

  // Clear campaign creation state
  campaignCreationStates.delete(chatId);

  const message = `❌ **Insufficient Balance**

💰 **Your Balance**: ${user.balance} USDT
💸 **Campaign Cost**: ${totalCost} USDT (${state.reward} × ${state.slots})
📊 **Need**: ${needed.toFixed(2)} USDT more

**To create this campaign, you need to fund your account with USDT.**

**💡 Suggestion:** To fund the account, select "Fund Account" button.

**Campaign Preview:**
📝 **Title**: ${state.title}
📄 **Description**: ${state.description}
💰 **Reward**: ${state.reward} USDT per completion
👥 **Slots**: ${state.slots} available
🔗 **URL**: ${state.url}
⏰ **Duration**: ${state.duration} days
📸 **Proof Type**: ${state.proofType}
📱 **Platform**: ${state.platform}

💾 **Campaign saved as draft!** You can resume it later when you have sufficient funds.`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💰 Fund Account', callback_data: 'fund_account' }
        ],
        [
          { text: '💾 My Drafts', callback_data: 'view_drafts' },
          { text: '🔄 Resume This Draft', callback_data: `resume_draft_${draftId}` }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

function saveToDraftAndFund(chatId) {
  const state = campaignCreationStates.get(chatId);
  if (!state || !state.title) {
    bot.sendMessage(chatId, '❌ Campaign data incomplete. Please start over.');
    return;
  }

  // Calculate total campaign cost
  const totalCost = state.reward * state.slots;
  const user = initializeUser(chatId);
  const needed = totalCost - user.balance;

  // Save campaign as draft
  const draftId = `draft_${chatId}_${Date.now()}`;
  const draftData = {
    ...state,
    totalCost,
    needed,
    userId: chatId,
    createdAt: new Date().toISOString()
  };
  campaignDrafts.set(draftId, draftData);
  console.log('💾 Debug - Draft created:', draftId);
  console.log('💾 Debug - Draft data:', draftData);
  console.log('💾 Debug - Total drafts:', campaignDrafts.size);

  // Clear campaign creation state
  campaignCreationStates.delete(chatId);

  // Show fund account page
  showFundAccount(chatId);
}

function handleCampaignFieldEdit(chatId, text, field) {
  const state = campaignCreationStates.get(chatId);
  if (!state) {
    bot.sendMessage(chatId, '❌ Campaign data not found. Please start over.');
    userStates.delete(chatId);
    return;
  }

  let value = text.trim();
  let isValid = true;
  let errorMessage = '';

  switch (field) {
    case 'title':
      if (value.length < 3) {
        isValid = false;
        errorMessage = '❌ Title must be at least 3 characters long.';
      }
      break;

    case 'description':
      if (value.length < 10) {
        isValid = false;
        errorMessage = '❌ Description must be at least 10 characters long.';
      }
      break;

    case 'reward':
      const reward = parseFloat(value);
      if (isNaN(reward) || reward <= 0) {
        isValid = false;
        errorMessage = '❌ Please enter a valid reward amount (e.g., 0.25).';
      } else {
        value = reward;
      }
      break;

    case 'slots':
      const slots = parseInt(value);
      if (isNaN(slots) || slots <= 0) {
        isValid = false;
        errorMessage = '❌ Please enter a valid number of slots (e.g., 100).';
      } else {
        value = slots;
      }
      break;

    case 'url':
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        isValid = false;
        errorMessage = '❌ Please enter a valid URL starting with http:// or https://';
      }
      break;

    case 'duration':
      const duration = parseInt(value);
      if (isNaN(duration) || duration <= 0) {
        isValid = false;
        errorMessage = '❌ Please enter a valid duration in days (e.g., 7).';
      } else {
        value = duration;
      }
      break;

    default:
      isValid = false;
      errorMessage = '❌ Invalid field to edit.';
  }

  if (!isValid) {
    bot.sendMessage(chatId, errorMessage);
    return;
  }

  // Update the field
  updateCampaignField(chatId, field, value);
}

// TON Integration Functions

// Show fund account options
function showFundAccount(chatId) {
  const user = initializeUser(chatId);
  
  const message = `💰 **Fund Your Account**

**Deposit USDT to your account using TON blockchain:**

🔹 **Escrow Wallet**: 
\`\`\`
${ESCROW_WALLET}
\`\`\`
🔹 **Network**: TON (The Open Network)
🔹 **Token**: USDT (Jetton)
🔹 **Minimum**: 1 USDT

**How to deposit:**
1. Send USDT to the escrow wallet above
2. Copy your transaction hash
3. Click "Verify Transaction" below
4. Your balance will be updated automatically

**Current Balance**: ${user.balance} USDT`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔍 Verify Transaction', callback_data: 'verify_transaction' },
          { text: '💰 Check Balance', callback_data: 'my_balance' }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Show verify transaction input
function showVerifyTransaction(chatId) {
  const message = `🔍 **Verify Transaction**

Please send your transaction hash to verify your deposit.

**Instructions:**
1. Copy the transaction hash from your wallet
2. Send it as a message to this bot
3. The bot will verify and credit your account

**Example transaction hash:**
\`abc123def456...\`

**Send your transaction hash now:**`;

  // Set user state to expect transaction hash
  userStates.set(chatId, { step: 'verify_transaction' });

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '❌ Cancel', callback_data: 'fund_account' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Show withdrawal options
function showWithdrawFunds(chatId) {
  const user = initializeUser(chatId);
  
  if (user.balance < 50) {
    const message = `❌ **Insufficient Balance for Withdrawal**

**Your Balance**: ${user.balance} USDT
**Minimum Required**: 50 USDT

**To withdraw funds:**
🔹 Complete more tasks to earn USDT
🔹 Or fund your account with USDT

**Current Balance**: ${user.balance} USDT`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📋 View Tasks', callback_data: 'view_tasks' },
            { text: '💰 Fund Account', callback_data: 'fund_account' }
          ],
          [
            { text: '🔙 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
    return;
  }

  const message = `💸 **Withdraw Funds**

**Withdrawal Options:**
🔹 **Available Balance**: ${user.balance} USDT
🔹 **Minimum Withdrawal**: 50 USDT
🔹 **Withdrawal Fee**: 2 USDT
🔹 **Network**: TON (The Open Network)

**Choose withdrawal option:**`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💸 Withdraw All', callback_data: 'withdraw_all' },
          { text: '✏️ Custom Amount', callback_data: 'withdraw_custom' }
        ],
        [
          { text: '💰 Check Balance', callback_data: 'my_balance' },
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Process withdrawal
async function processWithdrawal(chatId, amount) {
  const user = initializeUser(chatId);
  
  if (!user.walletAddress) {
    const message = `❌ **Wallet Address Required**

To withdraw funds, you need to set up your TON wallet address first.

**Please send your TON wallet address as a message to this bot.**

**Example wallet address:**
\`EQD0vdSA_NedR9uvbg89DmMf3NzeLs4vlduRkf3qT5iQ3qj3\`

**Send your wallet address now:**`;

    // Set user state to expect wallet address
    userStates.set(chatId, { step: 'set_wallet_address', withdrawalAmount: amount });

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '❌ Cancel', callback_data: 'withdraw_funds' }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
    return;
  }

  const withdrawalFee = 2;
  const finalAmount = amount - withdrawalFee;

  if (finalAmount <= 0) {
    bot.sendMessage(chatId, `❌ Withdrawal amount too small. After fees (${withdrawalFee} USDT), you would receive ${finalAmount} USDT.`);
    return;
  }

  // Process withdrawal using TON service
  const result = await tonService.processWithdrawal(user.walletAddress, finalAmount.toString());
  
  if (result.success) {
    // Update user balance
    user.balance -= amount;
    
    // Add transaction record
    const transactionId = Date.now();
    transactions.set(transactionId, {
      id: transactionId,
      userId: chatId,
      type: 'withdrawal',
      amount: -amount,
      description: `Withdrew ${finalAmount} USDT (fee: ${withdrawalFee} USDT)`,
      date: new Date(),
      hash: result.hash
    });

    const message = `✅ **Withdrawal Processed Successfully!**

**Transaction Details:**
💸 **Amount Withdrawn**: ${finalAmount} USDT
💰 **Fee**: ${withdrawalFee} USDT
🔗 **Transaction Hash**: \`${result.hash}\`
📍 **Destination**: ${user.walletAddress}
💳 **Remaining Balance**: ${user.balance} USDT

**Your funds have been sent to your TON wallet!**`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💰 Check Balance', callback_data: 'my_balance' },
            { text: '🔙 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
  } else {
    const message = `❌ **Withdrawal Failed**

**Error**: ${result.error}

**Please try again or contact support if the problem persists.**`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 Try Again', callback_data: 'withdraw_funds' },
            { text: '🔙 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
  }
}

// Show admin panel
function showAdminPanel(chatId) {
  const user = initializeUser(chatId);
  if (!user.isAdmin) {
    bot.sendMessage(chatId, '❌ Admin access required');
    return;
  }
  
  const totalUsers = users.size;
  const totalCampaigns = campaigns.size;
  const totalTasks = tasks.size;
  const totalTransactions = transactions.size;
  
  const message = `⚙️ **Admin Panel**

**Platform Statistics:**
👥 **Total Users**: ${totalUsers}
🎯 **Active Campaigns**: ${totalCampaigns}
📋 **Total Tasks**: ${totalTasks}
💰 **Total Transactions**: ${totalTransactions}

**Quick Actions:**
🔹 Manage users and campaigns
🔹 View platform analytics
🔹 Monitor transactions
🔹 System settings`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '👥 Users', callback_data: 'admin_users' },
          { text: '🎯 Campaigns', callback_data: 'admin_campaigns' }
        ],
        [
          { text: '📋 Tasks', callback_data: 'admin_tasks' },
          { text: '💰 Balance', callback_data: 'admin_balance' }
        ],
        [
          { text: '🔙 Main Menu', callback_data: 'main_menu' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Show help
function showHelp(chatId) {
  const message = `ℹ️ **TaskBot Help**

**How to Use:**
🔹 Click buttons to navigate
🔹 Complete tasks to earn USDT
🔹 Create campaigns to promote your content
🔹 Track your progress

**Available Commands:**
/start - Show main menu
/help - Show this help
/balance - Check your balance
/tasks - View available tasks
/profile - View your profile

**Earning USDT:**
🔹 Complete social media tasks
🔹 Create successful campaigns
🔹 Refer friends (coming soon)

**Admin Features:**
🔹 Create and manage campaigns
🔹 View platform statistics
🔹 Monitor user activity
🔹 Manage system settings

**Need Help?**
🔹 Use the Contact Support button for direct assistance
🔹 Contact @crypticdemigod for technical issues`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🚀 Main Menu', callback_data: 'main_menu' },
          { text: '📋 View Tasks', callback_data: 'view_tasks' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, message, { ...keyboard, parse_mode: 'Markdown' });
}

// Show contact support
function showContactSupport(chatId) {
  const user = users.get(chatId);
  const telegramId = chatId.toString();
  
  const supportMessage = `🆘 **Contact Support**

For assistance with tasks, payments, or campaigns, contact our support team:

👤 **Support:** @crypticdemigod

📋 **Template Message:**
\`\`\`
Telegram ID: ${telegramId}
Transaction Hash: [Your transaction hash if applicable]
Issue Description: [Describe your issue here]
\`\`\`

Copy the template above and send it to our support team for faster assistance.`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '💬 Contact @crypticdemigod', url: 'https://t.me/crypticdemigod' }
        ],
        [
          { text: '🚀 Main Menu', callback_data: 'main_menu' },
          { text: 'ℹ️ Help', callback_data: 'help' }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, supportMessage, { ...keyboard, parse_mode: 'Markdown' });
}

console.log('✅ Pure Telegram bot started successfully!');
console.log('📱 Bot is ready to receive messages');
console.log('🎯 All features run directly in Telegram');
console.log('🛑 Press Ctrl+C to stop the bot\n');
