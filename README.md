# QR Code Generator ZX

A powerful, customizable QR code generator web application powered by the ZXing ("Zebra Crossing") open-source library from Google. Features a modular architecture for maintainability and supports both PNG and SVG export formats.

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

### Customization Options (Categorized Interface)

#### Size & Dimensions

- **Display Size**: Visual size in the interface (200px - 600px)
- **Download Size**: Export resolution (100px - 800px)
- **Border Spacing**: Adjustable white space around the QR code

#### Colors & Appearance

- **QR Code Color**: Custom color for the QR code pattern
- **Background Color**: Custom background color
- **Transparent Background**: Option for transparent exports
- **Smart Defaults**: Optimal settings applied automatically

### Export Features

- **Dual Format Support**: PNG (raster) and SVG (vector) exports
- **High Quality**: PNG with custom resolution, SVG with crisp vectors
- **Transparent Background**: Support for both PNG and SVG formats
- **Custom Filenames**: Automatic timestamps for organization
- **Professional Output**: Always square dimensions (1:1 ratio)

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+ with modules)
- **Architecture**: Modular design with separation of concerns
- **QR Code Library**: ZXing-js (JavaScript port of Google's ZXing library)
- **Styling**: Custom CSS with responsive design and categorized layout
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter)

## Usage

1. **Select QR Code Type**: Choose from the available type buttons (URL, Text, Email, etc.)
2. **Enter Content**: Fill in the required information for your selected type
3. **Customize Appearance**:
   - **Size & Dimensions**: Set display size, download size, and border spacing
   - **Colors & Appearance**: Choose QR code color, background color, or transparent background
4. **Generate**: Click "Generate QR Code" to create your QR code
5. **Download**: Choose "Download PNG" for raster images or "Download SVG" for vector graphics

### Quick Tips

- Double-click input fields to fill with sample data for testing
- Use Ctrl+Enter (or Cmd+Enter on Mac) to quickly generate QR codes
- Type exact sizes in the size input boxes or use sliders for quick adjustments
- Enable transparent background for overlaying on images or documents
- Choose SVG for logos/print materials, PNG for web/social media
- QR codes are always generated as perfect squares for professional appearance

## Architecture

The application uses a modular ES6+ architecture for maintainability:

### Core Modules

- **Utils** (`assets/js/modules/utils.js`): Common utilities and validation functions
- **Data Processor** (`assets/js/modules/dataProcessor.js`): Handles different QR code types and data formatting
- **QR Generator** (`assets/js/modules/qrGenerator.js`): Core QR code generation for PNG and SVG formats
- **UI Controller** (`assets/js/modules/uiController.js`): Manages user interface interactions and state
- **App Controller** (`assets/js/app.js`): Main application coordinator

### Benefits of Modular Design

- **Maintainability**: Clear separation of concerns
- **Reusability**: Functions can be easily reused across modules
- **Testability**: Individual modules can be tested independently
- **Scalability**: Easy to add new features without affecting existing code
- **DRY Principle**: No code duplication across modules

## Browser Compatibility

- Chrome 60+ (ES6 modules support)
- Firefox 55+ (ES6 modules support)
- Safari 11+ (ES6 modules support)
- Edge 79+ (ES6 modules support)

## Installation

1. Clone or download this repository
2. Serve the files through a web server (required for ES6 modules)
   - For development: `python -m http.server 8000` or `npx serve`
   - For production: Deploy to any static hosting service
3. Open the application in a modern web browser

**Note**: ES6 modules require serving files through HTTP/HTTPS protocol, not file:// protocol.

## Project Structure

```text
QRCodeGeneratorZX/
├── index.html                              # Main application
├── assets/
│   ├── css/
│   │   └── styles.css                      # Complete application styling
│   └── js/
│       ├── app.js                          # Main application controller
│       └── modules/
│           ├── utils.js                    # Utility functions
│           ├── dataProcessor.js            # QR data processing
│           ├── qrGenerator.js              # QR generation (PNG & SVG)
│           └── uiController.js             # UI state management
├── package.json                            # Project configuration
├── .gitignore                             # Git ignore rules
└── README.md                              # Project documentation
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
- Add new QR code types
- Enhance the modular architecture

## Development

To work on this project:

1. Clone the repository
2. Start a local development server
3. Make changes to the modular codebase
4. Test across different browsers
5. Submit pull requests with clear descriptions

## Acknowledgments

- Google's ZXing project for the excellent barcode processing library
- The ZXing-js team for the JavaScript port
- Font Awesome for the beautiful icons
- Google Fonts for the typography
