import React from 'react';
import { Facebook, MessageCircle } from 'lucide-react';

interface DeveloperCardProps {
    variant?: 'compact' | 'full';
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({ variant = 'full' }) => {
    const isCompact = variant === 'compact';

    return (
        <div className={`flex flex-col items-center gap-4 ${isCompact ? 'scale-90 -mt-2' : 'mt-8'}`}>
            {/* Gradient Badge */}
            <div className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r from-teal-600 to-blue-700 shadow-xl transform hover:scale-105 transition-transform duration-300`}>
                <span className="text-white font-black text-sm lg:text-base tracking-wide whitespace-nowrap">
                    برمجة و تطوير د محمد صلاح جبر 2026
                </span>
            </div>

            {/* Icon Row: QR, WhatsApp, Facebook */}
            <div className="flex items-center gap-4 lg:gap-6">
                {/* QR Code Container */}
                <div className="group relative">
                    <div className="p-1 bg-white rounded-xl shadow-md border border-gray-100 group-hover:border-teal-500 transition-colors">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent('https://wa.me/201015668664')}`}
                            alt="Support QR"
                            className="w-10 h-10 lg:w-12 lg:h-12"
                        />
                    </div>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        تواصل معنا
                    </div>
                </div>

                {/* WhatsApp Icon */}
                <a
                    href="https://wa.me/201015668664"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 lg:p-3 rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    title="WhatsApp"
                >
                    <MessageCircle size={isCompact ? 18 : 22} />
                </a>

                {/* Facebook Icon */}
                <a
                    href="https://www.facebook.com/mohamed.salahgabr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 lg:p-3 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                    title="Facebook"
                >
                    <Facebook size={isCompact ? 18 : 22} />
                </a>
            </div>

            {/* Official Copyright Text */}
            <p className={`text-center font-bold text-gray-400 dark:text-zinc-500 tracking-tight ${isCompact ? 'text-[9px]' : 'text-xs lg:text-sm'}`}>
                جميع الحقوق محفوظة © 2026 نظام Nile المتكامل
            </p>
        </div>
    );
};
