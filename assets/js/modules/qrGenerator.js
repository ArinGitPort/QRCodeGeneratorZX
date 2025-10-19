/**
 * QR Code generator with PNG and SVG support
 */
import { Utils } from './utils.js';
import { optimizeSVG, getOptimizationStats } from './svgOptimizer.js';
import { generateLightweightSVG, getHybridStats } from './svgPngHybrid.js';
import { optimizeSVGRows, getRowOptimizationStats } from './svgRowOptimizer.js';

export class QRGenerator {
    constructor() {
        this.zxingLoaded = false;
        this.checkZXingLibrary();
    }

    /**
     * Check if ZXing library is loaded
     */
    checkZXingLibrary() {
        if (typeof ZXing !== 'undefined') {
            this.zxingLoaded = true;
            console.log('ZXing loaded successfully');
        } else {
            const checkInterval = setInterval(() => {
                if (typeof ZXing !== 'undefined') {
                    this.zxingLoaded = true;
                    console.log('ZXing loaded successfully');
                    clearInterval(checkInterval);
                }
            }, 100);
            
            setTimeout(() => {
                if (!this.zxingLoaded) {
                    clearInterval(checkInterval);
                    throw new Error('ZXing library failed to load');
                }
            }, 5000);
        }
    }

    /**
     * Generate QR code as canvas
     * @param {string} data - Data to encode
     * @param {Object} options - Generation options
     * @returns {HTMLCanvasElement} - Canvas with QR code
     */
    generateCanvas(data, options = {}) {
        if (!this.zxingLoaded) {
            throw new Error('ZXing library is not loaded yet');
        }

        const {
            size = 300,
            foregroundColor = '#000000',
            backgroundColor = '#FFFFFF',
            transparent = false,
            margin = 4
        } = options;

        // Ensure size is always a clean multiple of 10
        const cleanSize = Utils.roundToNearest(size, 10);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = cleanSize;
        canvas.height = cleanSize;

        // Generate QR code bit matrix
        const bitMatrix = this.generateBitMatrix(data, cleanSize, margin);
        
        // Draw QR code on canvas
        this.drawQRCodeOnCanvas(ctx, bitMatrix, cleanSize, foregroundColor, transparent ? 'transparent' : backgroundColor);
        
        return canvas;
    }

    /**
     * Generate QR code as SVG with multiple optimization options
     * @param {string} data - Data to encode
     * @param {Object} options - Generation options
     * @returns {Promise<string>|string} - Optimized SVG string or Promise for hybrid SVG
     */
    generateSVG(data, options = {}) {
        if (!this.zxingLoaded) {
            throw new Error('ZXing library is not loaded yet');
        }

        const {
            size = 300,
            foregroundColor = '#000000',
            backgroundColor = '#FFFFFF',
            transparent = false,
            margin = 4,
            optimize = true,      // Path optimization (default)
            rowOptimize = false,  // Block merging optimization (maintains full editability)
            hybrid = false,       // PNG-in-SVG hybrid mode (ultra-lightweight)
            pngResolution = 1024  // High resolution for hybrid mode
        } = options;

        // Ensure size is always a clean multiple of 10
        const cleanSize = Utils.roundToNearest(size, 10);

        // Use hybrid mode for ultra-lightweight SVGs
        if (hybrid) {
            return generateLightweightSVG(data, {
                size: cleanSize,
                pngResolution,
                foregroundColor,
                backgroundColor,
                transparent,
                margin
            });
        }

        // Generate QR code bit matrix (reusing utility - DRY principle)
        const bitMatrix = this.generateBitMatrix(data, cleanSize, margin);
        
        // Create basic SVG string
        const basicSVG = this.createSVGString(bitMatrix, cleanSize, foregroundColor, transparent ? 'transparent' : backgroundColor);
        
        // Apply block optimization (merges adjacent squares into larger blocks)
        if (rowOptimize) {
            const blockOptimizedSVG = optimizeSVGRows(basicSVG);
            
            // Log block optimization stats
            if (console && console.log) {
                const stats = getRowOptimizationStats(basicSVG, blockOptimizedSVG);
                console.log('SVG Block Optimization Stats:', {
                    'Original elements': stats.originalElements,
                    'Optimized elements': stats.optimizedElements,
                    'Elements reduced': stats.elementsReduced,
                    'Block merge efficiency': `${stats.blockMergeEfficiency}%`,
                    'Size reduction': `${stats.reductionPercent}%`
                });
            }
            
            return blockOptimizedSVG;
        }
        
        // Apply path optimization (merges all rectangles into single path)
        if (optimize) {
            const optimizedSVG = optimizeSVG(basicSVG);
            
            // Log path optimization stats
            if (console && console.log) {
                const stats = getOptimizationStats(basicSVG, optimizedSVG);
                console.log('SVG Path Optimization Stats:', {
                    'Original size': `${(stats.originalSize / 1024).toFixed(1)}KB`,
                    'Optimized size': `${(stats.optimizedSize / 1024).toFixed(1)}KB`,
                    'Size reduction': `${stats.reductionPercent}%`,
                    'Elements reduced': `${stats.originalElements} → ${stats.optimizedElements}`
                });
            }
            
            return optimizedSVG;
        }
        
        return basicSVG;
    }

    /**
     * Generate bit matrix using ZXing
     * @private
     */
    generateBitMatrix(data, size, margin) {
        try {
            const hints = new Map();
            
            // Use medium error correction by default
            if (ZXing.EncodeHintType && ZXing.ErrorCorrectionLevel) {
                hints.set(ZXing.EncodeHintType.ERROR_CORRECTION, ZXing.ErrorCorrectionLevel.M);
            }
            if (ZXing.EncodeHintType && ZXing.EncodeHintType.MARGIN) {
                hints.set(ZXing.EncodeHintType.MARGIN, margin);
            }

            const writer = new ZXing.QRCodeWriter();
            return writer.encode(data, ZXing.BarcodeFormat.QR_CODE, size, size, hints);
        } catch (hintError) {
            // Fallback: try without hints
            console.warn('Error with hints, trying without:', hintError);
            const writer = new ZXing.QRCodeWriter();
            return writer.encode(data, ZXing.BarcodeFormat.QR_CODE, size, size);
        }
    }

    /**
     * Draw QR code on canvas
     * @private
     */
    drawQRCodeOnCanvas(ctx, bitMatrix, size, foregroundColor, backgroundColor) {
        const moduleSize = size / bitMatrix.getWidth();
        
        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // Set background
        if (backgroundColor !== 'transparent') {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, size, size);
        }
        
        // Draw QR modules
        ctx.fillStyle = foregroundColor;
        for (let x = 0; x < bitMatrix.getWidth(); x++) {
            for (let y = 0; y < bitMatrix.getHeight(); y++) {
                if (bitMatrix.get(x, y)) {
                    ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
                }
            }
        }
    }

    /**
     * Create SVG string from bit matrix
     * @private
     */
    createSVGString(bitMatrix, size, foregroundColor, backgroundColor) {
        const moduleSize = size / bitMatrix.getWidth();
        const modules = [];
        
        // Collect all filled modules
        for (let x = 0; x < bitMatrix.getWidth(); x++) {
            for (let y = 0; y < bitMatrix.getHeight(); y++) {
                if (bitMatrix.get(x, y)) {
                    modules.push(`<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${foregroundColor}"/>`);
                }
            }
        }
        
        // Create SVG
        let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Add background if not transparent
        if (backgroundColor !== 'transparent') {
            svg += `<rect width="${size}" height="${size}" fill="${backgroundColor}"/>`;
        }
        
        // Add QR code modules
        svg += modules.join('');
        svg += '</svg>';
        
        return svg;
    }

    /**
     * Download canvas as PNG
     * @param {HTMLCanvasElement} canvas - Canvas to download
     * @param {string} filename - Filename without extension
     */
    downloadPNG(canvas, filename) {
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = url;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }, 'image/png');
    }

    /**
     * Download SVG string as SVG file
     * @param {string} svgString - SVG content
     * @param {string} filename - Filename without extension
     * @param {boolean} showStats - Whether to show optimization stats
     */
    downloadSVG(svgString, filename, showStats = false) {
        // Show optimization info if requested
        if (showStats && svgString.includes('<path')) {
            // This is likely an optimized SVG, create a basic version for comparison
            console.log('📊 SVG Optimization Applied:', {
                'File type': 'Optimized SVG',
                'Elements': 'Multiple <rect> elements merged into single <path>',
                'Benefits': 'Smaller file size, faster loading in design tools',
                'Compatibility': 'Maintains full visual fidelity'
            });
        }
        
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${filename}.svg`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Generate all SVG optimization versions for comparison
     * @param {string} data - Data to encode
     * @param {Object} options - Generation options
     * @returns {Promise<Object>} - Object with all SVG versions and comprehensive stats
     */
    async generateSVGVersions(data, options = {}) {
        // Generate all versions
        const basicSVG = this.generateSVG(data, { ...options, optimize: false, rowOptimize: false, hybrid: false });
        const rowOptimizedSVG = this.generateSVG(data, { ...options, optimize: false, rowOptimize: true, hybrid: false });
        const pathOptimizedSVG = this.generateSVG(data, { ...options, optimize: true, rowOptimize: false, hybrid: false });
        const hybridSVG = await this.generateSVG(data, { ...options, hybrid: true });
        
        // Get comprehensive statistics
        const rowStats = getRowOptimizationStats(basicSVG, rowOptimizedSVG);
        const pathStats = getOptimizationStats(basicSVG, pathOptimizedSVG);
        const hybridStats = await getHybridStats(data, options);
        
        return {
            basic: basicSVG,
            rowOptimized: rowOptimizedSVG,
            pathOptimized: pathOptimizedSVG,
            hybrid: hybridSVG,
            stats: {
                row: rowStats,
                path: pathStats,
                hybrid: hybridStats
            }
        };
    }

    /**
     * Generate lightweight hybrid SVG (async wrapper for convenience)
     * @param {string} data - Data to encode  
     * @param {Object} options - Generation options
     * @returns {Promise<string>} - Promise resolving to hybrid SVG
     */
    async generateHybridSVG(data, options = {}) {
        return this.generateSVG(data, { ...options, hybrid: true });
    }

    /**
     * Generate filename based on type and timestamp
     * @param {string} type - QR code type
     * @returns {string} - Generated filename
     */
    generateFilename(type) {
        const timestamp = Utils.generateTimestamp();
        return `qrcode-${type}-${timestamp}`;
    }
}