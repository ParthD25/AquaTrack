#!/usr/bin/env node

/**
 * Migrate documents from old `documents_library` collection to new `documents` collection.
 * 
 * This script:
 * - Reads from `documents_library`
 * - Transforms schema to final `documents` format
 * - Maps old categories to new canonical categories
 * - Infers MIME types and document types
 * - Writes to `documents` collection
 * 
 * Usage:
 *   # Dry run (no database changes)
 *   DRY_RUN=true node scripts/migrate-documents.ts
 *   
 *   # With output (saves CSV)
 *   node scripts/migrate-documents.ts --output migrate-docs.csv
 *   
 *   # Execute for real
 *   node scripts/migrate-documents.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, writeBatch, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

interface OldDocument {
  title: string;
  description?: string;
  category: string;
  type?: string;
  fileUrl?: string;
  tags?: string[];
  accessRoles?: string[];
  uploadedAt?: string;
  uploadedBy?: string;
  isActive?: boolean;
  version?: number;
  visibility?: string;
}

interface NewDocument {
  id: string;
  title: string;
  description?: string;
  category: string;
  subCategory?: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'image' | 'link' | 'video';
  mimeType: string;
  fileUrl: string;
  storagePath: string;
  accessRoles: string[];
  visibility: 'all_staff' | 'restricted';
  isActive: boolean;
  version: number;
  tags: string[];
  uploadedAt: Timestamp;
  uploadedBy: string;
  sortOrder: number;
}

interface MigrationLog {
  oldId: string;
  newId: string;
  title: string;
  oldCategory: string;
  newCategory: string;
  status: 'migrated' | 'skipped' | 'error';
  error?: string;
}

const DRY_RUN = process.env.DRY_RUN === 'true';
const OUTPUT_CSV = process.argv.includes('--output')
  ? process.argv[process.argv.indexOf('--output') + 1]
  : null;

// Category mapping
const CATEGORY_MAP: Record<string, string> = {
  'checklist': 'checklists',
  'incident': 'incident_reports',
  'incident_reports': 'incident_reports',
  'hr_form': 'staff_forms',
  'staff_forms': 'staff_forms',
  'training': 'training',
  'pool_tech': 'pool_tech',
  'maintenance': 'pool_tech',
  'operational': 'senior_lg',
  'senior_lg': 'senior_lg',
  'inventory': 'inventory',
  'archive': 'archive',
};

// MIME type inference
function getMimeType(url: string, fileType?: string): string {
  if (!url) return 'application/octet-stream';

  const ext = url.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'zip': 'application/zip',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

// Type inference
function inferType(url: string, fileType?: string): 'pdf' | 'docx' | 'xlsx' | 'image' | 'link' | 'video' {
  if (!url) return 'link';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    // It's a URL/link
    if (url.includes('.mp4') || url.includes('.mov') || url.includes('youtube') || url.includes('vimeo')) {
      return 'video';
    }
    return 'link';
  }

  const ext = url.split('.').pop()?.toLowerCase() || '';
  
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';

  // Fall back to original type if provided
  if (fileType === 'video') return 'video';
  if (fileType === 'xlsx') return 'xlsx';
  if (fileType === 'image') return 'image';
  
  return 'docx'; // Default
}

// Extract storage path from URL
function getStoragePath(url: string): string {
  if (!url) return '';
  
  // If it's a Firebase Storage URL
  if (url.includes('firebasestorage.googleapis.com')) {
    const match = url.match(/\/o\/(.*?)\?/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  // If it's a Google Drive URL
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([^/]+)/);
    if (match) {
      return `google-drive/${match[1]}`;
    }
  }

  // Fallback to URL as-is
  return url;
}

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`✗ Service account key not found at ${serviceAccountPath}`);
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS or place serviceAccountKey.json in web directory');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function migrateDocuments() {
  console.log('🔄 Starting document migration...');
  console.log(`   From: documents_library`);
  console.log(`   To:   documents`);
  console.log(`   Dry run: ${DRY_RUN}`);
  console.log('');

  try {
    const oldCollection = db.collection('documents_library');
    const snapshot = await oldCollection.get();

    console.log(`📊 Found ${snapshot.size} documents to migrate`);
    console.log('');

    const log: MigrationLog[] = [];
    const batch = writeBatch(db);
    let migrateCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const doc of snapshot.docs) {
      const oldData = doc.data() as OldDocument;

      try {
        const newId = doc.id;
        const newCategory = CATEGORY_MAP[oldData.category] || 'archive';
        const newType = inferType(oldData.fileUrl, oldData.type);
        const newMimeType = getMimeType(oldData.fileUrl, oldData.type);
        const storagePath = getStoragePath(oldData.fileUrl || '');

        // Determine visibility
        const accessRoles = oldData.accessRoles || ['admin', 'sr_guard', 'pool_tech', 'lifeguard'];
        const visibility = (accessRoles.length === 4 && 
          accessRoles.includes('admin') && 
          accessRoles.includes('sr_guard') &&
          accessRoles.includes('pool_tech') &&
          accessRoles.includes('lifeguard'))
          ? 'all_staff'
          : 'restricted';

        const newDoc: NewDocument = {
          id: newId,
          title: oldData.title,
          description: oldData.description || '',
          category: newCategory,
          subCategory: undefined,
          type: newType,
          mimeType: newMimeType,
          fileUrl: oldData.fileUrl || '',
          storagePath,
          accessRoles,
          visibility,
          isActive: oldData.isActive ?? true,
          version: oldData.version ?? 1,
          tags: oldData.tags || [],
          uploadedAt: Timestamp.now(), // Use current time if not provided
          uploadedBy: oldData.uploadedBy || 'System',
          sortOrder: 0,
        };

        if (oldData.uploadedAt) {
          try {
            newDoc.uploadedAt = Timestamp.fromDate(new Date(oldData.uploadedAt));
          } catch {
            // Keep current time
          }
        }

        // Write to new collection
        batch.set(db.collection('documents').doc(newId), newDoc);

        log.push({
          oldId: doc.id,
          newId,
          title: oldData.title,
          oldCategory: oldData.category,
          newCategory,
          status: 'migrated',
        });

        migrateCount++;
      } catch (err) {
        errorCount++;
        log.push({
          oldId: doc.id,
          newId: doc.id,
          title: oldData.title,
          oldCategory: oldData.category,
          newCategory: '',
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    if (!DRY_RUN && migrateCount > 0) {
      console.log(`✋ Writing ${migrateCount} documents...`);
      await batch.commit();
      console.log(`✅ Migrated ${migrateCount} documents`);
    } else if (DRY_RUN) {
      console.log(`🔍 Dry run: Would migrate ${migrateCount} documents`);
    }

    if (errorCount > 0) {
      console.log(`⚠️  Errors: ${errorCount}`);
    }

    // Output CSV if requested
    if (OUTPUT_CSV) {
      const csv = [
        ['Old ID', 'New ID', 'Title', 'Old Category', 'New Category', 'Status', 'Error'].join(','),
        ...log.map(row =>
          [
            row.oldId,
            row.newId,
            `"${row.title}"`,
            row.oldCategory,
            row.newCategory,
            row.status,
            row.error ? `"${row.error}"` : '',
          ].join(',')
        ),
      ].join('\n');

      fs.writeFileSync(OUTPUT_CSV, csv, 'utf-8');
      console.log(`📄 Log saved to: ${OUTPUT_CSV}`);
    }

    console.log('');
    console.log('Summary:');
    console.log(`  Total documents: ${snapshot.size}`);
    console.log(`  Migrated: ${migrateCount}`);
    console.log(`  Skipped: ${skipCount}`);
    console.log(`  Errors: ${errorCount}`);

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

migrateDocuments();
