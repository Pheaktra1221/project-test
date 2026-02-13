import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import os from 'os';
import dotenv from 'dotenv';

// ========== LOAD ENVIRONMENT VARIABLES ==========
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = path.join(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

const router = Router();
const upload = multer({ dest: 'uploads/' });

const emitRefresh = (req, resource) => {
  const io = req.app.get('io');
  if (io) io.emit('data_refresh', { resource });
};

// Create connection pool
import pool from '../config/db.js';

// ========== DEBUG ENVIRONMENT VARIABLES ==========
console.log('\n=== UPLOAD.JS STARTING ===');
console.log('Current directory:', __dirname);
console.log('Environment file loaded from:', envPath);
console.log('Environment variables:');
console.log('  GOOGLE_OAUTH_CLIENT_ID:', process.env.GOOGLE_OAUTH_CLIENT_ID ? '✓ Present' : '✗ MISSING');
console.log('  GOOGLE_OAUTH_CLIENT_SECRET:', process.env.GOOGLE_OAUTH_CLIENT_SECRET ? '✓ Present' : '✗ MISSING');
console.log('  GOOGLE_OAUTH_REDIRECT_URI:', process.env.GOOGLE_OAUTH_REDIRECT_URI || '✗ MISSING');
console.log('  GOOGLE_DRIVE_KEY_FILE:', process.env.GOOGLE_DRIVE_KEY_FILE || 'Not set');

let KEYS_DIR = process.env.GOOGLE_KEYS_DIR || path.join(__dirname, '..', 'config', 'keys', 'keys');
if (!process.env.GOOGLE_KEYS_DIR && fs.existsSync('/data/keys')) {
  KEYS_DIR = '/data/keys';
}
let DRIVE_KEY_PATH = process.env.GOOGLE_DRIVE_KEY_FILE || path.join(KEYS_DIR, 'drive-key.json');
let OAUTH_TOKEN_PATH = process.env.GOOGLE_OAUTH_TOKEN_PATH || path.join(KEYS_DIR, 'oauth-token.json');

console.log('\n=== PATH CONFIGURATION ===');
console.log('Keys directory:', KEYS_DIR);
console.log('Drive key path:', DRIVE_KEY_PATH);
console.log('Drive key exists:', fs.existsSync(DRIVE_KEY_PATH));
console.log('OAuth token path:', OAUTH_TOKEN_PATH);
console.log('OAuth token exists:', fs.existsSync(OAUTH_TOKEN_PATH));

// ========== INITIALIZE GOOGLE AUTH ==========
let keyFilePath = null;

// Check environment variable first
if (process.env.GOOGLE_DRIVE_KEY_FILE && fs.existsSync(process.env.GOOGLE_DRIVE_KEY_FILE)) {
  keyFilePath = process.env.GOOGLE_DRIVE_KEY_FILE;
  console.log('Using key file from env:', keyFilePath);
} else if (fs.existsSync(DRIVE_KEY_PATH)) {
  keyFilePath = DRIVE_KEY_PATH;
  console.log('Using default key file:', keyFilePath);
} else {
  console.warn('⚠️ Google Drive key file not found at:', DRIVE_KEY_PATH);
}

let auth = null;
let drive = null;

try {
  if (keyFilePath) {
    auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/drive']
    });
    drive = google.drive({ version: 'v3', auth });
    console.log('✅ Google Drive API initialized');
  } else {
    console.warn('⚠️ Google Drive API not initialized - no key file');
  }
} catch (error) {
  console.error('❌ Failed to initialize Google Drive API:', error.message);
}

// ========== OAuth2 CLIENT FOR USER AUTH ==========
const getOAuth2Client = () => {
  console.log('\n=== Creating OAuth2 Client ===');
  
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  
  console.log('Client ID:', clientId ? '✓ Present' : '✗ MISSING');
  console.log('Client Secret:', clientSecret ? '✓ Present' : '✗ MISSING');
  console.log('Redirect URI:', redirectUri || '✗ MISSING');
  
  if (!clientId) {
    console.error('❌ GOOGLE_OAUTH_CLIENT_ID is not set in .env');
    return null;
  }
  
  if (!clientSecret) {
    console.error('❌ GOOGLE_OAUTH_CLIENT_SECRET is not set in .env');
    return null;
  }
  
  if (!redirectUri) {
    console.error('❌ GOOGLE_OAUTH_REDIRECT_URI is not set in .env');
    return null;
  }
  
  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    console.log('✅ OAuth2 client created successfully');
    return oauth2Client;
  } catch (error) {
    console.error('❌ Failed to create OAuth2 client:', error.message);
    return null;
  }
};

// ========== TOKEN MANAGEMENT ==========
const loadUserTokens = () => {
  console.log('\n=== Loading OAuth Tokens ===');
  console.log('Token path:', OAUTH_TOKEN_PATH);
  
  try {
    if (fs.existsSync(OAUTH_TOKEN_PATH)) {
      console.log('📂 Loading tokens from:', OAUTH_TOKEN_PATH);
      const content = fs.readFileSync(OAUTH_TOKEN_PATH, 'utf8');
      const tokens = JSON.parse(content);
      console.log('✅ Tokens loaded successfully');
      console.log('Has refresh token:', !!tokens.refresh_token);
      console.log('Expiry date:', tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'No expiry');
      return tokens;
    } else {
      console.log('📂 No OAuth tokens file found at:', OAUTH_TOKEN_PATH);
      // List files in directory
      if (fs.existsSync(KEYS_DIR)) {
        console.log('Files in keys directory:', fs.readdirSync(KEYS_DIR).join(', '));
      }
    }
  } catch (error) {
    console.error('❌ Error loading OAuth tokens:', error.message);
    console.error('Stack:', error.stack);
  }
  return null;
};

const saveUserTokens = (tokens) => {
  try {
    console.log('💾 Saving tokens to:', OAUTH_TOKEN_PATH);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(KEYS_DIR)) {
      fs.mkdirSync(KEYS_DIR, { recursive: true });
      console.log('📁 Created directory:', KEYS_DIR);
    }
    
    fs.writeFileSync(OAUTH_TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf8');
    console.log('✅ Tokens saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Could not save OAuth tokens:', error.message);
    return false;
  }
};

// ========== ROUTES ==========

// 1. ROOT ENDPOINT - Test if router is working
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Upload router is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      test: '/test',
      authStatus: '/auth/status',
      authUrl: '/auth/url',
      authCallback: '/auth/callback',
      debug: '/debug',
      preview: '/preview',
      upload: '/ (POST)',
      userUpload: '/user (POST)'
    }
  });
});

// 2. TEST ENDPOINT
router.get('/test', (req, res) => {
  const oauth2Client = getOAuth2Client();
  
  res.json({
    success: true,
    message: 'Upload test endpoint',
    serverTime: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3001,
      hasDriveKey: !!keyFilePath,
      hasOAuthClient: !!oauth2Client,
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ? 'Configured' : 'Missing',
      redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'Missing'
    }
  });
});

// 3. DEBUG ENDPOINT
router.get('/debug', (req, res) => {
  const config = {
    paths: {
      keysDir: KEYS_DIR,
      keysDirExists: fs.existsSync(KEYS_DIR),
      driveKeyPath: DRIVE_KEY_PATH,
      driveKeyExists: fs.existsSync(DRIVE_KEY_PATH),
      oauthTokenPath: OAUTH_TOKEN_PATH,
      oauthTokenExists: fs.existsSync(OAUTH_TOKEN_PATH)
    },
    environment: {
      GOOGLE_DRIVE_KEY_FILE: process.env.GOOGLE_DRIVE_KEY_FILE || 'Not set',
      GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID || 'Not set',
      GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID ? 'Set' : 'MISSING',
      GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET ? 'Set' : 'MISSING',
      GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'MISSING'
    },
    tokens: loadUserTokens() ? 'Present' : 'Not present',
    canCreateOAuthClient: !!getOAuth2Client()
  };
  
  res.json({ success: true, config });
});

// 4. AUTH DEBUG ENDPOINT
router.get('/auth/debug', (req, res) => {
  console.log('\n=== /auth/debug endpoint called ===');
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID ? '✓ Present' : '✗ MISSING',
      GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET ? '✓ Present (hidden)' : '✗ MISSING',
      GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI || '✗ MISSING'
    },
    paths: {
      keysDir: KEYS_DIR,
      keysDirExists: fs.existsSync(KEYS_DIR),
      oauthTokenPath: OAUTH_TOKEN_PATH,
      oauthTokenExists: fs.existsSync(OAUTH_TOKEN_PATH)
    },
    tokens: loadUserTokens() ? '✅ Present' : '❌ Not present',
    oauthClient: getOAuth2Client() ? '✅ Created' : '❌ Failed to create',
    authUrlAvailable: !!(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET && process.env.GOOGLE_OAUTH_REDIRECT_URI)
  };
  
  res.json({ success: true, debug: debugInfo });
});

// 5. GET AUTH URL
router.get('/auth/url', (req, res) => {
  console.log('\n=== /auth/url endpoint called ===');
  
  try {
    const oauth2Client = getOAuth2Client();
    
    if (!oauth2Client) {
      console.error('❌ Cannot create OAuth2 client');
      return res.status(400).json({
        success: false,
        message: 'OAuth configuration incomplete',
        details: {
          clientId: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
          clientSecret: !!process.env.GOOGLE_OAUTH_CLIENT_SECRET,
          redirectUri: !!process.env.GOOGLE_OAUTH_REDIRECT_URI
        },
        help: 'Please check your .env file has GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REDIRECT_URI'
      });
    }
    
    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file'],
      prompt: 'consent',
      include_granted_scopes: true
    });
    
    console.log('✅ Generated auth URL:', authUrl);
    
    return res.json({
      success: true,
      url: authUrl,
      message: 'Authorization URL generated successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in /auth/url:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
      error: error.toString()
    });
  }
});

// 6. AUTH STATUS
router.get('/auth/status', async (req, res) => {
  try {
    const tokens = loadUserTokens();
    
    if (!tokens) {
      return res.json({
        success: true,
        authorized: false,
        message: 'Not authorized. Please click "ផ្តល់សិទ្ធិ Drive" to authorize.',
        hasTokens: false
      });
    }
    
    // Check if token has expired
    const now = Date.now();
    const expiryDate = tokens.expiry_date;
    
    if (expiryDate && now > expiryDate) {
      console.log('Token expired, attempting refresh...');
      
      try {
        const oauth2Client = getOAuth2Client();
        if (oauth2Client) {
          oauth2Client.setCredentials(tokens);
          const { credentials } = await oauth2Client.refreshAccessToken();
          
          if (credentials) {
            saveUserTokens(credentials);
            return res.json({
              success: true,
              authorized: true,
              expired: false,
              message: 'Authorized (token refreshed)'
            });
          }
        }
        
        return res.json({
          success: true,
          authorized: false,
          expired: true,
          message: 'Authorization expired. Please re-authorize.'
        });
        
      } catch (refreshErr) {
        console.error('Token refresh error:', refreshErr.message);
        return res.json({
          success: true,
          authorized: false,
          expired: true,
          message: 'Authorization expired. Please re-authorize.'
        });
      }
    }
    
    return res.json({
      success: true,
      authorized: true,
      expired: false,
      message: 'Authorized'
    });
    
  } catch (err) {
    console.error('auth status error', err);
    return res.status(500).json({
      success: false,
      authorized: false,
      message: 'Server error checking auth status'
    });
  }
});

// 7. AUTH CALLBACK
router.get('/auth/callback', async (req, res) => {
  console.log('\n=== /auth/callback called ===');
  console.log('Query params:', req.query);
  
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send(`
        <html>
          <head><title>Authorization Error</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1 style="color: #d32f2f;">Authorization Error</h1>
            <p>Missing authorization code.</p>
            <p>Please close this window and try again.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>
      `);
    }
    
    const oauth2Client = getOAuth2Client();
    
    if (!oauth2Client) {
      return res.status(400).send(`
        <html>
          <head><title>Configuration Error</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1 style="color: #d32f2f;">Configuration Error</h1>
            <p>OAuth client not configured on server.</p>
            <p>Please contact administrator.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>
      `);
    }
    
    console.log('Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code.toString());
    console.log('Tokens received:', tokens ? 'Yes' : 'No');
    
    const saved = saveUserTokens(tokens);
    
    if (!saved) {
      return res.status(500).send(`
        <html>
          <head><title>Save Error</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1 style="color: #d32f2f;">Save Error</h1>
            <p>Could not save authorization tokens.</p>
            <p>Please try again.</p>
            <script>setTimeout(() => window.close(), 3000);</script>
          </body>
        </html>
      `);
    }
    
    return res.send(`
      <html>
        <head><title>Authorization Successful</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: #388e3c;">✅ Authorization Successful!</h1>
          <p>Google Drive has been authorized successfully.</p>
          <p>You can now upload images to your Drive.</p>
          <p style="color: #666; margin-top: 30px;">This window will close automatically...</p>
          <script>
            // Notify parent window
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage('oauth_complete', '*');
            }
            // Close after 2 seconds
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).send(`
      <html>
        <head><title>Authorization Error</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: #d32f2f;">Authorization Error</h1>
          <p>${error.message || 'Unknown error occurred'}</p>
          <p>Please close this window and try again.</p>
          <script>setTimeout(() => window.close(), 5000);</script>
        </body>
      </html>
    `);
  }
});

// ========== EXISTING ENDPOINTS ==========

// Upload image to Google Drive
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { studentId, teacherId } = req.body;
    const file = req.file;
    
    let uploadPath = file.path;
    let compressedTemp = null;
    
    try {
      let sharp;
      try {
        sharp = (await import('sharp')).default;
      } catch (e) {
        sharp = null;
      }

      if (sharp) {
        compressedTemp = path.join(os.tmpdir(), `compressed_${Date.now()}_${path.basename(file.originalname, path.extname(file.originalname))}.jpg`);
        await sharp(file.path)
          .rotate()
          .resize({ width: 1024, height: 1024, fit: 'inside' })
          .jpeg({ quality: 80 })
          .toFile(compressedTemp);

        uploadPath = compressedTemp;
      }
    } catch (compressErr) {
      console.warn('Image compression failed:', compressErr.message);
      uploadPath = file.path;
      try { if (compressedTemp && fs.existsSync(compressedTemp)) fs.unlinkSync(compressedTemp); } catch (e) {}
    }

    const fileMetadata = { name: `student_${studentId}_${Date.now()}.jpg` };
    if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
      fileMetadata.parents = [process.env.GOOGLE_DRIVE_FOLDER_ID];
    }

    if (!drive) {
      throw new Error('Google Drive API not initialized');
    }

    let imageUrl = null;
    let fileId = null;

    try {
      const response = await drive.files.create({
        resource: fileMetadata,
        media: {
          mimeType: 'image/jpeg',
          body: fs.createReadStream(uploadPath)
        },
        fields: 'id, webViewLink, webContentLink',
        supportsAllDrives: true
      });

      fileId = response.data.id;

      try {
        await drive.permissions.create({
          fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          },
          supportsAllDrives: true
        });
      } catch (permErr) {
        console.warn('Could not set file permissions:', permErr.message);
      }

      imageUrl = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;

    } catch (driveErr) {
      // If Drive upload fails (common with service accounts due to quota), fall back to saving locally
      console.error('Drive upload failed, falling back to local storage:', driveErr.message || driveErr);

      try {
        // Ensure uploads dir exists
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const localName = `fallback_${Date.now()}_${path.basename(file.originalname)}`;
        const localPath = path.join(uploadsDir, localName);
        await fs.promises.copyFile(uploadPath, localPath);

        // Use a server-relative URL that express serves statically from /uploads
        imageUrl = `/uploads/${localName}`;

        // Mark fallback in logs
        console.warn('Saved fallback image to local uploads:', imageUrl);

      } catch (localErr) {
        console.error('Local fallback failed:', localErr.message || localErr);
        throw driveErr; // rethrow original drive error to be handled by outer catch
      }
    }

    // Clean up temp files
    try { fs.unlinkSync(file.path); } catch (e) {}
    try { if (compressedTemp && fs.existsSync(compressedTemp)) fs.unlinkSync(compressedTemp); } catch (e) {}

    // Update database: support student or teacher uploads
    if (teacherId) {
      try {
        await pool.execute('UPDATE teacher SET TeacherPic = ? WHERE TeacherID = ?', [imageUrl, teacherId]);
      } catch (e) {
        console.warn('DB update failed for teacher upload:', e.message);
      }
    } else if (studentId) {
      try {
        await pool.execute('UPDATE student SET StudentPicture = ? WHERE StudentID = ?', [imageUrl, studentId]);
      } catch (e) {
        console.warn('DB update failed for student upload:', e.message);
      }
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
      fileId
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Preview endpoint
router.get('/preview', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('Missing url');

    const extractFileId = (u) => {
      try {
        if (u.includes('/d/')) {
          const s = u.indexOf('/d/') + 3;
          const e = u.indexOf('/', s);
          return e === -1 ? u.substring(s) : u.substring(s, e);
        }
        const idMatch = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch) return idMatch[1];
        
        // Check if the URL is just an ID (alphanumeric and long enough)
        if (/^[a-zA-Z0-9_-]{10,}$/.test(u) && !u.startsWith('http')) {
           return u;
        }

        return null;
      } catch (e) {
        return null;
      }
    };

    const fileId = extractFileId(String(url));
    if (!fileId) return res.status(400).send('Invalid Google Drive URL');

    if (!drive) {
      return res.status(500).send('Drive API not initialized');
    }

    const driveResp = await drive.files.get({
      fileId,
      alt: 'media'
    }, { responseType: 'stream', params: { supportsAllDrives: true } });

    if (driveResp.headers && driveResp.headers['content-type']) {
      res.setHeader('Content-Type', driveResp.headers['content-type']);
    } else {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');

    driveResp.data.pipe(res);
  } catch (err) {
    console.error('Preview proxy error:', err.message);
    res.status(500).send('Preview error');
  }
});

// User upload (using OAuth tokens)
router.post('/user', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    
    const tokens = loadUserTokens();
    if (!tokens) return res.status(400).json({ success: false, message: 'No user tokens found. Authorize via /api/upload/auth/url' });

    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) return res.status(400).json({ success: false, message: 'OAuth client not configured' });
    
    oauth2Client.setCredentials(tokens);
    const userDrive = google.drive({ version: 'v3', auth: oauth2Client });

    const { studentId, teacherId } = req.body || {};
    
    let uploadPath = req.file.path;
    let compressedTemp = null;
    
    try {
      let sharp;
      try { sharp = (await import('sharp')).default; } catch (e) { sharp = null; }
      if (sharp) {
        compressedTemp = path.join(os.tmpdir(), `compressed_user_${Date.now()}.jpg`);
        await sharp(req.file.path)
          .rotate()
          .resize({ width: 1024, height: 1024, fit: 'inside' })
          .jpeg({ quality: 80 })
          .toFile(compressedTemp);
        uploadPath = compressedTemp;
      }
    } catch (e) {
      console.warn('User upload compression failed:', e.message);
      uploadPath = req.file.path;
    }

    const metadata = { name: `student_${studentId || 'unknown'}_${Date.now()}.jpg` };
    if (process.env.GOOGLE_DRIVE_FOLDER_ID) metadata.parents = [process.env.GOOGLE_DRIVE_FOLDER_ID];
    
    const driveResp = await userDrive.files.create({
      resource: metadata,
      media: { mimeType: 'image/jpeg', body: fs.createReadStream(uploadPath) },
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true
    });
    
    const newFileId = driveResp.data.id;
    
    try {
      await userDrive.permissions.create({
        fileId: newFileId,
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true
      });
    } catch (e) {
      console.warn('Could not set permission for user-upload:', e.message);
    }

    const finalUrl = driveResp.data.webViewLink || `https://drive.google.com/file/d/${newFileId}/view?usp=drivesdk`;

    // Cleanup
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    try { if (compressedTemp && fs.existsSync(compressedTemp)) fs.unlinkSync(compressedTemp); } catch (e) {}

    // Update DB: support teacher uploads for user-account uploads as well
    if (teacherId) {
      try {
        await pool.execute('UPDATE teacher SET TeacherPic = ? WHERE TeacherID = ?', [finalUrl, teacherId]);
        emitRefresh(req, 'teachers');
      } catch (e) {
        console.warn('DB update failed for teacher user-upload:', e.message);
      }
    } else if (studentId) {
      try {
        await pool.execute('UPDATE student SET StudentPicture = ? WHERE StudentID = ?', [finalUrl, studentId]);
        emitRefresh(req, 'students');
      } catch (e) {
        console.warn('DB update failed for user-upload:', e.message);
      }
    }

    return res.json({ success: true, imageUrl: finalUrl, fileId: newFileId });
  } catch (err) {
    console.error('user upload error:', err);
    return res.status(500).json({ success: false, message: err.message || String(err) });
  }
});

export default router;
