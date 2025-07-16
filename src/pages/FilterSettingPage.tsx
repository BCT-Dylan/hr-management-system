import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FilterCriteria } from '../types';

const FilterSettingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    experienceMin: 0,
    experienceMax: 10,
    educationRequirement: '',
    skillKeywords: '',
    languageRequirement: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (id) {
      loadFilterData(id);
    }
  }, [id]);

  const loadFilterData = async (jobId: string) => {
    setLoadingData(true);
    try {
      // Mock data - in real app, fetch from API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if filter exists for this job
      const mockFilter = {
        experienceMin: 2,
        experienceMax: 5,
        educationRequirement: 'bachelor',
        skillKeywords: 'React, JavaScript, TypeScript',
        languageRequirement: 'Chinese, English',
        notes: 'Need practical project experience'
      };
      
      setFormData(mockFilter);
    } catch (error) {
      console.error('Load filter criteria failed:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock save - in real app, call API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const filterData: Partial<FilterCriteria> = {
        jobPostingId: id!,
        experienceRange: {
          min: formData.experienceMin,
          max: formData.experienceMax
        },
        educationRequirement: formData.educationRequirement,
        skillKeywords: formData.skillKeywords.split(',').map(s => s.trim()).filter(s => s),
        languageRequirement: formData.languageRequirement.split(',').map(s => s.trim()).filter(s => s),
        notes: formData.notes
      };
      
      console.log('Save filter criteria:', filterData);
      alert(t('filters.saveSuccess', '篩選條件已保存'));
      navigate(`/jobs/${id}`);
    } catch (error) {
      alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="filter-setting-page">
      <div className="page-header">
        <Link to={`/jobs/${id}`} className="back-link">← {t('common.back')} {t('jobs.jobDetails')}</Link>
        <h1>{t('filters.settings', '篩選條件設定')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="filter-form">
        <div className="form-section">
          <h3>年資要求</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="experienceMin">最少年資</label>
              <input
                type="number"
                id="experienceMin"
                name="experienceMin"
                value={formData.experienceMin}
                onChange={handleNumberChange}
                min="0"
                max="20"
              />
            </div>
            <div className="form-group">
              <label htmlFor="experienceMax">最多年資</label>
              <input
                type="number"
                id="experienceMax"
                name="experienceMax"
                value={formData.experienceMax}
                onChange={handleNumberChange}
                min="0"
                max="20"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>學歷要求</h3>
          <div className="form-group">
            <label htmlFor="educationRequirement">最低學歷</label>
            <select
              id="educationRequirement"
              name="educationRequirement"
              value={formData.educationRequirement}
              onChange={handleInputChange}
            >
              <option value="">不限</option>
              <option value="高中">高中</option>
              <option value="專科">專科</option>
              <option value="大學">大學</option>
              <option value="研究所">研究所</option>
              <option value="博士">博士</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>技能關鍵字</h3>
          <div className="form-group">
            <label htmlFor="skillKeywords">技能關鍵字</label>
            <input
              type="text"
              id="skillKeywords"
              name="skillKeywords"
              value={formData.skillKeywords}
              onChange={handleInputChange}
              placeholder="例如: React, JavaScript, TypeScript (用逗號分隔)"
            />
            <small className="form-help">用逗號分隔多個關鍵字</small>
          </div>
        </div>

        <div className="form-section">
          <h3>語言能力</h3>
          <div className="form-group">
            <label htmlFor="languageRequirement">語言要求</label>
            <input
              type="text"
              id="languageRequirement"
              name="languageRequirement"
              value={formData.languageRequirement}
              onChange={handleInputChange}
              placeholder="例如: 中文, 英文, 日文 (用逗號分隔)"
            />
            <small className="form-help">用逗號分隔多個語言</small>
          </div>
        </div>

        <div className="form-section">
          <h3>備註說明</h3>
          <div className="form-group">
            <label htmlFor="notes">備註說明</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              placeholder="其他篩選條件說明..."
            />
          </div>
        </div>

        <div className="form-actions">
          <Link to={`/jobs/${id}`} className="btn btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? t('common.saving') : t('filters.saveSettings', '保存篩選條件')}
          </button>
        </div>
      </form>

      <div className="info-box">
        <h4>📝 {t('filters.info.title', '說明')}</h4>
        <p>{t('filters.info.description', '設定的篩選條件將用於自動評估後續上傳的履歷，AI 會根據這些條件對應徵者進行評分和分析。')}</p>
      </div>
    </div>
  );
};

export default FilterSettingPage;