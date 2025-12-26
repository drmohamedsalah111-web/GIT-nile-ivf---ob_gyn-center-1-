/**
 * RequireRole.tsx
 * Role-based access control component
 * Redirects users based on their role and required permissions
 */

import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
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
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ممنوع الدخول</h2>
          <p className="text-gray-600 mb-6">
            ليس لديك صلاحية الوصول إلى هذه الصفحة. يرجى التواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ.
          </p>
          <button
            onClick={() => window.location.href = redirectTo === 'reception' ? '/reception' : '/'}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            العودة إلى الصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  // Has access - render children
  return <>{children}</>;
};

export default RequireRole;
