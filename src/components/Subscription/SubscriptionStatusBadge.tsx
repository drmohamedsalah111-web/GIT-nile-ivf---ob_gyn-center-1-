import React from 'react';

interface SubscriptionStatusBadgeProps {
  status: string;
}

export const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({ status }) => {
  const styles = {
    active: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-orange-100 text-orange-700 border-orange-200',
    trial: 'bg-blue-100 text-blue-700 border-blue-200',
    expired: 'bg-red-100 text-red-700 border-red-200',
    suspended: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200'
  };
  
  const labels = {
    active: 'نشط',
    pending: 'قيد المراجعة',
    trial: 'تجريبي',
    expired: 'منتهي',
    suspended: 'قيد المراجعة', // suspended = pending في نظامنا
    cancelled: 'ملغي'
  };

  const currentStyle = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
  const label = labels[status as keyof typeof labels] || status;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentStyle}`}>
      {label}
    </span>
  );
};
