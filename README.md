# 📸 Irysgram

A decentralized Instagram-like photo sharing application built with IRYS datachain and Solana blockchain technology.

![Irysgram Banner](public/logo.svg)

## 🌟 Overview

Irysgram is a modern, decentralized photo sharing platform that combines the familiar Instagram-like user experience with the power of blockchain technology. Built on IRYS datachain with Solana devnet integration, it offers permanent photo storage and a seamless social media experience.

## ✨ Features

- **📱 Instagram-like Timeline**: Clean, modern interface with photo timeline feed
- **🔗 Blockchain Integration**: Photos stored permanently on IRYS datachain
- **💰 Solana Wallet**: Integrated wallet management with SOL and IRYS balance tracking
- **🎨 Responsive Design**: Works perfectly on desktop and mobile devices
- **🗑️ Photo Management**: Upload, view, and delete photos with ease
- **🔒 Secure Storage**: Decentralized storage with IRYS permanent data
- **⚡ Fast Uploads**: Efficient photo upload with progress tracking
- **🌍 Gateway Access**: Direct access to photos via IRYS gateway
- **🎯 Profile Links**: Click username to visit social profiles

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Blockchain**: Solana (Devnet), IRYS Datachain
- **Storage**: IRYS permanent data storage
- **Styling**: Custom CSS with modern design principles
- **Icons**: Font Awesome

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Solana wallet with devnet SOL
- IRYS account setup

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/0xdevrel/irysgram.git
   cd irysgram
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   SOLANA_PRIVATE_KEY=your_base58_encoded_private_key
   SOLANA_RPC_URL=https://api.devnet.solana.com
   PORT=3000
   ```

4. **Fund your wallet**
   - Get devnet SOL from [Solana faucet](https://faucet.solana.com/)
   - Fund IRYS balance using the app's fund button

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📋 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Solana Configuration
SOLANA_PRIVATE_KEY=your_base58_encoded_private_key_here
SOLANA_RPC_URL=https://api.devnet.solana.com

# Server Configuration
PORT=3000

# Optional: Custom IRYS Configuration
IRYS_NODE_URL=https://devnet.irys.xyz
```

### Wallet Setup

1. **Generate a Solana Keypair**
   ```bash
   solana-keygen new --outfile ~/.config/solana/id.json
   ```

2. **Get your private key**
   ```bash
   solana-keygen pubkey ~/.config/solana/id.json
   ```

3. **Convert to base58 format** (use tools like bs58 encoder)

4. **Add to .env file**

## 🎯 Usage

### Upload Photos
1. Click the camera icon or drag & drop images
2. Select photos from your device
3. Images are automatically uploaded to IRYS
4. View uploaded photos in your timeline

### Manage Wallet
- **Check Balance**: View SOL and IRYS balances in profile
- **Fund Wallet**: Use the fund button to add IRYS tokens
- **Get SOL**: Use the faucet button for devnet SOL

### Delete Photos
- Click the trash icon on any photo
- Confirm deletion in the dialog
- Photo is removed from timeline and localStorage

### Profile Features
- View your profile with photo count and balances
- Click username to visit linked social profiles
- Profile picture displays your custom avatar

## 🏗️ Project Structure

```
irysgram/
├── public/                 # Static files
│   ├── css/
│   │   └── styles.css     # Main stylesheet
│   ├── js/
│   │   └── app.js         # Frontend JavaScript
│   ├── index.html         # Main HTML file
│   ├── logo.svg           # IRYS logo
│   └── manish.png         # Profile picture
├── server/                # Backend files
│   └── app.js            # Express server
├── package.json          # Dependencies
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## 🔌 API Endpoints

### GET /api/balance
Get wallet balance and address information
```json
{
  "address": "wallet_address",
  "balance": "irys_balance_in_lamports",
  "solBalance": "sol_balance_in_lamports"
}
```

### POST /api/upload
Upload photo to IRYS
- **Content-Type**: multipart/form-data
- **Field**: photo (file)
- **Returns**: Upload receipt with ID and gateway URL

### POST /api/fund
Fund IRYS wallet for testing
- **Returns**: Funding transaction details

### POST /api/faucet
Request SOL airdrop (devnet only)
- **Returns**: Airdrop transaction signature

### GET /api/health
Health check endpoint
- **Returns**: Server status

## 🔧 Development

### Running in Development Mode

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start
```

### File Upload Configuration

The app supports:
- **File Types**: JPG, PNG, GIF, WebP
- **Max Size**: 10MB per file
- **Storage**: IRYS permanent storage
- **Access**: Via IRYS gateway URLs

### Customization

1. **Colors**: Edit CSS variables in `styles.css`
2. **Profile**: Replace `manish.png` with your profile picture
3. **Branding**: Update logo and favicon
4. **Links**: Modify profile links in HTML/JS

## 🌐 Network Configuration

### IRYS Devnet
- **Node URL**: https://devnet.irys.xyz
- **Gateway**: https://gateway.irys.xyz
- **Currency**: SOL (Solana devnet)
- **Retention**: 60 days (devnet)

### Solana Devnet
- **RPC URL**: https://api.devnet.solana.com
- **Faucet**: https://faucet.solana.com/
- **Explorer**: https://explorer.solana.com/?cluster=devnet

## 🐛 Troubleshooting

### Common Issues

1. **Wallet Connection Failed**
   - Check if private key is valid base58 format
   - Ensure wallet has sufficient SOL balance
   - Verify RPC URL is accessible

2. **Upload Failed**
   - Check IRYS balance (fund wallet if needed)
   - Verify file size is under 10MB
   - Ensure file is a valid image format

3. **Port Already in Use**
   - Kill existing processes: `pkill -f node`
   - Use different port: `PORT=3001 npm run dev`

### Debug Mode

Enable debug logging:
```bash
DEBUG=app:* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **GitHub**: https://github.com/0xdevrel/irysgram
- **IRYS Documentation**: https://docs.irys.xyz
- **Solana Documentation**: https://docs.solana.com
- **Creator**: [@0xdevrel](https://x.com/0xdevrel)

## 📞 Support

For support, please open an issue on GitHub or contact [@0xdevrel](https://x.com/0xdevrel) on Twitter.

---

Built with ❤️ by [@0xdevrel](https://x.com/0xdevrel) using IRYS and Solana
