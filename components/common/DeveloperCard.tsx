import React from 'react';
import { Facebook, MessageCircle } from 'lucide-react';

interface DeveloperCardProps {
    variant?: 'compact' | 'full';
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({ variant = 'full' }) => {
    const isCompact = variant === 'compact';
    const whatsappUrl = "https://wa.me/201003418068";
    const facebookUrl = "https://www.facebook.com/profile.php?id=100000785193419";

    if (isCompact) {
        return (
            <div className="flex flex-col items-center py-4 border-t border-borderColor/50 bg-surface/30">
                <div className="flex flex-col items-center gap-1 group">
                    <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest opacity-60">
                        برمجة و تطوير
                    </span>
                    <span className="text-xs font-black text-foreground tracking-tight">
                        د : محمد صلاح جبر
                    </span>

                    {/* Compact Social Icons */}
                    <div className="flex items-center gap-3 mt-1.5 mb-1.5">
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all duration-300"
                        >
                            <MessageCircle size={14} />
                        </a>
                        <a
                            href={facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-full bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300"
                        >
                            <Facebook size={14} />
                        </a>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1 bg-brand/5 rounded-full border border-brand/10">
                        <span className="text-[9px] font-bold text-brand uppercase tracking-tighter">
                            جميع الحقوق محفوظة
                        </span>
                        <span className="w-1 h-1 rounded-full bg-brand/30"></span>
                        <span className="text-[9px] font-black text-brand tracking-widest">
                            2026
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 mt-8 pt-8 border-t border-gray-100">
            <div className="text-center group">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 mb-3 group-hover:bg-brand/5 group-hover:border-brand/20 transition-all duration-300">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                        برمجة و تطوير
                    </span>
                </div>

                <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                    د : محمد صلاح جبر
                </h3>

                {/* Full Social Buttons */}
                <div className="flex items-center justify-center gap-4 mb-4">
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-600 border border-green-100 hover:bg-green-600 hover:text-white hover:shadow-lg hover:shadow-green-200 transition-all duration-300 group/link"
                    >
                        <MessageCircle size={18} className="group-hover/link:scale-110 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-wider">WhatsApp</span>
                    </a>
                    <a
                        href={facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 group/link"
                    >
                        <Facebook size={18} className="group-hover/link:scale-110 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-wider">Facebook</span>
                    </a>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                        جميع الحقوق محفوظة
                    </p>
                    <div className="inline-block px-6 py-1 rounded-full bg-gradient-to-r from-teal-600 to-blue-700 shadow-xl shadow-blue-500/10">
                        <span className="text-white font-black text-base tracking-[0.3em]">
                            2026
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
