/**
 * RequireRole.tsx
 * Role-based access control component
 * Redirects users based on their role and required permissions
 */

import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { adminAuthService } from '../../services/adminAuthService';
import toast from 'react-hot-toast';

interface RequireRoleProps {
  allowedRoles: string[];
  children: React.ReactNode;
  redirectTo?: 'home' | 'reception';
  showError?: boolean;
}

export const RequireRole: React.FC<RequireRoleProps> = ({
  allowedRoles,
  children,
  redirectTo = 'home',
  showError = true
}) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // Check if this is an admin login
      if (allowedRoles.includes('admin') || allowedRoles.includes('super_admin')) {
        const isAdminAuth = adminAuthService.isAuthenticated();
        
        if (isAdminAuth) {
          const admin = adminAuthService.getCurrentAdmin();
          
          if (admin) {
            // Admin is authenticated
            setHasAccess(true);
            return;
          }
        }
        
        // Not authenticated as admin
        setHasAccess(false);
        if (showError) {
          toast.error('يجب تسجيل الدخول كأدمن للوصول لهذه الصفحة');
        }
        return;
      }

      // Regular user role check (doctor/secretary)
      const userRole = await authService.getUserRole();
      
      if (!userRole) {
        setHasAccess(false);
        if (showError) {
          toast.error('لا يمكن تحديد صلاحياتك. يرجى تسجيل الدخول مرة أخرى.');
        }
        return;
      }

      const hasPermission = allowedRoles.includes(userRole);
      setHasAccess(hasPermission);

      if (!hasPermission && showError) {
        toast.error('ليس لديك صلاحية الوصول إلى هذه الصفحة');
      }
    } catch (error) {
      console.error('Error checking role:', error);
      setHasAccess(false);
      if (showError) {
        toast.error('حدث خطأ في التحقق من الصلاحيات');
      }
    }
  };

  // Loading state
  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // Access denied - show message
  if (!hasAccess) {
    const isAdminPage = allowedRoles.includes('admin') || allowedRoles.includes('super_admin');
    
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-400/50">
            <svg className="w-10 h-10 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">ممنوع الدخول</h2>
          <p className="text-purple-200 mb-6 leading-relaxed">
            {isAdminPage 
              ? 'هذه الصفحة مخصصة للمدراء فقط. يرجى تسجيل الدخول من خلال صفحة دخول الأدمن.'
              : 'ليس لديك صلاحية الوصول إلى هذه الصفحة. يرجى التواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAdminPage && (
              <button
                onClick={() => window.location.href = '/admin-login'}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all font-bold shadow-lg"
              >
                تسجيل دخول الأدمن
              </button>
            )}
            <button
              onClick={() => window.location.href = redirectTo === 'reception' ? '/reception' : '/'}
              className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all font-bold"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Has access - render children
  return <>{children}</>;
};

export default RequireRole;
