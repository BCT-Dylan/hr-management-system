import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EmailTemplate } from '../types';
import { supabaseService } from '../services/supabaseService';

const EmailTemplatePage: React.FC = () => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    subject: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoadingData(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const templatesData = await supabaseService.getTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Load templates failed:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingTemplate) {
        // Update existing template
        const updatedTemplate = await supabaseService.updateTemplate(editingTemplate.id, formData);
        if (updatedTemplate) {
          setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? updatedTemplate : t));
          alert(t('emailTemplates.updateSuccess'));
        } else {
          alert(t('emailTemplates.operationFailed'));
        }
      } else {
        // Create new template
        const newTemplate = await supabaseService.createTemplate(formData);
        setTemplates(prev => [...prev, newTemplate]);
        alert(t('emailTemplates.createSuccess'));
      }
      
      resetForm();
    } catch (error) {
      alert(t('emailTemplates.operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      purpose: template.purpose,
      subject: template.subject,
      content: template.content
    });
    setShowForm(true);
  };

  const handleDelete = async (templateId: string) => {
    if (window.confirm(t('emailTemplates.deleteConfirm'))) {
      try {
        const success = await supabaseService.deleteTemplate(templateId);
        if (success) {
          setTemplates(prev => prev.filter(t => t.id !== templateId));
          alert(t('emailTemplates.deleteSuccess'));
        } else {
          alert(t('emailTemplates.operationFailed'));
        }
      } catch (error) {
        console.error('Delete template failed:', error);
        alert(t('emailTemplates.operationFailed'));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      purpose: '',
      subject: '',
      content: ''
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  if (loadingData) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="email-template-page">
      <div className="page-header">
        <h1>{t('emailTemplates.title')}</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            {t('emailTemplates.addTemplate')}
          </button>
        )}
      </div>

      {showForm && (
        <div className="template-form-section">
          <div className="form-header">
            <h2>{editingTemplate ? t('emailTemplates.editTemplate') : t('emailTemplates.addTemplate')}</h2>
            <button onClick={resetForm} className="btn btn-secondary">{t('common.cancel')}</button>
          </div>

          <form onSubmit={handleSubmit} className="template-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">{t('emailTemplates.templateName')} *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="purpose">{t('emailTemplates.purpose')} *</label>
                <select
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t('emailTemplates.purpose')}</option>
                  <option value="general">{t('emailTemplates.purposes.general')}</option>
                  <option value="interview">{t('emailTemplates.purposes.interview')}</option>
                  <option value="offer">{t('emailTemplates.purposes.offer')}</option>
                  <option value="rejection">{t('emailTemplates.purposes.rejection')}</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="subject">{t('emailTemplates.subject')} *</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                placeholder={t('emailTemplates.subject')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">{t('emailTemplates.content')} *</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={10}
                required
                placeholder={t('emailTemplates.content')}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? t('common.saving', '保存中...') : (editingTemplate ? t('emailTemplates.updateTemplate', '更新模板') : t('emailTemplates.createTemplate', '建立模板'))}
              </button>
            </div>
          </form>

          <div className="variable-help">
            <h4>{t('emailTemplates.variables.title')}</h4>
            <div className="variables">
              <code>{'{{applicantName}}'}</code> - {t('emailTemplates.variables.applicantName')}
              <code>{'{{jobTitle}}'}</code> - {t('emailTemplates.variables.jobTitle')}
              <code>{'{{companyName}}'}</code> - {t('emailTemplates.variables.companyName')}
              <code>{'{{interviewTime}}'}</code> - {t('emailTemplates.variables.interviewTime')}
              <code>{'{{interviewLocation}}'}</code> - {t('emailTemplates.variables.interviewLocation')}
            </div>
          </div>
        </div>
      )}

      <div className="templates-list">
        <table className="templates-table">
          <thead>
            <tr>
              <th>{t('emailTemplates.templateName')}</th>
              <th>{t('emailTemplates.purpose')}</th>
              <th>{t('emailTemplates.lastModified')}</th>
              <th>{t('jobs.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(template => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{t(`emailTemplates.purposes.${template.purpose}`)}</td>
                <td>{template.updatedAt.toLocaleDateString()}</td>
                <td className="actions">
                  <button 
                    onClick={() => handleEdit(template)}
                    className="btn btn-sm"
                  >
                    {t('common.edit')}
                  </button>
                  <button 
                    onClick={() => handleDelete(template.id)}
                    className="btn btn-sm btn-danger"
                  >
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {templates.length === 0 && (
          <div className="empty-state">
            <p>{t('emailTemplates.noTemplates')}, <button onClick={() => setShowForm(true)} className="link-btn">{t('emailTemplates.createFirst')}</button></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTemplatePage;