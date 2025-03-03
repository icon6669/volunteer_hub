// This file is kept for backward compatibility but doesn't use Firebase anymore

// Dummy auth object for development mode
const auth = {
  onAuthStateChanged: (callback) => {
    // Check if there's a user in local storage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      callback(JSON.parse(storedUser));
    } else {
      callback(null);
    }
    return () => {}; // Return unsubscribe function
  },
  signInWithEmailAndPassword: async (email, password) => {
    // This is handled by our custom auth context now
    console.log(`Mock sign in with email: ${email}`);
    return Promise.resolve({ user: { email } });
  },
  createUserWithEmailAndPassword: async (email, password) => {
    // This is handled by our custom auth context now
    console.log(`Mock create user with email: ${email}`);
    return Promise.resolve({ user: { email } });
  },
  signOut: async () => {
    // This is handled by our custom auth context now
    console.log("Mock sign out successful");
    return Promise.resolve();
  }
};

// Dummy providers
const googleProvider = {};
const facebookProvider = {};

// Configure providers with settings from localStorage
const updateProviderSettings = async () => {
  try {
    // This is handled by our custom auth context now
    console.log('Mock update provider settings');
  } catch (error) {
    console.error("Error configuring auth providers:", 
      error instanceof Error ? error.message : 'Unknown error');
  }
};

export { auth, googleProvider, facebookProvider, updateProviderSettings };