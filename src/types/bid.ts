export interface BidDate {
  label: string;
  date: string;
  isPast?: boolean;
  isUrgent?: boolean;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  deadline?: string;
  priority: "high" | "medium" | "low";
  category: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  required: boolean;
  description?: string;
  notes?: string;
}

export interface BidAnalysis {
  title: string;
  solicitationNumber: string;
  agency: string;
  bidType: string;
  status: string;
  description: string;
  scopeOfWork: string;
  estimatedValue?: string;
  setAsideType?: string;
  naicsCode?: string;
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  keyDates: BidDate[];
  actionItems: ActionItem[];
  requiredDocuments: DocumentItem[];
  evaluationCriteria: string[];
  recommendedApproach: string;
  rawContent?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  analysis?: BidAnalysis;
  error?: string;
}
