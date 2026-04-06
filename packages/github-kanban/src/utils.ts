import type { CSSProperties } from 'react';
import type { Theme } from './types.js';

export function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
}

export function btnStyle(color: string): CSSProperties {
    return {
        background: 'transparent',
        border: `1px solid ${color}`,
        color,
        borderRadius: 4,
        padding: '3px 10px',
        fontSize: 11,
        cursor: 'pointer',
    };
}

export function inputStyle(theme: Theme): CSSProperties {
    return {
        background: theme.bgInput,
        border: `1px solid ${theme.borderCard}`,
        borderRadius: 6,
        color: theme.text,
        padding: '6px 10px',
        fontSize: 13,
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    };
}
