# QR Code Generator ZX

A powerful, customizable QR code generator web application powered by the ZXing ("Zebra Crossing") open-source library from Google.

## Features

### Supported QR Code Types

- **URL/Website Links** - Generate QR codes for any website
- **Plain Text** - Any text content
- **Email** - mailto links with optional subject and body
- **Phone Numbers** - tel: links for direct calling
- **SMS** - SMS links with pre-filled messages
- **WiFi Networks** - WiFi connection details (SSID, password, security type)
- **vCard Contacts** - Digital business cards with contact information
- **Social Media** - Direct links to Facebook, Twitter, Instagram, LinkedIn, YouTube, TikTok profiles

### Customization Options

- **Size Control**: Adjustable from 100px to 800px with both slider and input box
- **QR Code Color**: Custom color for the QR code pattern
- **Background Color**: Custom background color
- **Transparent Background**: Option for transparent PNG output
- **Border Spacing**: Adjustable white space around the QR code
- **Smart Defaults**: Optimal error correction applied automatically

### Download Features

- High-quality PNG format
- Transparent background support
- Always square dimensions (1:1 ratio)
- Custom filename with timestamp
- One-click download

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **QR Code Library**: ZXing-js (JavaScript port of Google's ZXing library)
- **Styling**: Custom CSS with responsive design
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter)

## Usage

1. **Select QR Code Type**: Choose from the available type buttons (URL, Text, Email, etc.)
2. **Enter Content**: Fill in the required information for your selected type
3. **Customize Appearance**: 
   - **Size & Dimensions**: Set QR code size and border spacing
   - **Colors & Appearance**: Choose QR code color, background color, or transparent background
4. **Generate**: Click "Generate QR Code" to create your QR code
5. **Download**: Click "Download PNG" to save your QR code

### Quick Tips

- Double-click input fields to fill with sample data for testing
- Use Ctrl+Enter (or Cmd+Enter on Mac) to quickly generate QR codes
- Type exact sizes in the size input box or use the slider for quick adjustments
- Enable transparent background for overlaying on images
- QR codes are always generated as perfect squares for professional appearance

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Installation

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. No additional installation or setup required!

## Project Structure

```
QRCodeGeneratorZX/
├── index.html          # Main application
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── package.json        # Project configuration
├── .gitignore         # Git ignore rules
└── README.md          # Project documentation
```

## Open Source Libraries

This project uses the following open-source libraries:

- **ZXing-js**: JavaScript port of Google's ZXing library for QR code generation
- **Font Awesome**: Icons for the user interface
- **Google Fonts**: Inter font family for typography

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## Acknowledgments

- Google's ZXing project for the excellent barcode processing library
- The ZXing-js team for the JavaScript port
- Font Awesome for the beautiful icons
- Google Fonts for the typography
