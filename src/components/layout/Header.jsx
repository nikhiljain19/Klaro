import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Plus, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '../../lib/AuthContext';
import { signOut } from '../../lib/supabase';

export default function Header({ onOpenUpload, onSignOut }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      if (onSignOut) onSignOut();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border px-6 py-4 flex justify-between items-center">
      <div 
        className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity duration-150" 
        onClick={() => navigate('/')}
      >
        <span className="text-base font-semibold text-gray-900 leading-tight">Klaro</span>
        <span className="text-xs text-text-muted">Your medical timeline</span>
      </div>
      <div className="flex gap-3">
        <button 
          onClick={() => navigate('/ask')}
          className="bg-muted border border-border text-gray-700 rounded-lg w-9 h-9 flex items-center justify-center md:w-auto md:h-auto md:px-4 md:py-2 text-sm font-medium"
        >
          <MessageCircle className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Ask</span>
        </button>
        <button 
          onClick={onOpenUpload}
          className="bg-primary text-white rounded-lg w-9 h-9 flex items-center justify-center md:w-auto md:h-auto md:px-4 md:py-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4 md:mr-1" />
          <span className="hidden md:inline">Add Report</span>
        </button>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none ml-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-medium flex items-center justify-center cursor-pointer uppercase">
                {user.email ? user.email.charAt(0) : 'U'}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card border border-border shadow-sm rounded-lg mt-1 min-w-[150px]">
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-sm px-3 py-2 cursor-pointer hover:bg-muted focus:bg-muted text-danger focus:text-danger flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
