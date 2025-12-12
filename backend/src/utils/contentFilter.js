import logger from './logger.js';

class ContentFilter {
  constructor() {
    // Comprehensive list of inappropriate terms and variations
    this.inappropriateTerms = [
      // Explicit terms
      'nude', 'naked', 'topless', 'bottomless', 'undressed', 'unclothed',
      'bare', 'exposed', 'revealing', 'provocative', 'seductive', 'sensual',
      'erotic', 'sexual', 'intimate', 'adult', 'mature', 'explicit',
      'nsfw', 'xxx', 'porn', 'pornographic', 'lewd', 'vulgar', 'obscene',
      
      // Body parts that could be inappropriate in context
      'breast', 'boob', 'chest', 'nipple', 'genital', 'penis', 'vagina',
      'buttocks', 'butt', 'ass', 'crotch', 'groin', 'thigh', 'cleavage',
      
      // Clothing-related terms that might indicate nudity
      'lingerie', 'underwear', 'bra', 'panties', 'bikini', 'swimsuit',
      'see-through', 'transparent', 'sheer', 'tight', 'skimpy', 'revealing',
      
      // Action terms
      'strip', 'undress', 'remove clothes', 'take off', 'disrobe',
      'seduce', 'tempt', 'allure', 'entice', 'arouse',
      
      // Suggestive terms
      'hot', 'sexy', 'attractive', 'gorgeous', 'beautiful woman', 'handsome man',
      'model pose', 'fashion model', 'glamour', 'pin-up', 'centerfold',
      
      // Common misspellings and variations
      'nud3', 'n4ked', 'b00bs', 'a$$', 'pr0n', 'xxx', '18+', 'adults only',
      
      // Terms in other languages (basic coverage)
      'desnudo', 'nudo', 'nu', 'nackt', 'naakt', 'nagi', 'голый',
      
      // Euphemisms and slang
      'birthday suit', 'in the buff', 'au naturel', 'skin', 'flesh',
      'private parts', 'intimate areas', 'naughty', 'dirty', 'kinky',
      
      // Violence and inappropriate content
      'violence', 'blood', 'gore', 'weapon', 'gun', 'knife', 'death',
      'kill', 'murder', 'torture', 'abuse', 'harm', 'hurt', 'pain',
      
      // Hate speech and discrimination
      'racist', 'nazi', 'hate', 'discrimination', 'offensive', 'slur',
      
      // Drug-related content
      'drug', 'cocaine', 'heroin', 'marijuana', 'weed', 'smoking', 'alcohol',
      
      // Gambling
      'casino', 'gambling', 'poker', 'betting', 'lottery'
    ];

    // Patterns that might indicate inappropriate content
    this.suspiciousPatterns = [
      /\b(no|without|remove|take off)\s+(clothes?|clothing|shirt|pants|dress)\b/i,
      /\b(show|reveal|expose)\s+(body|skin|flesh)\b/i,
      /\b(barely|scantily|minimally)\s+(clothed|dressed|covered)\b/i,
      /\b(tight|form.?fitting|skin.?tight)\s+(clothes?|clothing|outfit)\b/i,
      /\b(bedroom|bathroom|shower|bath)\s+(scene|setting)\b/i,
      /\b(romantic|intimate|private)\s+(moment|scene|setting)\b/i,
      /\b(18\+|adults?\s+only|mature\s+content)\b/i,
      /\b(not\s+safe\s+for\s+work|nsfw)\b/i,
      /\b(xxx|adult\s+content|explicit)\b/i,
      /\b(strip\s+club|night\s+club|red\s+light)\b/i
    ];

    // Safe alternatives to suggest
    this.safeAlternatives = [
      'fully clothed person',
      'professional portrait',
      'casual outfit',
      'business attire',
      'winter clothing',
      'summer outfit',
      'sports uniform',
      'formal wear',
      'artistic portrait',
      'character design'
    ];
  }

  /**
   * Check if text contains inappropriate content
   * @param {string} text - Text to check
   * @returns {Object} - Result with isInappropriate flag and details
   */
  checkContent(text) {
    if (!text || typeof text !== 'string') {
      return { isInappropriate: false, reason: null, suggestions: [] };
    }

    const lowerText = text.toLowerCase();
    const foundTerms = [];
    const foundPatterns = [];

    // Check for inappropriate terms
    for (const term of this.inappropriateTerms) {
      if (lowerText.includes(term.toLowerCase())) {
        foundTerms.push(term);
      }
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(text)) {
        foundPatterns.push(pattern.source);
      }
    }

    const isInappropriate = foundTerms.length > 0 || foundPatterns.length > 0;

    if (isInappropriate) {
      logger.warn('Inappropriate content detected:', {
        text: text.substring(0, 100) + '...',
        foundTerms,
        foundPatterns: foundPatterns.length
      });

      return {
        isInappropriate: true,
        reason: this.generateReason(foundTerms, foundPatterns),
        foundTerms,
        foundPatterns: foundPatterns.length,
        suggestions: this.safeAlternatives.slice(0, 3)
      };
    }

    return { isInappropriate: false, reason: null, suggestions: [] };
  }

  /**
   * Generate a user-friendly reason for content rejection
   * @param {Array} foundTerms - Inappropriate terms found
   * @param {Array} foundPatterns - Suspicious patterns found
   * @returns {string} - User-friendly reason
   */
  generateReason(foundTerms, foundPatterns) {
    if (foundTerms.length > 0) {
      return `Your prompt contains terms that may generate inappropriate content. Please use family-friendly descriptions.`;
    }
    
    if (foundPatterns.length > 0) {
      return `Your prompt appears to request inappropriate content. Please modify your description to be suitable for all audiences.`;
    }

    return 'Content may be inappropriate for our platform guidelines.';
  }

  /**
   * Sanitize text by removing inappropriate terms
   * @param {string} text - Text to sanitize
   * @returns {string} - Sanitized text
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let sanitized = text;

    // Replace inappropriate terms with safe alternatives
    for (const term of this.inappropriateTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      sanitized = sanitized.replace(regex, '[FILTERED]');
    }

    // Clean up multiple spaces and filtered markers
    sanitized = sanitized
      .replace(/\[FILTERED\]\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return sanitized;
  }

  /**
   * Check if user has been flagged for inappropriate content
   * @param {string} userId - User ID to check
   * @param {string} content - Content being checked
   * @returns {Object} - Result with action to take
   */
  async checkUserHistory(userId, content) {
    try {
      // Import ContentViolation model dynamically to avoid circular imports
      const { default: ContentViolation } = await import('../models/ContentViolation.js');
      
      // Check if user should be blocked based on violation history
      const shouldBlock = await ContentViolation.shouldBlockUser(userId);
      const violationCount = await ContentViolation.getUserViolationCount(userId, 24);
      
      logger.info('Content filter check for user:', {
        userId: userId?.substring(0, 10) + '...',
        contentLength: content?.length || 0,
        shouldBlock,
        violationCount,
        timestamp: new Date().toISOString()
      });

      return {
        shouldBlock,
        violationCount,
        action: shouldBlock ? 'block' : 'allow'
      };
    } catch (error) {
      logger.error('Error checking user history:', error);
      // Fail safe - allow if database check fails
      return {
        shouldBlock: false,
        violationCount: 0,
        action: 'allow'
      };
    }
  }

  /**
   * Record a content violation
   * @param {string} userId - User ID
   * @param {string} content - Inappropriate content
   * @param {Array} foundTerms - Terms that triggered the violation
   * @param {string} ipAddress - User's IP address
   * @param {string} userAgent - User's browser info
   * @returns {Object} - Violation record and recommended action
   */
  async recordViolation(userId, content, foundTerms = [], ipAddress = null, userAgent = null) {
    try {
      const { default: ContentViolation } = await import('../models/ContentViolation.js');
      
      // Determine severity based on found terms
      const criticalTerms = ['nude', 'naked', 'porn', 'xxx', 'explicit', 'sexual'];
      const highSeverityTerms = ['breast', 'genital', 'intimate', 'erotic'];
      
      let severity = 'low';
      if (foundTerms.some(term => criticalTerms.includes(term.toLowerCase()))) {
        severity = 'critical';
      } else if (foundTerms.some(term => highSeverityTerms.includes(term.toLowerCase()))) {
        severity = 'high';
      } else if (foundTerms.length > 2) {
        severity = 'medium';
      }

      // Get recommended action
      const action = await ContentViolation.getRecommendedAction(userId, severity);
      
      // Create violation record
      const violation = new ContentViolation({
        userId,
        violationType: 'inappropriate_content',
        content: content.substring(0, 1000), // Truncate for storage
        detectedTerms: foundTerms,
        severity,
        ipAddress,
        userAgent,
        action
      });

      await violation.save();

      logger.warn('Content violation recorded:', {
        userId: userId?.substring(0, 10) + '...',
        severity,
        action,
        termsCount: foundTerms.length,
        violationId: violation._id
      });

      return {
        violation,
        action,
        severity,
        shouldBlock: action === 'account_suspended' || action === 'blocked'
      };
    } catch (error) {
      logger.error('Error recording violation:', error);
      return {
        violation: null,
        action: 'flagged',
        severity: 'medium',
        shouldBlock: false
      };
    }
  }

  /**
   * Enhanced content check with context awareness
   * @param {Object} userSelections - Full user selections object
   * @returns {Object} - Comprehensive check result
   */
  checkFullContent(userSelections) {
    const { text, style, material, production, details = [] } = userSelections;
    
    // Combine all text fields for comprehensive checking
    const allText = [
      text,
      style,
      material,
      production,
      ...details
    ].filter(Boolean).join(' ');

    const result = this.checkContent(allText);

    // Additional context-based checks
    if (!result.isInappropriate) {
      // Check for combinations that might be inappropriate
      const combinations = [
        { terms: ['human', 'person', 'character'], styles: ['realistic', 'photorealistic'] },
        { terms: ['model', 'figure'], materials: ['skin', 'flesh', 'realistic'] }
      ];

      for (const combo of combinations) {
        const hasTerms = combo.terms?.some(term => 
          allText.toLowerCase().includes(term.toLowerCase())
        );
        const hasStyles = combo.styles?.some(style => 
          allText.toLowerCase().includes(style.toLowerCase())
        );
        const hasMaterials = combo.materials?.some(material => 
          allText.toLowerCase().includes(material.toLowerCase())
        );

        if (hasTerms && (hasStyles || hasMaterials)) {
          // Additional scrutiny for human figures
          const humanFigureCheck = this.checkContent(text + ' human figure realistic');
          if (humanFigureCheck.isInappropriate) {
            return humanFigureCheck;
          }
        }
      }
    }

    return result;
  }
}

export default new ContentFilter();