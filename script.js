class QRCodeGenerator {
    constructor() {
        this.currentType = 'url';
        this.zxingLoaded = false;
        this.checkZXingLibrary();
        this.initializeElements();
        this.bindEvents();
        this.updateSliderValues();
    }

    checkZXingLibrary() {
        // Check if ZXing library is loaded
        if (typeof ZXing !== 'undefined') {
            this.zxingLoaded = true;
            console.log('ZXing loaded successfully');
            console.log('Available ZXing properties:', Object.keys(ZXing));
        } else {
            // Wait for library to load
            const checkInterval = setInterval(() => {
                if (typeof ZXing !== 'undefined') {
                    this.zxingLoaded = true;
                    console.log('ZXing loaded successfully');
                    console.log('Available ZXing properties:', Object.keys(ZXing));
                    clearInterval(checkInterval);
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                if (!this.zxingLoaded) {
                    clearInterval(checkInterval);
                    this.showError('ZXing library failed to load. Please refresh the page.');
                }
            }, 5000);
        }
    }

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
        this.downloadBtn = document.getElementById('download-btn');
        this.qrDisplay = document.getElementById('qr-code-display');
        this.downloadSection = document.getElementById('download-section');
        this.qrData = document.getElementById('qr-data');
        this.qrSize = document.getElementById('qr-size');
    }

    bindEvents() {
        // Type selector events
        this.typeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchType(e.target.dataset.type);
            });
        });

        // Slider events for size (sync slider and input)
        this.customization.size.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            // Round to nearest 10 for clean values
            const roundedValue = Math.round(value / 10) * 10;
            this.customization.size.value = roundedValue;
            this.customization.sizeInput.value = roundedValue;
        });

        // Size input events (sync input and slider)
        this.customization.sizeInput.addEventListener('input', (e) => {
            let value = parseInt(e.target.value);
            // Ensure value is within bounds
            if (value < 100) value = 100;
            if (value > 800) value = 800;
            // Round to nearest 10 for clean values
            value = Math.round(value / 10) * 10;
            this.customization.sizeInput.value = value;
            this.customization.size.value = value;
        });

        // Margin slider events
        this.customization.margin.addEventListener('input', (e) => {
            this.customization.marginValue.textContent = e.target.value;
        });

        // Transparent background toggle
        this.customization.transparentBg.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.customization.backgroundColor.disabled = true;
                this.customization.backgroundColor.style.opacity = '0.5';
            } else {
                this.customization.backgroundColor.disabled = false;
                this.customization.backgroundColor.style.opacity = '1';
            }
        });

        // Generate button
        this.generateBtn.addEventListener('click', () => {
            this.generateQRCode();
        });

        // Download button
        this.downloadBtn.addEventListener('click', () => {
            this.downloadQRCode();
        });

        // Auto-generate on input change
        Object.values(this.inputs).forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    this.clearErrors();
                });
            }
        });

        // Auto-generate on customization change
        Object.values(this.customization).forEach(control => {
            if (control && control.addEventListener) {
                control.addEventListener('change', () => {
                    if (this.lastGeneratedData) {
                        this.generateQRCode();
                    }
                });
            }
        });
    }

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

    updateSliderValues() {
        // Initialize size values
        const initialSize = parseInt(this.customization.size.value);
        const roundedSize = Math.round(initialSize / 10) * 10;
        this.customization.size.value = roundedSize;
        this.customization.sizeInput.value = roundedSize;
        
        // Initialize margin value
        this.customization.marginValue.textContent = this.customization.margin.value;
    }

    generateData() {
        let data = '';

        switch (this.currentType) {
            case 'url':
                data = this.inputs.url.value.trim();
                if (data && !data.startsWith('http://') && !data.startsWith('https://')) {
                    data = 'https://' + data;
                }
                break;

            case 'text':
                data = this.inputs.text.value.trim();
                break;

            case 'email':
                const emailAddr = this.inputs.email.value.trim();
                const subject = this.inputs.emailSubject.value.trim();
                const body = this.inputs.emailBody.value.trim();
                
                data = `mailto:${emailAddr}`;
                const params = [];
                if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
                if (body) params.push(`body=${encodeURIComponent(body)}`);
                if (params.length > 0) {
                    data += '?' + params.join('&');
                }
                break;

            case 'phone':
                data = `tel:${this.inputs.phone.value.trim()}`;
                break;

            case 'sms':
                const smsNumber = this.inputs.smsNumber.value.trim();
                const smsMessage = this.inputs.smsMessage.value.trim();
                data = `sms:${smsNumber}`;
                if (smsMessage) {
                    data += `?body=${encodeURIComponent(smsMessage)}`;
                }
                break;

            case 'wifi':
                const ssid = this.inputs.wifiSsid.value.trim();
                const password = this.inputs.wifiPassword.value;
                const security = this.inputs.wifiSecurity.value;
                const hidden = this.inputs.wifiHidden.checked;
                
                data = `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;
                break;

            case 'vcard':
                const name = this.inputs.vcardName.value.trim();
                const org = this.inputs.vcardOrg.value.trim();
                const phone = this.inputs.vcardPhone.value.trim();
                const vcardEmail = this.inputs.vcardEmail.value.trim();
                const url = this.inputs.vcardUrl.value.trim();
                
                data = 'BEGIN:VCARD\n';
                data += 'VERSION:3.0\n';
                if (name) data += `FN:${name}\n`;
                if (org) data += `ORG:${org}\n`;
                if (phone) data += `TEL:${phone}\n`;
                if (vcardEmail) data += `EMAIL:${vcardEmail}\n`;
                if (url) data += `URL:${url}\n`;
                data += 'END:VCARD';
                break;

            case 'social':
                const platform = this.inputs.socialPlatform.value;
                const username = this.inputs.socialUsername.value.trim();
                
                const socialUrls = {
                    facebook: `https://facebook.com/${username}`,
                    twitter: `https://twitter.com/${username}`,
                    instagram: `https://instagram.com/${username}`,
                    linkedin: `https://linkedin.com/in/${username}`,
                    youtube: `https://youtube.com/@${username}`,
                    tiktok: `https://tiktok.com/@${username}`
                };
                
                data = socialUrls[platform] || '';
                break;
        }

        return data;
    }

    validateInput() {
        const data = this.generateData();
        
        if (!data) {
            this.showError('Please enter the required information.');
            return false;
        }

        // Additional validation for specific types
        switch (this.currentType) {
            case 'url':
                try {
                    new URL(data);
                } catch {
                    this.showError('Please enter a valid URL.');
                    return false;
                }
                break;

            case 'email':
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(this.inputs.email.value)) {
                    this.showError('Please enter a valid email address.');
                    return false;
                }
                break;

            case 'phone':
            case 'sms':
                const phoneValue = this.currentType === 'phone' ? 
                    this.inputs.phone.value : this.inputs.smsNumber.value;
                if (!phoneValue.trim()) {
                    this.showError('Please enter a phone number.');
                    return false;
                }
                break;

            case 'wifi':
                if (!this.inputs.wifiSsid.value.trim()) {
                    this.showError('Please enter a WiFi network name.');
                    return false;
                }
                break;

            case 'vcard':
                if (!this.inputs.vcardName.value.trim()) {
                    this.showError('Please enter at least a name for the contact.');
                    return false;
                }
                break;

            case 'social':
                if (!this.inputs.socialUsername.value.trim()) {
                    this.showError('Please enter a username.');
                    return false;
                }
                break;
        }

        return true;
    }

    generateQRCode() {
        this.clearErrors();

        // Check if ZXing is loaded
        if (!this.zxingLoaded) {
            this.showError('ZXing library is not loaded yet. Please wait a moment and try again.');
            return;
        }

        if (!this.validateInput()) {
            return;
        }

        const data = this.generateData();
        this.lastGeneratedData = data;

        // Show loading state
        this.generateBtn.classList.add('loading');
        this.generateBtn.textContent = 'Generating...';

        try {
            // Get customization options
            const size = parseInt(this.customization.sizeInput.value);
            const foregroundColor = this.customization.foregroundColor.value;
            const backgroundColor = this.customization.transparentBg.checked ? 
                'transparent' : this.customization.backgroundColor.value;
            const margin = parseInt(this.customization.margin.value);

            // Clear previous QR code
            this.qrDisplay.innerHTML = '';
            
            // Create canvas - ensure it's always square
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size (always square)
            canvas.width = size;
            canvas.height = size;
            
            // Generate QR code using ZXing with default error correction
            let bitMatrix;
            try {
                const hints = new Map();
                
                // Use medium error correction by default (good balance)
                if (ZXing.EncodeHintType && ZXing.ErrorCorrectionLevel) {
                    hints.set(ZXing.EncodeHintType.ERROR_CORRECTION, ZXing.ErrorCorrectionLevel.M);
                }
                if (ZXing.EncodeHintType && ZXing.EncodeHintType.MARGIN) {
                    hints.set(ZXing.EncodeHintType.MARGIN, margin);
                }

                const writer = new ZXing.QRCodeWriter();
                bitMatrix = writer.encode(data, ZXing.BarcodeFormat.QR_CODE, size, size, hints);
            } catch (hintError) {
                // Fallback: try without hints
                console.warn('Error with hints, trying without:', hintError);
                const writer = new ZXing.QRCodeWriter();
                bitMatrix = writer.encode(data, ZXing.BarcodeFormat.QR_CODE, size, size);
            }
            
            // Draw QR code on canvas
            this.drawQRCode(ctx, bitMatrix, size, foregroundColor, backgroundColor);
            
            // Add canvas to display
            this.qrDisplay.appendChild(canvas);
            this.qrDisplay.classList.add('has-qr');
            
            // Update info and show download section
            this.qrData.textContent = data.length > 50 ? data.substring(0, 50) + '...' : data;
            this.qrSize.textContent = `${size} × ${size}px (Square)`;
            this.downloadSection.classList.remove('hidden');
            
            // Store canvas for download
            this.generatedCanvas = canvas;

        } catch (error) {
            this.showError('Error generating QR code: ' + error.message);
            console.error('QR Code generation error:', error);
        } finally {
            // Reset button state
            this.generateBtn.classList.remove('loading');
            this.generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate QR Code';
        }
    }

    drawQRCode(ctx, bitMatrix, size, foregroundColor, backgroundColor) {
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

    downloadQRCode() {
        if (!this.generatedCanvas) {
            this.showError('No QR code to download. Please generate one first.');
            return;
        }

        try {
            // Create download link
            const link = document.createElement('a');
            link.download = `qrcode-${this.currentType}-${Date.now()}.png`;
            
            // Convert canvas to blob and create URL
            this.generatedCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.click();
                
                // Clean up
                setTimeout(() => URL.revokeObjectURL(url), 100);
            }, 'image/png');

        } catch (error) {
            this.showError('Error downloading QR code: ' + error.message);
            console.error('Download error:', error);
        }
    }

    showError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            this.generateBtn.parentNode.insertBefore(errorDiv, this.generateBtn);
        }
        
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 5000);
    }

    clearErrors() {
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.classList.remove('show');
        }
        
        // Remove error styling from inputs
        document.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
        });
    }
}

// Initialize the QR Code Generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for ZXing to load
    setTimeout(() => {
        new QRCodeGenerator();
    }, 100);
});

// Fallback QR code generator using a different approach
function createFallbackQRCode(text, size) {
    // This is a simple fallback that creates a basic pattern
    // In a real implementation, you might want to use another library
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    
    // Create a simple pattern to indicate QR code generation failed
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', size/2, size/2 - 10);
    ctx.fillText('Generation', size/2, size/2 + 10);
    ctx.fillText('Error', size/2, size/2 + 30);
    
    return canvas;
}

// Add some utility functions for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('generate-btn').click();
        }
    });

    // Add tooltips for better accessibility
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

    // Add sample data for quick testing
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

    // Add double-click to fill sample data
    Object.entries(sampleData).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('dblclick', () => {
                element.value = value;
                element.dispatchEvent(new Event('input'));
            });
        }
    });
});