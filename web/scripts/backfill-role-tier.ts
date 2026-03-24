#!/usr/bin/env node

/**
 * Backfill roleTier from existing role field.
 * 
 * This script migrates existing users to the new role system:
 * - Reads existing `role` field
 * - Creates `roleTier` field (copy of role, one of four built-in values only)
 * - Preserves `positionId`
 * - For backward compatibility during transition, keeps both fields
 * 
 * Usage:
 *   # Dry run (no database changes)
 *   DRY_RUN=true node scripts/backfill-role-tier.ts
 *   
 *   # With output (saves CSV)
 *   node scripts/backfill-role-tier.ts --output backfill-role-tier.csv
 *   
 *   # Execute for real
 *   node scripts/backfill-role-tier.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, writeBatch, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  role?: string;
  roleTier?: string;
  positionId?: string;
}

interface BackfillLog {
  userId: string;
  email: string;
  oldRole: string | null;
  newRoleTier: string;
  positionId: string;
  status: 'already_set' | 'backfilled' | 'error';
  error?: string;
}

const DRY_RUN = process.env.DRY_RUN === 'true';
const OUTPUT_CSV = process.argv.includes('--output') 
  ? process.argv[process.argv.indexOf('--output') + 1] 
  : null;

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

async function backfillRoleTier() {
  console.log('🔄 Starting role tier backfill...');
  console.log(`   Dry run: ${DRY_RUN}`);
  console.log('');

  try {
    const usersCollection = db.collection('users');
    const snapshot = await usersCollection.get();
    
    console.log(`📊 Found ${snapshot.size} users`);
    console.log('');

    const log: BackfillLog[] = [];
    const batch = writeBatch(db);
    let updateCount = 0;
    let errorCount = 0;

    const allowedRoles = ['admin', 'sr_guard', 'pool_tech', 'lifeguard'];

    for (const doc of snapshot.docs) {
      const data = doc.data() as UserDoc;
      
      try {
        const existingRole = data.role || 'lifeguard';
        const positionId = data.positionId || existingRole;
        
        // Ensure role is one of the allowed values
        const roleTier = allowedRoles.includes(existingRole) ? existingRole : 'lifeguard';

        if (!data.roleTier) {
          // Need to backfill
          batch.update(doc.ref, {
            roleTier,
            positionId,
            updatedAt: Timestamp.now(),
          });
          
          log.push({
            userId: doc.id,
            email: data.email || 'N/A',
            oldRole: existingRole,
            newRoleTier: roleTier,
            positionId,
            status: 'backfilled',
          });
          
          updateCount++;
        } else {
          // Already has roleTier
          log.push({
            userId: doc.id,
            email: data.email || 'N/A',
            oldRole: data.role || null,
            newRoleTier: data.roleTier,
            positionId: data.positionId || 'lifeguard',
            status: 'already_set',
          });
        }
      } catch (err) {
        errorCount++;
        log.push({
          userId: doc.id,
          email: data.email || 'N/A',
          oldRole: data.role || null,
          newRoleTier: '',
          positionId: data.positionId || '',
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    if (!DRY_RUN && updateCount > 0) {
      console.log(`✋ Waiting for batch write...`);
      await batch.commit();
      console.log(`✅ Updated ${updateCount} users`);
    } else if (DRY_RUN) {
      console.log(`🔍 Dry run: Would update ${updateCount} users`);
    } else {
      console.log(`✓ All users already have roleTier set`);
    }

    if (errorCount > 0) {
      console.log(`⚠️  Errors: ${errorCount}`);
    }

    // Output CSV if requested
    if (OUTPUT_CSV) {
      const csv = [
        ['User ID', 'Email', 'Old Role', 'New RoleTier', 'Position ID', 'Status', 'Error'].join(','),
        ...log.map(row =>
          [
            row.userId,
            `"${row.email}"`,
            row.oldRole || 'null',
            row.newRoleTier,
            row.positionId,
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
    console.log(`  Total users: ${snapshot.size}`);
    console.log(`  Updated: ${updateCount}`);
    console.log(`  Already set: ${snapshot.size - updateCount - errorCount}`);
    console.log(`  Errors: ${errorCount}`);
    
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

backfillRoleTier();
