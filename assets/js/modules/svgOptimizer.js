/**
 * SVG Optimizer Module
 * Optimizes QR code SVGs by converting multiple <rect> elements into a single <path> element
 * This dramatically reduces file size and improves performance in design tools like Illustrator
 */

/**
 * Optimizes an SVG string by merging all black rectangles into a single path
 * @param {string} svgString - The original SVG string with multiple <rect> elements
 * @returns {string} - Optimized SVG string with a single <path> element
 */
export function optimizeSVG(svgString) {
    try {
        // Parse the SVG string
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        
        // Check for parsing errors
        if (svgElement.nodeName === 'parsererror') {
            throw new Error('Invalid SVG string provided');
        }
        
        // Extract all rect elements
        const rects = svgElement.querySelectorAll('rect');
        
        if (rects.length === 0) {
            return svgString; // No rects to optimize
        }
        
        // Get SVG dimensions for validation
        const svgWidth = parseFloat(svgElement.getAttribute('width')) || 0;
        const svgHeight = parseFloat(svgElement.getAttribute('height')) || 0;
        
        // Convert rects to path data
        const pathData = convertRectsToPath(rects, svgWidth, svgHeight);
        
        if (!pathData) {
            return svgString; // Fallback to original if conversion fails
        }
        
        // Create optimized SVG
        const optimizedSVG = createOptimizedSVG(svgElement, pathData);
        
        return optimizedSVG;
        
    } catch (error) {
        console.warn('SVG optimization failed:', error.message);
        return svgString; // Return original SVG on error
    }
}

/**
 * Converts rect elements to a single path data string
 * @param {NodeList} rects - Collection of rect elements
 * @param {number} svgWidth - SVG width for validation
 * @param {number} svgHeight - SVG height for validation
 * @returns {string|null} - Path data string or null if conversion fails
 */
function convertRectsToPath(rects, svgWidth, svgHeight) {
    const rectangles = [];
    
    // Extract rectangle data from each rect element
    for (const rect of rects) {
        const x = parseFloat(rect.getAttribute('x')) || 0;
        const y = parseFloat(rect.getAttribute('y')) || 0;
        const width = parseFloat(rect.getAttribute('width')) || 0;
        const height = parseFloat(rect.getAttribute('height')) || 0;
        const fill = rect.getAttribute('fill') || '#000000';
        
        // Only process black/dark rectangles (ignore white/transparent ones)
        if (isBlackColor(fill) && width > 0 && height > 0) {
            // Validate coordinates are within SVG bounds
            if (x >= 0 && y >= 0 && x + width <= svgWidth && y + height <= svgHeight) {
                rectangles.push({ x, y, width, height });
            }
        }
    }
    
    if (rectangles.length === 0) {
        return null;
    }
    
    // Sort rectangles for consistent path generation (top to bottom, left to right)
    rectangles.sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
    });
    
    // Generate path data using move-to and rectangle commands
    const pathCommands = [];
    
    for (const rect of rectangles) {
        // Use 'M' (move-to) and 'h', 'v' (horizontal/vertical line) commands for rectangles
        // This creates a more compact path than using absolute coordinates
        pathCommands.push(
            `M${rect.x},${rect.y}`,           // Move to top-left corner
            `h${rect.width}`,                 // Horizontal line to top-right
            `v${rect.height}`,                // Vertical line to bottom-right
            `h${-rect.width}`,                // Horizontal line back to bottom-left
            'z'                               // Close path back to start
        );
    }
    
    return pathCommands.join('');
}

/**
 * Creates an optimized SVG string with a single path element
 * @param {Element} originalSvg - Original SVG element
 * @param {string} pathData - Path data string
 * @returns {string} - Optimized SVG string
 */
function createOptimizedSVG(originalSvg, pathData) {
    // Extract attributes from original SVG
    const width = originalSvg.getAttribute('width') || '100';
    const height = originalSvg.getAttribute('height') || '100';
    const viewBox = originalSvg.getAttribute('viewBox') || `0 0 ${width} ${height}`;
    
    // Find background color from original SVG (look for white/light background rects)
    let backgroundColor = '#ffffff'; // Default white
    const backgroundRect = originalSvg.querySelector('rect[fill="#ffffff"], rect[fill="white"], rect[fill="#fff"]');
    if (backgroundRect) {
        backgroundColor = backgroundRect.getAttribute('fill') || '#ffffff';
    }
    
    // Create optimized SVG with minimal structure
    const optimizedSVG = `<svg width="${width}" height="${height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${backgroundColor}"/>
  <path d="${pathData}" fill="#000000" fill-rule="evenodd"/>
</svg>`;
    
    return optimizedSVG;
}

/**
 * Determines if a color string represents a black or dark color
 * @param {string} color - Color string (hex, rgb, named color, etc.)
 * @returns {boolean} - True if the color is considered black/dark
 */
function isBlackColor(color) {
    if (!color) return false;
    
    // Normalize color string
    const normalizedColor = color.toLowerCase().trim();
    
    // Check for common black color representations
    const blackColors = [
        '#000000', '#000', 'black', 'rgb(0,0,0)', 'rgb(0, 0, 0)',
        'rgba(0,0,0,1)', 'rgba(0, 0, 0, 1)', 'hsl(0,0%,0%)'
    ];
    
    if (blackColors.includes(normalizedColor)) {
        return true;
    }
    
    // Check hex colors for very dark colors (threshold: #333333 or darker)
    const hexMatch = normalizedColor.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (hexMatch) {
        const hex = hexMatch[1];
        let r, g, b;
        
        if (hex.length === 3) {
            // Convert 3-digit hex to 6-digit
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else {
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        }
        
        // Consider colors with all RGB values <= 51 (0x33) as "black"
        return r <= 51 && g <= 51 && b <= 51;
    }
    
    // Check RGB colors
    const rgbMatch = normalizedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        return r <= 51 && g <= 51 && b <= 51;
    }
    
    return false;
}

/**
 * Gets optimization statistics for an SVG
 * @param {string} originalSvg - Original SVG string
 * @param {string} optimizedSvg - Optimized SVG string
 * @returns {object} - Statistics object with size reduction info
 */
export function getOptimizationStats(originalSvg, optimizedSvg) {
    const originalSize = new Blob([originalSvg]).size;
    const optimizedSize = new Blob([optimizedSvg]).size;
    const reduction = originalSize - optimizedSize;
    const reductionPercent = ((reduction / originalSize) * 100).toFixed(1);
    
    // Count elements in original SVG
    const parser = new DOMParser();
    const originalDoc = parser.parseFromString(originalSvg, 'image/svg+xml');
    const originalRects = originalDoc.querySelectorAll('rect').length;
    
    return {
        originalSize,
        optimizedSize,
        reduction,
        reductionPercent: parseFloat(reductionPercent),
        originalElements: originalRects,
        optimizedElements: 2, // background rect + path
        elementsReduced: originalRects - 2
    };
}

/**
 * Validates that an optimized SVG is visually equivalent to the original
 * This is a basic validation - for production use, consider more sophisticated comparison
 * @param {string} originalSvg - Original SVG string
 * @param {string} optimizedSvg - Optimized SVG string
 * @returns {boolean} - True if SVGs appear to be equivalent
 */
export function validateOptimization(originalSvg, optimizedSvg) {
    try {
        const parser = new DOMParser();
        
        // Parse both SVGs
        const originalDoc = parser.parseFromString(originalSvg, 'image/svg+xml');
        const optimizedDoc = parser.parseFromString(optimizedSvg, 'image/svg+xml');
        
        // Check for parsing errors
        if (originalDoc.documentElement.nodeName === 'parsererror' || 
            optimizedDoc.documentElement.nodeName === 'parsererror') {
            return false;
        }
        
        // Compare dimensions
        const originalSvgEl = originalDoc.documentElement;
        const optimizedSvgEl = optimizedDoc.documentElement;
        
        const originalWidth = originalSvgEl.getAttribute('width');
        const originalHeight = originalSvgEl.getAttribute('height');
        const optimizedWidth = optimizedSvgEl.getAttribute('width');
        const optimizedHeight = optimizedSvgEl.getAttribute('height');
        
        if (originalWidth !== optimizedWidth || originalHeight !== optimizedHeight) {
            return false;
        }
        
        // Basic element count validation
        const originalRects = originalDoc.querySelectorAll('rect[fill="#000000"], rect[fill="black"]').length;
        const optimizedPaths = optimizedDoc.querySelectorAll('path').length;
        
        // Should have at least one path in optimized version if there were black rects in original
        return originalRects > 0 ? optimizedPaths > 0 : true;
        
    } catch (error) {
        console.warn('SVG validation failed:', error.message);
        return false;
    }
}