import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { 
  Database, 
  AlertCircle, 
  CheckCircle, 
  Lock, 
  ArrowRight,
  Loader,
  Table,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import SupabaseConnectionGuide from '../components/SupabaseConnectionGuide';

const SupabaseSetupPage: React.FC = () => {
  const { isAuthenticated, isOwner } = useAuth();
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [tablesStatus, setTablesStatus] = useState<Record<string, boolean>>({
    system_settings: false,
    users: false,
    events: false,
    roles: false,
    volunteers: false,
    messages: false
  });
  
  // Redirect if not authenticated or not owner
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isOwner) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <Lock className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="mb-6 text-gray-600">
            Supabase setup is only accessible to the system owner. You don't have the required permissions.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Check connection on component mount
  useEffect(() => {
    checkSupabaseConnection();
  }, []);
  
  const checkSupabaseConnection = async () => {
    try {
      setIsChecking(true);
      setConnectionError('');
      
      // Check if we can connect to Supabase
      if (!supabase) {
        setSupabaseConnected(false);
        setConnectionError('Supabase is not initialized. Please connect to Supabase first by clicking the "Connect to Supabase" button in the top right corner of the editor.');
        return;
      }
      
      const { data, error } = await supabase.from('system_settings').select('count');
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is fine for this check
        setSupabaseConnected(false);
        setConnectionError(`Failed to connect to Supabase: ${error.message}`);
        return;
      }
      
      setSupabaseConnected(true);
      
      // Check if tables exist
      await checkTablesExist();
    } catch (error: any) {
      setSupabaseConnected(false);
      setConnectionError(`Failed to connect to Supabase: ${error.message || 'Unknown error'}`);
    } finally {
      setIsChecking(false);
    }
  };
  
  const checkTablesExist = async () => {
    if (!supabase) return;
    
    const tables = ['system_settings', 'users', 'events', 'roles', 'volunteers', 'messages'];
    const status: Record<string, boolean> = {};
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count');
        status[table] = !error;
      } catch {
        status[table] = false;
      }
    }
    
    setTablesStatus(status);
  };
  
  const allTablesExist = Object.values(tablesStatus).every(status => status);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Database className="mr-2 h-6 w-6 text-primary-600" />
          Supabase Setup
        </h1>
        <p className="text-gray-600 mt-2">
          Configure your Supabase connection for secure data storage
        </p>
      </div>
      
      <SupabaseConnectionGuide 
        isConnected={supabaseConnected}
        onTestConnection={checkSupabaseConnection}
        error={connectionError}
      />
      
      {supabaseConnected && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold flex items-center">
              <Table className="mr-2 h-5 w-5 text-primary-600" />
              Database Tables Status
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Check if all required tables have been created
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(tablesStatus).map(([table, exists]) => (
                <div key={table} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="font-medium text-gray-700">{table}</span>
                  {exists ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Ready
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Missing
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {!allTablesExist && (
              <div className="bg-yellow-50 p-4 rounded-md text-yellow-800 mb-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Missing Tables Detected
                </h3>
                <p className="text-sm">
                  Some required tables are missing. Please run the migrations to create all necessary tables.
                </p>
                <div className="mt-3 text-sm bg-gray-800 text-white p-3 rounded-md font-mono">
                  npx supabase migration up
                </div>
              </div>
            )}
            
            {allTablesExist && (
              <div className="bg-green-50 p-4 rounded-md text-green-800">
                <h3 className="font-medium mb-2 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  All Tables Ready
                </h3>
                <p className="text-sm">
                  All required tables have been created and are ready to use. Your application is properly connected to Supabase.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseSetupPage;