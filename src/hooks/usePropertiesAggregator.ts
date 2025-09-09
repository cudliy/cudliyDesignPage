import { useCallback, useRef } from 'react';
import { PropertiesAggregator } from '../utils/propertiesAggregator';
import type { DesignProperties } from '../utils/propertiesAggregator';

/**
 * Custom hook for managing design properties aggregation
 * Provides methods to collect subcategory selections and generate enhanced prompts
 */
export const usePropertiesAggregator = () => {
  const aggregatorRef = useRef(new PropertiesAggregator());
  
  /**
   * Add color selection from ColorPicker
   */
  const addColor = useCallback((colorHex: string) => {
    aggregatorRef.current.addColorProperties(colorHex);
  }, []);
  
  /**
   * Add size selection from SizeSelector
   */
  const addSize = useCallback((size: string, customWidth?: string, customHeight?: string) => {
    aggregatorRef.current.addSizeProperties(size, customWidth, customHeight);
  }, []);
  
  /**
   * Add production method from ProductionSelector
   */
  const addProduction = useCallback((production: 'handmade' | 'digital') => {
    aggregatorRef.current.addProductionProperties(production);
  }, []);
  
  /**
   * Add style selection from StyleSelector
   */
  const addStyle = useCallback((style: string) => {
    aggregatorRef.current.addStyleProperties(style);
  }, []);
  
  /**
   * Add material selection from MaterialSelector
   */
  const addMaterial = useCallback((materialKey: string) => {
    aggregatorRef.current.addMaterialProperties(materialKey);
  }, []);
  
  /**
   * Add detail selections from DetailSelector
   */
  const addDetails = useCallback((details: string[]) => {
    aggregatorRef.current.addDetailProperties(details);
  }, []);
  
  /**
   * Generate enhanced prompt with all collected properties
   */
  const generateEnhancedPrompt = useCallback((basePrompt: string): string => {
    return aggregatorRef.current.generateEnhancedPrompt(basePrompt);
  }, []);
  
  /**
   * Get all current properties
   */
  const getProperties = useCallback((): DesignProperties => {
    return aggregatorRef.current.getProperties();
  }, []);
  
  /**
   * Reset all properties
   */
  const resetProperties = useCallback(() => {
    aggregatorRef.current.reset();
  }, []);
  
  /**
   * Check if any properties have been set
   */
  const hasProperties = useCallback((): boolean => {
    const props = aggregatorRef.current.getProperties();
    return Object.keys(props).length > 0;
  }, []);
  
  return {
    addColor,
    addSize,
    addProduction,
    addStyle,
    addMaterial,
    addDetails,
    generateEnhancedPrompt,
    getProperties,
    resetProperties,
    hasProperties
  };
};
