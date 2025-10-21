import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Constants for file validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: `File "${file.name}" exceeds 10MB limit` 
        }, { status: 400 });
      }

      // Validate file type
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
          return NextResponse.json({ 
            error: `File type not supported for "${file.name}"` 
          }, { status: 400 });
        }
      }

      // Create unique filename with timestamp
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${file.name}`;
      
      // Ensure uploads directory exists
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Save file
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(uploadDir, uniqueFilename);
      await writeFile(filePath, buffer);

      // Return public URL
      uploadedFiles.push({
        originalName: file.name,
        filename: uniqueFilename,
        url: `/uploads/${uniqueFilename}`,
        size: file.size,
        type: file.type || `application/${extension}`
      });
    }

    return NextResponse.json({ 
      success: true,
      files: uploadedFiles 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload files' 
    }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}