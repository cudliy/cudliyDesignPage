// Xometry API Service - Commented out for now
// Remove this comment block and restore the original file when ready to use Xometry API

// Placeholder exports to prevent import errors
export const xometryService = {
  getInstantQuote: async () => ({ error: 'Xometry service disabled' }),
  estimateShipping: async () => ({ error: 'Xometry service disabled' }),
  getMaterials: async () => [],
  getFinishes: async () => [],
  validateModel: async () => ({ valid: false, issues: ['Xometry service disabled'], recommendations: [] })
};

export type XometryQuoteRequest = any;
export type XometryQuoteResponse = any;
export type XometryShippingEstimate = any;
export type XometryMaterialOption = any;
export type XometryFinishOption = any;