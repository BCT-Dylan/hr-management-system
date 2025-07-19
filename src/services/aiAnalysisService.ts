import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { 
  AIAnalysisRequest, 
  AIAnalysisResult, 
  ExtractedInfo, 
  ScoringCriteria 
} from '../types';

class AIAnalysisService {
  private llm: ChatOpenAI;

  /**
   * Clean AI response to extract JSON content
   */
  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks if present
    let cleaned = response.trim();
    
    // Remove ```json at the beginning
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    
    // Remove ``` at the end
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    
    // Find JSON object boundaries if there's extra text
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    return cleaned.trim();
  }

  /**
   * Safe JSON parse with error handling
   */
  private safeJsonParse(jsonString: string, fallback: any = {}): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('JSON parse error:', error);
      console.error('Failed to parse:', jsonString);
      return fallback;
    }
  }

  constructor() {
    // Initialize OpenAI LLM
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    console.log('OpenAI API Key configured:', !!apiKey);
    console.log('Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0
    });
    
    if (!apiKey) {
      throw new Error('REACT_APP_OPENAI_API_KEY is not configured');
    }
    
    this.llm = new ChatOpenAI({
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      apiKey: apiKey,
    });
  }

  /**
   * Extract personal information from resume
   */
  async extractPersonalInfo(resumeContent: string): Promise<ExtractedInfo> {
    const extractionPrompt = PromptTemplate.fromTemplate(`
作為履歷分析專家，請從以下履歷內容中準確提取個人資訊。
請直接回應純 JSON 格式，不要使用 markdown 代碼塊包裝：

履歷內容：
{resumeContent}

請提取以下資訊並以 JSON 格式返回：
{{
  "name": "姓名",
  "email": "電子郵件",
  "phone": "電話號碼", 
  "location": "居住地址或城市",
  "languages": [
    {{"language": "語言名稱", "level": "程度"}}
  ],
  "education": [
    {{
      "degree": "學歷程度",
      "major": "主修科系",
      "school": "學校名稱",
      "graduation_year": "年份",
      "gpa": "GPA分數"
    }}
  ],
  "experience": [
    {{
      "company": "公司名稱",
      "position": "職位",
      "duration": "任職期間",
      "start_date": "開始日期",
      "end_date": "結束日期",
      "description": "工作描述",
      "skills": ["技能1", "技能2"],
      "achievements": ["成就1", "成就2"]
    }}
  ],
  "skills": ["技能列表"],
  "summary": "個人簡介或摘要"
}}

注意事項：
- 如果某項資訊不存在，請使用 null 或空陣列
- 語言程度請使用：basic, intermediate, advanced, native, professional
- 日期格式盡量標準化（YYYY-MM-DD 或 YYYY-MM）
- 技能請儘量識別技術技能和軟技能
- 請直接返回純 JSON，不要使用 markdown 包裝
`);

    try {
      const prompt = await extractionPrompt.format({ resumeContent });
      const response = await this.llm.invoke(prompt);
      
      // Clean and parse JSON response
      const cleanedResponse = this.cleanJsonResponse(response.content as string);
      console.log('Cleaned extraction response:', cleanedResponse);
      const extractedData = this.safeJsonParse(cleanedResponse, {
        name: undefined,
        email: undefined,
        phone: undefined,
        location: undefined,
        languages: [],
        education: [],
        experience: [],
        skills: [],
        summary: undefined,
      });
      return extractedData as ExtractedInfo;
    } catch (error) {
      console.error('Personal info extraction failed:', error);
      return {
        name: undefined,
        email: undefined,
        phone: undefined,
        location: undefined,
        languages: [],
        education: [],
        experience: [],
        skills: [],
        summary: undefined,
      };
    }
  }

  /**
   * Analyze resume against job requirements and scoring criteria
   */
  async analyzeResume(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const { resumeContent, jobDescription, jobDescriptionDetail, scoringCriteria } = request;

    // First extract personal information
    const extractedInfo = await this.extractPersonalInfo(resumeContent);

    // Create comprehensive analysis prompt
    const analysisPrompt = PromptTemplate.fromTemplate(`
作為專業的 HR 履歷分析師，請根據以下職缺要求和評分標準，對候選人履歷進行全面分析評估。

=== 職缺資訊 ===
基本描述：{jobDescription}

詳細要求：{jobDescriptionDetail}

=== 評分標準 ===
{scoringCriteriaText}

=== 候選人履歷 ===
{resumeContent}

=== 已提取的個人資訊 ===
{extractedInfoText}

請根據上述資訊進行詳細分析，並直接以純 JSON 格式提供以下評估結果（不要使用 markdown 代碼塊）：

{{
  "matchPercentage": 數字(0-100),
  "analysis": "詳細分析說明（300-500字）",
  "strengths": [
    "優勢1：具體說明",
    "優勢2：具體說明",
    "優勢3：具體說明"
  ],
  "weaknesses": [
    "不足1：具體說明",
    "不足2：具體說明",
    "不足3：具體說明"
  ],
  "recommendations": [
    "建議1：針對面試或錄用的建議",
    "建議2：針對候選人發展的建議",
    "建議3：針對職位適配的建議"
  ]
}}

評分考量原則：
1. 嚴格評分：分數應該真實反映匹配度，不要過於寬鬆
2. 分數範圍說明：
   - 90-100%：完美匹配，所有條件都超出預期
   - 80-89%：高度匹配，大部分條件符合且有亮點
   - 70-79%：良好匹配，主要條件符合但有改善空間
   - 60-69%：基本匹配，部分條件符合但有明顯不足
   - 50-59%：勉強匹配，少數條件符合，需要大幅改善
   - 0-49%：不匹配，大部分條件不符合

3. 詳細評分計算：
   - 技術技能匹配度 × 權重
   - 經驗年資和領域相關性 × 權重  
   - 學歷背景符合度 × 權重
   - 語言能力滿足度 × 權重
   - 軟技能表現 × 權重

4. 評分標準：
   - 必需條件不符合應大幅扣分
   - 經驗不足應適當扣分
   - 技能不匹配應明顯扣分
   - 只有超出期望才能得到高分

請確保分析客觀、嚴格，提供真實的匹配度評分。

重要：請直接回應純 JSON 格式，不要使用 markdown 代碼塊包裝。
`);

    try {
      const prompt = await analysisPrompt.format({
        jobDescription,
        jobDescriptionDetail: jobDescriptionDetail || '無額外詳細要求',
        scoringCriteriaText: this.formatScoringCriteria(scoringCriteria),
        resumeContent,
        extractedInfoText: JSON.stringify(extractedInfo, null, 2),
      });

      console.log('AI Analysis - Sending prompt to OpenAI...');
      console.log('Prompt length:', prompt.length);
      console.log('Job description:', jobDescription?.substring(0, 100) + '...');
      console.log('Resume content length:', resumeContent?.length);
      
      const response = await this.llm.invoke(prompt);
      console.log('AI Analysis - Received response from OpenAI');
      console.log('Raw response content:', response.content);
      
      // Clean and parse JSON response
      const cleanedResponse = this.cleanJsonResponse(response.content as string);
      console.log('Cleaned analysis response:', cleanedResponse);
      const analysisResult = this.safeJsonParse(cleanedResponse, {
        matchPercentage: 0,
        analysis: 'AI 分析解析失敗，建議人工審核',
        strengths: ['履歷格式清晰'],
        weaknesses: ['無法完成自動分析'],
        recommendations: ['建議人工審核']
      });

      console.log('AI Analysis - Parsed result:', {
        matchPercentage: analysisResult.matchPercentage,
        strengthsCount: analysisResult.strengths?.length,
        weaknessesCount: analysisResult.weaknesses?.length,
        recommendationsCount: analysisResult.recommendations?.length
      });

      return {
        matchPercentage: analysisResult.matchPercentage,
        extractedInfo,
        analysis: analysisResult.analysis,
        strengths: analysisResult.strengths || [],
        weaknesses: analysisResult.weaknesses || [],
        recommendations: analysisResult.recommendations || [],
      };
    } catch (error) {
      console.error('Resume analysis failed:', error);
      
      // Return fallback analysis
      return {
        matchPercentage: 0,
        extractedInfo,
        analysis: `分析過程中發生錯誤：${error instanceof Error ? error.message : '未知錯誤'}`,
        strengths: ['履歷格式清晰'],
        weaknesses: ['無法完成自動分析'],
        recommendations: ['建議人工審核'],
      };
    }
  }

  /**
   * Format scoring criteria for prompt
   */
  private formatScoringCriteria(criteria: ScoringCriteria): string {
    const sections = [];

    sections.push(`技術技能 (權重: ${criteria.technical_skills.weight}%)`);
    sections.push(`  必需技能: ${criteria.technical_skills.required_skills.join(', ')}`);
    if (criteria.technical_skills.preferred_skills?.length) {
      sections.push(`  加分技能: ${criteria.technical_skills.preferred_skills.join(', ')}`);
    }

    sections.push(`\n工作經驗 (權重: ${criteria.experience.weight}%)`);
    sections.push(`  最少年資: ${criteria.experience.min_years} 年`);
    if (criteria.experience.preferred_domains?.length) {
      sections.push(`  偏好領域: ${criteria.experience.preferred_domains.join(', ')}`);
    }

    sections.push(`\n學歷要求 (權重: ${criteria.education.weight}%)`);
    sections.push(`  最低學歷: ${this.formatDegree(criteria.education.min_degree)}`);
    if (criteria.education.preferred_majors?.length) {
      sections.push(`  偏好科系: ${criteria.education.preferred_majors.join(', ')}`);
    }

    sections.push(`\n語言能力 (權重: ${criteria.languages.weight}%)`);
    sections.push(`  必需語言: ${criteria.languages.required_languages.join(', ')}`);

    sections.push(`\n軟技能 (權重: ${criteria.soft_skills.weight}%)`);
    if (criteria.soft_skills.preferred_skills?.length) {
      sections.push(`  重視技能: ${criteria.soft_skills.preferred_skills.join(', ')}`);
    }

    return sections.join('\n');
  }

  /**
   * Format degree for display
   */
  private formatDegree(degree: string): string {
    const degreeMap: { [key: string]: string } = {
      'high_school': '高中',
      'associate': '專科',
      'bachelor': '學士',
      'master': '碩士',
      'doctorate': '博士',
    };
    return degreeMap[degree] || degree;
  }

  /**
   * Check if OpenAI API key is configured
   */
  isConfigured(): boolean {
    return !!process.env.REACT_APP_OPENAI_API_KEY;
  }

  /**
   * Get configuration status message
   */
  getConfigurationMessage(): string {
    if (!this.isConfigured()) {
      return 'OpenAI API Key 未設定，請在環境變數中設定 REACT_APP_OPENAI_API_KEY';
    }
    return 'AI 分析服務已就緒';
  }
}

export const aiAnalysisService = new AIAnalysisService();