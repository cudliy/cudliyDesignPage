import logger from './logger.js';
import ContentViolation from '../models/ContentViolation.js';

class RequestTracker {
  constructor() {
    // Specific request IDs to block (from reported violations)
    this.blockedRequestIds = [
      'ab6bde80-4439-468a-a41f-1dd212b3169f', // Reported inappropriate content request
    ];

    // Suspicious runner IDs to monitor
    this.suspiciousRunnerIds = [
      '0390daf3-b546-4738-b7e7-f3f4cbfdd919', // Associated with inappropriate content
    ];

    // Blocked endpoints that bypass our content filtering
    this.blockedEndpoints = [
      'fal-ai/flux-2-lora-gallery/hdr-style', // Used for inappropriate content generation
    ];
  }

  /**
   * Check if a request should be blocked based on known violation patterns
   */
  async checkRequest(requestData) {
    const { 
      requestId, 
      runnerId, 
      endpoint, 
      userId, 
      ipAddress, 
      userAgent,
      prompt 
    } = requestData;

    // Check for blocked request IDs
    if (requestId && this.blockedRequestIds.includes(requestId)) {
      await this.recordViolation(userId, 'blocked_request_id', {
        requestId,
        reason: 'Request ID associated with policy violations',
        ipAddress,
        userAgent
      });
      
      return {
        shouldBlock: true,
        reason: 'Request blocked due to previous policy violations',
        violationType: 'blocked_request_id'
      };
    }

    // Check for suspicious runner IDs
    if (runnerId && this.suspiciousRunnerIds.includes(runnerId)) {
      await this.recordViolation(userId, 'suspicious_runner', {
        runnerId,
        reason: 'Runner ID associated with policy violations',
        ipAddress,
        userAgent
      });
      
      return {
        shouldBlock: true,
        reason: 'Request blocked due to suspicious activity patterns',
        violationType: 'suspicious_runner'
      };
    }

    // Check for blocked endpoints
    if (endpoint && this.blockedEndpoints.some(blocked => endpoint.includes(blocked))) {
      await this.recordViolation(userId, 'blocked_endpoint', {
        endpoint,
        reason: 'Endpoint used for policy violations',
        ipAddress,
        userAgent
      });
      
      return {
        shouldBlock: true,
        reason: 'This service endpoint has been disabled due to policy violations',
        violationType: 'blocked_endpoint'
      };
    }

    // Check for patterns that match the reported violation
    if (this.matchesViolationPattern(requestData)) {
      await this.recordViolation(userId, 'pattern_match', {
        pattern: 'matches_reported_violation',
        reason: 'Request matches known violation patterns',
        ipAddress,
        userAgent
      });
      
      return {
        shouldBlock: true,
        reason: 'Request blocked due to matching violation patterns',
        violationType: 'pattern_match'
      };
    }

    return {
      shouldBlock: false,
      reason: null,
      violationType: null
    };
  }

  /**
   * Check if request matches patterns from the reported violation
   */
  matchesViolationPattern(requestData) {
    const { endpoint, duration, timestamp } = requestData;

    // Pattern matching based on the reported violation
    const violationPatterns = [
      // Specific endpoint + duration pattern
      {
        endpoint: 'fal-ai/flux-2-lora-gallery',
        durationRange: [25, 35], // 29 seconds ± 6 seconds
        timePattern: /05:5[0-9]:[0-9]{2}/ // Around 5:53 AM pattern
      },
      // HDR style endpoint (often used for inappropriate content)
      {
        endpoint: 'hdr-style',
        anyDuration: true
      }
    ];

    return violationPatterns.some(pattern => {
      if (pattern.endpoint && !endpoint?.includes(pattern.endpoint)) {
        return false;
      }

      if (pattern.durationRange && duration) {
        const [min, max] = pattern.durationRange;
        if (duration < min || duration > max) {
          return false;
        }
      }

      if (pattern.timePattern && timestamp) {
        const timeStr = new Date(timestamp).toTimeString();
        if (!pattern.timePattern.test(timeStr)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Record a violation based on request tracking
   */
  async recordViolation(userId, violationType, details) {
    try {
      const violation = new ContentViolation({
        userId: userId || 'unknown',
        violationType,
        content: `Request tracking violation: ${JSON.stringify(details)}`,
        detectedTerms: [violationType],
        severity: 'high', // Request-based violations are serious
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        action: 'blocked',
        notes: details.reason
      });

      await violation.save();

      logger.warn('Request tracking violation recorded:', {
        userId: userId?.substring(0, 10) + '...',
        violationType,
        details: details.reason,
        violationId: violation._id
      });

      return violation;
    } catch (error) {
      logger.error('Error recording request tracking violation:', error);
      return null;
    }
  }

  /**
   * Add a new request ID to the blocked list
   */
  async blockRequestId(requestId, reason, reportedBy) {
    if (!this.blockedRequestIds.includes(requestId)) {
      this.blockedRequestIds.push(requestId);
      
      logger.warn('Request ID added to block list:', {
        requestId,
        reason,
        reportedBy,
        totalBlocked: this.blockedRequestIds.length
      });

      // Optionally persist to database for permanent storage
      await this.persistBlockedRequest(requestId, reason, reportedBy);
    }
  }

  /**
   * Add a new runner ID to the suspicious list
   */
  async flagRunnerId(runnerId, reason, reportedBy) {
    if (!this.suspiciousRunnerIds.includes(runnerId)) {
      this.suspiciousRunnerIds.push(runnerId);
      
      logger.warn('Runner ID added to suspicious list:', {
        runnerId,
        reason,
        reportedBy,
        totalSuspicious: this.suspiciousRunnerIds.length
      });
    }
  }

  /**
   * Block an entire endpoint
   */
  async blockEndpoint(endpoint, reason, reportedBy) {
    if (!this.blockedEndpoints.includes(endpoint)) {
      this.blockedEndpoints.push(endpoint);
      
      logger.warn('Endpoint added to block list:', {
        endpoint,
        reason,
        reportedBy,
        totalBlocked: this.blockedEndpoints.length
      });
    }
  }

  /**
   * Persist blocked request to database for permanent storage
   */
  async persistBlockedRequest(requestId, reason, reportedBy) {
    try {
      const violation = new ContentViolation({
        userId: 'system',
        violationType: 'blocked_request_permanent',
        content: `Permanently blocked request ID: ${requestId}`,
        detectedTerms: ['blocked_request'],
        severity: 'critical',
        action: 'account_suspended',
        notes: `Blocked by ${reportedBy}: ${reason}`
      });

      await violation.save();
      return violation;
    } catch (error) {
      logger.error('Error persisting blocked request:', error);
      return null;
    }
  }

  /**
   * Get current block lists for admin review
   */
  getBlockLists() {
    return {
      blockedRequestIds: [...this.blockedRequestIds],
      suspiciousRunnerIds: [...this.suspiciousRunnerIds],
      blockedEndpoints: [...this.blockedEndpoints]
    };
  }
}

export default new RequestTracker();