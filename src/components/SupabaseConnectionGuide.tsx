import React from 'react';
import { Database, AlertCircle, CheckCircle, Copy, Server } from 'lucide-react';

interface SupabaseConnectionGuideProps {
  isConnected: boolean;
  onTestConnection: () => void;
  error?: string;
}

const SupabaseConnectionGuide: React.FC<SupabaseConnectionGuideProps> = ({
  isConnected,
  onTestConnection,
  error
}) => {
  const [copied, setCopied] = React.useState(false);
  
  const copyMigrationCommand = () => {
    navigator.clipboard.writeText('npx supabase migration new create_system_settings_table');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold flex items-center">
          <Database className="mr-2 h-5 w-5 text-primary-600" />
          Supabase Connection Guide
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Follow these steps to connect your application to Supabase
        </p>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium">Connection Status</h3>
            <p className="text-sm text-gray-500 mt-1">
              Supabase connection is required for storing application data
            </p>
          </div>
          <div className="flex items-center">
            {isConnected ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Connected
              </span>
            ) : (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Not Connected
              </span>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Step 1: Connect to Supabase</h3>
            <p className="text-sm text-gray-600 mb-4">
              Click the "Connect to Supabase" button in the top right corner of the editor to set up your connection.
              This will create a new Supabase project or connect to an existing one.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Step 2: Run Migrations</h3>
            <p className="text-sm text-gray-600 mb-4">
              After connecting to Supabase, you need to run the migrations to create the necessary tables.
              The migration files are already included in the project under <code>supabase/migrations</code>.
            </p>
            
            <div className="bg-gray-800 text-white p-3 rounded-md text-sm font-mono mb-2 flex justify-between items-center">
              <span>npx supabase migration up</span>
              <button 
                onClick={copyMigrationCommand}
                className="text-gray-400 hover:text-white"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            
            <p className="text-xs text-gray-500">
              This command will apply all migrations to your Supabase project.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Step 3: Test Connection</h3>
            <p className="text-sm text-gray-600 mb-4">
              After running the migrations, test your connection to make sure everything is working correctly.
            </p>
            
            <div className="flex justify-end">
              <button
                onClick={onTestConnection}
                className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <Database className="h-5 w-5 mr-2" />
                Test Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionGuide;