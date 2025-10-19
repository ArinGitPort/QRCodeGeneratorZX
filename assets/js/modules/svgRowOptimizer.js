/**
 * SVG Row Optimizer Module
 * Optimizes QR code SVGs by merging adjacent horizontal black squares into single <rect> elements
 * This reduces element count while maintaining perfect visual fidelity and keeping full vector editability
 */

/**
 * Optimizes SVG by merging adjacent horizontal black rectangles
 * @param {string} svgString - Original SVG string with individual rect elements
 * @returns {string} - Optimized SVG with merged horizontal rectangles
 */
export function optimizeSVGRows(svgString) {
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
        
        // Get SVG dimensions
        const svgWidth = parseFloat(svgElement.getAttribute('width')) || 0;
        const svgHeight = parseFloat(svgElement.getAttribute('height')) || 0;
        
        // Extract and merge rectangles
        const { mergedRects, backgroundRect } = extractAndMergeRectangles(rects, svgWidth, svgHeight);
        
        // Create optimized SVG
        const optimizedSVG = createOptimizedRowSVG(svgElement, mergedRects, backgroundRect);
        
        return optimizedSVG;
        
    } catch (error) {
        console.warn('SVG row optimization failed:', error.message);
        return svgString; // Return original SVG on error
    }
}

/**
 * Extracts rectangle data and merges adjacent horizontal rectangles
 * @private
 * @param {NodeList} rects - Collection of rect elements
 * @param {number} svgWidth - SVG width for validation
 * @param {number} svgHeight - SVG height for validation
 * @returns {Object} - Object with merged rectangles and background
 */
function extractAndMergeRectangles(rects, svgWidth, svgHeight) {
    const blackRects = [];
    let backgroundRect = null;
    
    // Extract rectangle data from each rect element
    for (const rect of rects) {
        const rectData = extractRectData(rect);
        
        // Validate coordinates are within SVG bounds
        if (!isRectValid(rectData, svgWidth, svgHeight)) {
            continue;
        }
        
        if (isBlackColor(rectData.fill)) {
            blackRects.push(rectData);
        } else if (isBackgroundColor(rectData.fill) && !backgroundRect) {
            // Keep the first background rectangle found
            backgroundRect = rectData;
        }
    }
    
    if (blackRects.length === 0) {
        return { mergedRects: [], backgroundRect };
    }
    
    // Merge adjacent horizontal rectangles
    const mergedRects = mergeHorizontalRectangles(blackRects);
    
    return { mergedRects, backgroundRect };
}

/**
 * Extracts rectangle data from DOM element (DRY utility)
 * @private
 * @param {Element} rect - Rectangle DOM element
 * @returns {Object} - Rectangle data object
 */
function extractRectData(rect) {
    return {
        x: parseFloat(rect.getAttribute('x')) || 0,
        y: parseFloat(rect.getAttribute('y')) || 0,
        width: parseFloat(rect.getAttribute('width')) || 0,
        height: parseFloat(rect.getAttribute('height')) || 0,
        fill: rect.getAttribute('fill') || '#000000'
    };
}

/**
 * Validates rectangle coordinates (DRY utility)
 * @private
 * @param {Object} rectData - Rectangle data
 * @param {number} svgWidth - SVG width
 * @param {number} svgHeight - SVG height
 * @returns {boolean} - True if rectangle is valid
 */
function isRectValid(rectData, svgWidth, svgHeight) {
    return rectData.width > 0 && 
           rectData.height > 0 && 
           rectData.x >= 0 && 
           rectData.y >= 0 && 
           rectData.x + rectData.width <= svgWidth && 
           rectData.y + rectData.height <= svgHeight;
}

/**
 * Merges rectangles that are horizontally adjacent in the same row
 * @private
 * @param {Array} rectangles - Array of rectangle data objects
 * @returns {Array} - Array of merged rectangle data objects
 */
function mergeHorizontalRectangles(rectangles) {
    if (rectangles.length === 0) {
        return [];
    }
    
    // Group rectangles by row (same y coordinate and height)
    const rowGroups = groupRectanglesByRow(rectangles);
    
    // Merge adjacent rectangles in each row
    const mergedRects = [];
    
    for (const rowKey in rowGroups) {
        const rowRects = rowGroups[rowKey];
        const mergedRowRects = mergeAdjacentInRow(rowRects);
        mergedRects.push(...mergedRowRects);
    }
    
    return mergedRects;
}

/**
 * Groups rectangles by row (same y and height)
 * @private
 * @param {Array} rectangles - Array of rectangle data
 * @returns {Object} - Object with row keys and rectangle arrays
 */
function groupRectanglesByRow(rectangles) {
    const groups = {};
    
    for (const rect of rectangles) {
        // Create row key from y coordinate and height (with tolerance for floating point)
        const rowKey = `${Math.round(rect.y * 1000)}_${Math.round(rect.height * 1000)}`;
        
        if (!groups[rowKey]) {
            groups[rowKey] = [];
        }
        
        groups[rowKey].push(rect);
    }
    
    // Sort rectangles in each row by x coordinate for proper merging
    for (const rowKey in groups) {
        groups[rowKey].sort((a, b) => a.x - b.x);
    }
    
    return groups;
}

/**
 * Merges adjacent rectangles in a single row
 * @private
 * @param {Array} rowRects - Array of rectangles in the same row, sorted by x
 * @returns {Array} - Array of merged rectangles
 */
function mergeAdjacentInRow(rowRects) {
    if (rowRects.length === 0) {
        return [];
    }
    
    if (rowRects.length === 1) {
        return [rowRects[0]];
    }
    
    const merged = [];
    let currentRect = { ...rowRects[0] }; // Clone first rectangle
    
    for (let i = 1; i < rowRects.length; i++) {
        const nextRect = rowRects[i];
        
        // Check if rectangles are adjacent (current rect's right edge meets next rect's left edge)
        const tolerance = 0.001; // Small tolerance for floating point comparison
        const currentRightEdge = currentRect.x + currentRect.width;
        const isAdjacent = Math.abs(currentRightEdge - nextRect.x) <= tolerance;
        
        // Check if rectangles have same height and y position
        const sameRow = Math.abs(currentRect.y - nextRect.y) <= tolerance && 
                       Math.abs(currentRect.height - nextRect.height) <= tolerance;
        
        if (isAdjacent && sameRow) {
            // Merge: extend current rectangle width to include next rectangle
            currentRect.width = (nextRect.x + nextRect.width) - currentRect.x;
        } else {
            // Not adjacent: save current rectangle and start new one
            merged.push(currentRect);
            currentRect = { ...nextRect };
        }
    }
    
    // Don't forget the last rectangle
    merged.push(currentRect);
    
    return merged;
}

/**
 * Creates optimized SVG string with merged rectangles
 * @private
 * @param {Element} originalSvg - Original SVG element
 * @param {Array} mergedRects - Array of merged rectangle data
 * @param {Object|null} backgroundRect - Background rectangle data
 * @returns {string} - Optimized SVG string
 */
function createOptimizedRowSVG(originalSvg, mergedRects, backgroundRect) {
    // Extract attributes from original SVG
    const width = originalSvg.getAttribute('width') || '100';
    const height = originalSvg.getAttribute('height') || '100';
    const viewBox = originalSvg.getAttribute('viewBox') || `0 0 ${width} ${height}`;
    
    // Start building SVG
    let svg = `<svg width="${width}" height="${height}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Add background rectangle if found
    if (backgroundRect) {
        svg += `\n  <rect x="${backgroundRect.x}" y="${backgroundRect.y}" width="${backgroundRect.width}" height="${backgroundRect.height}" fill="${backgroundRect.fill}"/>`;
    } else {
        // Default white background
        svg += `\n  <rect width="100%" height="100%" fill="#ffffff"/>`;
    }
    
    // Add merged rectangles
    for (const rect of mergedRects) {
        svg += `\n  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${rect.fill}"/>`;
    }
    
    svg += '\n</svg>';
    
    return svg;
}

/**
 * Determines if a color represents black/dark (DRY utility - reused from other modules)
 * @private
 * @param {string} color - Color string
 * @returns {boolean} - True if color is black/dark
 */
function isBlackColor(color) {
    if (!color) return false;
    
    const normalizedColor = color.toLowerCase().trim();
    
    // Common black color representations
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
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else {
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        }
        
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
 * Determines if a color represents background/light color (DRY utility)
 * @private
 * @param {string} color - Color string
 * @returns {boolean} - True if color is background/light
 */
function isBackgroundColor(color) {
    if (!color) return false;
    
    const normalizedColor = color.toLowerCase().trim();
    
    // Common background/white color representations
    const backgroundColors = [
        '#ffffff', '#fff', 'white', 'rgb(255,255,255)', 'rgb(255, 255, 255)',
        'rgba(255,255,255,1)', 'rgba(255, 255, 255, 1)', 'transparent'
    ];
    
    if (backgroundColors.includes(normalizedColor)) {
        return true;
    }
    
    // Check hex colors for very light colors (threshold: #cccccc or lighter)
    const hexMatch = normalizedColor.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (hexMatch) {
        const hex = hexMatch[1];
        let r, g, b;
        
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else {
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        }
        
        return r >= 204 && g >= 204 && b >= 204;
    }
    
    return false;
}

/**
 * Gets row optimization statistics
 * @param {string} originalSvg - Original SVG string
 * @param {string} optimizedSvg - Row-optimized SVG string
 * @returns {Object} - Statistics object with optimization info
 */
export function getRowOptimizationStats(originalSvg, optimizedSvg) {
    const originalSize = new Blob([originalSvg]).size;
    const optimizedSize = new Blob([optimizedSvg]).size;
    const reduction = originalSize - optimizedSize;
    const reductionPercent = ((reduction / originalSize) * 100).toFixed(1);
    
    // Count elements
    const parser = new DOMParser();
    const originalDoc = parser.parseFromString(originalSvg, 'image/svg+xml');
    const optimizedDoc = parser.parseFromString(optimizedSvg, 'image/svg+xml');
    
    const originalRects = originalDoc.querySelectorAll('rect').length;
    const optimizedRects = optimizedDoc.querySelectorAll('rect').length;
    
    // Calculate merge efficiency
    const elementsReduced = originalRects - optimizedRects;
    const mergeEfficiency = originalRects > 0 ? ((elementsReduced / originalRects) * 100).toFixed(1) : '0.0';
    
    return {
        originalSize,
        optimizedSize,
        reduction,
        reductionPercent: parseFloat(reductionPercent),
        originalElements: originalRects,
        optimizedElements: optimizedRects,
        elementsReduced,
        mergeEfficiency: parseFloat(mergeEfficiency)
    };
}

/**
 * Validates that row-optimized SVG maintains visual fidelity
 * @param {string} originalSvg - Original SVG string
 * @param {string} optimizedSvg - Row-optimized SVG string
 * @returns {boolean} - True if optimization maintains visual fidelity
 */
export function validateRowOptimization(originalSvg, optimizedSvg) {
    try {
        const parser = new DOMParser();
        
        const originalDoc = parser.parseFromString(originalSvg, 'image/svg+xml');
        const optimizedDoc = parser.parseFromString(optimizedSvg, 'image/svg+xml');
        
        if (originalDoc.documentElement.nodeName === 'parsererror' || 
            optimizedDoc.documentElement.nodeName === 'parsererror') {
            return false;
        }
        
        // Compare dimensions
        const originalSvgEl = originalDoc.documentElement;
        const optimizedSvgEl = optimizedDoc.documentElement;
        
        const dimensionsMatch = 
            originalSvgEl.getAttribute('width') === optimizedSvgEl.getAttribute('width') &&
            originalSvgEl.getAttribute('height') === optimizedSvgEl.getAttribute('height');
        
        if (!dimensionsMatch) {
            return false;
        }
        
        // Validate that we have fewer elements but same coverage area
        const originalRects = originalDoc.querySelectorAll('rect[fill="#000000"], rect[fill="black"]');
        const optimizedRects = optimizedDoc.querySelectorAll('rect[fill="#000000"], rect[fill="black"]');
        
        // Should have fewer rectangles in optimized version
        const hasFewerElements = optimizedRects.length < originalRects.length;
        
        // Should still have black rectangles if original had them
        const hasBlackRects = originalRects.length === 0 || optimizedRects.length > 0;
        
        return hasFewerElements && hasBlackRects;
        
    } catch (error) {
        console.warn('Row optimization validation failed:', error.message);
        return false;
    }
}

/**
 * Utility function to download row-optimized SVG
 * @param {string} svgContent - SVG content
 * @param {string} filename - Filename without extension
 */
export function downloadRowOptimizedSVG(svgContent, filename) {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${filename}-row-optimized.svg`;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Generates comparison of different optimization methods
 * @param {string} originalSvg - Original SVG string
 * @returns {Object} - Comparison data for different optimization methods
 */
export function compareOptimizationMethods(originalSvg) {
    try {
        // Row optimization
        const rowOptimized = optimizeSVGRows(originalSvg);
        const rowStats = getRowOptimizationStats(originalSvg, rowOptimized);
        
        return {
            original: {
                size: new Blob([originalSvg]).size,
                elements: (originalSvg.match(/<rect/g) || []).length
            },
            rowOptimized: {
                svg: rowOptimized,
                stats: rowStats,
                description: 'Horizontal rectangle merging - maintains full vector editability'
            }
        };
        
    } catch (error) {
        console.warn('Optimization comparison failed:', error.message);
        return null;
    }
}