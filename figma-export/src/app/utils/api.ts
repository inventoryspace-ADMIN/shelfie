import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './supabase/info';

// Initialize Supabase client for frontend auth
const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-550b27f4`;

// Types
export interface UserData {
  profile: {
    name: string;
    email: string;
    createdAt: string;
  };
  preferences: {
    theme: string;
    gridSize: number;
    appTitle: string;
    customTheme: { main: string; accent: string } | null;
  };
  sections: Array<{
    id: string;
    name: string;
    createdAt: string;
  }>;
  currentSectionId: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    image: string;
    category: string;
    sectionId: string;
    dateAdded: string;
  }>;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
}

export interface SigninData {
  email: string;
  password: string;
}

// Helper function to make authenticated API calls
async function apiCall(
  endpoint: string, 
  options: RequestInit = {}, 
  requireAuth: boolean = true
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Always include the anon key for Supabase Edge Functions
  if (requireAuth) {
    // For authenticated requests, use the user's access token
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      throw new Error('No active session - user needs to sign in');
    }
  } else {
    // For unauthenticated requests, use the anon key
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API call failed: ${response.status}`);
  }

  return response;
}

// Authentication functions
export async function signUp(data: SignupData) {
  try {
    console.log('Attempting signup with data:', { email: data.email, name: data.name });
    
    // Try client-side signup first (this handles existing users gracefully)
    const { data: authData, error: clientSignUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name
        }
      }
    });

    // If client signup fails because user exists, try signing in instead
    if (clientSignUpError) {
      if (clientSignUpError.message.includes('already been registered') || 
          clientSignUpError.message.includes('already registered')) {
        console.log('User already exists, attempting sign in instead...');
        
        // Try to sign in the existing user
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (signInError) {
          throw new Error(`Sign in failed for existing user: ${signInError.message}`);
        }

        console.log('Successfully signed in existing user');
        
        // Initialize user data if it doesn't exist
        try {
          await getUserData();
          console.log('User data exists, signup/signin complete');
        } catch (dataError) {
          if (dataError instanceof Error && dataError.message.includes('User data not found')) {
            console.log('User data not found, initializing for existing user...');
            await initializeUserDataFallback();
          }
        }
        
        return signInData;
      } else {
        // Other signup errors
        throw new Error(clientSignUpError.message);
      }
    }

    // If client signup succeeded but user needs confirmation, handle it
    if (authData.user && !authData.session) {
      console.log('User created but needs email confirmation, using server-side signup...');
      
      // Use server-side signup to auto-confirm
      try {
        const response = await apiCall('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            name: data.name
          }),
        }, false);
        
        const result = await response.json();
        console.log('Server signup successful:', result.message);
      } catch (serverError) {
        // If server signup also fails with "already registered", that's expected
        // The user was created by client signup, so we can proceed to sign in
        if (serverError instanceof Error && 
            serverError.message.includes('already been registered')) {
          console.log('Server confirms user exists, proceeding with sign in...');
        } else {
          console.warn('Server signup failed:', serverError);
        }
      }

      // Now sign in the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        throw new Error(`Sign in after confirmation failed: ${signInError.message}`);
      }

      console.log('Sign in after server confirmation successful');
      return signInData;
    }

    // If we have a session from client signup, we're good
    if (authData.session) {
      console.log('Client signup successful with immediate session');
      return authData;
    }

    // Fallback: try server-side signup
    console.log('No session from client signup, trying server-side...');
    const response = await apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        name: data.name
      }),
    }, false);
    
    const result = await response.json();
    console.log('Server signup successful:', result.message);

    // Sign in after server signup
    const { data: finalSignInData, error: finalSignInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (finalSignInError) {
      throw new Error(`Final sign in failed: ${finalSignInError.message}`);
    }

    console.log('Final sign in successful');
    return finalSignInData;
    
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}

export async function signIn(data: SigninData) {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      console.error('Sign in error:', error.message);
      throw new Error(error.message);
    }

    console.log('Sign in successful');
    
    // Check if user data exists and initialize if needed
    try {
      await getUserData();
      console.log('User data exists, signin complete');
    } catch (dataError) {
      if (dataError instanceof Error && dataError.message.includes('User data not found')) {
        console.log('User data not found after signin, initializing...');
        try {
          await initializeUserDataFallback();
          console.log('User data initialized after signin');
        } catch (initError) {
          console.warn('Failed to initialize user data after signin:', initError);
          // Don't throw - let the user proceed, the app will handle missing data gracefully
        }
      }
    }
    
    return authData;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error.message);
      throw new Error(error.message);
    }
    console.log('Sign out successful');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

export async function getCurrentSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// User data functions
export async function getUserData(): Promise<UserData> {
  try {
    const response = await apiCall('/user/data');
    const result = await response.json();
    return result.userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    
    // If user data not found, try to initialize it
    if (error instanceof Error && error.message.includes('User data not found')) {
      console.log('User data not found, attempting to initialize...');
      try {
        await initializeUserDataFallback();
        console.log('Fallback initialization completed, retrying data fetch...');
        
        // Try fetching again after initialization with a small delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryResponse = await apiCall('/user/data');
        const retryResult = await retryResponse.json();
        console.log('Data fetch retry successful');
        return retryResult.userData;
      } catch (initError) {
        console.error('Failed to initialize user data via fallback:', initError);
        // Re-throw the original error so the calling code can handle it
        throw new Error(`User data initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}`);
      }
    }
    
    // For other errors, re-throw
    throw error;
  }
}

// Fallback user data initialization for existing users
async function initializeUserDataFallback() {
  try {
    console.log('Calling fallback initialization endpoint...');
    const response = await apiCall('/user/initialize-fallback', {
      method: 'POST',
    });
    
    const result = await response.json();
    console.log('Fallback initialization successful:', result.message);
    return result;
  } catch (error) {
    console.error('Error in fallback initialization:', error);
    throw error;
  }
}

export async function updatePreferences(preferences: Partial<UserData['preferences']>) {
  try {
    const response = await apiCall('/user/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    });
    
    const result = await response.json();
    console.log('Preferences updated:', result.message);
    return result;
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
}

export async function updateCurrentSection(currentSectionId: string) {
  try {
    const response = await apiCall('/user/current-section', {
      method: 'PUT',
      body: JSON.stringify({ currentSectionId }),
    });
    
    const result = await response.json();
    console.log('Current section updated:', result.message);
    return result;
  } catch (error) {
    console.error('Error updating current section:', error);
    throw error;
  }
}

// Item functions
export async function addItem(itemData: Omit<UserData['items'][0], 'id' | 'dateAdded'>) {
  try {
    const response = await apiCall('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
    
    const result = await response.json();
    console.log('Item added:', result.item.title);
    return result.item;
  } catch (error) {
    console.error('Error adding item:', error);
    throw error;
  }
}

export async function updateItem(id: string, itemData: Omit<UserData['items'][0], 'id' | 'dateAdded'>) {
  try {
    const response = await apiCall(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
    
    const result = await response.json();
    console.log('Item updated:', result.item.title);
    return result.item;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
}

export async function deleteItem(id: string) {
  try {
    const response = await apiCall(`/items/${id}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    console.log('Item deleted:', result.message);
    return result;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
}

export async function reorderItems(itemIds: string[], sectionId: string) {
  const maxRetries = 2;
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      console.log(`🚀 API Call: reorderItems (attempt ${retryCount + 1}/${maxRetries + 1})`);
      console.log('📦 Data being sent:', { itemIds, sectionId });
      console.log('📊 ItemIds length:', itemIds.length);
      console.log('📝 ItemIds array:', itemIds);
      
      const response = await apiCall('/items/reorder', {
        method: 'PUT',
        body: JSON.stringify({ itemIds, sectionId }),
      });
      
      const result = await response.json();
      console.log('✅ API Response:', result);
      console.log('Items reordered:', result.message);
      return result;
    } catch (error) {
      retryCount++;
      
      console.error(`❌ Error in reorderItems API call (attempt ${retryCount}):`, error);
      
      // Add more specific error details
      if (error instanceof Error) {
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
      }
      
      // Try to parse error details if it's a structured error from the backend
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.details) {
          console.error('❌ Backend error details:', errorData.details);
          
          // Log specific debugging info
          if (errorData.details.notFoundItems) {
            console.error('❌ Items not found in backend:', errorData.details.notFoundItems);
          }
          if (errorData.details.itemsInRequestedSection) {
            console.error('❌ Available items in section:', errorData.details.itemsInRequestedSection);
          }
          if (errorData.details.allSectionsWithItems) {
            console.error('❌ All sections with their items:', errorData.details.allSectionsWithItems);
          }
        }
      } catch (parseError) {
        // Error message is not JSON, continue with regular error handling
        console.log('Error message is not structured JSON, proceeding with basic error handling');
      }
      
      // If we've exhausted retries, throw the error
      if (retryCount > maxRetries) {
        // Check if it's a network error vs backend error
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Network connection failed. Please check your internet connection.');
        }
        
        throw error;
      }
      
      // Wait a bit before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 3000);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Section functions
export async function addSection(name: string) {
  try {
    const response = await apiCall('/sections', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    
    const result = await response.json();
    console.log('Section added:', result.section.name);
    return result.section;
  } catch (error) {
    console.error('Error adding section:', error);
    throw error;
  }
}

export async function updateSection(id: string, name: string) {
  try {
    const response = await apiCall(`/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    
    const result = await response.json();
    console.log('Section updated:', result.section.name);
    return result.section;
  } catch (error) {
    console.error('Error updating section:', error);
    throw error;
  }
}

export async function deleteSection(id: string) {
  try {
    const response = await apiCall(`/sections/${id}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    console.log('Section deleted:', result.message);
    return result;
  } catch (error) {
    console.error('Error deleting section:', error);
    throw error;
  }
}

// Utility function to listen for auth state changes
export function onAuthStateChange(callback: (session: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.id);
    callback(session);
  });
}

// Health check function
export async function healthCheck() {
  try {
    console.log('Testing API health check...');
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Health check successful:', result);
    return result;
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}

// Share functions
export async function createShareToken(sectionId: string): Promise<string> {
  try {
    console.log('Creating share token for section:', sectionId);
    const response = await apiCall('/share/create', {
      method: 'POST',
      body: JSON.stringify({ sectionId }),
    });
    
    const result = await response.json();
    console.log('Share token created:', result.shareToken);
    return result.shareToken;
  } catch (error) {
    console.error('Error creating share token:', error);
    throw error;
  }
}

export interface SharedInventoryData {
  section: {
    id: string;
    name: string;
  };
  items: Array<{
    id: string;
    title: string;
    description: string;
    image: string;
    category: string;
    sectionId: string;
    dateAdded: string;
  }>;
  userProfile: {
    name: string;
    appTitle: string;
  };
  sharedAt: string;
}

export async function getSharedInventory(shareToken: string): Promise<SharedInventoryData> {
  try {
    console.log('Fetching shared inventory for token:', shareToken);
    const response = await fetch(`${API_BASE_URL}/share/${shareToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}` // Use anon key for public shares
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Failed to fetch shared inventory: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Shared inventory fetched:', result.shareData);
    return result.shareData;
  } catch (error) {
    console.error('Error fetching shared inventory:', error);
    throw error;
  }
}