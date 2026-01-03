import { supabase } from './supabaseClient';
import bcrypt from 'bcryptjs';

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'moderator' | 'viewer';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface AdminLoginResponse {
  success: boolean;
  admin?: Admin;
  token?: string;
  error?: string;
}

/**
 * 🔐 خدمة مصادقة الأدمن - منفصلة تماماً عن نظام العيادات
 */
class AdminAuthService {
  private currentAdmin: Admin | null = null;
  private readonly ADMIN_TOKEN_KEY = 'admin_auth_token';
  private readonly ADMIN_DATA_KEY = 'admin_data';

  /**
   * تسجيل دخول الأدمن
   */
  async login(email: string, password: string): Promise<AdminLoginResponse> {
    try {
      // 1. جلب بيانات الأدمن من قاعدة البيانات
      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !admin) {
        return {
          success: false,
          error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        };
      }

      // 2. التحقق من كلمة المرور
      const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
      
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        };
      }

      // 3. إنشاء token بسيط (في الإنتاج، استخدم JWT)
      const token = this.generateToken(admin.id);

      // 4. تحديث آخر دخول
      await supabase.rpc('update_admin_last_login', { admin_id_param: admin.id });

      // 5. تسجيل نشاط الدخول
      await this.logActivity(admin.id, 'login', {
        ip: await this.getClientIP(),
        userAgent: navigator.userAgent
      });

      // 6. حفظ البيانات محلياً
      this.currentAdmin = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        is_active: admin.is_active,
        last_login: admin.last_login,
        created_at: admin.created_at
      };

      localStorage.setItem(this.ADMIN_TOKEN_KEY, token);
      localStorage.setItem(this.ADMIN_DATA_KEY, JSON.stringify(this.currentAdmin));
      localStorage.setItem('adminLogin', 'true'); // ✅ علامة للسوبر أدمن

      return {
        success: true,
        admin: this.currentAdmin,
        token
      };
    } catch (error: any) {
      console.error('Admin login error:', error);
      return {
        success: false,
        error: error.message || 'حدث خطأ أثناء تسجيل الدخول'
      };
    }
  }

  /**
   * تسجيل خروج الأدمن
   */
  async logout(): Promise<void> {
    try {
      if (this.currentAdmin) {
        await this.logActivity(this.currentAdmin.id, 'logout');
      }
    } catch (error) {
      console.error('Error logging admin logout:', error);
    } finally {
      this.currentAdmin = null;
      localStorage.removeItem(this.ADMIN_TOKEN_KEY);
      localStorage.removeItem(this.ADMIN_DATA_KEY);
      localStorage.removeItem('adminLogin'); // تنظيف أي علامات قديمة
    }
  }

  /**
   * الحصول على الأدمن الحالي
   */
  getCurrentAdmin(): Admin | null {
    if (this.currentAdmin) {
      return this.currentAdmin;
    }

    // محاولة استرجاع من localStorage
    const storedData = localStorage.getItem(this.ADMIN_DATA_KEY);
    const storedToken = localStorage.getItem(this.ADMIN_TOKEN_KEY);

    if (storedData && storedToken) {
      try {
        this.currentAdmin = JSON.parse(storedData);
        return this.currentAdmin;
      } catch (error) {
        console.error('Error parsing stored admin data:', error);
        this.logout();
      }
    }

    return null;
  }

  /**
   * التحقق من تسجيل الدخول
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.ADMIN_TOKEN_KEY);
    return !!token && !!this.getCurrentAdmin();
  }

  /**
   * تغيير كلمة المرور
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const admin = this.getCurrentAdmin();
      if (!admin) {
        return { success: false, error: 'لم يتم تسجيل الدخول' };
      }

      // 1. التحقق من كلمة المرور الحالية
      const { data: adminData, error: fetchError } = await supabase
        .from('admins')
        .select('password_hash')
        .eq('id', admin.id)
        .single();

      if (fetchError || !adminData) {
        return { success: false, error: 'حدث خطأ أثناء التحقق' };
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminData.password_hash);
      if (!isCurrentPasswordValid) {
        return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
      }

      // 2. تشفير كلمة المرور الجديدة
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // 3. تحديث كلمة المرور
      const { error: updateError } = await supabase
        .from('admins')
        .update({ 
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', admin.id);

      if (updateError) {
        return { success: false, error: 'فشل تحديث كلمة المرور' };
      }

      // 4. تسجيل النشاط
      await this.logActivity(admin.id, 'password_changed');

      return { success: true };
    } catch (error: any) {
      console.error('Change password error:', error);
      return { success: false, error: error.message || 'حدث خطأ' };
    }
  }

  /**
   * تسجيل نشاط الأدمن
   */
  async logActivity(
    adminId: string, 
    action: string, 
    details: any = {}
  ): Promise<void> {
    try {
      await supabase.rpc('log_admin_activity', {
        admin_id_param: adminId,
        action_param: action,
        details_param: details,
        ip_param: await this.getClientIP(),
        user_agent_param: navigator.userAgent
      });
    } catch (error) {
      console.error('Error logging admin activity:', error);
    }
  }

  /**
   * إنشاء token بسيط
   */
  private generateToken(adminId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return btoa(`${adminId}:${timestamp}:${random}`);
  }

  /**
   * الحصول على IP العميل (تقريبي)
   */
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * جلب سجل نشاط الأدمن
   */
  async getActivityLog(limit: number = 50): Promise<any[]> {
    try {
      const admin = this.getCurrentAdmin();
      if (!admin) return [];

      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .eq('admin_id', admin.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activity log:', error);
      return [];
    }
  }

  /**
   * جلب كل الأدمن (للـ Super Admin فقط)
   */
  async getAllAdmins(): Promise<Admin[]> {
    try {
      const currentAdmin = this.getCurrentAdmin();
      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
        throw new Error('غير مصرح');
      }

      const { data, error } = await supabase
        .from('admins')
        .select('id, name, email, role, is_active, last_login, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching admins:', error);
      return [];
    }
  }
}

export const adminAuthService = new AdminAuthService();
