// 在瀏覽器控制台執行此腳本來檢查環境變數
console.log('=== 環境變數檢查 ===');
console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? '已設置' : '未設置');
console.log('金鑰長度:', process.env.REACT_APP_SUPABASE_ANON_KEY?.length || 0);
console.log('金鑰前幾個字符:', process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 10) + '...' || '無');

// 測試Supabase連接
import { supabase } from '../lib/supabase.ts';
console.log('Supabase客戶端:', supabase);

// 簡單測試查詢
supabase.from('jobs').select('count').limit(1).then(
  ({ data, error }) => {
    if (error) {
      console.error('連接錯誤:', error);
    } else {
      console.log('連接成功:', data);
    }
  }
);