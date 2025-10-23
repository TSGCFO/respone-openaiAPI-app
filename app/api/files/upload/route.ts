import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';

// Constants for file validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 10;

// MIME type to file extension mapping for strict validation
const MIME_TYPE_MAP: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
  'image/svg+xml': ['svg'],
  'application/pdf': ['pdf'],
  'text/plain': ['txt'],
  'text/csv': ['csv'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'application/vnd.ms-powerpoint': ['ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx']
};

// File signatures (magic numbers) for common file types
const FILE_SIGNATURES: Record<string, Buffer[]> = {
  jpg: [Buffer.from([0xFF, 0xD8, 0xFF])],
  png: [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
  gif: [
    Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61]), // GIF87a
    Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])  // GIF89a
  ],
  pdf: [Buffer.from([0x25, 0x50, 0x44, 0x46])], // %PDF
  webp: [Buffer.from('RIFF', 'utf8')],
  // Office documents have complex signatures, but check for common patterns
  doc: [Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])],
  docx: [Buffer.from([0x50, 0x4B, 0x03, 0x04])], // ZIP signature (docx/xlsx/pptx are zips)
  xls: [Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])],
  xlsx: [Buffer.from([0x50, 0x4B, 0x03, 0x04])],
  ppt: [Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])],
  pptx: [Buffer.from([0x50, 0x4B, 0x03, 0x04])]
};

// Sanitize filename to prevent path traversal attacks
function sanitizeFilename(filename: string): string {
  // Remove any path components
  const basename = path.basename(filename);
  // Replace any potentially dangerous characters
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Verify file content matches its claimed type
function verifyFileSignature(buffer: Buffer, extension: string): boolean {
  const signatures = FILE_SIGNATURES[extension];
  if (!signatures) {
    // No signature check available for this type, allow text files
    return ['txt', 'csv', 'svg'].includes(extension);
  }

  // Check if the file starts with any of the valid signatures
  for (const signature of signatures) {
    if (buffer.length >= signature.length) {
      const fileStart = buffer.slice(0, signature.length);
      if (fileStart.equals(signature)) {
        return true;
      }
    }
  }

  // Special case for WebP - check for WEBP after RIFF
  if (extension === 'webp' && buffer.length >= 12) {
    const webpMarker = buffer.slice(8, 12).toString('utf8');
    if (webpMarker === 'WEBP') {
      return true;
    }
  }

  return false;
}

// Calculate file hash for integrity and deduplication
function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Rate limiting helper (simple in-memory implementation)
const uploadRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_UPLOADS_PER_WINDOW = 20;

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const limit = uploadRateLimit.get(clientId);
  
  if (!limit || now > limit.resetTime) {
    uploadRateLimit.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }
  
  if (limit.count >= MAX_UPLOADS_PER_WINDOW) {
    return false;
  }
  
  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again later.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    // Validate number of files
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    
    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_PER_REQUEST} files allowed per request` },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file size
      if (file.size === 0) {
        return NextResponse.json(
          { error: `File "${file.name}" is empty` },
          { status: 400 }
        );
      }
      
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: `File "${file.name}" exceeds 10MB limit` 
        }, { status: 400 });
      }

      // Extract and validate file extension
      const originalName = sanitizeFilename(file.name);
      const lastDotIndex = originalName.lastIndexOf('.');
      
      if (lastDotIndex === -1 || lastDotIndex === originalName.length - 1) {
        return NextResponse.json(
          { error: `File "${file.name}" has no valid extension` },
          { status: 400 }
        );
      }
      
      const extension = originalName.slice(lastDotIndex + 1).toLowerCase();

      // Validate MIME type against extension
      const validExtensions = MIME_TYPE_MAP[file.type];
      if (!validExtensions || !validExtensions.includes(extension)) {
        // Check if it's a known safe text file without strict MIME type
        if (!['txt', 'csv'].includes(extension) || !file.type.startsWith('text/')) {
          return NextResponse.json({ 
            error: `File type mismatch for "${file.name}". MIME type ${file.type} doesn't match extension .${extension}` 
          }, { status: 400 });
        }
      }

      // Read file buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Verify file signature (magic numbers) - actual content validation
      if (!verifyFileSignature(buffer, extension)) {
        return NextResponse.json({
          error: `File "${file.name}" content doesn't match its type. Possible security risk detected.`
        }, { status: 400 });
      }

      // Calculate file hash for integrity
      const fileHash = calculateFileHash(buffer);
      
      // Generate secure unique filename with hash
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const safeBaseName = originalName.slice(0, lastDotIndex).slice(0, 50); // Limit length
      const uniqueFilename = `${timestamp}-${randomString}-${safeBaseName}.${extension}`;
      
      // Ensure uploads directory exists with secure permissions
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true, mode: 0o755 });
      }

      // Additional security check: ensure we're not writing outside uploads directory
      const filePath = path.join(uploadDir, uniqueFilename);
      const resolvedPath = path.resolve(filePath);
      const resolvedUploadDir = path.resolve(uploadDir);
      
      if (!resolvedPath.startsWith(resolvedUploadDir)) {
        return NextResponse.json({
          error: 'Invalid file path detected. Security violation.'
        }, { status: 400 });
      }

      // Save file
      await writeFile(filePath, buffer);

      // Log file upload for audit trail (in production, this should go to a proper logging service)
      console.log(`File uploaded: ${uniqueFilename} | Original: ${file.name} | Size: ${file.size} | Hash: ${fileHash} | Client: ${clientId}`);

      // TODO: In production, integrate with virus scanning service
      // Example: await scanFileForViruses(filePath);
      // Services to consider: ClamAV, VirusTotal API, Windows Defender API
      
      /* Production virus scanning placeholder:
      try {
        const scanResult = await virusScanner.scan(filePath);
        if (scanResult.infected) {
          await unlink(filePath); // Delete infected file
          return NextResponse.json({
            error: `File "${file.name}" failed security scan: ${scanResult.threat}`
          }, { status: 400 });
        }
      } catch (scanError) {
        console.error('Virus scan failed:', scanError);
        // Decide whether to reject file or accept with warning
      }
      */

      // Return file info
      uploadedFiles.push({
        originalName: file.name,
        filename: uniqueFilename,
        url: `/uploads/${uniqueFilename}`,
        size: file.size,
        type: file.type || `application/${extension}`,
        hash: fileHash.slice(0, 16), // Return partial hash for verification
        uploadedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ 
      success: true,
      files: uploadedFiles 
    });

  } catch (error) {
    console.error('Upload error:', error);
    // Don't expose internal error details to client
    return NextResponse.json({ 
      error: 'Failed to process file upload. Please try again.' 
    }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  // Note: CORS headers are now handled in next.config.mjs
  return new NextResponse(null, { status: 200 });
}