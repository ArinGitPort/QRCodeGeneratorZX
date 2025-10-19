/**
 * UI Controller for QR Code Generator
 */
import { Utils } from './utils.js';

export class UIController {
    constructor() {
        this.currentType = 'url';
        this.initializeElements();
        this.bindEvents();
        this.updateSliderValues();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        // Type selector buttons
        this.typeButtons = document.querySelectorAll('.type-btn');
        
        // Input containers
        this.inputContainers = {
            url: document.getElementById('url-input'),
            text: document.getElementById('text-input'),
            email: document.getElementById('email-input'),
            phone: document.getElementById('phone-input'),
            sms: document.getElementById('sms-input'),
            wifi: document.getElementById('wifi-input'),
            vcard: document.getElementById('vcard-input'),
            social: document.getElementById('social-input')
        };

        // Input elements
        this.inputs = {
            url: document.getElementById('url'),
            text: document.getElementById('text'),
            email: document.getElementById('email'),
            emailSubject: document.getElementById('email-subject'),
            emailBody: document.getElementById('email-body'),
            phone: document.getElementById('phone'),
            smsNumber: document.getElementById('sms-number'),
            smsMessage: document.getElementById('sms-message'),
            wifiSsid: document.getElementById('wifi-ssid'),
            wifiPassword: document.getElementById('wifi-password'),
            wifiSecurity: document.getElementById('wifi-security'),
            wifiHidden: document.getElementById('wifi-hidden'),
            vcardName: document.getElementById('vcard-name'),
            vcardOrg: document.getElementById('vcard-org'),
            vcardPhone: document.getElementById('vcard-phone'),
            vcardEmail: document.getElementById('vcard-email'),
            vcardUrl: document.getElementById('vcard-url'),
            socialPlatform: document.getElementById('social-platform'),
            socialUsername: document.getElementById('social-username')
        };

        // Customization elements
        this.customization = {
            size: document.getElementById('size'),
            sizeInput: document.getElementById('size-input'),
            foregroundColor: document.getElementById('foreground-color'),
            backgroundColor: document.getElementById('background-color'),
            transparentBg: document.getElementById('transparent-bg'),
            margin: document.getElementById('margin'),
            marginValue: document.getElementById('margin-value')
        };

        // Control elements
        this.generateBtn = document.getElementById('generate-btn');
        this.downloadPngBtn = document.getElementById('download-png-btn');
        this.downloadSvgBtn = document.getElementById('download-svg-btn');
        this.qrDisplay = document.getElementById('qr-code-display');
        this.downloadSection = document.getElementById('download-section');
        this.qrData = document.getElementById('qr-data');
        this.qrSize = document.getElementById('qr-size');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Type selector events
        this.typeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchType(e.target.dataset.type);
            });
        });

        // Size control events
        this.setupSizeControls();

        // Margin control events
        this.customization.margin.addEventListener('input', (e) => {
            this.customization.marginValue.textContent = e.target.value;
        });

        // Transparent background toggle
        this.customization.transparentBg.addEventListener('change', (e) => {
            this.toggleBackgroundColor(e.target.checked);
        });

        // Auto-clear errors on input
        Object.values(this.inputs).forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    this.clearErrors();
                });
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.generateBtn.click();
            }
        });

        // Sample data on double-click
        this.setupSampleData();

        // Tooltips
        this.setupTooltips();
    }

    /**
     * Setup size control synchronization
     */
    setupSizeControls() {
        // Slider to input sync
        this.customization.size.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const roundedValue = Utils.roundToNearest(value, 10);
            this.customization.size.value = roundedValue;
            this.customization.sizeInput.value = roundedValue;
        });

        // Input to slider sync
        this.customization.sizeInput.addEventListener('input', (e) => {
            let value = parseInt(e.target.value);
            value = Utils.clamp(value, 100, 800);
            value = Utils.roundToNearest(value, 10);
            this.customization.sizeInput.value = value;
            this.customization.size.value = value;
        });
    }

    /**
     * Switch QR code type
     * @param {string} type - QR code type
     */
    switchType(type) {
        this.currentType = type;
        
        // Update button states
        this.typeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            }
        });

        // Hide all input containers
        Object.values(this.inputContainers).forEach(container => {
            container.classList.add('hidden');
        });

        // Show selected input container
        if (this.inputContainers[type]) {
            this.inputContainers[type].classList.remove('hidden');
        }

        this.clearErrors();
    }

    /**
     * Toggle background color input based on transparent checkbox
     * @param {boolean} isTransparent - Whether transparent is checked
     */
    toggleBackgroundColor(isTransparent) {
        this.customization.backgroundColor.disabled = isTransparent;
        this.customization.backgroundColor.style.opacity = isTransparent ? '0.5' : '1';
    }

    /**
     * Update slider initial values
     */
    updateSliderValues() {
        const initialSize = parseInt(this.customization.size.value);
        const roundedSize = Utils.roundToNearest(initialSize, 10);
        this.customization.size.value = roundedSize;
        this.customization.sizeInput.value = roundedSize;
        this.customization.marginValue.textContent = this.customization.margin.value;
    }

    /**
     * Get current input values
     * @returns {Object} - Current input values
     */
    getInputValues() {
        const values = {};
        Object.entries(this.inputs).forEach(([key, input]) => {
            if (input) {
                values[key] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });
        return values;
    }

    /**
     * Get current customization options
     * @returns {Object} - Current customization options
     */
    getCustomizationOptions() {
        return {
            size: parseInt(this.customization.sizeInput.value),
            foregroundColor: this.customization.foregroundColor.value,
            backgroundColor: this.customization.backgroundColor.value,
            transparent: this.customization.transparentBg.checked,
            margin: parseInt(this.customization.margin.value)
        };
    }

    /**
     * Display QR code in the UI
     * @param {HTMLCanvasElement} canvas - Canvas with QR code
     */
    displayQRCode(canvas) {
        this.qrDisplay.innerHTML = '';
        this.qrDisplay.appendChild(canvas);
        this.qrDisplay.classList.add('has-qr');
    }

    /**
     * Update QR code info display
     * @param {string} data - QR code data
     * @param {number} size - QR code size
     */
    updateQRInfo(data, size) {
        this.qrData.textContent = Utils.truncateText(data, 50);
        this.qrSize.textContent = `${size} × ${size}px (Square)`;
        this.downloadSection.classList.remove('hidden');
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.generateBtn.classList.add('loading');
        this.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.generateBtn.classList.remove('loading');
        this.generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate QR Code';
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        let errorDiv = document.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            this.generateBtn.parentNode.insertBefore(errorDiv, this.generateBtn);
        }
        
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 5000);
    }

    /**
     * Clear error messages
     */
    clearErrors() {
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
        
        document.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
        });
    }

    /**
     * Setup sample data for testing
     */
    setupSampleData() {
        const sampleData = {
            url: 'https://github.com',
            text: 'Hello, World! This is a sample QR code.',
            email: 'example@email.com',
            phone: '+1234567890',
            'wifi-ssid': 'MyWiFiNetwork',
            'vcard-name': 'John Doe',
            'vcard-org': 'Example Company',
            'social-username': 'johndoe'
        };

        Object.entries(sampleData).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('dblclick', () => {
                    element.value = value;
                    element.dispatchEvent(new Event('input'));
                });
            }
        });
    }

    /**
     * Setup tooltips
     */
    setupTooltips() {
        const tooltips = {
            'margin': 'White space around the QR code (in modules)',
            'transparent-bg': 'Make background transparent (useful for overlaying on images)',
            'size-input': 'QR code dimensions (always square)'
        };

        Object.entries(tooltips).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.title = text;
            }
        });
    }

    /**
     * Get current QR code type
     * @returns {string} - Current type
     */
    getCurrentType() {
        return this.currentType;
    }
}