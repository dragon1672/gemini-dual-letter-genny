import React, { useState } from 'react';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
    contentClassName?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ 
    title, 
    children, 
    defaultOpen = true,
    className = "",
    contentClassName = "p-4"
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className={`border border-gray-700 rounded bg-gray-800/50 ${className}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 text-xs font-bold text-gray-300 hover:bg-gray-700/50 transition-colors uppercase tracking-wider"
            >
                <span>{title}</span>
                <i className={`fas fa-chevron-down transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && <div className={`border-t border-gray-700 space-y-4 ${contentClassName}`}>{children}</div>}
        </div>
    );
};