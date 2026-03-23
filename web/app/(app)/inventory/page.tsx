'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { collection, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DEFAULT_ITEMS = [
  { id: 'emergency_oxygen_first_aid', label: 'Emergency Oxygen - First Aid Room', unit: 'PSI' },
  { id: 'emergency_oxygen_office', label: 'Emergency Oxygen - Office', unit: 'PSI' },
  { id: 'gloves_xs', label: 'Gloves - XS', unit: 'boxes' },
  { id: 'gloves_s', label: 'Gloves - S', unit: 'boxes' },
  { id: 'gloves_m', label: 'Gloves - M', unit: 'boxes' },
  { id: 'gloves_l', label: 'Gloves - L', unit: 'boxes' },
  { id: 'gloves_xl', label: 'Gloves - XL', unit: 'boxes' },
  { id: 'bandaids_variety', label: 'BandAids - E+R Variety Pack', unit: 'boxes' },
  { id: 'bandaids_strip', label: 'BandAids - Medi-First 7/8" x 3" Strip', unit: 'boxes' },
  { id: 'stretch_bandage_1', label: 'Stretch Bandages - 1" x 75"', unit: 'boxes' },
  { id: 'stretch_bandage_2', label: 'Stretch Bandages - 2" x 75"', unit: 'boxes' },
  { id: 'stretch_bandage_3', label: 'Stretch Bandages - 3" x 75"', unit: 'boxes' },
  { id: 'gauze_2x2', label: 'Gauze Pads - 2" x 2"', unit: 'boxes' },
  { id: 'gauze_3x3', label: 'Gauze Pads - 3" x 3"', unit: 'boxes' },
  { id: 'gauze_4x4', label: 'Gauze Pads - 4" x 4" (E+R/Dynarex/Medline)', unit: 'boxes' },
  { id: 'knuckle_bandages', label: 'Knuckle Bandages', unit: 'boxes' },
  { id: 'medi_rip_bandage', label: 'Medi-Rip Self-Adherent Bandage', unit: 'rolls' },
  { id: 'medical_tape', label: 'Medical Tape Rolls', unit: 'rolls' },
  { id: 'razors', label: 'Razors', unit: 'units' },
  { id: 'scissors', label: 'Scissors', unit: 'units' },
  { id: 'pulse_oximeter', label: 'Pulse Oximeter', unit: 'units' },
  { id: 'biohazard_bags', label: 'Biohazard Bags', unit: 'bags' },
  { id: 'ice_packs', label: 'Ice Packs', unit: 'bags' },
  { id: 'pulsar_cleaner', label: 'Pulsar Cleaner', unit: 'bottles' },
  { id: 'co2_tank_1', label: 'CO2 Level Tank 1', unit: 'level' },
  { id: 'co2_tank_2', label: 'CO2 Level Tank 2', unit: 'level' },
  { id: 'muriatic_acid_tank_1', label: 'Muriatic Acid Level Tank 1', unit: 'level' },
  { id: 'muriatic_acid_tank_2', label: 'Muriatic Acid Level Tank 2', unit: 'level' },
  { id: 'pulsar_briquettes_100', label: 'Pulsar Briquettes - 100 lb', unit: 'lbs' },
  { id: 'pulsar_briquettes_50', label: 'Pulsar Briquettes - 50 lb', unit: 'lbs' },
  { id: 'liquid_chlorine', label: 'Liquid Chlorine', unit: 'gallons' },
  { id: 'sodium_bicarbonate', label: 'Sodium Bicarbonate (50 lb bags)', unit: 'bags' },
  { id: 'calcium', label: 'Calcium (50 lb bags)', unit: 'bags' },
  { id: 'dpd1a_reagent', label: 'DPD1A Test Reagent', unit: 'bottles' },
  { id: 'dpd1b_reagent', label: 'DPD1B Test Reagent', unit: 'bottles' },
  { id: 'dpd3_reagent', label: 'DPD3 Test Reagent', unit: 'bottles' },
  { id: 'ph_reagent', label: 'pH Test Reagent', unit: 'bottles' },
  { id: 'alk_reagent', label: 'ALK Test Reagent', unit: 'bottles' },
  { id: 'ch1_reagent', label: 'CH1 Test Reagent', unit: 'bottles' },
  { id: 'ch2_reagent', label: 'CH2 Test Reagent', unit: 'bottles' },
];

type InventoryEntry = {
  month: string;
  items: Record<string, number>;
  notes?: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
};

export default function InventoryPage() {
  const { user, hasRole } = useAuth();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [items, setItems] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = {};
    DEFAULT_ITEMS.forEach(i => { base[i.id] = 0; });
    return base;
  });
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const q = query(collection(db, 'inventory_entries'), orderBy('month', 'desc'));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => d.data() as InventoryEntry);
        setEntries(list);
      } catch (err) {
        console.error('Failed to load inventory', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  const canAccess = hasRole('admin', 'sr_guard', 'pool_tech');
  if (!canAccess) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <p className="font-semibold">Access Restricted</p>
          <p className="text-sm text-muted">Inventory is available to Pool Tech, Senior Guards, and Admins.</p>
        </div>
      </div>
    );
  }

  const entryByMonth = useMemo(() => {
    return entries.find(e => e.month === month) || null;
  }, [entries, month]);

  useEffect(() => {
    if (entryByMonth) {
      const base: Record<string, number> = {};
      DEFAULT_ITEMS.forEach(i => { base[i.id] = entryByMonth.items?.[i.id] ?? 0; });
      setItems(base);
      setNotes(entryByMonth.notes || '');
    } else {
      const base: Record<string, number> = {};
      DEFAULT_ITEMS.forEach(i => { base[i.id] = 0; });
      setItems(base);
      setNotes('');
    }
  }, [entryByMonth, month]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setStatus('');
    try {
      const payload: InventoryEntry = {
        month,
        items,
        notes: notes.trim() ? notes.trim() : undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
        updatedByName: user.displayName,
      };
      await setDoc(doc(db, 'inventory_entries', month), payload, { merge: true });
      setEntries(prev => {
        const without = prev.filter(e => e.month !== month);
        return [payload, ...without].sort((a, b) => b.month.localeCompare(a.month));
      });
      setStatus('Saved.');
    } catch (err) {
      console.error('Save failed', err);
      setStatus('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Inventory Tracker</h1>
          <p className="page-subtitle">Monthly inventory snapshots with history for trend review.</p>
        </div>
      </div>

      <div className="card mb-6" style={{ padding: 20 }}>
        <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="section-title">Monthly Entry</h2>
            <p className="text-sm text-muted">Log counts for {month}.</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              className="form-input"
              value={month}
              onChange={e => setMonth(e.target.value)}
              style={{ maxWidth: 180 }}
            />
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {DEFAULT_ITEMS.map(item => (
            <div key={item.id} className="card" style={{ padding: 14 }}>
              <div className="text-sm font-semibold">{item.label}</div>
              <div className="text-xs text-muted">Unit: {item.unit}</div>
              <input
                type="number"
                min={0}
                className="form-input"
                style={{ marginTop: 8 }}
                value={items[item.id] ?? 0}
                onChange={e => setItems(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>

        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">Notes</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Notes about usage, shortages, or anomalies."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {status && <div className="text-sm text-muted" style={{ marginTop: 8 }}>{status}</div>}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="section-title">History</h2>
          <span className="text-xs text-muted">Most recent first</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: 120 }}>Month</th>
                {DEFAULT_ITEMS.map(item => (
                  <th key={item.id} style={{ minWidth: 140, textAlign: 'center' }}>{item.label}</th>
                ))}
                <th style={{ minWidth: 220 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={DEFAULT_ITEMS.length + 2} style={{ textAlign: 'center', padding: 20 }}>Loading history...</td></tr>
              )}
              {!loading && entries.length === 0 && (
                <tr><td colSpan={DEFAULT_ITEMS.length + 2} style={{ textAlign: 'center', padding: 20 }}>No inventory entries yet.</td></tr>
              )}
              {!loading && entries.map(entry => (
                <tr key={entry.month}>
                  <td className="text-sm font-semibold">{entry.month}</td>
                  {DEFAULT_ITEMS.map(item => (
                    <td key={item.id} style={{ textAlign: 'center' }}>
                      <span className="text-sm">{entry.items?.[item.id] ?? 0}</span>
                    </td>
                  ))}
                  <td className="text-xs text-muted">{entry.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
