# 資料庫整合建議

## 目前狀況
目前系統使用 localStorage 作為臨時儲存解決方案，資料僅保存在瀏覽器本地。對於生產環境，我們需要整合真實的資料庫系統。

## 推薦的資料庫架構

### 1. 關聯式資料庫 (推薦)

#### PostgreSQL + Prisma ORM
```sql
-- users 表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'hr',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- job_postings 表
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    attachments TEXT[],
    is_public BOOLEAN DEFAULT true,
    applicant_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- filter_criteria 表
CREATE TABLE filter_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    experience_min INTEGER DEFAULT 0,
    experience_max INTEGER DEFAULT 10,
    education_requirement VARCHAR(50),
    skill_keywords TEXT[],
    language_requirement TEXT[],
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- applicants 表
CREATE TABLE applicants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    resume_file_path VARCHAR(500),
    resume_file_name VARCHAR(200),
    ai_score INTEGER,
    ai_summary TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    is_selected BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- email_templates 表
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    purpose VARCHAR(100) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- email_logs 表
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID REFERENCES applicants(id),
    template_id UUID REFERENCES email_templates(id),
    recipient_email VARCHAR(100) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent'
);

-- 索引
CREATE INDEX idx_job_postings_created_at ON job_postings(created_at);
CREATE INDEX idx_applicants_job_posting_id ON applicants(job_posting_id);
CREATE INDEX idx_applicants_status ON applicants(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
```

#### Prisma Schema (schema.prisma)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  username      String         @unique @db.VarChar(50)
  email         String         @unique @db.VarChar(100)
  passwordHash  String         @map("password_hash") @db.VarChar(255)
  role          String         @default("hr") @db.VarChar(20)
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @default(now()) @updatedAt @map("updated_at")
  
  jobPostings   JobPosting[]
  emailTemplates EmailTemplate[]
  
  @@map("users")
}

model JobPosting {
  id              String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title           String           @db.VarChar(200)
  department      String           @db.VarChar(100)
  location        String           @db.VarChar(100)
  jobType         String           @map("job_type") @db.VarChar(50)
  description     String           @db.Text
  attachments     String[]
  isPublic        Boolean          @default(true) @map("is_public")
  applicantCount  Int              @default(0) @map("applicant_count")
  createdBy       String?          @map("created_by") @db.Uuid
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @default(now()) @updatedAt @map("updated_at")
  
  creator         User?            @relation(fields: [createdBy], references: [id])
  filterCriteria  FilterCriteria?
  applicants      Applicant[]
  
  @@map("job_postings")
}

model FilterCriteria {
  id                    String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  jobPostingId          String     @unique @map("job_posting_id") @db.Uuid
  experienceMin         Int        @default(0) @map("experience_min")
  experienceMax         Int        @default(10) @map("experience_max")
  educationRequirement  String?    @map("education_requirement") @db.VarChar(50)
  skillKeywords         String[]   @map("skill_keywords")
  languageRequirement   String[]   @map("language_requirement")
  notes                 String?    @db.Text
  createdAt             DateTime   @default(now()) @map("created_at")
  updatedAt             DateTime   @default(now()) @updatedAt @map("updated_at")
  
  jobPosting            JobPosting @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)
  
  @@map("filter_criteria")
}

model Applicant {
  id            String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String      @db.VarChar(100)
  email         String      @db.VarChar(100)
  jobPostingId  String      @map("job_posting_id") @db.Uuid
  resumeFilePath String?    @map("resume_file_path") @db.VarChar(500)
  resumeFileName String?    @map("resume_file_name") @db.VarChar(200)
  aiScore       Int?        @map("ai_score")
  aiSummary     String?     @map("ai_summary") @db.Text
  status        String      @default("pending") @db.VarChar(20)
  isSelected    Boolean     @default(false) @map("is_selected")
  emailSent     Boolean     @default(false) @map("email_sent")
  emailSentAt   DateTime?   @map("email_sent_at")
  uploadedAt    DateTime    @default(now()) @map("uploaded_at")
  
  jobPosting    JobPosting  @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)
  emailLogs     EmailLog[]
  
  @@map("applicants")
}

model EmailTemplate {
  id          String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String     @db.VarChar(200)
  purpose     String     @db.VarChar(100)
  subject     String     @db.VarChar(500)
  content     String     @db.Text
  createdBy   String?    @map("created_by") @db.Uuid
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @default(now()) @updatedAt @map("updated_at")
  
  creator     User?      @relation(fields: [createdBy], references: [id])
  emailLogs   EmailLog[]
  
  @@map("email_templates")
}

model EmailLog {
  id              String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  applicantId     String        @map("applicant_id") @db.Uuid
  templateId      String        @map("template_id") @db.Uuid
  recipientEmail  String        @map("recipient_email") @db.VarChar(100)
  subject         String        @db.VarChar(500)
  content         String        @db.Text
  sentAt          DateTime      @default(now()) @map("sent_at")
  status          String        @default("sent") @db.VarChar(20)
  
  applicant       Applicant     @relation(fields: [applicantId], references: [id])
  template        EmailTemplate @relation(fields: [templateId], references: [id])
  
  @@map("email_logs")
}
```

### 2. 後端 API 設計

#### Node.js + Express + Prisma
```typescript
// src/services/DatabaseService.ts
import { PrismaClient } from '@prisma/client';
import { JobPosting, Applicant, FilterCriteria, EmailTemplate } from '../types';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Job Posting methods
  async getJobs(): Promise<JobPosting[]> {
    return await this.prisma.jobPosting.findMany({
      include: {
        filterCriteria: true,
        applicants: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getJobById(id: string): Promise<JobPosting | null> {
    return await this.prisma.jobPosting.findUnique({
      where: { id },
      include: {
        filterCriteria: true,
        applicants: true
      }
    });
  }

  async createJob(data: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt' | 'applicantCount'>): Promise<JobPosting> {
    return await this.prisma.jobPosting.create({
      data: {
        ...data,
        applicantCount: 0
      }
    });
  }

  async updateJob(id: string, data: Partial<JobPosting>): Promise<JobPosting | null> {
    try {
      return await this.prisma.jobPosting.update({
        where: { id },
        data
      });
    } catch (error) {
      return null;
    }
  }

  async deleteJob(id: string): Promise<boolean> {
    try {
      await this.prisma.jobPosting.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Applicant methods
  async getApplicantsByJobId(jobId: string): Promise<Applicant[]> {
    return await this.prisma.applicant.findMany({
      where: { jobPostingId: jobId },
      orderBy: { uploadedAt: 'desc' }
    });
  }

  async createApplicant(data: Omit<Applicant, 'id' | 'uploadedAt'>): Promise<Applicant> {
    const applicant = await this.prisma.applicant.create({
      data
    });

    // Update job applicant count
    await this.updateJobApplicantCount(data.jobPostingId);

    return applicant;
  }

  private async updateJobApplicantCount(jobId: string): Promise<void> {
    const count = await this.prisma.applicant.count({
      where: { jobPostingId: jobId }
    });

    await this.prisma.jobPosting.update({
      where: { id: jobId },
      data: { applicantCount: count }
    });
  }

  // Filter methods
  async saveFilter(data: Omit<FilterCriteria, 'id'>): Promise<FilterCriteria> {
    return await this.prisma.filterCriteria.upsert({
      where: { jobPostingId: data.jobPostingId },
      update: data,
      create: data
    });
  }

  // Template methods
  async getTemplates(): Promise<EmailTemplate[]> {
    return await this.prisma.emailTemplate.findMany({
      orderBy: { updatedAt: 'desc' }
    });
  }

  async createTemplate(data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    return await this.prisma.emailTemplate.create({
      data
    });
  }

  async updateTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    try {
      return await this.prisma.emailTemplate.update({
        where: { id },
        data
      });
    } catch (error) {
      return null;
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    try {
      await this.prisma.emailTemplate.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

#### API Routes
```typescript
// src/routes/jobs.ts
import express from 'express';
import { DatabaseService } from '../services/DatabaseService';

const router = express.Router();
const dbService = new DatabaseService();

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await dbService.getJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const job = await dbService.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// POST /api/jobs
router.post('/', async (req, res) => {
  try {
    const job = await dbService.createJob(req.body);
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// PUT /api/jobs/:id
router.put('/:id', async (req, res) => {
  try {
    const job = await dbService.updateJob(req.params.id, req.body);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', async (req, res) => {
  try {
    const success = await dbService.deleteJob(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

export default router;
```

### 3. 前端整合

#### API Service 層
```typescript
// src/services/api.ts
import axios from 'axios';
import { JobPosting, Applicant, FilterCriteria, EmailTemplate } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hrToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export class ApiService {
  // Job methods
  async getJobs(): Promise<JobPosting[]> {
    const response = await api.get('/jobs');
    return response.data;
  }

  async getJobById(id: string): Promise<JobPosting> {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  }

  async createJob(jobData: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt' | 'applicantCount'>): Promise<JobPosting> {
    const response = await api.post('/jobs', jobData);
    return response.data;
  }

  async updateJob(id: string, jobData: Partial<JobPosting>): Promise<JobPosting> {
    const response = await api.put(`/jobs/${id}`, jobData);
    return response.data;
  }

  async deleteJob(id: string): Promise<void> {
    await api.delete(`/jobs/${id}`);
  }

  // Applicant methods
  async getApplicantsByJobId(jobId: string): Promise<Applicant[]> {
    const response = await api.get(`/jobs/${jobId}/applicants`);
    return response.data;
  }

  async createApplicant(applicantData: Omit<Applicant, 'id' | 'uploadedAt'>): Promise<Applicant> {
    const response = await api.post('/applicants', applicantData);
    return response.data;
  }

  // Filter methods
  async saveFilter(filterData: Omit<FilterCriteria, 'id'>): Promise<FilterCriteria> {
    const response = await api.post('/filters', filterData);
    return response.data;
  }

  async getFilterByJobId(jobId: string): Promise<FilterCriteria | null> {
    try {
      const response = await api.get(`/jobs/${jobId}/filter`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  // Template methods
  async getTemplates(): Promise<EmailTemplate[]> {
    const response = await api.get('/templates');
    return response.data;
  }

  async createTemplate(templateData: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    const response = await api.post('/templates', templateData);
    return response.data;
  }

  async updateTemplate(id: string, templateData: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const response = await api.put(`/templates/${id}`, templateData);
    return response.data;
  }

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/templates/${id}`);
  }

  // File upload
  async uploadResume(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await api.post('/upload/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.filePath;
  }
}

export const apiService = new ApiService();
```

#### 環境變數設定
```bash
# .env
DATABASE_URL="postgresql://username:password@localhost:5432/hr_management"
JWT_SECRET="your-secret-key"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-password"
OPENAI_API_KEY="your-openai-key"
UPLOAD_DIR="./uploads"
```

### 4. 部署建議

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hr_management
      POSTGRES_USER: hr_user
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://hr_user:secure_password@postgres:5432/hr_management
      JWT_SECRET: your-secret-key
    depends_on:
      - postgres
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:3001/api
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 5. 遷移計劃

#### 階段 1: 資料庫設置
1. 設置 PostgreSQL 資料庫
2. 建立 Prisma schema
3. 執行資料庫遷移

#### 階段 2: 後端開發
1. 建立 Node.js + Express API
2. 實作資料庫服務層
3. 建立 API 路由
4. 實作認證和授權

#### 階段 3: 前端整合
1. 建立 API 服務層
2. 替換 localStorage 為 API 呼叫
3. 實作錯誤處理和載入狀態
4. 建立檔案上傳功能

#### 階段 4: 進階功能
1. 整合 AI 履歷分析服務
2. 實作 SMTP 信件發送
3. 加入檔案管理系統
4. 建立日誌和監控

### 6. 安全考量

#### 認證與授權
- 使用 JWT 進行使用者認證
- 實作角色權限控制
- API 端點保護

#### 資料安全
- 密碼加密儲存
- SQL 注入防護
- 輸入驗證和清理

#### 檔案安全
- 檔案類型限制
- 檔案大小限制
- 惡意檔案掃描

### 7. 效能優化

#### 資料庫優化
- 適當的索引設計
- 查詢優化
- 連接池管理

#### 快取策略
- Redis 快取常用資料
- 瀏覽器快取設定
- API 回應快取

#### 檔案處理
- 檔案壓縮
- CDN 整合
- 背景任務處理

這個整合計劃提供了從目前的 localStorage 解決方案遷移到完整資料庫系統的完整藍圖。