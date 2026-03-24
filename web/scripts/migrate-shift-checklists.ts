#!/usr/bin/env node

/**
 * Migrate shift checklist data from old `task_completions` format to new `shift_checklists` format.
 * 
 * This script:
 * - Reads from `task_completions` collection (if exists)
 * - Transforms to new `shift_checklists` format with nested tasks
 * - Backfills existing shift_checklist documents with completion data
 * - Sets the `ownerUid` field required by Firestore rules
 * 
 * Old format (task_completions):
 *   {taskId, staffId, shiftDate, done, completedAt, completedBy}
 * 
 * New format (shift_checklists):
 *   {ownerUid, shiftDate, status, tasks: {[taskId]: {done, completedAt, completedBy}}}
 * 
 * Usage:
 *   # Dry run (no database changes)
 *   DRY_RUN=true node scripts/migrate-shift-checklists.ts
 *   
 *   # With output (saves CSV)
 *   node scripts/migrate-shift-checklists.ts --output migrate-checklists.csv
 *   
 *   # Execute for real
 *   node scripts/migrate-shift-checklists.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, writeBatch, Timestamp, FieldValue, deleteField } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

interface OldTaskCompletion {
  taskId: string;
  staffId: string;
  shiftDate: string | Timestamp;
  done: boolean;
  completedAt?: Timestamp | string;
  completedBy?: string;
}

interface NewShiftChecklist {
  ownerUid: string;
  shiftDate: Timestamp;
  status: 'pending' | 'in_progress' | 'completed';
  tasks: Record<string, {
    done: boolean;
    completedAt?: Timestamp;
    completedBy?: string;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface MigrationLog {
  staffId: string;
  shiftDate: string;
  checklistId: string;
  taskCount: number;
  status: 'created' | 'updated' | 'skipped' | 'error';
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

// Convert date string to Timestamp
function toTimestamp(date: string | Timestamp | undefined): Timestamp {
  if (!date) return Timestamp.now();
  if (date instanceof Timestamp) return date;
  try {
    return Timestamp.fromDate(new Date(date));
  } catch {
    return Timestamp.now();
  }
}

// Generate checklist ID from staffId and shiftDate
function getChecklistId(staffId: string, shiftDate: Timestamp | string): string {
  const dateStr = typeof shiftDate === 'string' 
    ? shiftDate.split('T')[0] 
    : shiftDate.toDate().toISOString().split('T')[0];
  return `${staffId}_${dateStr}`;
}

async function migrateShiftChecklists() {
  console.log('🔄 Starting shift checklist migration...');
  console.log(`   From: task_completions`);
  console.log(`   To:   shift_checklists`);
  console.log(`   Dry run: ${DRY_RUN}`);
  console.log('');

  try {
    // Check if task_completions collection exists
    const taskCompletionsRef = db.collection('task_completions');
    const snapshot = await taskCompletionsRef.get();

    if (snapshot.empty) {
      console.log('ℹ️  No task_completions found. Nothing to migrate.');
      console.log('');
      return;
    }

    console.log(`📊 Found ${snapshot.size} task completions to migrate`);
    console.log('');

    // Group by staffId + shiftDate
    const grouped: Record<string, OldTaskCompletion[]> = {};
    for (const doc of snapshot.docs) {
      const data = doc.data() as OldTaskCompletion;
      const dateStr = typeof data.shiftDate === 'string'
        ? data.shiftDate.split('T')[0]
        : (data.shiftDate as Timestamp).toDate().toISOString().split('T')[0];
      const key = `${data.staffId}_${dateStr}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(data);
    }

    console.log(`📋 Grouped into ${Object.keys(grouped).length} shift checklists`);
    console.log('');

    const log: MigrationLog[] = [];
    const batch = writeBatch(db);
    let createCount = 0;
    let updateCount = 0;
    let errorCount = 0;

    for (const [key, completions] of Object.entries(grouped)) {
      try {
        const firstCompletion = completions[0];
        const staffId = firstCompletion.staffId;
        const shiftDate = toTimestamp(firstCompletion.shiftDate);
        const checklistId = getChecklistId(staffId, shiftDate);

        // Build tasks object from completions
        const tasks: Record<string, any> = {};
        for (const completion of completions) {
          tasks[completion.taskId] = {
            done: completion.done || false,
            ...(completion.completedAt && { completedAt: toTimestamp(completion.completedAt) }),
            ...(completion.completedBy && { completedBy: completion.completedBy }),
          };
        }

        // Determine status
        const allCompleted = completions.every(c => c.done);
        const anyCompleted = completions.some(c => c.done);
        const status = allCompleted ? 'completed' : anyCompleted ? 'in_progress' : 'pending';

        // Create new checklist
        const newChecklist: NewShiftChecklist = {
          ownerUid: staffId,
          shiftDate,
          status,
          tasks,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        // Write to shift_checklists collection
        batch.set(
          db.collection('shift_checklists').doc(checklistId),
          newChecklist,
          { merge: true } // Merge in case document already exists
        );

        log.push({
          staffId,
          shiftDate: shiftDate.toDate().toISOString().split('T')[0],
          checklistId,
          taskCount: completions.length,
          status: 'created',
        });

        createCount++;

      } catch (err) {
        errorCount++;
        const firstCompletion = completions[0];
        log.push({
          staffId: firstCompletion.staffId,
          shiftDate: typeof firstCompletion.shiftDate === 'string'
            ? firstCompletion.shiftDate
            : (firstCompletion.shiftDate as Timestamp).toDate().toISOString().split('T')[0],
          checklistId: '',
          taskCount: completions.length,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    if (!DRY_RUN && (createCount > 0 || updateCount > 0)) {
      console.log(`✋ Writing ${createCount + updateCount} shift checklists...`);
      await batch.commit();
      console.log(`✅ Migrated ${createCount + updateCount} shift checklists`);
    } else if (DRY_RUN) {
      console.log(`🔍 Dry run: Would migrate ${createCount + updateCount} shift checklists`);
    }

    if (errorCount > 0) {
      console.log(`⚠️  Errors: ${errorCount}`);
    }

    // Output CSV if requested
    if (OUTPUT_CSV) {
      const csv = [
        ['Staff ID', 'Shift Date', 'Checklist ID', 'Task Count', 'Status', 'Error'].join(','),
        ...log.map(row =>
          [
            row.staffId,
            row.shiftDate,
            row.checklistId,
            row.taskCount,
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
    console.log(`  Total task completions: ${snapshot.size}`);
    console.log(`  Grouped into checklists: ${Object.keys(grouped).length}`);
    console.log(`  Created/Updated: ${createCount + updateCount}`);
    console.log(`  Errors: ${errorCount}`);

    console.log('');
    console.log('⚠️  Next steps:');
    console.log('  1. Verify shift_checklists collection has ownerUid fields');
    console.log('  2. Test dashboard loads checklists correctly');
    console.log('  3. Verify task completion toggle works');
    console.log('  4. [Optional] Delete task_completions collection after verification');

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

migrateShiftChecklists();
