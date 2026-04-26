import React, { useState, useEffect } from 'react';
import { UserPlus, User, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getPatients, savePatient, updatePatient, deletePatient, getReports, updateReport } from '../lib/supabase';
import { toast } from 'sonner';

export default function People() {
  const [people, setPeople] = useState([]);
  const [unlinkedMatches, setUnlinkedMatches] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    gender: 'Prefer not to say',
    relationship: 'Self',
    notes: ''
  });

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const data = await getPatients();
      setPeople(data || []);

      const reps = await getReports();
      const unlinked = reps.filter(r => !r.patient_id && r.extracted_values?.patient_info?.name);
      
      const matches = [];
      const dataSafe = data || [];
      for(const r of unlinked) {
        const extractedName = r.extracted_values.patient_info.name.trim().toLowerCase();
        const match = dataSafe.find(p => p.name.trim().toLowerCase() === extractedName);
        if (match) {
          matches.push({ report: r, person: match });
        }
      }
      setUnlinkedMatches(matches);

    } catch (err) {
      console.error(err);
      toast.error('Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const openFormForNew = () => {
    setEditingPerson(null);
    setFormData({
      name: '',
      date_of_birth: '',
      gender: 'Prefer not to say',
      relationship: 'Self',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openFormForEdit = (person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name || '',
      date_of_birth: person.date_of_birth || '',
      gender: person.gender || 'Prefer not to say',
      relationship: person.relationship || 'Self',
      notes: person.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editingPerson) {
        await updatePatient(editingPerson.id, formData);
        toast.success('Person updated');
      } else {
        await savePatient(formData);
        toast.success('Person added');
      }
      setIsModalOpen(false);
      fetchPeople();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save person');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("This will not delete their reports, only the person profile. Are you sure?")) {
      return;
    }
    
    try {
      await deletePatient(id);
      toast.success('Person deleted');
      fetchPeople();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete person');
    }
  };

  const handleConfirmLink = async (reportId, personId) => {
    try {
      await updateReport(reportId, { patient_id: personId });
      setUnlinkedMatches(prev => prev.filter(m => m.report.id !== reportId));
      if (unlinkedMatches.length <= 1) setShowReviewModal(false);
      toast.success("Report linked");
    } catch(err) { 
      toast.error("Failed to link report");
    }
  }
  
  const handleSkipLink = (reportId) => {
    setUnlinkedMatches(prev => prev.filter(m => m.report.id !== reportId));
    if (unlinkedMatches.length <= 1) setShowReviewModal(false);
  }

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
          <h1 className="text-2xl font-semibold text-gray-900">People</h1>
          <p className="text-sm text-text-muted mt-1">Manage profiles for everyone whose reports you track</p>
        </div>
        <button
          onClick={openFormForNew}
          className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Person
        </button>
      </div>

      {unlinkedMatches.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex justify-between items-center">
          <div className="text-amber-800 text-sm font-medium">
            {unlinkedMatches.length} report{unlinkedMatches.length > 1 ? 's' : ''} could be automatically linked to people. Review and confirm?
          </div>
          <button onClick={() => setShowReviewModal(true)} className="bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
            Review
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-text-muted animate-pulse">Loading people...</div>
      ) : people.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border border-dashed">
          <User className="w-12 h-12 text-text-subtle mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No people yet</h3>
          <p className="text-sm text-text-muted">Add your first person profile to organize reports.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map(p => (
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

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-lg bg-card border border-border shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle>Review Suggested Links</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-4 py-4">
            {unlinkedMatches.map(m => (
              <div key={m.report.id} className="border border-border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 max-w-[50%]">
                    <span className="text-sm font-medium text-gray-900 truncate">{m.report.file_name}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted shrink-0" />
                  <div className="flex items-center gap-2 max-w-[40%] bg-primary/10 px-2 py-1 rounded text-primary text-sm font-medium truncate">
                    <User className="w-3.5 h-3.5 shrink-0" /> {m.person.name}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                  <button onClick={() => handleSkipLink(m.report.id)} className="text-xs font-medium text-text-muted px-3 py-1.5 hover:text-gray-900 transition-colors">Skip</button>
                  <button onClick={() => handleConfirmLink(m.report.id, m.person.id)} className="text-xs font-medium bg-primary text-white px-4 py-1.5 rounded-md hover:bg-primary/90 transition-colors">Confirm Link</button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <button onClick={() => setShowReviewModal(false)} className="text-sm font-medium text-text-muted hover:text-gray-900 px-4 py-2 transition-colors">Done</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border shadow-xl rounded-xl">
          <DialogHeader>
            <DialogTitle>{editingPerson ? 'Edit Person' : 'Add New Person'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Name *</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-focus focus:ring-1 focus:ring-primary focus:outline-none bg-white" placeholder="Person's full name" />
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
              <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-focus focus:ring-1 focus:ring-primary focus:outline-none bg-white resize-none" placeholder="Any relevant context about this person..." />
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
