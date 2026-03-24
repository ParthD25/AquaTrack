#!/usr/bin/env node

/**
 * Initialize shift templates and audit templates in Firestore.
 * 
 * This script creates the base data for:
 * - shift_templates: Recurring shift definitions (weekday early, evening, etc.)
 * - audit_templates: Types of audits staff must complete (VAT, CPR, etc.)
 * 
 * Usage:
 *   DRY_RUN=true node scripts/init-shift-templates.ts
 *   node scripts/init-shift-templates.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, writeBatch, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

interface ShiftTemplate {
  id: string;
  name: string;
  days: string[];
  startTime: string;
  endTime: string;
  active: boolean;
  tasks: Record<string, {
    title: string;
    category: 'chemical' | 'safety' | 'opening' | 'closing' | 'cleaning' | 'maintenance' | 'custom';
    priority: 'high' | 'medium' | 'low';
    isRequired: boolean;
  }>;
}

interface AuditTemplate {
  id: string;
  key: string;
  label: string;
  description: string;
  icon: string;
  requiredRoles: string[];
  renewalMonths?: number;
}

const DRY_RUN = process.env.DRY_RUN === 'true';

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`✗ Service account key not found at ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const SHIFT_TEMPLATES: Omit<ShiftTemplate, 'id'>[] = [
  {
    name: 'Weekday Early Morning',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '05:30',
    endTime: '09:30',
    active: true,
    tasks: {
      'chem-check': { title: 'Chemical Check - Main Pool', category: 'chemical', priority: 'high', isRequired: true },
      'aed-check': { title: 'AED Equipment Inspection', category: 'safety', priority: 'high', isRequired: true },
      'O2-check': { title: 'Oxygen Unit Check', category: 'safety', priority: 'high', isRequired: true },
      'deck-walk': { title: 'Deck Walk & Zone Check', category: 'opening', priority: 'medium', isRequired: true },
      'locker-check': { title: 'Locker Room Inspection', category: 'cleaning', priority: 'medium', isRequired: false },
    },
  },
  {
    name: 'Weekday Mid-Morning',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '09:30',
    endTime: '14:00',
    active: true,
    tasks: {
      'chem-check': { title: 'Chemical Check - Main Pool', category: 'chemical', priority: 'high', isRequired: true },
      'patrol': { title: 'Zone Patrol & Supervision', category: 'opening', priority: 'high', isRequired: true },
      'log-entry': { title: 'Chemical Log Entry', category: 'chemical', priority: 'medium', isRequired: true },
    },
  },
  {
    name: 'Weekday Evening',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '15:45',
    endTime: '20:15',
    active: true,
    tasks: {
      'chem-check': { title: 'Chemical Check - Main Pool', category: 'chemical', priority: 'high', isRequired: true },
      'closing': { title: 'Pool Closing Procedure', category: 'closing', priority: 'high', isRequired: true },
      'cleaning': { title: 'Deck Cleaning', category: 'cleaning', priority: 'medium', isRequired: true },
      'equipment-secure': { title: 'Secure Equipment & Areas', category: 'safety', priority: 'high', isRequired: true },
    },
  },
  {
    name: 'Saturday Early',
    days: ['saturday'],
    startTime: '06:30',
    endTime: '09:00',
    active: true,
    tasks: {
      'chem-check': { title: 'Chemical Check - Main Pool', category: 'chemical', priority: 'high', isRequired: true },
      'opening': { title: 'Morning Opening', category: 'opening', priority: 'high', isRequired: true },
    },
  },
  {
    name: 'Saturday Morning',
    days: ['saturday'],
    startTime: '08:45',
    endTime: '12:00',
    active: true,
    tasks: {
      'chem-check': { title: 'Chemical Check - Main Pool', category: 'chemical', priority: 'high', isRequired: true },
      'patrol': { title: 'Zone Patrol & Supervision', category: 'opening', priority: 'high', isRequired: true },
    },
  },
];

const AUDIT_TEMPLATES: Omit<AuditTemplate, 'id'>[] = [
  {
    key: 'vat',
    label: 'VAT',
    description: 'Visual Acuity Test',
    icon: '👁️',
    requiredRoles: ['lifeguard', 'sr_guard', 'pool_tech'],
    renewalMonths: 12,
  },
  {
    key: 'cpr',
    label: 'CPR',
    description: 'CPR Live Exercise',
    icon: '💓',
    requiredRoles: ['lifeguard', 'sr_guard'],
    renewalMonths: 12,
  },
  {
    key: 'brick',
    label: 'Brick Test',
    description: 'Brick Retrieval Exercise',
    icon: '🧱',
    requiredRoles: ['lifeguard', 'sr_guard'],
    renewalMonths: 12,
  },
  {
    key: 'live_recognition',
    label: 'Live Recognition',
    description: 'Red Ball Recognition Exercise',
    icon: '🔴',
    requiredRoles: ['lifeguard', 'sr_guard'],
    renewalMonths: 6,
  },
  {
    key: 'swim_instructor',
    label: 'Swim Instructor',
    description: 'Swim Instructor Skills Audit',
    icon: '🏊',
    requiredRoles: ['sr_guard'],
    renewalMonths: 24,
  },
];

async function initializeTemplates() {
  console.log('🔄 Initializing shift and audit templates...');
  console.log(`   Dry run: ${DRY_RUN}`);
  console.log('');

  try {
    const batch = writeBatch(db);
    let shiftCount = 0;
    let auditCount = 0;

    // Create shift templates
    for (let i = 0; i < SHIFT_TEMPLATES.length; i++) {
      const template = SHIFT_TEMPLATES[i];
      const shiftId = `shift_${i + 1}`;
      
      const doc = {
        id: shiftId,
        ...template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      batch.set(db.collection('shift_templates').doc(shiftId), doc);
      console.log(`✓ Shift template: ${template.name}`);
      shiftCount++;
    }

    // Create audit templates
    for (let i = 0; i < AUDIT_TEMPLATES.length; i++) {
      const template = AUDIT_TEMPLATES[i];
      const auditId = template.key;

      const doc = {
        id: auditId,
        ...template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      batch.set(db.collection('audit_templates').doc(auditId), doc);
      console.log(`✓ Audit template: ${template.label}`);
      auditCount++;
    }

    console.log('');

    if (!DRY_RUN) {
      console.log('✋ Writing to database...');
      await batch.commit();
      console.log(`✅ Created ${shiftCount} shift templates and ${auditCount} audit templates`);
    } else {
      console.log(`🔍 Dry run: Would create ${shiftCount} shift templates and ${auditCount} audit templates`);
    }

    console.log('');
    console.log('✨ Templates initialized successfully!');

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

initializeTemplates();
