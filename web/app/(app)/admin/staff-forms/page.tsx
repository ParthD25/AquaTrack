'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

type FieldType = 'text' | 'textarea' | 'checkbox' | 'number' | 'percentage' | 'dropdown' | 'email' | 'phone' | 'date';

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for dropdown/checkbox groups
}

interface StaffForm {
  id: string;
  title: string;
  description?: string;
  category: 'general' | 'incident' | 'checklist' | 'training' | 'feedback' | 'custom';
  fields: FormField[];
  createdAt: string;
  createdBy: string;
  active: boolean;
}

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: 'text', label: 'Short Text', icon: '📝' },
  { value: 'textarea', label: 'Long Text', icon: '📄' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'phone', label: 'Phone', icon: '☎️' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'percentage', label: 'Percentage', icon: '%️' },
  { value: 'checkbox', label: 'Yes / No', icon: '☑️' },
  { value: 'dropdown', label: 'Drop-down', icon: '⬇️' },
  { value: 'date', label: 'Date', icon: '📅' },
];

const CATEGORIES = ['general', 'incident', 'checklist', 'training', 'feedback', 'custom'] as const;
const CATEGORY_ICONS: Record<string, string> = {
  general: '📋',
  incident: '🚨',
  checklist: '☑️',
  training: '🎓',
  feedback: '💬',
  custom: '✨',
};

export default function StaffFormsPage() {
  const { user } = useAuth();
  const [forms, setForms] = useState<StaffForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState<StaffForm | null>(null);

  // Form builder state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<StaffForm['category']>('general');
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    async function fetchForms() {
      try {
        const snap = await getDocs(collection(db, 'staff_forms'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffForm));
        setForms(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchForms();
  }, []);

  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: `Question ${fields.length + 1}`,
      type,
      required: false,
      placeholder: type === 'percentage' ? '0-100%' : undefined,
    };
    setFields([...fields, newField]);
  };

  const handleUpdateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSaveForm = async () => {
    if (!formTitle.trim() || fields.length === 0 || !user) {
      alert('Please add a title and at least one field');
      return;
    }

    setSaving(true);
    try {
      const formId = editingForm?.id || `form_${Date.now()}`;
      const formData: StaffForm = {
        id: formId,
        title: formTitle,
        description: formDescription,
        category: formCategory,
        fields,
        createdAt: editingForm?.createdAt || new Date().toISOString(),
        createdBy: editingForm?.createdBy || user.displayName,
        active: true,
      };

      await setDoc(doc(db, 'staff_forms', formId), formData);
      setForms(prev =>
        editingForm
          ? prev.map(f => f.id === formId ? formData : f)
          : [...prev, formData]
      );

      // Reset form
      setFormTitle('');
      setFormDescription('');
      setFormCategory('general');
      setFields([]);
      setEditingForm(null);
      setShowBuilder(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Delete this form? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'staff_forms', formId));
      setForms(prev => prev.filter(f => f.id !== formId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete form');
    }
  };

  const handleEditForm = (form: StaffForm) => {
    setEditingForm(form);
    setFormTitle(form.title);
    setFormDescription(form.description || '');
    setFormCategory(form.category);
    setFields([...form.fields]);
    setShowBuilder(true);
  };

  const handleCancelBuilder = () => {
    setShowBuilder(false);
    setEditingForm(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('general');
    setFields([]);
  };

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p className="font-semibold">Admin Only</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="page-container flex justify-center"><div className="spinner" /></div>;

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Staff Forms Management</h1>
          <p className="page-subtitle">Create and manage custom forms for your staff</p>
        </div>
        {!showBuilder && (
          <button className="btn btn-primary" onClick={() => setShowBuilder(true)}>
            ➕ New Form
          </button>
        )}
      </div>

      {showBuilder ? (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">{editingForm ? '✏️ Edit Form' : '📋 Create New Form'}</h2>
            <button className="btn btn-ghost" onClick={handleCancelBuilder} style={{ color: 'var(--text-secondary)' }}>
              ✕
            </button>
          </div>

          <div className="grid-2 grid gap-6">
            {/* Form Settings */}
            <div>
              <div className="form-group">
                <label className="form-label">Form Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Monthly Staff Feedback Form"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  placeholder="What is this form for?"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={formCategory} onChange={e => setFormCategory(e.target.value as StaffForm['category'])}>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSaveForm}
                disabled={saving || !formTitle.trim() || fields.length === 0}
                style={{ width: '100%', marginTop: 24 }}
              >
                {saving ? 'Saving...' : editingForm ? 'Update Form' : 'Create Form'}
              </button>

              <button
                className="btn btn-ghost"
                onClick={handleCancelBuilder}
                style={{ width: '100%', marginTop: 8, color: 'var(--red-500)' }}
              >
                Cancel
              </button>
            </div>

            {/* Fields List */}
            <div>
              <h4 className="section-title mb-3">Form Fields ({fields.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '70vh', overflowY: 'auto', marginBottom: 16 }}>
                {fields.length === 0 ? (
                  <div className="empty-state" style={{ fontSize: '0.875rem' }}>
                    <p>No fields yet. Add one from the list below.</p>
                  </div>
                ) : (
                  fields.map(field => (
                    <div key={field.id} className="card" style={{ padding: 12, background: 'var(--bg-elevated)' }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Question text"
                          value={field.label}
                          onChange={e => handleUpdateField(field.id, { label: e.target.value })}
                          style={{ flex: 1, fontSize: '0.875rem' }}
                        />
                        <button
                          className="btn btn-ghost"
                          onClick={() => handleRemoveField(field.id)}
                          style={{ color: '#ef4444', padding: '6px 8px' }}
                        >
                          🗑
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select
                          className="form-select"
                          value={field.type}
                          onChange={e => handleUpdateField(field.id, { type: e.target.value as FieldType })}
                          style={{ fontSize: '0.875rem', flex: 1 }}
                        >
                          {FIELD_TYPES.map(t => (
                            <option key={t.value} value={t.value}>
                              {t.icon} {t.label}
                            </option>
                          ))}
                        </select>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={e => handleUpdateField(field.id, { required: e.target.checked })}
                          />
                          Required
                        </label>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <h4 className="section-title mb-3">Add Field Type</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                {FIELD_TYPES.map(type => (
                  <button
                    key={type.value}
                    className="btn btn-secondary"
                    onClick={() => handleAddField(type.value)}
                    style={{ fontSize: '0.875rem', padding: '8px 4px' }}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Forms List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {forms.length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <div className="empty-state">
                  <p>No forms created yet</p>
                  <button className="btn btn-primary mt-4" onClick={() => setShowBuilder(true)}>
                    Create Your First Form
                  </button>
                </div>
              </div>
            ) : (
              forms.map(form => (
                <div key={form.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div className="text-sm font-semibold" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {CATEGORY_ICONS[form.category]} {form.title}
                      </div>
                      <div className="text-xs text-muted mt-1">{form.fields.length} field{form.fields.length !== 1 ? 's' : ''}</div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Active</span>
                  </div>

                  {form.description && (
                    <p className="text-xs text-muted mb-3" style={{ lineHeight: 1.4 }}>
                      {form.description}
                    </p>
                  )}

                  <div style={{ marginBottom: 12, padding: 8, background: 'var(--bg-elevated)', borderRadius: 6 }}>
                    <div className="text-xs text-muted mb-2" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Fields:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {form.fields.slice(0, 3).map(f => (
                        <span
                          key={f.id}
                          className="badge"
                          style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--blue-500)',
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                          }}
                        >
                          {FIELD_TYPES.find(t => t.value === f.type)?.icon} {f.type}
                        </span>
                      ))}
                      {form.fields.length > 3 && (
                        <span className="text-xs text-muted">+{form.fields.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted mb-3">
                    Created by {form.createdBy} on {new Date(form.createdAt).toLocaleDateString()}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEditForm(form)}
                      style={{ flex: 1, fontSize: '0.875rem' }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleDeleteForm(form.id)}
                      style={{ flex: 1, color: '#ef4444', fontSize: '0.875rem' }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
