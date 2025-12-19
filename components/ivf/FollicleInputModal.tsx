import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';

interface FollicleInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (right: number[], left: number[]) => void;
    initialRight?: number[];
    initialLeft?: number[];
}

const FollicleInputModal: React.FC<FollicleInputModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialRight = [],
    initialLeft = [],
}) => {
    const [rightFollicles, setRightFollicles] = useState<number[]>(initialRight);
    const [leftFollicles, setLeftFollicles] = useState<number[]>(initialLeft);
    const [newRight, setNewRight] = useState<string>('');
    const [newLeft, setNewLeft] = useState<string>('');

    if (!isOpen) return null;

    const addFollicle = (side: 'right' | 'left') => {
        const value = side === 'right' ? newRight : newLeft;
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) return;

        if (side === 'right') {
            setRightFollicles([...rightFollicles, num].sort((a, b) => b - a));
            setNewRight('');
        } else {
            setLeftFollicles([...leftFollicles, num].sort((a, b) => b - a));
            setNewLeft('');
        }
    };

    const removeFollicle = (side: 'right' | 'left', index: number) => {
        if (side === 'right') {
            setRightFollicles(rightFollicles.filter((_, i) => i !== index));
        } else {
            setLeftFollicles(leftFollicles.filter((_, i) => i !== index));
        }
    };

    const getFollicleColor = (size: number): string => {
        if (size >= 18) return 'bg-green-500 text-white';
        if (size >= 14) return 'bg-blue-500 text-white';
        if (size >= 10) return 'bg-yellow-500 text-white';
        return 'bg-gray-300 text-gray-700';
    };

    const handleSave = () => {
        onSave(rightFollicles, leftFollicles);
        onClose();
    };

    const totalFollicles = rightFollicles.length + leftFollicles.length;
    const folliclesOver14 = [...rightFollicles, ...leftFollicles].filter(f => f >= 14).length;
    const folliclesOver17 = [...rightFollicles, ...leftFollicles].filter(f => f >= 17).length;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Folliculometry</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="mt-4 flex gap-4 text-sm">
                        <span className="bg-white/20 px-3 py-1 rounded-full">Total: {totalFollicles}</span>
                        <span className="bg-blue-400 px-3 py-1 rounded-full">≥14mm: {folliclesOver14}</span>
                        <span className="bg-green-400 px-3 py-1 rounded-full">≥17mm: {folliclesOver17}</span>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Right Ovary */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-blue-500"></span>
                                Right Ovary ({rightFollicles.length})
                            </h3>

                            {/* Input */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="number"
                                    step="0.5"
                                    placeholder="Size (mm)"
                                    value={newRight}
                                    onChange={(e) => setNewRight(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addFollicle('right')}
                                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500"
                                />
                                <button
                                    onClick={() => addFollicle('right')}
                                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Follicles */}
                            <div className="flex flex-wrap gap-2">
                                {rightFollicles.map((size, i) => (
                                    <div
                                        key={i}
                                        className={`${getFollicleColor(size)} px-3 py-1 rounded-full flex items-center gap-2 text-sm font-semibold`}
                                    >
                                        {size}mm
                                        <button
                                            onClick={() => removeFollicle('right', i)}
                                            className="hover:bg-black/20 rounded-full p-0.5"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {rightFollicles.length === 0 && (
                                    <span className="text-gray-400 text-sm">No follicles recorded</span>
                                )}
                            </div>
                        </div>

                        {/* Left Ovary */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-pink-500"></span>
                                Left Ovary ({leftFollicles.length})
                            </h3>

                            {/* Input */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="number"
                                    step="0.5"
                                    placeholder="Size (mm)"
                                    value={newLeft}
                                    onChange={(e) => setNewLeft(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addFollicle('left')}
                                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-500"
                                />
                                <button
                                    onClick={() => addFollicle('left')}
                                    className="bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-lg transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Follicles */}
                            <div className="flex flex-wrap gap-2">
                                {leftFollicles.map((size, i) => (
                                    <div
                                        key={i}
                                        className={`${getFollicleColor(size)} px-3 py-1 rounded-full flex items-center gap-2 text-sm font-semibold`}
                                    >
                                        {size}mm
                                        <button
                                            onClick={() => removeFollicle('left', i)}
                                            className="hover:bg-black/20 rounded-full p-0.5"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {leftFollicles.length === 0 && (
                                    <span className="text-gray-400 text-sm">No follicles recorded</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Size Legend</h4>
                        <div className="flex gap-4 text-xs">
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                                &lt;10mm
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                10-13mm
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                14-17mm
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                ≥18mm (Mature)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Save Follicles
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FollicleInputModal;
