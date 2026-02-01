import { rgb } from 'pdf-lib';
import type { Color } from 'pdf-lib';

export interface InvoiceStyleConfig {
    colors: {
        /** Main text color (body, data) */
        text: Color;
        /** Secondary text (labels like "BILL TO:", "Bank Name") */
        label: Color;
        /** High emphasis text (Invoice Title, Amount Due Value) */
        emphasis: Color;
        /** Accent color for specific highlights (Soft Accent style) */
        accent: Color;
        /** Table grid lines and dividers */
        border: Color;
    };
    table: {
        /** Table header text color */
        headerText: Color;
        /** Grid line thickness */
        lineWidth: number;
    };
}

// Helper to Create RGB colors easily
const c = (r: number, g: number, b: number) => rgb(r, g, b);

// PALETTE
const BLACK = c(0, 0, 0);
const DARK_GRAY = c(0.2, 0.2, 0.2);
const GRAY = c(0.5, 0.5, 0.5);
const LIGHT_GRAY = c(0.7, 0.7, 0.7);
const SOFT_INDIGO = c(0.35, 0.35, 0.85); // Soft Indigo/Purple


export const STYLES: Record<string, InvoiceStyleConfig> = {
    // 1. DEFAULT: Neutral, monochrome, familiar. Black, white, soft gray.
    default: {
        colors: {
            text: BLACK,
            label: DARK_GRAY,
            emphasis: BLACK,
            accent: BLACK,
            border: LIGHT_GRAY,
        },
        table: {
            headerText: BLACK,
            lineWidth: 0.5,
        },
    },

    // 2. CLEAN: Modern but conservative. More white space feels (lighter lines). Grayscale, subtle.
    clean: {
        colors: {
            text: DARK_GRAY,
            label: GRAY,
            emphasis: BLACK,
            accent: DARK_GRAY,
            border: c(0.85, 0.85, 0.85), // Very light gray borders
        },
        table: {
            headerText: DARK_GRAY,
            lineWidth: 0.5,
        },
    },

    // 3. STANDARD: Business/Accounting. Structured/Firm. Grayscale, slightly stronger borders.
    standard: {
        colors: {
            text: BLACK,
            label: BLACK,
            emphasis: BLACK,
            accent: BLACK,
            border: GRAY, // Stronger gray
        },
        table: {
            headerText: BLACK,
            lineWidth: 1.0, // Thicker lines
        },
    },

    // 4. CLASSIC: Old-school. Pure black and white. Strong grid.
    classic: {
        colors: {
            text: BLACK,
            label: BLACK,
            emphasis: BLACK,
            accent: BLACK,
            border: BLACK, // Pure black borders
        },
        table: {
            headerText: BLACK,
            lineWidth: 1.0,
        },
    },

    // 5. SOFT ACCENT: Soft Indigo/Purple accents on Title, Header, Amount Due.
    soft_accent: {
        colors: {
            text: DARK_GRAY,
            label: GRAY,
            emphasis: SOFT_INDIGO, // Title and Amount due uses this
            accent: SOFT_INDIGO,
            border: c(0.8, 0.8, 0.9), // Tinge of cool gray
        },
        table: {
            headerText: SOFT_INDIGO, // Table header accent
            lineWidth: 0.5,
        },
    },
};
