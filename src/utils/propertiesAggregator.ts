// Strategic Properties Aggregation System for Advanced Design Categories
// This utility intelligently collects and formats all subcategory selections

interface DesignProperties {
  // Color subcategories
  color?: {
    primaryColor: string;
    colorHex: string;
    colorScheme: 'monochrome' | 'complementary' | 'triadic' | 'analogous';
    colorIntensity: 'vibrant' | 'muted' | 'pastel' | 'dark';
  };
  
  // Size subcategories  
  size?: {
    sizeCategory: 'S' | 'M' | 'L' | 'custom';
    dimensions?: {
      width: string;
      height: string;
      units: 'mm' | 'cm' | 'inches';
    };
    scale: 'miniature' | 'small' | 'medium' | 'large' | 'oversized';
  };
  
  // Production subcategories
  production?: {
    method: 'handmade' | 'digital';
    technique: string;
    complexity: 'simple' | 'moderate' | 'complex' | 'highly-detailed';
    finishQuality: 'rough' | 'smooth' | 'polished' | 'textured';
  };
  
  // Style subcategories
  style?: {
    primaryStyle: 'sci-fi' | 'low-poly' | 'realistic' | 'playful' | 'retro';
    aestheticModifiers: string[];
    designEra?: string;
    visualComplexity: 'minimal' | 'moderate' | 'detailed' | 'intricate';
  };
  
  // Material subcategories (comprehensive mapping)
  material?: {
    category: 'soft' | 'texture' | 'size' | 'hard' | 'smooth' | 'flexible';
    subcategory: string;
    materialType: string;
    properties: {
      hardness: 'soft' | 'medium' | 'hard' | 'flexible';
      surface: 'smooth' | 'textured' | 'rough' | 'polished';
      durability: 'fragile' | 'moderate' | 'durable' | 'robust';
      printability: 'easy' | 'moderate' | 'challenging' | 'expert';
    };
    description: string;
  };
  
  // Detail subcategories (all 6 categories)
  details?: {
    infill?: string[]; // upright, Sitting, Lying, Standing
    parts?: string[]; // dynamic, Neutral, Modular, Fixed  
    pose?: string[]; // Jumping, Waving, Running, Sleeping
    strength?: string[]; // Strong, Flexible, Rigid, Soft
    complexity?: string[]; // Simple, Detailed, Basic, Advanced
    lighting?: string[]; // Natural, Studio, Dramatic, Soft
  };
}

// Material subcategory mapping for intelligent categorization
export const MATERIAL_SUBCATEGORY_MAP = {
  // Soft category
  'fabric-yarn': {
    category: 'soft',
    materialType: 'Fabric/Yarn',
    properties: { hardness: 'soft', surface: 'textured', durability: 'moderate', printability: 'challenging' },
    description: 'Knit, crochet, or sewn texture with fabric-like appearance'
  },
  'special-finish-soft': {
    category: 'soft', 
    materialType: 'Special Finish',
    properties: { hardness: 'soft', surface: 'smooth', durability: 'moderate', printability: 'moderate' },
    description: 'Padded or stuffed effects with soft cushioned appearance'
  },
  
  // Texture category
  'wood-textured': {
    category: 'texture',
    materialType: 'Wood',
    properties: { hardness: 'hard', surface: 'textured', durability: 'durable', printability: 'moderate' },
    description: 'Wood grain patterns, carved details, natural wood texture'
  },
  'fabric-yarn-textured': {
    category: 'texture',
    materialType: 'Fabric/Yarn', 
    properties: { hardness: 'soft', surface: 'textured', durability: 'moderate', printability: 'challenging' },
    description: 'Knit and crochet patterns with visible textile structure'
  },
  'clay-ceramic-textured': {
    category: 'texture',
    materialType: 'Clay/Ceramic',
    properties: { hardness: 'hard', surface: 'textured', durability: 'fragile', printability: 'expert' },
    description: 'Hand-molded clay texture with ceramic-like surface imperfections'
  },
  'special-finish-textured': {
    category: 'texture',
    materialType: 'Special Finish',
    properties: { hardness: 'medium', surface: 'textured', durability: 'moderate', printability: 'moderate' },
    description: 'Embossed patterns, hybrid material mix with complex surface details'
  },
  
  // Size category (material context)
  'small': {
    category: 'size',
    materialType: 'Compact Design',
    properties: { hardness: 'medium', surface: 'smooth', durability: 'moderate', printability: 'easy' },
    description: 'Compact design optimized for small-scale printing'
  },
  'medium': {
    category: 'size', 
    materialType: 'Standard Design',
    properties: { hardness: 'medium', surface: 'smooth', durability: 'moderate', printability: 'easy' },
    description: 'Standard size with balanced detail and printability'
  },
  'large': {
    category: 'size',
    materialType: 'Large Scale Design', 
    properties: { hardness: 'medium', surface: 'smooth', durability: 'durable', printability: 'moderate' },
    description: 'Large-scale design with enhanced structural elements'
  },
  'custom': {
    category: 'size',
    materialType: 'Custom Dimensions',
    properties: { hardness: 'medium', surface: 'smooth', durability: 'moderate', printability: 'moderate' },
    description: 'Custom-sized design with specific dimensional requirements'
  },
  
  // Hard category
  'plastic-hard': {
    category: 'hard',
    materialType: 'Plastic',
    properties: { hardness: 'hard', surface: 'smooth', durability: 'durable', printability: 'easy' },
    description: 'Rigid plastic materials like PLA, ABS, PETG, and UV resin with solid structure'
  },
  'wood': {
    category: 'hard',
    materialType: 'Wood',
    properties: { hardness: 'hard', surface: 'textured', durability: 'durable', printability: 'expert' },
    description: 'Solid wood construction, carved or assembled wooden components'
  },
  'metal': {
    category: 'hard', 
    materialType: 'Metal',
    properties: { hardness: 'hard', surface: 'smooth', durability: 'robust', printability: 'expert' },
    description: 'Metal components including wire, sheet metal, and small cast metal parts'
  },
  'clay-ceramic': {
    category: 'hard',
    materialType: 'Clay/Ceramic',
    properties: { hardness: 'hard', surface: 'smooth', durability: 'fragile', printability: 'expert' },
    description: 'Kiln-fired clay or ceramic with solid, brittle characteristics'
  },
  
  // Smooth category
  'plastic-smooth': {
    category: 'smooth',
    materialType: 'Plastic',
    properties: { hardness: 'hard', surface: 'smooth', durability: 'durable', printability: 'easy' },
    description: 'Ultra-smooth plastic finish using resin and PETG materials'
  },
  'metal-smooth': {
    category: 'smooth',
    materialType: 'Metal', 
    properties: { hardness: 'hard', surface: 'polished', durability: 'robust', printability: 'expert' },
    description: 'Polished metal surface with mirror-like finish and high reflectivity'
  },
  'special-finish-smooth': {
    category: 'smooth',
    materialType: 'Special Finish',
    properties: { hardness: 'medium', surface: 'polished', durability: 'moderate', printability: 'moderate' },
    description: 'Painted or polished finishes with professional-grade surface quality'
  },
  
  // Flexible category
  'plastic-flexible': {
    category: 'flexible',
    materialType: 'Flexible Plastic',
    properties: { hardness: 'flexible', surface: 'smooth', durability: 'durable', printability: 'moderate' },
    description: 'Flexible plastics like TPU and Nylon with rubber-like properties'
  },
  'fabric-yarn-flexible': {
    category: 'flexible',
    materialType: 'Flexible Fabric',
    properties: { hardness: 'flexible', surface: 'textured', durability: 'moderate', printability: 'challenging' },
    description: 'Flexible fabric materials with bendable, soft characteristics'
  },
  'paper-cardboard': {
    category: 'flexible',
    materialType: 'Paper/Cardboard',
    properties: { hardness: 'flexible', surface: 'smooth', durability: 'fragile', printability: 'easy' },
    description: 'Paper-based materials suitable for origami or folded constructions'
  }
} as const;

// Style aesthetic modifiers for enhanced descriptions
export const STYLE_MODIFIERS = {
  'sci-fi': ['futuristic', 'high-tech', 'cyberpunk', 'space-age', 'metallic', 'neon-accented'],
  'low-poly': ['geometric', 'angular', 'faceted', 'minimalist', 'crystalline', 'simplified'],
  'realistic': ['photorealistic', 'detailed', 'lifelike', 'accurate', 'natural', 'proportional'],
  'playful': ['whimsical', 'colorful', 'cartoon-like', 'fun', 'childlike', 'cheerful'],
  'retro': ['vintage', 'nostalgic', 'classic', 'antique', 'old-fashioned', 'period-specific']
} as const;

// Production technique mapping
export const PRODUCTION_TECHNIQUES = {
  'handmade': {
    techniques: ['hand-sculpted', 'artisan-crafted', 'manually-detailed', 'traditional-methods'],
    qualities: ['unique-imperfections', 'organic-texture', 'human-touch', 'craft-quality']
  },
  'digital': {
    techniques: ['3D-printed', 'digitally-manufactured', 'precision-made', 'computer-generated'],
    qualities: ['geometrically-precise', 'layer-consistent', 'digitally-accurate', 'machine-perfect']
  }
} as const;

/**
 * Aggregates all selected properties from the six advanced categories
 * into a structured DesignProperties object
 */
export class PropertiesAggregator {
  private properties: DesignProperties = {};
  
  /**
   * Add color properties from ColorPicker component
   */
  addColorProperties(colorHex: string): void {
    // Extract color insights
    const colorIntensity = this.analyzeColorIntensity(colorHex);
    const colorScheme = this.determineColorScheme(colorHex);
    
    this.properties.color = {
      primaryColor: colorHex,
      colorHex,
      colorScheme,
      colorIntensity
    };
  }
  
  /**
   * Add size properties from SizeSelector component
   */
  addSizeProperties(size: string, customWidth?: string, customHeight?: string): void {
    const sizeCategory = size as 'S' | 'M' | 'L' | 'custom';
    const scale = this.mapSizeToScale(sizeCategory);
    
    this.properties.size = {
      sizeCategory,
      scale,
      ...(size === 'custom' && customWidth && customHeight ? {
        dimensions: {
          width: customWidth,
          height: customHeight,
          units: 'mm' as const
        }
      } : {})
    };
  }
  
  /**
   * Add production properties from ProductionSelector component  
   */
  addProductionProperties(production: 'handmade' | 'digital'): void {
    const productionData = PRODUCTION_TECHNIQUES[production];
    
    this.properties.production = {
      method: production,
      technique: productionData.techniques[0],
      complexity: production === 'handmade' ? 'complex' : 'moderate',
      finishQuality: production === 'handmade' ? 'textured' : 'smooth'
    };
  }
  
  /**
   * Add style properties from StyleSelector component
   */
  addStyleProperties(style: string): void {
    const primaryStyle = style as 'sci-fi' | 'low-poly' | 'realistic' | 'playful' | 'retro';
    const aestheticModifiers = [...(STYLE_MODIFIERS[primaryStyle] || [])];
    
    this.properties.style = {
      primaryStyle,
      aestheticModifiers,
      visualComplexity: this.mapStyleToComplexity(primaryStyle)
    };
  }
  
  /**
   * Add material properties from MaterialSelector component
   */  
  addMaterialProperties(materialKey: string): void {
    const materialData = MATERIAL_SUBCATEGORY_MAP[materialKey as keyof typeof MATERIAL_SUBCATEGORY_MAP];
    
    if (materialData) {
      this.properties.material = {
        category: materialData.category,
        subcategory: materialKey,
        materialType: materialData.materialType,
        properties: materialData.properties,
        description: materialData.description
      };
    }
  }
  
  /**
   * Add detail properties from DetailSelector component
   */
  addDetailProperties(details: string[]): void {
    // Categorize details into their respective groups
    const categorizedDetails = this.categorizeDetails(details);
    
    this.properties.details = categorizedDetails;
  }
  
  /**
   * Generate an enhanced prompt by intelligently combining base prompt with properties
   */
  generateEnhancedPrompt(basePrompt: string): string {
    let enhancedPrompt = basePrompt;
    
    // Add color enhancements
    if (this.properties.color) {
      const colorDesc = this.generateColorDescription(this.properties.color);
      enhancedPrompt += `, ${colorDesc}`;
    }
    
    // Add material enhancements
    if (this.properties.material) {
      const materialDesc = this.generateMaterialDescription(this.properties.material);
      enhancedPrompt += `, ${materialDesc}`;
    }
    
    // Add style enhancements
    if (this.properties.style) {
      const styleDesc = this.generateStyleDescription(this.properties.style);
      enhancedPrompt += `, ${styleDesc}`;
    }
    
    // Add size enhancements
    if (this.properties.size) {
      const sizeDesc = this.generateSizeDescription(this.properties.size);
      enhancedPrompt += `, ${sizeDesc}`;
    }
    
    // Add production enhancements
    if (this.properties.production) {
      const productionDesc = this.generateProductionDescription(this.properties.production);
      enhancedPrompt += `, ${productionDesc}`;
    }
    
    // Add detail enhancements
    if (this.properties.details) {
      const detailsDesc = this.generateDetailsDescription(this.properties.details);
      if (detailsDesc) {
        enhancedPrompt += `, ${detailsDesc}`;
      }
    }
    
    // Add 3D printing optimization suffix
    enhancedPrompt += ', professional 3D rendering, white background, suitable for 3D printing, high detail, centered composition';
    
    return enhancedPrompt;
  }
  
  /**
   * Get all aggregated properties
   */
  getProperties(): DesignProperties {
    return { ...this.properties };
  }
  
  /**
   * Reset all properties
   */
  reset(): void {
    this.properties = {};
  }
  
  // Private helper methods
  
  private analyzeColorIntensity(colorHex: string): 'vibrant' | 'muted' | 'pastel' | 'dark' {
    const hex = colorHex.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16); 
    const b = parseInt(hex.substr(4, 2), 16);
    
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const saturation = (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, g, b) || 0;
    
    if (brightness < 80) return 'dark';
    if (saturation < 0.3) return 'muted';
    if (brightness > 200 && saturation < 0.6) return 'pastel';
    return 'vibrant';
  }
  
  private determineColorScheme(_colorHex: string): 'monochrome' | 'complementary' | 'triadic' | 'analogous' {
    // For single color, default to monochrome (could be enhanced with multi-color analysis)
    return 'monochrome';
  }
  
  private mapSizeToScale(size: 'S' | 'M' | 'L' | 'custom'): 'miniature' | 'small' | 'medium' | 'large' | 'oversized' {
    const mapping = {
      'S': 'small' as const,
      'M': 'medium' as const, 
      'L': 'large' as const,
      'custom': 'medium' as const
    };
    return mapping[size];
  }
  
  private mapStyleToComplexity(style: string): 'minimal' | 'moderate' | 'detailed' | 'intricate' {
    const complexityMap = {
      'low-poly': 'minimal' as const,
      'playful': 'moderate' as const, 
      'realistic': 'detailed' as const,
      'sci-fi': 'intricate' as const,
      'retro': 'detailed' as const
    };
    return complexityMap[style as keyof typeof complexityMap] || 'moderate';
  }
  
  private categorizeDetails(details: string[]): NonNullable<DesignProperties['details']> {
    const infillOptions = ['upright', 'Sitting', 'Lying', 'Standing'];
    const partsOptions = ['dynamic', 'Neutral', 'Modular', 'Fixed'];
    const poseOptions = ['Jumping', 'Waving', 'Running', 'Sleeping'];
    const strengthOptions = ['Strong', 'Flexible', 'Rigid', 'Soft'];
    const complexityOptions = ['Simple', 'Detailed', 'Basic', 'Advanced'];
    const lightingOptions = ['Natural', 'Studio', 'Dramatic', 'Soft'];
    
    return {
      infill: details.filter(d => infillOptions.indexOf(d) !== -1),
      parts: details.filter(d => partsOptions.indexOf(d) !== -1),
      pose: details.filter(d => poseOptions.indexOf(d) !== -1), 
      strength: details.filter(d => strengthOptions.indexOf(d) !== -1),
      complexity: details.filter(d => complexityOptions.indexOf(d) !== -1),
      lighting: details.filter(d => lightingOptions.indexOf(d) !== -1)
    };
  }
  
  private generateColorDescription(color: NonNullable<DesignProperties['color']>): string {
    return `${color.colorIntensity} ${color.primaryColor} color scheme with ${color.colorScheme} palette`;
  }
  
  private generateMaterialDescription(material: NonNullable<DesignProperties['material']>): string {
    return `${material.description}, ${material.properties.surface} surface finish, ${material.properties.hardness} material properties`;
  }
  
  private generateStyleDescription(style: NonNullable<DesignProperties['style']>): string {
    const modifiers = style.aestheticModifiers.slice(0, 2).join(' and ');
    return `${style.primaryStyle} style with ${modifiers} aesthetic, ${style.visualComplexity} level of detail`;
  }
  
  private generateSizeDescription(size: NonNullable<DesignProperties['size']>): string {
    if (size.dimensions) {
      return `custom dimensions ${size.dimensions.width}x${size.dimensions.height}${size.dimensions.units}, ${size.scale} scale`;
    }
    return `${size.sizeCategory} size, ${size.scale} scale proportions`;
  }
  
  private generateProductionDescription(production: NonNullable<DesignProperties['production']>): string {
    return `${production.method} production using ${production.technique}, ${production.complexity} detailing, ${production.finishQuality} finish quality`;
  }
  
  private generateDetailsDescription(details: NonNullable<DesignProperties['details']>): string {
    const descriptions: string[] = [];
    
    if (details.infill?.length) descriptions.push(`${details.infill.join(', ')} positioning`);
    if (details.parts?.length) descriptions.push(`${details.parts.join(', ')} component design`);
    if (details.pose?.length) descriptions.push(`${details.pose.join(', ')} pose characteristics`);
    if (details.strength?.length) descriptions.push(`${details.strength.join(', ')} structural properties`);
    if (details.complexity?.length) descriptions.push(`${details.complexity.join(', ')} complexity level`);
    if (details.lighting?.length) descriptions.push(`${details.lighting.join(', ')} lighting conditions`);
    
    return descriptions.join(', ');
  }
}

// Export types for external use
export type { DesignProperties };
