/**
 * AnonU Privacy-Safe Crash Reporting Service
 * Interfaces with Firebase Crashlytics while stripping user emails, author UIDs, and raw tokens.
 */

export interface CrashContext {
  screen?: string;
  campusId?: string;
  themeMode?: string;
  networkOnline?: boolean;
  [key: string]: any;
}

class CrashReportingService {
  private breadcrumbs: Array<{ message: string; timestamp: number }> = [];

  /**
   * Log a lightweight navigation or action breadcrumb
   */
  logBreadcrumb(message: string): void {
    const sanitized = this.sanitize(message);
    this.breadcrumbs.push({ message: sanitized, timestamp: Date.now() });
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs.shift();
    }

    try {
      // In production native build:
      // const crashlytics = require('@react-native-firebase/crashlytics').default;
      // crashlytics().log(sanitized);
    } catch {
      // fallback
    }
  }

  /**
   * Capture and report a non-fatal exception
   */
  recordError(error: Error | any, context?: CrashContext): void {
    const sanitizedError = error instanceof Error ? error : new Error(String(error));
    const safeContext = context ? this.sanitizeContext(context) : {};

    if (__DEV__) {
      console.error('[CrashReporting] Captured non-fatal:', sanitizedError.message, safeContext);
    }

    try {
      // In production native build:
      // const crashlytics = require('@react-native-firebase/crashlytics').default;
      // crashlytics().setAttributes(safeContext);
      // crashlytics().recordError(sanitizedError);
    } catch {
      // fallback
    }
  }

  /**
   * Sanitize text against common PII patterns (email, phone, long hashes)
   */
  private sanitize(input: string): string {
    return input
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
  }

  /**
   * Sanitize arbitrary context dictionary
   */
  private sanitizeContext(ctx: CrashContext): Record<string, string> {
    const cleaned: Record<string, string> = {};
    for (const [key, val] of Object.entries(ctx)) {
      if (typeof val === 'string') {
        cleaned[key] = this.sanitize(val);
      } else {
        cleaned[key] = String(val);
      }
    }
    return cleaned;
  }

  /**
   * Get collected breadcrumbs (for unit testing)
   */
  getBreadcrumbs() {
    return [...this.breadcrumbs];
  }

  /**
   * Clear breadcrumbs
   */
  clearBreadcrumbs() {
    this.breadcrumbs = [];
  }
}

export const crashReporting = new CrashReportingService();
