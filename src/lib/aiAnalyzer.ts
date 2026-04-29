import OpenAI from "openai";
import { BidAnalysis } from "@/types/bid";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const SYSTEM_PROMPT = `You are an expert government procurement analyst and bid preparation specialist. 
Your job is to analyze government bid solicitation documents and provide comprehensive, actionable guidance 
for businesses that want to bid on the project.

Always respond with valid JSON matching the exact schema provided. Be thorough, specific, and practical.
Extract all available dates, requirements, and contact information from the provided content.
When specific information is not available, make reasonable inferences or mark as "Not specified".`;

export async function analyzeBidContent(content: string): Promise<BidAnalysis> {
  const prompt = `Analyze the following government bid solicitation content and provide a comprehensive bid preparation guide.

CONTENT:
${content.substring(0, 15000)}

Return a JSON object with EXACTLY this structure:
{
  "title": "Full title of the bid solicitation",
  "solicitationNumber": "The official solicitation/bid number",
  "agency": "Government agency or organization issuing the bid",
  "bidType": "Type of bid (e.g., RFP, RFQ, ITB, IFB, RFSOB, etc.)",
  "status": "Current status (e.g., Open, Closed, Awarded, Cancelled)",
  "description": "Brief description of what is being procured (2-3 sentences)",
  "scopeOfWork": "Detailed scope of work description (what the contractor will need to do)",
  "estimatedValue": "Estimated contract value if mentioned, or null",
  "setAsideType": "Set-aside type if applicable (e.g., Small Business, 8(a), SDVOSB), or null",
  "naicsCode": "NAICS code if mentioned, or null",
  "contactInfo": {
    "name": "Contracting officer name if available",
    "email": "Contact email if available",
    "phone": "Contact phone if available"
  },
  "keyDates": [
    {
      "label": "Human readable label (e.g., 'Questions Deadline', 'Submission Deadline', 'Pre-Bid Meeting')",
      "date": "Date/time string (e.g., 'January 15, 2025 at 2:00 PM EST')",
      "isPast": false,
      "isUrgent": false
    }
  ],
  "actionItems": [
    {
      "id": "action-1",
      "title": "Short action title",
      "description": "Detailed description of what to do",
      "deadline": "Related deadline if applicable, or null",
      "priority": "high|medium|low",
      "category": "Category (e.g., 'Registration', 'Preparation', 'Submission', 'Compliance')"
    }
  ],
  "requiredDocuments": [
    {
      "id": "doc-1",
      "name": "Document name",
      "required": true,
      "description": "Brief description of the document",
      "notes": "Any special notes or instructions"
    }
  ],
  "evaluationCriteria": [
    "List of evaluation criteria as strings"
  ],
  "recommendedApproach": "Strategic recommendation for winning this bid (2-3 paragraphs)"
}

Important guidelines:
- Extract ALL dates mentioned in the solicitation for keyDates
- Create comprehensive, numbered action items covering the full bid process from registration to submission
- Include all required and optional documents
- Set isPast to true if the date has clearly passed based on context
- Set isUrgent to true for deadlines within 7 days
- Order action items by priority and logical sequence
- Be specific about Florida-specific requirements if this is a Florida state bid`;

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const result = response.choices[0].message.content;
  if (!result) throw new Error("No response from AI");

  return JSON.parse(result) as BidAnalysis;
}

export async function analyzeBidContentFallback(content: string): Promise<BidAnalysis> {
  // Fallback analysis when OpenAI is not available - parses content directly
  const lines = content.split("\n").filter(l => l.trim().length > 0);
  
  // Extract basic info with regex
  const titleMatch = content.match(/(?:title|subject|solicitation title)\s*:?\s*([^\n]{10,100})/i);
  const solNumMatch = content.match(/(?:solicitation|bid|rfp|rfq|itb)\s*(?:number|no\.?|#)?\s*:?\s*([A-Z0-9-]{3,30})/i);
  const agencyMatch = content.match(/(?:agency|organization|department)\s*:?\s*([^\n]{5,80})/i);
  const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = content.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);

  // Extract date patterns
  const dateMatches: Array<{label: string, date: string}> = [];
  const dateRegex = /((?:due\s*date|submission\s*deadline|closing|questions?\s*due|pre-bid|opening)[^\n:]*)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}(?:[^\n]{0,30})?)/gi;
  let m;
  while ((m = dateRegex.exec(content)) !== null) {
    dateMatches.push({ label: m[1].trim(), date: m[2].trim() });
  }

  return {
    title: titleMatch?.[1]?.trim() || "Government Bid Solicitation",
    solicitationNumber: solNumMatch?.[1]?.trim() || "See document",
    agency: agencyMatch?.[1]?.trim() || "Government Agency",
    bidType: content.match(/\b(RFP|RFQ|ITB|IFB|RFSOB)\b/i)?.[1]?.toUpperCase() || "Bid",
    status: "Open",
    description: lines.find(l => l.length > 100)?.substring(0, 300) || "See full solicitation document for details.",
    scopeOfWork: "Please review the full solicitation document for complete scope of work details.",
    estimatedValue: undefined,
    setAsideType: undefined,
    naicsCode: undefined,
    contactInfo: {
      email: emailMatch?.[1],
      phone: phoneMatch?.[1],
    },
    keyDates: dateMatches.length > 0 ? dateMatches.map((d) => ({
      label: d.label,
      date: d.date,
      isPast: false,
      isUrgent: false,
    })) : [
      {
        label: "Submission Deadline",
        date: "See solicitation document",
        isPast: false,
        isUrgent: false,
      }
    ],
    actionItems: [
      {
        id: "action-1",
        title: "Register on the Bidding Platform",
        description: "Ensure your company is registered on the relevant government procurement platform to be eligible to submit a bid.",
        priority: "high",
        category: "Registration",
      },
      {
        id: "action-2",
        title: "Review Full Solicitation Document",
        description: "Carefully read all sections of the solicitation including scope, requirements, terms, and conditions.",
        priority: "high",
        category: "Preparation",
      },
      {
        id: "action-3",
        title: "Submit Questions",
        description: "Submit any clarifying questions before the questions deadline to get official answers.",
        priority: "medium",
        category: "Preparation",
      },
      {
        id: "action-4",
        title: "Prepare Technical Proposal",
        description: "Develop your technical approach addressing all requirements in the scope of work.",
        priority: "high",
        category: "Preparation",
      },
      {
        id: "action-5",
        title: "Prepare Cost/Price Proposal",
        description: "Develop your pricing in the required format, including all required line items.",
        priority: "high",
        category: "Preparation",
      },
      {
        id: "action-6",
        title: "Gather Required Documents",
        description: "Collect all required certifications, licenses, and supporting documents.",
        priority: "high",
        category: "Compliance",
      },
      {
        id: "action-7",
        title: "Submit Bid Package",
        description: "Submit your complete bid package before the deadline via the specified submission method.",
        priority: "high",
        category: "Submission",
      },
    ],
    requiredDocuments: [
      {
        id: "doc-1",
        name: "Technical Proposal",
        required: true,
        description: "Your technical approach and methodology for fulfilling the contract requirements.",
      },
      {
        id: "doc-2",
        name: "Price/Cost Proposal",
        required: true,
        description: "Detailed pricing in the required format.",
      },
      {
        id: "doc-3",
        name: "Business Registration Certificate",
        required: true,
        description: "Proof of business registration in the relevant state.",
      },
      {
        id: "doc-4",
        name: "References",
        required: true,
        description: "List of past performance references for similar work.",
      },
    ],
    evaluationCriteria: [
      "Technical approach and methodology",
      "Relevant experience and past performance",
      "Qualifications of key personnel",
      "Price/cost",
    ],
    recommendedApproach: "Review the full solicitation document carefully to understand all requirements. Ensure your bid addresses each evaluation criterion clearly. Consider attending any pre-bid meetings or conferences. Submit your questions early to get clarification on any ambiguous requirements before the deadline.",
  };
}
