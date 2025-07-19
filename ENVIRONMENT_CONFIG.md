# 環境配置說明

## 開發工具組件控制

本項目中的AI測試組件（AI配置檢查 & AI連線測試）會根據環境自動顯示/隱藏：

### 開發環境 (development)
- **顯示**: AI配置檢查組件
- **顯示**: AI連線測試組件
- **用途**: 開發者可以測試AI連接和配置

### 生產環境 (production)
- **隱藏**: 所有AI測試組件
- **原因**: 避免在生產環境中暴露開發工具

## 實現方式

### 1. DevelopmentTools 組件
```typescript
// src/components/DevelopmentTools.tsx
const DevelopmentTools: React.FC = () => {
  // 只在開發環境中渲染
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <AIConfigTest />
      <AITestButton />
    </>
  );
};
```

### 2. 在頁面中使用
```typescript
// src/pages/JobDetailPage.tsx
import DevelopmentTools from '../components/DevelopmentTools';

// 在組件中直接使用，會自動根據環境顯示/隱藏
<DevelopmentTools />
```

## 環境變數

### 開發環境
```bash
NODE_ENV=development
npm start
```

### 生產環境構建
```bash
NODE_ENV=production
npm run build
```

## 測試方法

### 開發環境測試
1. 運行 `npm start`
2. 訪問履歷列表頁面
3. 應該能看到 "AI配置檢查" 和 "AI連線測試" 組件

### 生產環境測試
1. 運行 `npm run build`
2. 運行 `serve -s build`
3. 訪問履歷列表頁面
4. 不應該看到任何AI測試組件

## 其他可能的開發工具

如果未來需要添加其他開發工具，可以直接添加到 `DevelopmentTools` 組件中：

```typescript
const DevelopmentTools: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <AIConfigTest />
      <AITestButton />
      {/* 未來的開發工具可以添加在這裡 */}
      <DatabaseConnectionTest />
      <PerformanceMonitor />
    </>
  );
};
```