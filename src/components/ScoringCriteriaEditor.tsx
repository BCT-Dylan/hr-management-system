import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Box,
  Slider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import {
  Psychology as AIIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Code as TechIcon,
  Work as ExperienceIcon,
  School as EducationIcon,
  Language as LanguageIcon,
  Psychology as SoftSkillsIcon,
} from '@mui/icons-material';
import { ScoringCriteria } from '../types';

interface ScoringCriteriaEditorProps {
  scoringCriteria: ScoringCriteria;
  onChange: (criteria: ScoringCriteria) => void;
}

const ScoringCriteriaEditor: React.FC<ScoringCriteriaEditorProps> = ({
  scoringCriteria,
  onChange,
}) => {
  const [newSkills, setNewSkills] = useState<{[key: string]: string}>({});

  const handleWeightChange = (category: keyof ScoringCriteria, weight: number) => {
    onChange({
      ...scoringCriteria,
      [category]: {
        ...scoringCriteria[category],
        weight,
      },
    });
  };

  const handleFieldChange = (
    category: keyof ScoringCriteria,
    field: string,
    value: any
  ) => {
    onChange({
      ...scoringCriteria,
      [category]: {
        ...scoringCriteria[category],
        [field]: value,
      },
    });
  };

  const addSkill = (category: keyof ScoringCriteria, skillType: string) => {
    const skillKey = `${category}_${skillType}`;
    const skill = newSkills[skillKey]?.trim();
    
    if (!skill) return;

    const currentSkills = ((scoringCriteria[category] as any)[skillType] as string[]) || [];
    if (!currentSkills.includes(skill)) {
      onChange({
        ...scoringCriteria,
        [category]: {
          ...scoringCriteria[category],
          [skillType]: [...currentSkills, skill],
        },
      });
    }

    setNewSkills(prev => ({ ...prev, [skillKey]: '' }));
  };

  const removeSkill = (
    category: keyof ScoringCriteria,
    skillType: string,
    index: number
  ) => {
    const currentSkills = (scoringCriteria[category] as any)[skillType] as string[];
    onChange({
      ...scoringCriteria,
      [category]: {
        ...scoringCriteria[category],
        [skillType]: currentSkills.filter((_, i) => i !== index),
      },
    });
  };

  const handleNewSkillChange = (key: string, value: string) => {
    setNewSkills(prev => ({ ...prev, [key]: value }));
  };

  const renderSkillsSection = (
    category: keyof ScoringCriteria,
    skillType: string,
    label: string,
    placeholder: string
  ) => {
    const skillKey = `${category}_${skillType}`;
    const skills = ((scoringCriteria[category] as any)[skillType] as string[]) || [];

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {label}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {skills.map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              onDelete={() => removeSkill(category, skillType, index)}
              deleteIcon={<DeleteIcon />}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder={placeholder}
            value={newSkills[skillKey] || ''}
            onChange={(e) => handleNewSkillChange(skillKey, e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill(category, skillType);
              }
            }}
            sx={{ flexGrow: 1 }}
          />
          <IconButton
            size="small"
            onClick={() => addSkill(category, skillType)}
            color="primary"
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Box>
    );
  };

  const totalWeight = Object.values(scoringCriteria).reduce(
    (sum, criteria) => sum + criteria.weight,
    0
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AIIcon sx={{ mr: 1 }} />
          AI 履歷評分標準設定
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          設定各項評分標準的權重和具體要求。AI 將根據這些標準對履歷進行評分，總權重應為 100%。
        </Alert>

        {totalWeight !== 100 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            目前總權重為 {totalWeight}%，建議調整至 100% 以獲得最佳評分效果。
          </Alert>
        )}

        {/* Technical Skills */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TechIcon color="primary" />
              <Typography variant="h6">
                技術技能 ({scoringCriteria.technical_skills.weight}%)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>權重</Typography>
              <Slider
                value={scoringCriteria.technical_skills.weight}
                onChange={(_, value) => handleWeightChange('technical_skills', value as number)}
                min={0}
                max={50}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
            </Box>
            {renderSkillsSection(
              'technical_skills',
              'required_skills',
              '必需技能',
              '輸入技能名稱，如：React, Python, SQL'
            )}
            {renderSkillsSection(
              'technical_skills',
              'preferred_skills',
              '加分技能',
              '輸入加分技能，如：Docker, AWS, GraphQL'
            )}
          </AccordionDetails>
        </Accordion>

        {/* Experience */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ExperienceIcon color="primary" />
              <Typography variant="h6">
                工作經驗 ({scoringCriteria.experience.weight}%)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>權重</Typography>
              <Slider
                value={scoringCriteria.experience.weight}
                onChange={(_, value) => handleWeightChange('experience', value as number)}
                min={0}
                max={50}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
            </Box>
            <TextField
              fullWidth
              type="number"
              label="最少年資要求"
              value={scoringCriteria.experience.min_years}
              onChange={(e) => handleFieldChange('experience', 'min_years', parseInt(e.target.value) || 0)}
              sx={{ mb: 2 }}
              inputProps={{ min: 0, max: 20 }}
            />
            {renderSkillsSection(
              'experience',
              'preferred_domains',
              '偏好的工作領域',
              '輸入領域，如：金融科技, 電商, 遊戲'
            )}
          </AccordionDetails>
        </Accordion>

        {/* Education */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EducationIcon color="primary" />
              <Typography variant="h6">
                學歷要求 ({scoringCriteria.education.weight}%)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>權重</Typography>
              <Slider
                value={scoringCriteria.education.weight}
                onChange={(_, value) => handleWeightChange('education', value as number)}
                min={0}
                max={40}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
            </Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>最低學歷要求</InputLabel>
              <Select
                value={scoringCriteria.education.min_degree}
                label="最低學歷要求"
                onChange={(e) => handleFieldChange('education', 'min_degree', e.target.value)}
              >
                <MenuItem value="high_school">高中</MenuItem>
                <MenuItem value="associate">專科</MenuItem>
                <MenuItem value="bachelor">學士</MenuItem>
                <MenuItem value="master">碩士</MenuItem>
                <MenuItem value="doctorate">博士</MenuItem>
              </Select>
            </FormControl>
            {renderSkillsSection(
              'education',
              'preferred_majors',
              '偏好的主修科系',
              '輸入科系，如：資訊工程, 電機, 商管'
            )}
          </AccordionDetails>
        </Accordion>

        {/* Languages */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LanguageIcon color="primary" />
              <Typography variant="h6">
                語言能力 ({scoringCriteria.languages.weight}%)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>權重</Typography>
              <Slider
                value={scoringCriteria.languages.weight}
                onChange={(_, value) => handleWeightChange('languages', value as number)}
                min={0}
                max={30}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
            </Box>
            {renderSkillsSection(
              'languages',
              'required_languages',
              '必需語言',
              '輸入語言，如：中文, English, 日本語'
            )}
          </AccordionDetails>
        </Accordion>

        {/* Soft Skills */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SoftSkillsIcon color="primary" />
              <Typography variant="h6">
                軟技能 ({scoringCriteria.soft_skills.weight}%)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>權重</Typography>
              <Slider
                value={scoringCriteria.soft_skills.weight}
                onChange={(_, value) => handleWeightChange('soft_skills', value as number)}
                min={0}
                max={30}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
            </Box>
            {renderSkillsSection(
              'soft_skills',
              'preferred_skills',
              '重視的軟技能',
              '輸入軟技能，如：溝通能力, 團隊合作, 解決問題'
            )}
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            評分標準摘要
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI 將根據以上設定的標準對每份履歷進行評分，並計算出 0-100% 的適配度分數。
            權重越高的項目在最終評分中的影響越大。
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ScoringCriteriaEditor;