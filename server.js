const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// IRYS SDK imports
const { Uploader } = require('@irys/upload');
const { Solana } = require('@irys/upload-solana');

// Solana imports for faucet
const { Connection, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
let bs58;
try {
  bs58 = require('bs58');
} catch (e) {
  console.log('bs58 import error, trying alternative approach');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// IRYS uploader instance
let irysUploader;

// Solana connection
const solanaConnection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');

// Get wallet keypair
const getWalletKeypair = () => {
  try {
    // Handle different bs58 versions
    const decode = bs58.decode || bs58.default?.decode || bs58;
    if (typeof decode !== 'function') {
      throw new Error('bs58.decode function not available');
    }
    return Keypair.fromSecretKey(decode(process.env.SOLANA_PRIVATE_KEY));
  } catch (error) {
    console.error('Error creating wallet keypair:', error);
    throw error;
  }
};

// Initialize IRYS uploader
const getIrysUploader = async () => {
  if (!irysUploader) {
    try {
      // Configure IRYS for devnet with RPC URL
      irysUploader = await Uploader(Solana)
        .withWallet(process.env.SOLANA_PRIVATE_KEY)
        .withRpc(process.env.SOLANA_RPC_URL) // Required for devnet
        .devnet(); // Use devnet for testing
      
      console.log('IRYS uploader initialized successfully');
      console.log('Network:', irysUploader.api.url);
      console.log('Wallet address:', irysUploader.address);
    } catch (error) {
      console.error('Failed to initialize IRYS uploader:', error);
      throw error;
    }
  }
  return irysUploader;
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'IRYS Photo Upload Server is running' });
});

// Get wallet balance
app.get('/api/balance', async (req, res) => {
  try {
    const uploader = await getIrysUploader();
    const balance = await uploader.getBalance();
    const address = uploader.address;
    
    // Also get SOL balance from Solana
    const keypair = getWalletKeypair();
    const solBalance = await solanaConnection.getBalance(keypair.publicKey);
    
    res.json({
      address,
      balance: uploader.utils.fromAtomic(balance),
      balanceAtomic: balance.toString(),
      token: uploader.token,
      solBalance: solBalance / LAMPORTS_PER_SOL,
      solBalanceLamports: solBalance
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Request SOL from faucet
app.post('/api/faucet', async (req, res) => {
  try {
    const keypair = getWalletKeypair();
    const publicKey = keypair.publicKey;
    
    // Request airdrop from Solana devnet faucet
    const airdropSignature = await solanaConnection.requestAirdrop(
      publicKey,
      2 * LAMPORTS_PER_SOL // Request 2 SOL
    );
    
    // Wait for confirmation
    await solanaConnection.confirmTransaction(airdropSignature);
    
    // Get new balance
    const newBalance = await solanaConnection.getBalance(publicKey);
    
    res.json({
      message: 'SOL airdrop successful',
      signature: airdropSignature,
      newBalance: newBalance / LAMPORTS_PER_SOL,
      address: publicKey.toString()
    });
  } catch (error) {
    console.error('Error requesting airdrop:', error);
    res.status(500).json({ 
      error: 'Failed to request airdrop',
      message: error.message
    });
  }
});

// Fund wallet (for testing)
app.post('/api/fund', async (req, res) => {
  try {
    const { amount } = req.body;
    const uploader = await getIrysUploader();
    
    const fundAmount = amount || 0.1; // Default 0.1 SOL
    const fundTx = await uploader.fund(uploader.utils.toAtomic(fundAmount));
    
    res.json({
      message: `Successfully funded ${uploader.utils.fromAtomic(fundTx.quantity)} ${uploader.token}`,
      txId: fundTx.id,
      quantity: uploader.utils.fromAtomic(fundTx.quantity)
    });
  } catch (error) {
    console.error('Error funding wallet:', error);
    res.status(500).json({ error: 'Failed to fund wallet' });
  }
});

// Upload photo to IRYS
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    const uploader = await getIrysUploader();
    
    // Check balance before upload
    const balance = await uploader.getBalance();
    const price = await uploader.getPrice(req.file.size);
    
    if (balance.lt(price)) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: uploader.utils.fromAtomic(price),
        available: uploader.utils.fromAtomic(balance)
      });
    }

    // Upload file to IRYS
    const filePath = req.file.path;
    const tags = [
      { name: 'Content-Type', value: req.file.mimetype },
      { name: 'application-id', value: 'irys-photo-upload' },
      { name: 'file-name', value: req.file.originalname }
    ];

    const receipt = await uploader.uploadFile(filePath, { tags });
    
    // Clean up local file
    fs.unlinkSync(filePath);
    
    const gatewayUrl = `https://gateway.irys.xyz/${receipt.id}`;
    
    res.json({
      message: 'Photo uploaded successfully',
      id: receipt.id,
      url: gatewayUrl,
      size: req.file.size,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      tags: tags
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    
    // Clean up local file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Get photo metadata
app.get('/api/photo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gatewayUrl = `https://gateway.irys.xyz/${id}`;
    
    res.json({
      id,
      url: gatewayUrl,
      gateway: 'https://gateway.irys.xyz'
    });
  } catch (error) {
    console.error('Error getting photo metadata:', error);
    res.status(500).json({ error: 'Failed to get photo metadata' });
  }
});

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  res.status(500).json({ error: error.message });
});

// Initialize server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  
  try {
    await getIrysUploader();
    console.log('IRYS uploader ready');
  } catch (error) {
    console.error('Failed to initialize IRYS uploader:', error);
  }
});
