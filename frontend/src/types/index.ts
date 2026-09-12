export type LabelAngle = 'FRONT' | 'BACK' | 'SIDE' | 'INGREDIENTS' | 'NUTRITION' | 'TOP' | 'BOTTOM' | 'OTHER';

export type ExtractionStatus = 'CONFIRMED' | 'INFERRED' | 'MISSING' | 'UNCLEAR';

export type ComplianceStatus = 'COMPLIANT' | 'NEEDS_VERIFICATION' | 'POTENTIAL_ISSUE';

export type Core3DState = 'SCANNING' | 'ANALYZING' | 'VERIFYING' | 'COMPLIANT' | 'NEEDS_VERIFICATION' | 'POTENTIAL_ISSUE';

export interface ImageQualityResult {
  imageId: string;
  filename: string;
  labelAngle: LabelAngle;
  width: number;
  height: number;
  resolutionStatus: 'EXCELLENT' | 'GOOD' | 'LOW';
  blurScore: number;
  readabilityScore: number;
  overallQuality: 'GOOD QUALITY' | 'LOW QUALITY';
  warnings: string[];
  recommendation?: string;
}

export interface ExtractedField<T = string> {
  value: T;
  confidence: number;
  sourceImageId: string;
  sourceAngle: LabelAngle;
  status: ExtractionStatus;
  rawSnippet?: string;
}

export interface ProductIdentity {
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  variant: string;
  packSize: string;
}

export interface LabelInformation {
  netQuantity: string;
  mrp: string;
  manufacturer: string;
  packer?: string;
  marketer?: string;
  countryOfOrigin: string;
  batchNumber: string;
  manufacturingDate?: string;
  expiryDate: string;
  bestBefore?: string;
  fssaiLicense?: string;
}

export interface NutritionData {
  servingSize?: string;
  energy?: string;
  protein?: string;
  carbohydrates?: string;
  totalSugars?: string;
  addedSugars?: string;
  fat?: string;
  saturatedFat?: string;
  transFat?: string;
  fiber?: string;
  sodium?: string;
  [key: string]: string | undefined;
}

export interface ProductEvidenceItem {
  field: string;
  sourceAngle: LabelAngle;
  sourceImageId: string;
  statement: string;
  extractedValue?: string;
  snippet?: string;
}

export interface ProductInsightItem {
  text: string;
  basis?: string;
  confidence?: number;
}

export interface ProductInsights {
  uses: ProductInsightItem[];
  benefits: ProductInsightItem[];
  warnings: ProductInsightItem[];
  disadvantages: ProductInsightItem[];
  limitations?: ProductInsightItem[];
}

export interface StructuredProductData {
  productName: ExtractedField<string>;
  brand: ExtractedField<string>;
  category: ExtractedField<string>;
  netQuantity: ExtractedField<string>;
  ingredients: ExtractedField<string[]>;
  allergens: ExtractedField<string[]>;
  nutritionalInfo: ExtractedField<Record<string, string>>;
  mrp: ExtractedField<string>;
  manufacturer: ExtractedField<string>;
  importer?: ExtractedField<string>;
  countryOfOrigin: ExtractedField<string>;
  batchNumber: ExtractedField<string>;
  manufacturingDate?: ExtractedField<string>;
  expiryDate: ExtractedField<string>;
  bestBeforePeriod?: ExtractedField<string>;
  customerCare: ExtractedField<string>;
  fssaiLicense: ExtractedField<string>;
  storageInstructions: ExtractedField<string>;
  warnings: ExtractedField<string[]>;
  labelClaims: ExtractedField<string[]>;
  usageInstructions?: ExtractedField<string[]>;
  certifications?: ExtractedField<string[]>;
  licenseInformation?: ExtractedField<string[]>;
  otherInformation?: ExtractedField<string[]>;
  missingInformation?: string[];
  unclearInformation?: string[];

  // Universal Structured Aggregations & Intelligence
  productIdentity?: ProductIdentity;
  labelInformation?: LabelInformation;
  nutrition?: NutritionData;
  claims?: string[];
  productInsights?: ProductInsights;
  evidence?: ProductEvidenceItem[];
  confidence?: Record<string, string | number>;
  confidenceSummary?: Record<string, string>;
}

export interface DetectedConflict {
  id: string;
  field: string;
  fieldLabel: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  discrepantValues: {
    sourceAngle: LabelAngle;
    sourceImageId: string;
    value: string;
    confidence: number;
  }[];
  recommendation: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleVersion: string;
  category: 'METROLOGY' | 'MANDATORY_DECLARATIONS' | 'SAFETY_ALLERGENS' | 'DATES_SHELF_LIFE' | 'CONSUMER_RIGHTS' | 'CLAIMS_ACCURACY';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PASS' | 'NEEDS_VERIFICATION' | 'POTENTIAL_ISSUE';
  evidence: {
    statement: string;
    sourceAngle?: LabelAngle;
    sourceImageId?: string;
    extractedValue?: string;
  }[];
  explanation: string;
  recommendation: string;
  requiredFields: string[];
}

export interface LabelImageRecord {
  id: string;
  url: string;
  filename: string;
  labelAngle: LabelAngle;
  mimetype: string;
  size: number;
  uploadedAt: string;
  ocrText?: string;
  quality?: ImageQualityResult;
}

export interface ComplianceScanRecord {
  id: string;
  userId: string;
  productName: string;
  category: string;
  status: ComplianceStatus;
  overallScore: number;
  images: LabelImageRecord[];
  extractedData?: StructuredProductData;
  verifiedData?: StructuredProductData;
  conflicts: DetectedConflict[];
  ruleResults: RuleEvaluationResult[];
  passedCount: number;
  needsVerificationCount: number;
  potentialIssueCount: number;
  humanVerification: {
    isVerified: boolean;
    verifiedAt?: string;
    verifiedBy?: string;
    editedFields: string[];
    notes?: string;
  };
  executiveSummary: string;
  isDemoSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportItem {
  id: string;
  scanId: string;
  productName: string;
  category: string;
  status: ComplianceStatus;
  overallScore: number;
  issueCount: number;
  generatedAt: string;
  isDemoSample?: boolean;
  downloadUrl: string;
}
