import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password 
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function resendConfirmation(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email
  })
  if (error) throw error
}

async function handleAuthError(error) {
  if (error && error.message && (error.message.includes('JWT') || error.message.includes('not authenticated') || error.message.includes('Auth session missing'))) {
    await signOut();
    toast.error("Your session expired. Please sign in again.");
    window.location.href = '/login';
    return true;
  }
  return false;
}

export async function getReports() {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', user.id)
    .order('report_date', { ascending: false })
  
  if (error) {
    const isAuth = await handleAuthError(error);
    if (!isAuth) throw error;
  }
  return data
}

export async function getPatients() {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function findPersonByName(name) {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', user.id)
  if (error) throw error
  if (!data || data.length === 0) 
    return null
  
  const normalised = name.trim().toLowerCase()
  return data.find(p => p.name.trim().toLowerCase() === normalised) || null
}

export async function savePatient(data) {
  const user = await getCurrentUser()
  const { data: saved, error } = await supabase
    .from('patients')
    .insert([{ ...data, user_id: user.id }])
    .select()
    .single()
  if (error) throw error
  return saved
}

export async function updatePatient(id, data) {
  const { data: updated, error } = await supabase
    .from('patients')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return updated
}

export async function deletePatient(id) {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function saveReport(data) {
  const user = await getCurrentUser()
  const { data: savedData, error } = await supabase
    .from('reports')
    .insert([{ ...data, user_id: user.id }])
    .select()
    .single()
    
  if (error) {
    const isAuth = await handleAuthError(error);
    if (!isAuth) throw error;
  }
  return savedData
}

export async function updateReport(id, data) {
  const { data: updatedData, error } = await supabase
    .from('reports')
    .update(data)
    .eq('id', id)
    .select()
    .single()
    
  if (error) throw error
  return updatedData
}

export async function uploadReportFile(file) {
  const user = await getCurrentUser()
  // Use timestamp to prevent filename collisions
  const fileName = `${user.id}/${Date.now()}_${file.name}`
  
  const { data, error } = await supabase.storage
    .from('reports')
    .upload(fileName, file, {
      contentType: 'application/pdf',
    })
    
  if (error) {
    const isAuth = await handleAuthError(error);
    if (!isAuth) throw error;
  }
  
  // Create 10-year signed URL to store initially
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('reports')
    .createSignedUrl(data.path, 315360000)
    
  if (signedUrlError) {
    const isAuth = await handleAuthError(signedUrlError);
    if (!isAuth) throw signedUrlError;
  }
    
  return {
    fileUrl: signedUrlData.signedUrl,
    filePath: data.path
  }
}

export async function getReportFileUrl(filePath) {
  // Create a 1-hour signed URL for viewing an existing report
  const { data, error } = await supabase.storage
    .from('reports')
    .createSignedUrl(filePath, 3600)
    
  if (error) throw error
  
  return data.signedUrl
}

export async function deleteReport(id, filePath) {
  // Delete file from storage first
  if (filePath) {
    await supabase.storage
      .from('reports')
      .remove([filePath])
  }
  // Then delete DB row
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function saveFeedback(data) {
  const user = await getCurrentUser()
  const { error } = await supabase
    .from('feedback')
    .insert([{ ...data, user_id: user.id }])
  if (error) throw error
}
