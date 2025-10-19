/**
 * SVG-PNG Hybrid Generator Module
 * Creates ultra-lightweight SVGs by embedding high-resolution PNGs inside SVG <image> elements
 * This approach maintains vector scalability while avoiding thousands of <rect> elements
 */

/**
 * Generates a lightweight SVG containing an embedded high-resolution PNG
 * @param {string} data - Data to encode in QR code
 * @param {Object} options - Generation options
 * @returns {Promise<string>} - Promise resolving to SVG string with embedded PNG
 */
export async function generateLightweightSVG(data, options = {}) {
    const {
        size = 300,
        pngResolution = 1024, // High resolution for crisp quality
        foregroundColor = '#000000',
        backgroundColor = '#FFFFFF',
        transparent = false,
        margin = 4,
        compressionQuality = 0.95 // PNG quality (0.0 - 1.0)
    } = options;

    try {
        // Generate high-resolution PNG data URL
        const pngDataUrl = await generateHighResPNG(data, {
            size: pngResolution,
            foregroundColor,
            backgroundColor,
            transparent,
            margin,
            quality: compressionQuality
        });

        // Create lightweight SVG wrapper
        const svgContent = createSVGWrapper(pngDataUrl, size, transparent ? 'transparent' : backgroundColor);

        return svgContent;

    } catch (error) {
        throw new Error(`Failed to generate lightweight SVG: ${error.message}`);
    }
}

/**
 * Generates high-resolution PNG as data URL
 * @private
 * @param {string} data - QR code data
 * @param {Object} options - PNG generation options
 * @returns {Promise<string>} - Promise resolving to PNG data URL
 */
async function generateHighResPNG(data, options) {
    return new Promise((resolve, reject) => {
        try {
            if (typeof ZXing === 'undefined') {
                reject(new Error('ZXing library not loaded'));
                return;
            }

            const { size, foregroundColor, backgroundColor, transparent, margin, quality } = options;

            // Generate bit matrix using ZXing
            const bitMatrix = generateBitMatrix(data, size, margin);
            
            // Create high-resolution canvas
            const canvas = createHighResCanvas(bitMatrix, size, foregroundColor, transparent ? null : backgroundColor);
            
            // Convert to PNG data URL with specified quality
            const mimeType = transparent ? 'image/png' : 'image/jpeg';
            const dataUrl = canvas.toDataURL(mimeType, quality);
            
            resolve(dataUrl);

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generates ZXing bit matrix (reusable utility - follows DRY principle)
 * @private
 * @param {string} data - Data to encode
 * @param {number} size - Matrix size
 * @param {number} margin - Margin size
 * @returns {Object} - ZXing bit matrix
 */
function generateBitMatrix(data, size, margin) {
    if (typeof ZXing === 'undefined') {
        throw new Error('ZXing library not loaded');
    }

    const hints = new Map();
    
    // Set error correction and margin (same logic as main generator)
    if (ZXing.EncodeHintType && ZXing.ErrorCorrectionLevel) {
        hints.set(ZXing.EncodeHintType.ERROR_CORRECTION, ZXing.ErrorCorrectionLevel.M);
    }
    if (ZXing.EncodeHintType && ZXing.EncodeHintType.MARGIN) {
        hints.set(ZXing.EncodeHintType.MARGIN, margin);
    }

    try {
        const writer = new ZXing.QRCodeWriter();
        return writer.encode(data, ZXing.BarcodeFormat.QR_CODE, size, size, hints);
    } catch (hintError) {
        // Fallback without hints (consistent with main generator)
        console.warn('Generating QR without hints:', hintError.message);
        const writer = new ZXing.QRCodeWriter();
        return writer.encode(data, ZXing.BarcodeFormat.QR_CODE, size, size);
    }
}

/**
 * Creates high-resolution canvas from bit matrix
 * @private
 * @param {Object} bitMatrix - ZXing bit matrix
 * @param {number} size - Canvas size
 * @param {string} foregroundColor - QR code color
 * @param {string|null} backgroundColor - Background color (null for transparent)
 * @returns {HTMLCanvasElement} - High-resolution canvas
 */
function createHighResCanvas(bitMatrix, size, foregroundColor, backgroundColor) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = size;
    canvas.height = size;
    
    // Calculate module size
    const moduleSize = size / bitMatrix.getWidth();
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Set background if not transparent
    if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, size, size);
    }
    
    // Draw QR modules with pixel-perfect precision
    ctx.fillStyle = foregroundColor;
    ctx.imageSmoothingEnabled = false; // Crisp pixel rendering
    
    for (let x = 0; x < bitMatrix.getWidth(); x++) {
        for (let y = 0; y < bitMatrix.getHeight(); y++) {
            if (bitMatrix.get(x, y)) {
                const pixelX = Math.round(x * moduleSize);
                const pixelY = Math.round(y * moduleSize);
                const pixelSize = Math.round(moduleSize);
                
                ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);
            }
        }
    }
    
    return canvas;
}

/**
 * Creates SVG wrapper with embedded PNG
 * @private
 * @param {string} pngDataUrl - PNG data URL
 * @param {number} size - SVG display size
 * @param {string} backgroundColor - Background color
 * @returns {string} - Complete SVG string
 */
function createSVGWrapper(pngDataUrl, size, backgroundColor) {
    const viewBox = `0 0 ${size} ${size}`;
    
    // Create minimal SVG structure
    let svg = `<svg width="${size}" height="${size}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;
    
    // Add background if not transparent
    if (backgroundColor !== 'transparent') {
        svg += `\n  <rect width="100%" height="100%" fill="${backgroundColor}"/>`;
    }
    
    // Embed high-resolution PNG
    svg += `\n  <image x="0" y="0" width="${size}" height="${size}" xlink:href="${pngDataUrl}" style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; image-rendering: pixelated;"/>`;
    
    svg += '\n</svg>';
    
    return svg;
}

/**
 * Gets file size statistics for different approaches
 * @param {string} data - QR code data
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - Size comparison statistics
 */
export async function getHybridStats(data, options = {}) {
    try {
        // Generate lightweight SVG
        const lightweightSVG = await generateLightweightSVG(data, options);
        
        // Calculate sizes
        const svgSize = new Blob([lightweightSVG]).size;
        const pngDataSize = estimatePNGDataSize(lightweightSVG);
        
        // Estimate traditional SVG size (approximate)
        const estimatedTraditionalSize = estimateTraditionalSVGSize(data, options);
        
        return {
            lightweightSVG: {
                totalSize: svgSize,
                pngDataSize: pngDataSize,
                svgWrapperSize: svgSize - pngDataSize,
                elements: 2 // background rect + image element
            },
            estimatedTraditional: {
                totalSize: estimatedTraditionalSize,
                elements: estimatedTraditionalSize / 100 // rough estimate
            },
            savings: {
                bytes: Math.max(0, estimatedTraditionalSize - svgSize),
                percentage: Math.max(0, ((estimatedTraditionalSize - svgSize) / estimatedTraditionalSize * 100).toFixed(1))
            }
        };
        
    } catch (error) {
        console.warn('Stats calculation failed:', error.message);
        return null;
    }
}

/**
 * Estimates PNG data size from SVG containing data URL
 * @private
 * @param {string} svgContent - SVG content with embedded PNG
 * @returns {number} - Estimated PNG data size in bytes
 */
function estimatePNGDataSize(svgContent) {
    const dataUrlMatch = svgContent.match(/data:image\/[^;]+;base64,([^"]+)/);
    if (dataUrlMatch) {
        // Base64 encoding adds ~33% overhead, so reverse that
        return Math.round(dataUrlMatch[1].length * 0.75);
    }
    return 0;
}

/**
 * Estimates traditional SVG size based on QR complexity
 * @private
 * @param {string} data - QR code data
 * @param {Object} options - Generation options
 * @returns {number} - Estimated size in bytes
 */
function estimateTraditionalSVGSize(data, options) {
    // Rough estimation: longer data = more modules = larger SVG
    const baseSize = 2000; // Base SVG overhead
    const dataComplexity = data.length * 50; // Approximate bytes per character
    const sizeMultiplier = (options.size || 300) / 300; // Size scaling factor
    
    return Math.round((baseSize + dataComplexity) * sizeMultiplier);
}

/**
 * Validates that the hybrid SVG renders correctly
 * @param {string} svgContent - SVG content to validate
 * @returns {boolean} - True if SVG appears valid
 */
export function validateHybridSVG(svgContent) {
    try {
        // Basic structural validation
        if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
            return false;
        }
        
        // Check for embedded image
        if (!svgContent.includes('<image') || !svgContent.includes('data:image/')) {
            return false;
        }
        
        // Parse as DOM to check for errors
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        
        if (doc.documentElement.nodeName === 'parsererror') {
            return false;
        }
        
        // Check for required attributes
        const svgEl = doc.documentElement;
        const imageEl = svgEl.querySelector('image');
        
        if (!imageEl || !imageEl.getAttribute('xlink:href')) {
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.warn('Hybrid SVG validation failed:', error.message);
        return false;
    }
}

/**
 * Utility function to download hybrid SVG
 * @param {string} svgContent - SVG content
 * @param {string} filename - Filename without extension
 */
export function downloadHybridSVG(svgContent, filename) {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${filename}-hybrid.svg`;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Generates multiple format options for comparison
 * @param {string} data - QR code data
 * @param {Object} options - Base generation options
 * @returns {Promise<Object>} - Object with different format versions
 */
export async function generateAllFormats(data, options = {}) {
    try {
        // Generate hybrid SVG
        const hybridSVG = await generateLightweightSVG(data, options);
        
        // Generate high-res PNG for standalone use
        const pngDataUrl = await generateHighResPNG(data, {
            size: options.pngResolution || 1024,
            foregroundColor: options.foregroundColor || '#000000',
            backgroundColor: options.backgroundColor || '#FFFFFF',
            transparent: options.transparent || false,
            margin: options.margin || 4,
            quality: options.compressionQuality || 0.95
        });
        
        return {
            hybridSVG,
            standalonePNG: pngDataUrl,
            stats: await getHybridStats(data, options)
        };
        
    } catch (error) {
        throw new Error(`Failed to generate all formats: ${error.message}`);
    }
}