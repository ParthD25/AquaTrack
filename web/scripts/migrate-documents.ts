/**
 * Migration script: Convert old `documents` collection to new `documents_library` format
 * 
 * Usage: NODE_PATH=dist node -r ts-node/register scripts/migrate-documents.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Error: Service account key not found at ${serviceAccountPath}`);
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS environment variable or place serviceAccountKey.json in web directory');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Type definitions
interface OldDocument {
  title: string;
  category: string;
  url?: string;
  year?: number;
  accessLevel?: string;
}

interface NewDocument {
  title: string;
  description?: string;
  category: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'image' | 'link' | 'video';
  fileUrl?: string;
  fileSize?: number;
  uploadedAt: FieldValue;
  uploadedBy: string;
  tags: string[];
  accessRoles: string[];
  version: number;
  isActive: boolean;
  linkedForms?: string[];
  metadata?: Record<string, any>;
}

// Map access levels from old format to new roles
function mapAccessLevel(oldAccessLevel?: string): string[] {
  if (!oldAccessLevel || oldAccessLevel === 'admin') {
    return ['admin'];
  }
  // "all" or empty = all authenticated users
  if (oldAccessLevel === 'all' || oldAccessLevel === 'public') {
    return ['admin', 'sr_guard', 'pool_tech', 'lifeguard'];
  }
  return oldAccessLevel.split(',').map(r => r.trim()).filter(r => r);
}

// Infer document type from filename or category
function inferDocumentType(title: string, url?: string): 'pdf' | 'docx' | 'xlsx' | 'image' | 'link' | 'video' {
  const filename = (url || title || '').toLowerCase();
  
  if (filename.includes('.pdf')) return 'pdf';
  if (filename.includes('.docx') || filename.includes('.doc')) return 'docx';
  if (filename.includes('.xlsx') || filename.includes('.xls')) return 'xlsx';
  if (filename.includes('.jpg') || filename.includes('.jpeg') || filename.includes('.png') || filename.includes('.gif')) return 'image';
  if (filename.includes('http') || filename.startsWith('http')) return 'link';
  if (filename.includes('.mp4') || filename.includes('.mov') || filename.includes('.avi')) return 'video';
  
  // Default based on category
  if (filename.includes('video') || filename.includes('training')) return 'video';
  if (filename.includes('checklist')) return 'pdf';
  
  return 'pdf';
}

async function migrateDocuments() {
  console.log('🚀 Starting document migration...\n');
  
  try {
    // Fetch all documents from old collection
    const oldDocsSnapshot = await db.collection('documents').get();
    console.log(`📄 Found ${oldDocsSnapshot.size} documents in old collection\n`);
    
    if (oldDocsSnapshot.size === 0) {
      console.log('ℹ️ No documents to migrate');
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    // Process each document
    for (const docSnap of oldDocsSnapshot.docs) {
      try {
        const oldData = docSnap.data() as OldDocument;
        const docId = docSnap.id;

        // Transform to new format
        const newData: NewDocument = {
          title: oldData.title || 'Untitled',
          category: mapCategory(oldData.category),
          type: inferDocumentType(oldData.title, oldData.url),
          fileUrl: oldData.url,
          uploadedAt: Timestamp.now(),
          uploadedBy: 'migration-script',
          tags: extractTags(oldData.title, oldData.category),
          accessRoles: mapAccessLevel(oldData.accessLevel),
          version: 1,
          isActive: true,
          metadata: {
            migratedFrom: 'documents',
            originalYear: oldData.year,
            originalAccessLevel: oldData.accessLevel,
          }
        };

        // Save to new collection
        await db.collection('documents_library').doc(docId).set(newData);
        console.log(`✅ ${docId}: "${newData.title}" → ${newData.category}`);
        migratedCount++;

      } catch (err) {
        console.error(`❌ Error migrating ${docSnap.id}:`, err);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successfully migrated: ${migratedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📁 Collection: documents_library`);

    if (migratedCount > 0) {
      console.log(`\n✨ Migration complete! Your documents are now in the documents_library collection.`);
      console.log(`💡 Next steps:`);
      console.log(`   1. Update web pages to read from documents_library`);
      console.log(`   2. Update mobile app to read from documents_library`);
      console.log(`   3. Test thoroughly`);
      console.log(`   4. Update Firestore security rules`);
      console.log(`   5. Delete old documents collection\n`);
    }

  } catch (err) {
    console.error('💥 Migration failed:', err);
    process.exit(1);
  }
}

function mapCategory(oldCategory: string): string {
  const categoryMap: Record<string, string> = {
    'checklist': 'checklist',
    'incident': 'incident',
    'hr_form': 'hr_form',
    'training': 'training',
    'pool_tech': 'training',
    'maintenance': 'maintenance',
    'operational': 'operational',
    'archive': 'archive',
    'forms': 'operational',
    'documents': 'operational',
  };
  
  return categoryMap[oldCategory?.toLowerCase()] || 'operational';
}

function extractTags(title: string, category: string): string[] {
  const tags: Set<string> = new Set();
  
  // Add category as tag
  tags.add(category?.toLowerCase() || 'document');
  
  // Extract some keywords from title
  const keywords = title.split(/[\s\-_]+/).filter(w => w.length > 3);
  keywords.slice(0, 3).forEach(kw => tags.add(kw.toLowerCase()));
  
  return Array.from(tags);
}

// Run migration
migrateDocuments().then(() => {
  console.log('Process completed. Exiting...');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
