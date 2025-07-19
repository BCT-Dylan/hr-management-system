import { 
  ApplicationStatus, 
  CreateApplicationStatusRequest, 
  UpdateApplicationStatusRequest,
  APIResponse 
} from '../types';
import { supabaseService } from './supabaseService';

class ApplicationStatusService {
  /**
   * Get all application statuses (active and inactive)
   */
  async getAllStatuses(): Promise<ApplicationStatus[]> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from('application_statuses')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Failed to fetch application statuses:', error);
        throw error;
      }

      return data.map(this.mapDatabaseToStatus);
    } catch (error) {
      console.error('Error fetching application statuses:', error);
      return [];
    }
  }

  /**
   * Get only active application statuses
   */
  async getActiveStatuses(): Promise<ApplicationStatus[]> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from('application_statuses')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Failed to fetch active application statuses:', error);
        throw error;
      }

      return data.map(this.mapDatabaseToStatus);
    } catch (error) {
      console.error('Error fetching active application statuses:', error);
      return [];
    }
  }

  /**
   * Get status by ID
   */
  async getStatusById(id: string): Promise<ApplicationStatus | null> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from('application_statuses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Failed to fetch application status:', error);
        return null;
      }

      return this.mapDatabaseToStatus(data);
    } catch (error) {
      console.error('Error fetching application status:', error);
      return null;
    }
  }

  /**
   * Get status by name
   */
  async getStatusByName(name: string): Promise<ApplicationStatus | null> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from('application_statuses')
        .select('*')
        .eq('name', name)
        .single();

      if (error) {
        console.error('Failed to fetch application status by name:', error);
        return null;
      }

      return this.mapDatabaseToStatus(data);
    } catch (error) {
      console.error('Error fetching application status by name:', error);
      return null;
    }
  }

  /**
   * Create a new application status
   */
  async createStatus(request: CreateApplicationStatusRequest): Promise<APIResponse<ApplicationStatus>> {
    try {
      // Validate name uniqueness
      const existingStatus = await this.getStatusByName(request.name);
      if (existingStatus) {
        return {
          success: false,
          error: '狀態名稱已存在，請使用不同的名稱'
        };
      }

      // Get next sort order if not provided
      let sortOrder = request.sortOrder;
      if (sortOrder === undefined) {
        const { data: maxData } = await supabaseService.getClient()
          .from('application_statuses')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1);
        
        sortOrder = (maxData?.[0]?.sort_order || 0) + 1;
      }

      const { data, error } = await supabaseService.getClient()
        .from('application_statuses')
        .insert([{
          name: request.name,
          display_name: request.displayName,
          description: request.description,
          color: request.color,
          sort_order: sortOrder,
          is_default: false,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Failed to create application status:', error);
        return {
          success: false,
          error: '建立狀態失敗：' + error.message
        };
      }

      return {
        success: true,
        data: this.mapDatabaseToStatus(data),
        message: '新增狀態成功'
      };
    } catch (error) {
      console.error('Error creating application status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '建立狀態時發生未知錯誤'
      };
    }
  }

  /**
   * Update an existing application status
   */
  async updateStatus(id: string, request: UpdateApplicationStatusRequest): Promise<APIResponse<ApplicationStatus>> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (request.displayName !== undefined) updateData.display_name = request.displayName;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.color !== undefined) updateData.color = request.color;
      if (request.isActive !== undefined) updateData.is_active = request.isActive;
      if (request.sortOrder !== undefined) updateData.sort_order = request.sortOrder;

      const { data, error } = await supabaseService.getClient()
        .from('application_statuses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update application status:', error);
        return {
          success: false,
          error: '更新狀態失敗：' + error.message
        };
      }

      return {
        success: true,
        data: this.mapDatabaseToStatus(data),
        message: '更新狀態成功'
      };
    } catch (error) {
      console.error('Error updating application status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新狀態時發生未知錯誤'  
      };
    }
  }

  /**
   * Delete an application status (only custom ones, not defaults)
   */
  async deleteStatus(id: string): Promise<APIResponse<void>> {
    try {
      // Check if status is in use
      const { data: applicantsData, error: applicantsError } = await supabaseService.getClient()
        .from('applicants')
        .select('id')
        .eq('status_id', id)
        .limit(1);

      if (applicantsError) {
        console.error('Failed to check status usage:', applicantsError);
        return {
          success: false,
          error: '檢查狀態使用情況失敗'
        };
      }

      if (applicantsData && applicantsData.length > 0) {
        return {
          success: false,
          error: '此狀態正在使用中，無法刪除。請先將使用此狀態的申請改為其他狀態。'
        };
      }

      // Check if it's a default status
      const status = await this.getStatusById(id);
      if (status?.isDefault) {
        return {
          success: false,
          error: '無法刪除系統預設狀態'
        };
      }

      const { error } = await supabaseService.getClient()
        .from('application_statuses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete application status:', error);
        return {
          success: false,
          error: '刪除狀態失敗：' + error.message
        };
      }

      return {
        success: true,
        message: '刪除狀態成功'
      };
    } catch (error) {
      console.error('Error deleting application status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '刪除狀態時發生未知錯誤'
      };
    }
  }

  /**
   * Reorder statuses
   */
  async reorderStatuses(statusOrders: { id: string; sortOrder: number }[]): Promise<APIResponse<void>> {
    try {
      const updates = statusOrders.map(({ id, sortOrder }) => 
        supabaseService.getClient()
          .from('application_statuses')
          .update({ sort_order: sortOrder, updated_at: new Date().toISOString() })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Failed to reorder statuses:', errors);
        return {
          success: false,
          error: '重新排序失敗'
        };
      }

      return {
        success: true,
        message: '排序更新成功'
      };
    } catch (error) {
      console.error('Error reordering statuses:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '重新排序時發生未知錯誤'
      };
    }
  }

  /**
   * Get count of applicants using each status
   */
  async getStatusUsageStats(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabaseService.getClient()
        .from('applicants')
        .select('status_id')
        .not('status_id', 'is', null);

      if (error) {
        console.error('Failed to fetch status usage stats:', error);
        return {};
      }

      const stats: Record<string, number> = {};
      data.forEach((item: any) => {
        if (item.status_id) {
          stats[item.status_id] = (stats[item.status_id] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching status usage stats:', error);
      return {};
    }
  }

  /**
   * Map database record to ApplicationStatus interface
   */
  private mapDatabaseToStatus(data: any): ApplicationStatus {
    return {
      id: data.id,
      name: data.name,
      displayName: data.display_name,
      description: data.description,
      color: data.color,
      isDefault: data.is_default,
      isActive: data.is_active,
      sortOrder: data.sort_order,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

export const applicationStatusService = new ApplicationStatusService();