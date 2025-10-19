import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Business {
  id: string;
  name: string;
  business_type: string;
  tax_id?: string | null;
  address?: any;
  created_at: string;
  updated_at: string;
}

interface Account {
  id: string;
  business_id: string;
  name: string;
  account_type: string;
  bank_name: string;
  account_number: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

interface BusinessContextType {
  businesses: Business[];
  currentBusiness: Business | null;
  accounts: Account[];
  loading: boolean;
  setCurrentBusiness: (business: Business) => void;
  refreshBusinesses: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setBusinesses(data || []);

      const savedBusinessId = localStorage.getItem('currentBusinessId');
      let current = null as Business | null;

      if (savedBusinessId) {
        current = data?.find(b => b.id === savedBusinessId) || null;
      }

      if (!current && data && data.length > 0) {
        current = data[0];
      }

      setCurrentBusinessState(current);
      if (current) {
        localStorage.setItem('currentBusinessId', current.id);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    if (!currentBusiness) return;

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBusinesses();
    } else {
      setBusinesses([]);
      setCurrentBusinessState(null);
      setAccounts([]);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (currentBusiness) {
      fetchAccounts();
    }
  }, [currentBusiness]);

  const setCurrentBusiness = (business: Business) => {
    setCurrentBusinessState(business);
    localStorage.setItem('currentBusinessId', business.id);

    supabase
      .from('businesses')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', business.id)
      .then(() => {});
  };

  const refreshBusinesses = async () => {
    await fetchBusinesses();
  };

  const refreshAccounts = async () => {
    await fetchAccounts();
  };

  const value = {
    businesses,
    currentBusiness,
    accounts,
    loading,
    setCurrentBusiness,
    refreshBusinesses,
    refreshAccounts,
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
