import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Applicant, JobPosting } from '../types';
import './EmailModal.css';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: EmailData) => Promise<void>;
  applicant: Applicant;
  job: JobPosting;
  emailType: 'interview' | 'rejection';
}

interface EmailData {
  to: string;
  subject: string;
  content: string;
  type: 'interview' | 'rejection';
}

const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  onSend,
  applicant,
  job,
  emailType
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [emailData, setEmailData] = useState<EmailData>({
    to: applicant.email,
    subject: '',
    content: '',
    type: emailType
  });

  useEffect(() => {
    if (isOpen) {
      generateEmailContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, emailType, applicant, job]);

  const generateEmailContent = async () => {
    setGenerating(true);
    try {
      // Simulate AI email generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const templates = {
        interview: {
          subject: `面試邀請 - ${job.title} 職位`,
          content: `親愛的 ${applicant.name}，

感謝您對本公司 ${job.title} 職位的興趣與申請。

經過初步審核，我們對您的背景和經驗印象深刻，特此邀請您參加面試。

面試詳情：
• 職位：${job.title}
• 部門：${job.department}
• 地點：${job.location}
• 面試時間：請回覆確認您方便的時間
• 面試地點：本公司會議室

${applicant.aiSummary ? `AI評估摘要：${applicant.aiSummary}` : ''}

請回覆此郵件確認您的參與意願，並提供您方便的面試時間。如有任何疑問，請隨時與我們聯繫。

期待與您見面！

最好的祝福，
人力資源部`
        },
        rejection: {
          subject: `關於您申請 ${job.title} 職位的回覆`,
          content: `親愛的 ${applicant.name}，

感謝您對本公司 ${job.title} 職位的興趣與申請。

經過仔細評估，我們決定選擇其他更符合當前職位需求的候選人。這個決定並不容易，因為我們收到了許多優秀的申請。

${applicant.aiSummary ? `評估摘要：${applicant.aiSummary}` : ''}

我們感謝您花時間申請此職位，並鼓勵您繼續關注我們未來的職位機會。您的履歷將保留在我們的人才庫中，若有合適的職位，我們會主動與您聯繫。

再次感謝您對本公司的關注。

祝您未來一切順利！

最好的祝福，
人力資源部`
        }
      };

      const template = templates[emailType];
      setEmailData(prev => ({
        ...prev,
        subject: template.subject,
        content: template.content
      }));
    } catch (error) {
      console.error('Generate email content failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleInputChange = (field: keyof EmailData, value: string) => {
    setEmailData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      await onSend(emailData);
      onClose();
    } catch (error) {
      console.error('Send email failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    generateEmailContent();
  };

  if (!isOpen) return null;

  return (
    <div className="email-modal-overlay">
      <div className="email-modal">
        <div className="email-modal-header">
          <h2>
            {emailType === 'interview' 
              ? t('email.sendInterview', '發送面試邀請') 
              : t('email.sendRejection', '發送拒絕信')
            }
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="email-modal-body">
          {generating ? (
            <div className="generating-content">
              <div className="spinner"></div>
              <p>{t('email.generating', 'AI 正在生成信件內容...')}</p>
            </div>
          ) : (
            <>
              <div className="recipient-info">
                <div className="recipient-details">
                  <span><strong>{t('applicants.name')}:</strong> {applicant.name}</span>
                  <span><strong>{t('applicants.email')}:</strong> {applicant.email}</span>
                  <span><strong>{t('applicants.aiScore')}:</strong> {applicant.aiScore || t('applicants.noScore')}</span>
                </div>
              </div>

              <div className="email-form">
                <div className="form-group">
                  <label htmlFor="subject">{t('emailTemplates.subject')}</label>
                  <input
                    type="text"
                    id="subject"
                    value={emailData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="email-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="content">
                    {t('emailTemplates.content')}
                    <button 
                      type="button" 
                      onClick={handleRegenerate}
                      className="regenerate-btn"
                      disabled={generating}
                    >
                      🔄 {t('email.regenerate', '重新生成')}
                    </button>
                  </label>
                  <textarea
                    id="content"
                    value={emailData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows={15}
                    className="email-textarea"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="email-modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={loading || generating}
          >
            {t('common.cancel')}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSend}
            disabled={loading || generating || !emailData.subject || !emailData.content}
          >
            {loading ? t('email.sending', '發送中...') : t('email.send', '發送信件')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;