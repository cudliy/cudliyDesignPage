// Client-side content filtering utility
class ClientContentFilter {
  private inappropriateTerms: string[] = [
    // Basic inappropriate terms (subset of server-side list for performance)
    'nude', 'naked', 'topless', 'bottomless', 'undressed', 'unclothed',
    'bare', 'exposed', 'revealing', 'provocative', 'seductive', 'sensual',
    'erotic', 'sexual', 'intimate', 'adult', 'mature', 'explicit',
    'nsfw', 'xxx', 'porn', 'pornographic', 'lewd', 'vulgar', 'obscene',
    'breast', 'boob', 'nipple', 'genital', 'penis', 'vagina',
    'buttocks', 'butt', 'ass', 'crotch', 'groin', 'cleavage',
    'lingerie', 'underwear', 'bra', 'panties', 'bikini',
    'see-through', 'transparent', 'sheer', 'skimpy',
    'strip', 'undress', 'remove clothes', 'take off', 'disrobe',
    'seduce', 'tempt', 'allure', 'entice', 'arouse',
    'sexy', 'hot', 'gorgeous', 'beautiful woman', 'handsome man',
    'model pose', 'fashion model', 'glamour', 'pin-up',
    'nud3', 'n4ked', 'b00bs', 'a$$', 'pr0n', '18+',
    'birthday suit', 'in the buff', 'au naturel',
    'private parts', 'intimate areas', 'naughty', 'dirty', 'kinky'
  ];

  private suspiciousPatterns: RegExp[] = [
    /\b(no|without|remove|take off)\s+(clothes?|clothing|shirt|pants|dress)\b/i,
    /\b(show|reveal|expose)\s+(body|skin|flesh)\b/i,
    /\b(barely|scantily|minimally)\s+(clothed|dressed|covered)\b/i,
    /\b(tight|form.?fitting|skin.?tight)\s+(clothes?|clothing|outfit)\b/i,
    /\b(bedroom|bathroom|shower|bath)\s+(scene|setting)\b/i,
    /\b(romantic|intimate|private)\s+(moment|scene|setting)\b/i,
    /\b(18\+|adults?\s+only|mature\s+content)\b/i,
    /\b(not\s+safe\s+for\s+work|nsfw)\b/i,
    /\b(xxx|adult\s+content|explicit)\b/i
  ];

  private safeAlternatives: string[] = [
    'fully clothed character',
    'professional portrait',
    'casual outfit',
    'business attire',
    'winter clothing',
    'summer outfit',
    'sports uniform',
    'formal wear',
    'artistic character',
    'cartoon character'
  ];

  /**
   * Check if text contains inappropriate content
   */
  checkContent(text: string): {
    isInappropriate: boolean;
    reason?: string;
    suggestions?: string[];
  } {
    if (!text || typeof text !== 'string') {
      return { isInappropriate: false };
    }

    const lowerText = text.toLowerCase();
    const foundTerms: string[] = [];

    // Check for inappropriate terms
    for (const term of this.inappropriateTerms) {
      if (lowerText.includes(term.toLowerCase())) {
        foundTerms.push(term);
      }
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(text)) {
        return {
          isInappropriate: true,
          reason: 'Your description may generate inappropriate content. Please use family-friendly terms.',
          suggestions: this.safeAlternatives.slice(0, 3)
        };
      }
    }

    if (foundTerms.length > 0) {
      return {
        isInappropriate: true,
        reason: 'Your description contains terms that may generate inappropriate content. Please use family-friendly descriptions.',
        suggestions: this.safeAlternatives.slice(0, 3)
      };
    }

    return { isInappropriate: false };
  }

  /**
   * Get suggestions for safe content
   */
  getSafeSuggestions(): string[] {
    return [...this.safeAlternatives];
  }

  /**
   * Sanitize text by removing inappropriate terms
   */
  sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let sanitized = text;

    // Replace inappropriate terms
    for (const term of this.inappropriateTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      sanitized = sanitized.replace(regex, '');
    }

    // Clean up extra spaces
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
  }

  /**
   * Check full user selections for inappropriate content
   */
  checkUserSelections(selections: {
    text?: string;
    style?: string;
    material?: string;
    production?: string;
    details?: string[];
  }): {
    isInappropriate: boolean;
    reason?: string;
    suggestions?: string[];
  } {
    const { text, style, material, production, details = [] } = selections;
    
    // Combine all text fields
    const allText = [text, style, material, production, ...details]
      .filter(Boolean)
      .join(' ');

    return this.checkContent(allText);
  }
}

export const contentFilter = new ClientContentFilter();
export default contentFilter;