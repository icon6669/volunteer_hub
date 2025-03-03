import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import SocialLoginButton from '../components/SocialLoginButton';

const LoginPage: React.FC = () => {
  const { 
    loginWithEmail, 
    loginWithGoogle, 
    loginWithFacebook, 
    isAuthenticated, 
    isLoading, 
    users,
    sendPasswordResetEmail
  } = useAuth();
  const { isGoogleAuthEnabled, isFacebookAuthEnabled } = useSettings();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  
  const isFirstUser = users.length === 0;
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    
    setIsProcessing(true);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
      setIsProcessing(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setError('');
    setIsProcessing(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google login failed. Please try again.');
      setIsProcessing(false);
    }
  };
  
  const handleFacebookLogin = async () => {
    setError('');
    setIsProcessing(true);
    try {
      await loginWithFacebook();
    } catch (err: any) {
      setError(err.message || 'Facebook login failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess(false);
    
    if (!resetEmail.trim()) {
      setResetError('Email is required');
      return;
    }
    
    setIsProcessing(true);
    try {
      const success = await sendPasswordResetEmail(resetEmail);
      if (success) {
        setResetSuccess(true);
        setResetEmail('');
      } else {
        setResetError('Failed to send password reset email. Please check if the email is registered.');
      }
    } catch (err) {
      setResetError('An error occurred. Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (showForgotPassword) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-8">
            <button 
              onClick={() => setShowForgotPassword(false)}
              className="text-primary-600 hover:text-primary-800 mb-6 flex items-center text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to login
            </button>
            
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Reset Your Password</h1>
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password
              </p>
            </div>
            
            {resetError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}
            
            {resetSuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>Password reset email sent! Check your inbox for further instructions.</span>
              </div>
            )}
            
            <form onSubmit={handlePasswordReset}>
              <div className="mb-6">
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your email address"
                />
              </div>
              
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center ${
                  isProcessing ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isProcessing ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Welcome to Volunteer Hub</h1>
            <p className="text-gray-600">
              Sign in to manage events and volunteer opportunities
            </p>
            {isFirstUser && (
              <div className="mt-2 p-2 bg-secondary-100 text-secondary-800 rounded-md">
                You'll be registered as the system owner with full access
              </div>
            )}
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleEmailLogin}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div className="mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div className="mb-6 text-right">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setResetEmail(email);
                }}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                Forgot password?
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center ${
                isProcessing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <Mail className="h-5 w-5 mr-2" />
              {isFirstUser ? 'Sign Up with Email' : 'Sign In with Email'}
            </button>
          </form>
          
          {(isGoogleAuthEnabled || isFacebookAuthEnabled) && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-3">
                {isGoogleAuthEnabled && (
                  <SocialLoginButton 
                    provider="google" 
                    onClick={handleGoogleLogin} 
                    disabled={isProcessing} 
                  />
                )}
                
                {isFacebookAuthEnabled && (
                  <SocialLoginButton 
                    provider="facebook" 
                    onClick={handleFacebookLogin} 
                    disabled={isProcessing} 
                  />
                )}
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;