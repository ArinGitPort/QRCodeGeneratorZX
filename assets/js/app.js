/**
 * Main QR Code Generator Application
 */
import { UIController } from './modules/uiController.js';
import { QRGenerator } from './modules/qrGenerator.js';
import { DataProcessor } from './modules/dataProcessor.js';

export class QRCodeGeneratorApp {
    constructor() {
        this.ui = new UIController();
        this.qrGenerator = new QRGenerator();
        this.currentCanvas = null;
        this.currentSVG = null;
        this.lastGeneratedData = null;
        
        this.bindAppEvents();
    }

    /**
     * Bind application-level events
     */
    bindAppEvents() {
        // Generate button
        this.ui.generateBtn.addEventListener('click', () => {
            this.generateQRCode();
        });

        // Download buttons
        if (this.ui.downloadPngBtn) {
            this.ui.downloadPngBtn.addEventListener('click', () => {
                this.downloadPNG();
            });
        }

        if (this.ui.downloadSvgBtn) {
            this.ui.downloadSvgBtn.addEventListener('click', () => {
                this.downloadSVG();
            });
        }

        // Auto-regenerate on customization change
        Object.values(this.ui.customization).forEach(control => {
            if (control && control.addEventListener) {
                control.addEventListener('change', () => {
                    if (this.lastGeneratedData) {
                        this.generateQRCode();
                    }
                });
            }
        });
    }

    /**
     * Generate QR code
     */
    async generateQRCode() {
        this.ui.clearErrors();

        try {
            // Get current input values
            const inputs = this.ui.getInputValues();
            const type = this.ui.getCurrentType();

            // Validate input data
            const validation = DataProcessor.validateData(type, inputs);
            if (!validation.valid) {
                this.ui.showError(validation.message);
                return;
            }

            // Process data
            const data = DataProcessor.processData(type, inputs);
            this.lastGeneratedData = data;

            // Show loading state
            this.ui.showLoading();

            // Wait a bit for UI update
            await new Promise(resolve => setTimeout(resolve, 10));

            // Get customization options
            const options = this.ui.getCustomizationOptions();

            // Intelligently choose optimization method based on QR complexity and size
            const shouldUseHybrid = data.length > 200 || options.size > 500; // Hybrid for very complex/large QRs
            const shouldUseRowOptimize = data.length > 50 && data.length <= 200; // Row optimization for medium complexity
            const shouldUsePathOptimize = data.length <= 50; // Path optimization for simple QRs
            
            // Set optimization options (smart defaults)
            options.hybrid = shouldUseHybrid;
            options.rowOptimize = shouldUseRowOptimize && !shouldUseHybrid;
            options.optimize = shouldUsePathOptimize && !shouldUseHybrid && !shouldUseRowOptimize;

            // Generate QR code as canvas
            this.currentCanvas = this.qrGenerator.generateCanvas(data, options);

            // Generate SVG with intelligent optimization
            const svgResult = this.qrGenerator.generateSVG(data, options);
            
            if (svgResult instanceof Promise) {
                // Handle async hybrid SVG generation
                this.currentSVG = await svgResult;
                console.log('💡 Generated ultra-lightweight hybrid SVG (PNG embedded for optimal design tool performance)');
            } else {
                // Handle sync optimization
                this.currentSVG = svgResult;
                
                if (shouldUseRowOptimize) {
                    console.log('💡 Generated block-optimized SVG (adjacent squares merged into larger rectangular blocks for better Illustrator performance while maintaining full editability)');
                } else if (shouldUsePathOptimize) {
                    console.log('💡 Generated path-optimized SVG (all elements merged into single path for maximum compression)');
                }
            }

            // Display QR code
            this.ui.displayQRCode(this.currentCanvas);
            this.ui.updateQRInfo(data, options.size);

        } catch (error) {
            this.ui.showError('Error generating QR code: ' + error.message);
            console.error('QR Code generation error:', error);
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Download QR code as PNG
     */
    downloadPNG() {
        if (!this.currentCanvas) {
            this.ui.showError('No QR code to download. Please generate one first.');
            return;
        }

        try {
            const filename = this.qrGenerator.generateFilename(this.ui.getCurrentType());
            this.qrGenerator.downloadPNG(this.currentCanvas, filename);
        } catch (error) {
            this.ui.showError('Error downloading PNG: ' + error.message);
            console.error('PNG download error:', error);
        }
    }

    /**
     * Download QR code as SVG
     */
    downloadSVG() {
        if (!this.currentSVG) {
            this.ui.showError('No QR code to download. Please generate one first.');
            return;
        }

        try {
            const filename = this.qrGenerator.generateFilename(this.ui.getCurrentType());
            this.qrGenerator.downloadSVG(this.currentSVG, filename, true); // Show optimization stats
            
            // Provide detailed feedback about the optimization type used
            setTimeout(() => {
                if (this.currentSVG.includes('<image') && this.currentSVG.includes('data:image/')) {
                    console.log('💡 Downloaded ultra-lightweight hybrid SVG! Embeds high-resolution PNG for maximum Illustrator performance with minimal file size.');
                } else if (this.currentSVG.includes('<path')) {
                    console.log('💡 Downloaded path-optimized SVG! All elements merged into single path for maximum compression.');
                } else {
                    // Count rectangles to determine if block-optimized
                    const rectCount = (this.currentSVG.match(/<rect/g) || []).length;
                    if (rectCount > 2 && rectCount < 100) {
                        console.log('💡 Downloaded block-optimized SVG! Adjacent squares merged into larger rectangular blocks for better Illustrator performance while maintaining full vector editability.');
                    } else if (rectCount >= 100) {
                        console.log('💡 Downloaded standard SVG with individual elements - perfect for maximum editability.');
                    } else {
                        console.log('💡 Downloaded optimized SVG.');
                    }
                }
            }, 100);
        } catch (error) {
            this.ui.showError('Error downloading SVG: ' + error.message);
            console.error('SVG download error:', error);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for ZXing to load
    setTimeout(() => {
        try {
            new QRCodeGeneratorApp();
        } catch (error) {
            console.error('Failed to initialize QR Code Generator:', error);
        }
    }, 100);
});