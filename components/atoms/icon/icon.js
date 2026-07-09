/**
 * A16 — Standalone Icon atom.
 * Reusable icon component that accepts icon name (Font Awesome class) and colour.
 * Usage: renderIcon('fa-coins', { colour: '#f59e0b', size: 'lg', className: 'mr-2' })
 */
(function (global) {
    'use strict';

    const ICON_SIZES = {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl'
    };

    /**
     * Render a Font Awesome icon with optional colour and size.
     * @param {string} icon - Font Awesome icon class (e.g. 'fa-coins', 'fa-times')
     * @param {object} [opts] - Options
     * @param {string} [opts.colour] - CSS colour value (e.g. '#f59e0b', 'text-error', 'text-base-content/60')
     * @param {string} [opts.size] - Icon size key: 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl' (default 'md')
     * @param {string} [opts.className] - Additional CSS classes
     * @param {boolean} [opts.fixedWidth] - Whether to add fa-fw for fixed-width icons (default false)
     * @param {string} [opts.title] - Tooltip/title text
     * @param {string} [opts.id] - Element id attribute
     * @returns {string} HTML string
     */
    function renderIcon(icon, opts = {}) {
        const {
            colour = '',
            size = 'md',
            className = '',
            fixedWidth = false,
            title = '',
            id = ''
        } = opts;

        const sizeClass = ICON_SIZES[size] || ICON_SIZES.md;
        const colourStyle = colour && !colour.startsWith('text-') && !colour.startsWith('fill-')
            ? ` style="color:${colour}"`
            : '';
        const colourClass = colour && (colour.startsWith('text-') || colour.startsWith('fill-'))
            ? ` ${colour}`
            : '';
        const fwClass = fixedWidth ? ' fa-fw' : '';
        const idAttr = id ? ` id="${id}"` : '';
        const titleAttr = title ? ` title="${title}"` : '';

        return `<i class="fas ${icon}${fwClass} ${sizeClass}${colourClass}${className ? ` ${className}` : ''}"${idAttr}${titleAttr}${colourStyle} aria-hidden="true"></i>`;
    }

    global.MTFRegister({
        renderIcon,
        ICON_SIZES
    });
})(typeof window !== 'undefined' ? window : globalThis);