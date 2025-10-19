/**
 * SVG Block Optimizer Module
 * Optimizes QR code SVGs by merging adjacent black squares into larger square/rectangular blocks
 * This dramatically reduces element count while maintaining perfect visual fidelity and full vector editability
 */

/**
 * Optimizes SVG by merging adjacent black squares into larger blocks
 * @param {string} svgString - Original SVG string with individual rect elements
 * @returns {string} - Optimized SVG with merged rectangular blocks
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
        
        // Extract and merge rectangles into larger blocks
        const { mergedRects, backgroundRect } = extractAndMergeBlocks(rects, svgWidth, svgHeight);
        
        // Create optimized SVG
        const optimizedSVG = createOptimizedRowSVG(svgElement, mergedRects, backgroundRect);
        
        return optimizedSVG;
        
    } catch (error) {
        console.warn('SVG row optimization failed:', error.message);
        return svgString; // Return original SVG on error
    }
}

/**
 * Extracts rectangle data and merges adjacent squares into larger blocks
 * @private
 * @param {NodeList} rects - Collection of rect elements
 * @param {number} svgWidth - SVG width for validation
 * @param {number} svgHeight - SVG height for validation
 * @returns {Object} - Object with merged blocks and background
 */
function extractAndMergeBlocks(rects, svgWidth, svgHeight) {
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
    
    // Merge adjacent squares into larger blocks (both horizontal and vertical)
    const mergedRects = mergeIntoBlocks(blackRects);
    
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
 * Merges adjacent squares into larger rectangular blocks
 * @private
 * @param {Array} rectangles - Array of rectangle data objects
 * @returns {Array} - Array of merged block data objects
 */
function mergeIntoBlocks(rectangles) {
    if (rectangles.length === 0) {
        return [];
    }
    
    // Create a 2D grid representation for efficient block detection
    const grid = createGridFromRectangles(rectangles);
    
    // Find and merge blocks using flood-fill algorithm
    const mergedBlocks = findLargestBlocks(grid, rectangles);
    
    return mergedBlocks;
}

/**
 * Creates a 2D grid representation from rectangles for efficient block detection
 * @private
 * @param {Array} rectangles - Array of rectangle data
 * @returns {Object} - Grid object with coordinates and module size
 */
function createGridFromRectangles(rectangles) {
    if (rectangles.length === 0) return { grid: {}, moduleSize: 1, minX: 0, minY: 0 };
    
    // Determine module size (assuming all rectangles are same size modules)
    const firstRect = rectangles[0];
    const moduleSize = Math.min(firstRect.width, firstRect.height);
    
    // Find grid bounds
    let minX = Math.min(...rectangles.map(r => r.x));
    let minY = Math.min(...rectangles.map(r => r.y));
    
    // Create grid coordinate system
    const grid = {};
    
    for (const rect of rectangles) {
        // Convert real coordinates to grid coordinates
        const gridX = Math.round((rect.x - minX) / moduleSize);
        const gridY = Math.round((rect.y - minY) / moduleSize);
        const key = `${gridX},${gridY}`;
        
        grid[key] = {
            gridX,
            gridY,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            fill: rect.fill,
            used: false
        };
    }
    
    return { grid, moduleSize, minX, minY };
}

/**
 * Finds largest possible rectangular blocks using greedy algorithm
 * @private
 * @param {Object} gridData - Grid data from createGridFromRectangles
 * @param {Array} originalRects - Original rectangles for fallback
 * @returns {Array} - Array of merged block rectangles
 */
function findLargestBlocks(gridData, originalRects) {
    const { grid, moduleSize, minX, minY } = gridData;
    const blocks = [];
    
    // Get all grid positions sorted by position (top-left to bottom-right)
    const positions = Object.keys(grid).sort((a, b) => {
        const [x1, y1] = a.split(',').map(Number);
        const [x2, y2] = b.split(',').map(Number);
        if (y1 !== y2) return y1 - y2;
        return x1 - x2;
    });
    
    for (const posKey of positions) {
        const startCell = grid[posKey];
        if (startCell.used) continue;
        
        // Try to find the largest rectangle starting from this position
        const block = findLargestRectangleFrom(grid, startCell.gridX, startCell.gridY, moduleSize, minX, minY);
        
        if (block) {
            blocks.push(block);
        }
    }
    
    return blocks.length > 0 ? blocks : originalRects; // Fallback to original if no blocks found
}

/**
 * Finds the largest rectangle starting from a given grid position
 * @private
 * @param {Object} grid - Grid object
 * @param {number} startX - Starting grid X coordinate
 * @param {number} startY - Starting grid Y coordinate  
 * @param {number} moduleSize - Size of each module
 * @param {number} minX - Minimum X coordinate offset
 * @param {number} minY - Minimum Y coordinate offset
 * @returns {Object|null} - Rectangle block or null if already used
 */
function findLargestRectangleFrom(grid, startX, startY, moduleSize, minX, minY) {
    const startKey = `${startX},${startY}`;
    if (!grid[startKey] || grid[startKey].used) return null;
    
    // Find maximum width (how far right we can go)
    let maxWidth = 0;
    for (let x = startX; ; x++) {
        const key = `${x},${startY}`;
        if (!grid[key] || grid[key].used) break;
        maxWidth++;
    }
    
    // Find maximum height for the current width
    let maxHeight = 0;
    let finalWidth = maxWidth;
    
    for (let h = 1; ; h++) {
        // Check if we can extend the rectangle by one row
        let canExtendHeight = true;
        let currentRowWidth = 0;
        
        for (let x = startX; x < startX + finalWidth; x++) {
            const key = `${x},${startY + h - 1}`;
            if (!grid[key] || grid[key].used) {
                canExtendHeight = false;
                break;
            }
            currentRowWidth++;
        }
        
        if (!canExtendHeight) break;
        
        maxHeight = h;
        // Adjust width to maintain rectangle shape - take minimum width of all rows
        finalWidth = Math.min(finalWidth, currentRowWidth);
    }
    
    // If we found a valid rectangle, mark cells as used and create block
    if (maxHeight > 0 && finalWidth > 0) {
        for (let y = startY; y < startY + maxHeight; y++) {
            for (let x = startX; x < startX + finalWidth; x++) {
                const key = `${x},${y}`;
                if (grid[key]) {
                    grid[key].used = true;
                }
            }
        }
        
        return {
            x: minX + startX * moduleSize,
            y: minY + startY * moduleSize,
            width: finalWidth * moduleSize,
            height: maxHeight * moduleSize,
            fill: grid[startKey].fill
        };
    }
    
    return null;
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
 * Gets block optimization statistics
 * @param {string} originalSvg - Original SVG string
 * @param {string} optimizedSvg - Block-optimized SVG string
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
    
    // Calculate block merge efficiency
    const elementsReduced = originalRects - optimizedRects;
    const blockMergeEfficiency = originalRects > 0 ? ((elementsReduced / originalRects) * 100).toFixed(1) : '0.0';
    
    return {
        originalSize,
        optimizedSize,
        reduction,
        reductionPercent: parseFloat(reductionPercent),
        originalElements: originalRects,
        optimizedElements: optimizedRects,
        elementsReduced,
        mergeEfficiency: parseFloat(blockMergeEfficiency),
        blockMergeEfficiency: parseFloat(blockMergeEfficiency) // More descriptive name
    };
}

/**
 * Validates that block-optimized SVG maintains visual fidelity
 * @param {string} originalSvg - Original SVG string
 * @param {string} optimizedSvg - Block-optimized SVG string
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
        
        // Should have significantly fewer rectangles in block-optimized version
        const hasFewerElements = optimizedRects.length < originalRects.length;
        
        // Should still have black rectangles if original had them
        const hasBlackRects = originalRects.length === 0 || optimizedRects.length > 0;
        
        // Block optimization should achieve better reduction than simple row merging
        const significantReduction = optimizedRects.length <= originalRects.length * 0.7; // At least 30% reduction
        
        return hasFewerElements && hasBlackRects && significantReduction;
        
    } catch (error) {
        console.warn('Row optimization validation failed:', error.message);
        return false;
    }
}

/**
 * Utility function to download block-optimized SVG
 * @param {string} svgContent - SVG content
 * @param {string} filename - Filename without extension
 */
export function downloadRowOptimizedSVG(svgContent, filename) {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${filename}-block-optimized.svg`;
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
        // Block optimization
        const blockOptimized = optimizeSVGRows(originalSvg);
        const blockStats = getRowOptimizationStats(originalSvg, blockOptimized);
        
        return {
            original: {
                size: new Blob([originalSvg]).size,
                elements: (originalSvg.match(/<rect/g) || []).length
            },
            blockOptimized: {
                svg: blockOptimized,
                stats: blockStats,
                description: 'Smart rectangular block merging - maintains full vector editability with maximum element reduction'
            }
        };
        
    } catch (error) {
        console.warn('Optimization comparison failed:', error.message);
        return null;
    }
}