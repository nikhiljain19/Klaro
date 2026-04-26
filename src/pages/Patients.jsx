import React, { useState, useEffect } from 'react';
import { UserPlus, User, Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getPatients, savePatient, updatePatient, deletePatient } from '../lib/supabase';
import { toast } from 'sonner';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    gender: 'Prefer not to say',
    relationship: 'Self',
    notes: ''
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await getPatients();
      setPatients(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const openFormForNew = () => {
    setEditingPatient(null);
    setFormData({
      name: '',
      date_of_birth: '',
      gender: 'Prefer not to say',
      relationship: 'Self',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openFormForEdit = (patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name || '',
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || 'Prefer not to say',
      relationship: patient.relationship || 'Self',
      notes: patient.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, formData);
        toast.success('Patient updated');
      } else {
        await savePatient(formData);
        toast.success('Patient added');
      }
      setIsModalOpen(false);
      fetchPatients();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save patient');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("This will not delete their reports, only the patient profile. Are you sure?")) {
      return;
    }
    
    try {
      await deletePatient(id);
      toast.success('Patient deleted');
      fetchPatients();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete patient');
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
          <p className="text-sm text-text-muted mt-1">Manage patient profiles linked to your reports</p>
        </div>
        <button
          onClick={openFormForNew}
          className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Patient
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-muted animate-pulse">Loading patients...</div>
      ) : patients.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border border-dashed">
          <User className="w-12 h-12 text-text-subtle mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No patients yet</h3>
          <p className="text-sm text-text-muted">Add your first patient profile to organize reports.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map(p => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow group relative">
              
              <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                <button onClick={() => openFormForEdit(p)} className="text-text-muted hover:text-primary transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="text-text-muted hover:text-danger transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold uppercase shrink-0">
                  {p.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 truncate">
                    <h3 className="text-base font-medium text-gray-900 truncate">{p.name}</h3>
                    {p.relationship && (
                      <span className="text-[10px] bg-muted leading-tight text-text-muted rounded-full px-2 py-0.5 capitalize shrink-0">
                        {p.relationship}
                      </span>
                    )}
                  </div>
                  {p.date_of_birth && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {calculateAge(p.date_of_birth)} years old
                    </p>
                  )}
                </div>
              </div>

              {p.notes && (
                <p className="text-xs text-text-muted mt-4 truncate block bg-muted/50 p-2 rounded-md">
                  {p.notes.substring(0, 60)}{p.notes.length > 60 ? '...' : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Name *</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-focus focus:ring-1 focus:ring-primary focus:outline-none bg-white" placeholder="Patient's full name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Date of Birth</label>
                <input type="date" value={formData.date_of_birth} onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-focus focus:ring-1 focus:ring-primary focus:outline-none bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Gender</label>
                <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-focus focus:ring-1 focus:ring-primary focus:outline-none bg-white">
                  <option>Prefer not to say</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Relationship</label>
              <select value={formData.relationship} onChange={e => setFormData({ ...formData, relationship: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-focus focus:ring-1 focus:ring-primary focus:outline-none bg-white">
                <option>Self</option>
                <option>Partner</option>
                <option>Mother</option>
                <option>Father</option>
                <option>Child</option>
                <option>Sibling</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-focus focus:ring-1 focus:ring-primary focus:outline-none bg-white resize-none" placeholder="Any relevant context about this patient..." />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setIsModalOpen(false)} className="text-sm font-medium text-text-muted hover:text-gray-900 px-4 py-2 transition-colors">Cancel</button>
            <button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
