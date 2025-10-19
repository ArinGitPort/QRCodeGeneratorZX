/**
 * Utility functions for QR Code Generator
 */
export class Utils {
    /**
     * Validates email address format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if valid email
     */
    static isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    /**
     * Validates URL format
     * @param {string} url - URL to validate
     * @returns {boolean} - True if valid URL
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Ensures URL has protocol
     * @param {string} url - URL to process
     * @returns {string} - URL with protocol
     */
    static ensureProtocol(url) {
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            return 'https://' + url;
        }
        return url;
    }

    /**
     * Rounds value to nearest multiple
     * @param {number} value - Value to round
     * @param {number} multiple - Multiple to round to
     * @returns {number} - Rounded value
     */
    static roundToNearest(value, multiple) {
        return Math.round(value / multiple) * multiple;
    }

    /**
     * Clamps value between min and max
     * @param {number} value - Value to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} - Clamped value
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Generates timestamp for filenames
     * @returns {string} - Timestamp string
     */
    static generateTimestamp() {
        return Date.now().toString();
    }

    /**
     * Truncates text to specified length
     * @param {string} text - Text to truncate
     * @param {number} length - Maximum length
     * @returns {string} - Truncated text
     */
    static truncateText(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
}