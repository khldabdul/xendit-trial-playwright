import { TOTP } from 'totp-generator';

/**
 * TOTP Utility for automating 2FA challenges
 * Uses the totp-generator with the secret key provided in the environment
 */
export class TotpHelper {
  private secret: string;

  constructor(secret?: string) {
    // If no secret provided, attempt to get from process.env
    this.secret = secret || process.env.XENDIT_TOTP_SECRET || '';
  }

  public async generateCode(): Promise<string> {
    if (!this.secret) {
      throw new Error(
        'TOTP secret is not configured. Please set XENDIT_TOTP_SECRET in your .env file.'
      );
    }
    const { otp } = await TOTP.generate(this.secret);
    return otp;
  }
}
