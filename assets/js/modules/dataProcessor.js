/**
 * Data processor for different QR code types
 */
import { Utils } from './utils.js';

export class DataProcessor {
    /**
     * Process data based on QR code type
     * @param {string} type - QR code type
     * @param {Object} inputs - Input values
     * @returns {string} - Processed data string
     */
    static processData(type, inputs) {
        switch (type) {
            case 'url':
                return this.processUrl(inputs.url);
            case 'text':
                return this.processText(inputs.text);
            case 'email':
                return this.processEmail(inputs);
            case 'phone':
                return this.processPhone(inputs.phone);
            case 'sms':
                return this.processSms(inputs);
            case 'wifi':
                return this.processWifi(inputs);
            case 'vcard':
                return this.processVcard(inputs);
            case 'social':
                return this.processSocial(inputs);
            default:
                return '';
        }
    }

    /**
     * Process URL data
     * @param {string} url - URL input
     * @returns {string} - Processed URL
     */
    static processUrl(url) {
        return Utils.ensureProtocol(url.trim());
    }

    /**
     * Process text data
     * @param {string} text - Text input
     * @returns {string} - Processed text
     */
    static processText(text) {
        return text.trim();
    }

    /**
     * Process email data
     * @param {Object} inputs - Email inputs
     * @returns {string} - Mailto URL
     */
    static processEmail(inputs) {
        const email = inputs.email.trim();
        const subject = inputs.emailSubject.trim();
        const body = inputs.emailBody.trim();
        
        let data = `mailto:${email}`;
        const params = [];
        
        if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
        if (body) params.push(`body=${encodeURIComponent(body)}`);
        
        if (params.length > 0) {
            data += '?' + params.join('&');
        }
        
        return data;
    }

    /**
     * Process phone data
     * @param {string} phone - Phone input
     * @returns {string} - Tel URL
     */
    static processPhone(phone) {
        return `tel:${phone.trim()}`;
    }

    /**
     * Process SMS data
     * @param {Object} inputs - SMS inputs
     * @returns {string} - SMS URL
     */
    static processSms(inputs) {
        const number = inputs.smsNumber.trim();
        const message = inputs.smsMessage.trim();
        
        let data = `sms:${number}`;
        if (message) {
            data += `?body=${encodeURIComponent(message)}`;
        }
        
        return data;
    }

    /**
     * Process WiFi data
     * @param {Object} inputs - WiFi inputs
     * @returns {string} - WiFi configuration string
     */
    static processWifi(inputs) {
        const ssid = inputs.wifiSsid.trim();
        const password = inputs.wifiPassword;
        const security = inputs.wifiSecurity;
        const hidden = inputs.wifiHidden;
        
        return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;
    }

    /**
     * Process vCard data
     * @param {Object} inputs - vCard inputs
     * @returns {string} - vCard string
     */
    static processVcard(inputs) {
        const name = inputs.vcardName.trim();
        const org = inputs.vcardOrg.trim();
        const phone = inputs.vcardPhone.trim();
        const email = inputs.vcardEmail.trim();
        const url = inputs.vcardUrl.trim();
        
        let data = 'BEGIN:VCARD\n';
        data += 'VERSION:3.0\n';
        if (name) data += `FN:${name}\n`;
        if (org) data += `ORG:${org}\n`;
        if (phone) data += `TEL:${phone}\n`;
        if (email) data += `EMAIL:${email}\n`;
        if (url) data += `URL:${url}\n`;
        data += 'END:VCARD';
        
        return data;
    }

    /**
     * Process social media data
     * @param {Object} inputs - Social inputs
     * @returns {string} - Social media URL
     */
    static processSocial(inputs) {
        const platform = inputs.socialPlatform;
        const username = inputs.socialUsername.trim();
        
        const socialUrls = {
            facebook: `https://facebook.com/${username}`,
            twitter: `https://twitter.com/${username}`,
            instagram: `https://instagram.com/${username}`,
            linkedin: `https://linkedin.com/in/${username}`,
            youtube: `https://youtube.com/@${username}`,
            tiktok: `https://tiktok.com/@${username}`
        };
        
        return socialUrls[platform] || '';
    }

    /**
     * Validate input data
     * @param {string} type - QR code type
     * @param {Object} inputs - Input values
     * @returns {Object} - Validation result
     */
    static validateData(type, inputs) {
        switch (type) {
            case 'url':
                const url = this.processUrl(inputs.url);
                if (!url) return { valid: false, message: 'Please enter a URL.' };
                if (!Utils.isValidUrl(url)) return { valid: false, message: 'Please enter a valid URL.' };
                break;
                
            case 'text':
                if (!inputs.text.trim()) return { valid: false, message: 'Please enter some text.' };
                break;
                
            case 'email':
                if (!Utils.isValidEmail(inputs.email)) return { valid: false, message: 'Please enter a valid email address.' };
                break;
                
            case 'phone':
            case 'sms':
                const phoneField = type === 'phone' ? inputs.phone : inputs.smsNumber;
                if (!phoneField.trim()) return { valid: false, message: 'Please enter a phone number.' };
                break;
                
            case 'wifi':
                if (!inputs.wifiSsid.trim()) return { valid: false, message: 'Please enter a WiFi network name.' };
                break;
                
            case 'vcard':
                if (!inputs.vcardName.trim()) return { valid: false, message: 'Please enter at least a name for the contact.' };
                break;
                
            case 'social':
                if (!inputs.socialUsername.trim()) return { valid: false, message: 'Please enter a username.' };
                break;
        }
        
        return { valid: true };
    }
}