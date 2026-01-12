import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export interface TriageResult {
  category: string;
  priority: string;
  suggestedFix: string;
  estimatedUrgency: string;
  confidence: number;
}

const VALID_CATEGORIES = [
  'PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE',
  'STRUCTURAL', 'PEST_CONTROL', 'LANDSCAPING', 'CLEANING', 'SAFETY', 'OTHER'
];

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export async function triageTicket(
  title: string,
  description: string,
  propertyType?: string
): Promise<TriageResult | null> {
  if (!genAI) {
    console.log('Gemini API key not configured, skipping AI triage');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a property maintenance expert AI. Analyze this maintenance request and provide triage information.

MAINTENANCE REQUEST:
Title: ${title}
Description: ${description}
${propertyType ? `Property Type: ${propertyType}` : ''}

Respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "category": "ONE OF: ${VALID_CATEGORIES.join(', ')}",
  "priority": "ONE OF: ${VALID_PRIORITIES.join(', ')}",
  "suggestedFix": "Brief 1-2 sentence diagnosis and recommended action",
  "estimatedUrgency": "Brief explanation of why this priority level",
  "confidence": 0.0 to 1.0
}

PRIORITY GUIDELINES:
- URGENT: Safety hazard, water damage spreading, no heat in winter, no AC in extreme heat, gas smell, electrical sparking
- HIGH: Major inconvenience, potential for damage if delayed (leaks, broken appliances affecting daily life)
- MEDIUM: Needs attention but not immediately (minor leaks, cosmetic issues, non-critical repairs)
- LOW: Routine maintenance, minor cosmetic issues, preventive work

Respond with ONLY the JSON object, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Clean up response - remove any markdown code blocks if present
    let jsonText = text;
    if (text.startsWith('```')) {
      jsonText = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const parsed = JSON.parse(jsonText);

    // Validate and normalize the response
    const category = VALID_CATEGORIES.includes(parsed.category?.toUpperCase())
      ? parsed.category.toUpperCase()
      : 'OTHER';

    const priority = VALID_PRIORITIES.includes(parsed.priority?.toUpperCase())
      ? parsed.priority.toUpperCase()
      : 'MEDIUM';

    return {
      category,
      priority,
      suggestedFix: parsed.suggestedFix || 'Unable to determine suggested fix',
      estimatedUrgency: parsed.estimatedUrgency || '',
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7)),
    };
  } catch (error) {
    console.error('AI Triage error:', error);
    return null;
  }
}

export async function retriageTicket(
  title: string,
  description: string,
  currentCategory: string,
  currentPriority: string,
  comments?: string[]
): Promise<TriageResult | null> {
  if (!genAI) {
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a property maintenance expert AI. Re-analyze this maintenance request with additional context.

MAINTENANCE REQUEST:
Title: ${title}
Description: ${description}
Current Category: ${currentCategory}
Current Priority: ${currentPriority}
${comments?.length ? `\nAdditional Comments:\n${comments.join('\n')}` : ''}

Based on the full context, should the category or priority be updated?

Respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "category": "ONE OF: ${VALID_CATEGORIES.join(', ')}",
  "priority": "ONE OF: ${VALID_PRIORITIES.join(', ')}",
  "suggestedFix": "Updated diagnosis based on all information",
  "estimatedUrgency": "Brief explanation",
  "confidence": 0.0 to 1.0
}

Respond with ONLY the JSON object, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    let jsonText = text;
    if (text.startsWith('```')) {
      jsonText = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const parsed = JSON.parse(jsonText);

    return {
      category: VALID_CATEGORIES.includes(parsed.category?.toUpperCase())
        ? parsed.category.toUpperCase()
        : currentCategory,
      priority: VALID_PRIORITIES.includes(parsed.priority?.toUpperCase())
        ? parsed.priority.toUpperCase()
        : currentPriority,
      suggestedFix: parsed.suggestedFix || '',
      estimatedUrgency: parsed.estimatedUrgency || '',
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7)),
    };
  } catch (error) {
    console.error('AI Re-triage error:', error);
    return null;
  }
}
