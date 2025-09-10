import { URL } from 'url';

export interface PlatformValidation {
  isValid: boolean;
  error?: string;
  resolvedUrl?: string;
  platform?: string;
}

export class URLValidator {
  private static readonly PLATFORM_DOMAINS = {
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

  private static readonly SUSPICIOUS_DOMAINS = [
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

  private static readonly PHISHING_INDICATORS = [
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

  /**
   * Validates if a URL belongs to the specified platform
   */
  static async validatePlatformUrl(url: string, platform: string): Promise<PlatformValidation> {
    try {
      // Basic URL validation
      if (!this.isValidUrl(url)) {
        return {
          isValid: false,
          error: '❌ Invalid URL format. Please provide a valid URL starting with http:// or https://'
        };
      }

      // Check for suspicious shortened URLs
      if (this.isShortenedUrl(url)) {
        return {
          isValid: false,
          error: '❌ Shortened URLs are not allowed for security reasons. Please provide the full URL.'
        };
      }

      // Check for phishing indicators
      if (this.hasPhishingIndicators(url)) {
        return {
          isValid: false,
          error: '⚠️ This URL appears suspicious and may be a phishing attempt. Please provide a legitimate platform URL.'
        };
      }

      // Resolve the URL to get the final destination
      const resolvedUrl = await this.resolveUrl(url);
      if (!resolvedUrl) {
        return {
          isValid: false,
          error: '❌ Unable to resolve URL. Please check if the URL is accessible.'
        };
      }

      // Validate platform-specific domain
      const platformDomains = this.PLATFORM_DOMAINS[platform.toLowerCase() as keyof typeof this.PLATFORM_DOMAINS];
      if (!platformDomains) {
        return {
          isValid: false,
          error: `❌ Unknown platform: ${platform}`
        };
      }

      const urlObj = new URL(resolvedUrl);
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
        resolvedUrl,
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

  /**
   * Basic URL format validation
   */
  private static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Check if URL is a shortened URL
   */
  private static isShortenedUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      return this.SUSPICIOUS_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }

  /**
   * Check for phishing indicators in URL
   */
  private static hasPhishingIndicators(url: string): boolean {
    const urlLower = url.toLowerCase();
    
    return this.PHISHING_INDICATORS.some(indicator => 
      urlLower.includes(indicator)
    );
  }

  /**
   * Resolve URL to get final destination (handles redirects)
   */
  private static async resolveUrl(url: string): Promise<string | null> {
    try {
      // For now, we'll do a simple validation
      // In production, you might want to use a library like 'follow-redirects'
      // or make an HTTP request to resolve redirects
      return url;
    } catch (error) {
      console.error('Error resolving URL:', error);
      return null;
    }
  }

  /**
   * Get platform-specific URL examples
   */
  static getPlatformExamples(platform: string): string[] {
    const examples: { [key: string]: string[] } = {
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

  /**
   * Get security tips for URL validation
   */
  static getSecurityTips(): string {
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
}

export const urlValidator = new URLValidator();
