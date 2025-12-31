import React from 'react';

interface DeveloperCardProps {
    variant?: 'compact' | 'full';
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({ variant = 'full' }) => {
    const isCompact = variant === 'compact';

    if (isCompact) {
        return (
            <div className="flex flex-col items-center py-4 border-t border-borderColor/50 bg-surface/30">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-textSecondary uppercase tracking-widest opacity-60">
                        برمجة و تطوير
                    </span>
                    <span className="text-xs font-black text-foreground tracking-tight">
                        د : محمد صلاح جبر
                    </span>
                    <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-brand/5 rounded-full border border-brand/10">
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
