import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from './kv_store.tsx';

const app = new Hono();

// Enable CORS and logging
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
app.use('*', logger(console.log));

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// User Authentication Routes

// Server-side signup with email confirmation
app.post('/make-server-550b27f4/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    console.log('Creating user with admin API:', { email, name });

    // Use admin API to create user with email_confirm: true
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured
      email_confirm: true
    });

    if (createError) {
      console.error('Admin user creation error:', createError.message);
      
      // If user already exists, that's not necessarily an error for our flow
      if (createError.message.includes('already been registered') || 
          createError.message.includes('already registered')) {
        console.log('User already exists in auth, checking for data initialization...');
        
        // Try to get the existing user to see if we can initialize their data
        try {
          const { data: existingUsers } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000
          });
          
          const existingUser = existingUsers.users.find(u => u.email === email);
          if (existingUser) {
            console.log('Found existing user:', existingUser.id);
            
            // Check if user data exists
            const existingData = await kv.get(`user:${existingUser.id}`);
            if (!existingData) {
              console.log('Existing user has no data, initializing...');
              
              // Initialize user data for existing user
              const defaultUserData = {
                profile: {
                  name: existingUser.user_metadata?.name || name,
                  email,
                  createdAt: new Date().toISOString()
                },
                preferences: {
                  theme: 'light',
                  gridSize: 4,
                  appTitle: 'INVENTORY',
                  customTheme: null
                },
                sections: [
                  { id: 'clothing', name: 'Clothing', createdAt: new Date().toISOString() },
                  { id: 'skincare', name: 'Skincare', createdAt: new Date().toISOString() },
                  { id: 'haircare', name: 'Haircare', createdAt: new Date().toISOString() }
                ],
                currentSectionId: 'clothing',
                items: [
                  {
                    id: '1',
                    title: 'Ralph Lauren Big Pony',
                    description: 'Classic polo shirt with oversized pony logo',
                    image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop',
                    category: 'Tops',
                    sectionId: 'clothing',
                    dateAdded: new Date().toISOString()
                  },
                  {
                    id: '2',
                    title: 'Supreme x Nike',
                    description: 'Limited edition collaboration sneakers',
                    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop',
                    category: 'Footwear',
                    sectionId: 'clothing',
                    dateAdded: new Date().toISOString()
                  },
                  {
                    id: '3',
                    title: 'Kaws x Uniqlo',
                    description: 'Artist collaboration graphic tee',
                    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
                    category: 'Tops',
                    sectionId: 'clothing',
                    dateAdded: new Date().toISOString()
                  },
                  {
                    id: '4',
                    title: 'YEEZY 500',
                    description: 'Chunky retro-inspired sneakers',
                    image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop',
                    category: 'Footwear',
                    sectionId: 'clothing',
                    dateAdded: new Date().toISOString()
                  }
                ]
              };

              await kv.set(`user:${existingUser.id}`, defaultUserData);
              console.log('User data initialized for existing user:', existingUser.id);
              
              return c.json({ 
                message: 'Existing user data initialized successfully',
                user: existingUser,
                dataInitialized: true
              });
            } else {
              console.log('Existing user already has data');
              return c.json({ 
                message: 'User already exists with data',
                user: existingUser,
                dataExists: true
              });
            }
          }
        } catch (listError) {
          console.error('Error checking existing users:', listError);
        }
        
        // Return the original error if we can't handle it gracefully
        return c.json({ error: createError.message }, 400);
      }
      
      return c.json({ error: createError.message }, 400);
    }

    if (!userData.user) {
      return c.json({ error: 'No user data returned from signup' }, 500);
    }

    console.log('User created successfully:', userData.user.id);

    // Initialize user data in KV store
    const defaultUserData = {
      profile: {
        name,
        email,
        createdAt: new Date().toISOString()
      },
      preferences: {
        theme: 'light',
        gridSize: 4,
        appTitle: 'INVENTORY',
        customTheme: null
      },
      sections: [
        { id: 'clothing', name: 'Clothing', createdAt: new Date().toISOString() },
        { id: 'skincare', name: 'Skincare', createdAt: new Date().toISOString() },
        { id: 'haircare', name: 'Haircare', createdAt: new Date().toISOString() }
      ],
      currentSectionId: 'clothing',
      items: [
        {
          id: '1',
          title: 'Ralph Lauren Big Pony',
          description: 'Classic polo shirt with oversized pony logo',
          image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop',
          category: 'Tops',
          sectionId: 'clothing',
          dateAdded: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Supreme x Nike',
          description: 'Limited edition collaboration sneakers',
          image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop',
          category: 'Footwear',
          sectionId: 'clothing',
          dateAdded: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Kaws x Uniqlo',
          description: 'Artist collaboration graphic tee',
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
          category: 'Tops',
          sectionId: 'clothing',
          dateAdded: new Date().toISOString()
        },
        {
          id: '4',
          title: 'YEEZY 500',
          description: 'Chunky retro-inspired sneakers',
          image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop',
          category: 'Footwear',
          sectionId: 'clothing',
          dateAdded: new Date().toISOString()
        }
      ]
    };

    await kv.set(`user:${userData.user.id}`, defaultUserData);
    console.log('User data initialized for:', userData.user.id);

    return c.json({ 
      message: 'User created and initialized successfully',
      user: userData.user
    });
  } catch (error) {
    console.log(`Server signup error: ${error}`);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Initialize user data after client-side signup
app.post('/make-server-550b27f4/user/initialize', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) {
      console.log(`Auth error while initializing user: ${authError?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { userId, email, name } = await c.req.json();
    
    if (!userId || !email || !name) {
      return c.json({ error: 'UserId, email, and name are required' }, 400);
    }

    // Verify the user ID matches the authenticated user
    if (user.id !== userId) {
      return c.json({ error: 'User ID mismatch' }, 403);
    }

    // Check if user data already exists
    const existingData = await kv.get(`user:${userId}`);
    if (existingData) {
      console.log(`User data already exists for ${userId}`);
      return c.json({ message: 'User data already initialized' });
    }

    // Initialize user data in KV store
    const defaultUserData = {
      profile: {
        name,
        email,
        createdAt: new Date().toISOString()
      },
      preferences: {
        theme: 'light',
        gridSize: 4,
        appTitle: 'INVENTORY',
        customTheme: null
      },
      sections: [
        { id: 'clothing', name: 'Clothing', createdAt: new Date().toISOString() },
        { id: 'skincare', name: 'Skincare', createdAt: new Date().toISOString() },
        { id: 'haircare', name: 'Haircare', createdAt: new Date().toISOString() }
      ],
      currentSectionId: 'clothing',
      items: [
        {
          id: '1',
          title: 'Ralph Lauren Big Pony',
          description: 'Classic polo shirt with oversized pony logo',
          image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop',
          category: 'Tops',
          sectionId: 'clothing',
          dateAdded: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Supreme x Nike',
          description: 'Limited edition collaboration sneakers',
          image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop',
          category: 'Footwear',
          sectionId: 'clothing',
          dateAdded: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Kaws x Uniqlo',
          description: 'Artist collaboration graphic tee',
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
          category: 'Tops',
          sectionId: 'clothing',
          dateAdded: new Date().toISOString()
        },
        {
          id: '4',
          title: 'YEEZY 500',
          description: 'Chunky retro-inspired sneakers',
          image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop',
          category: 'Footwear',
          sectionId: 'clothing',
          dateAdded: new Date().toISOString()
        }
      ]
    };

    await kv.set(`user:${userId}`, defaultUserData);

    return c.json({ 
      message: 'User data initialized successfully'
    });
  } catch (error) {
    console.log(`User initialization error: ${error}`);
    return c.json({ error: 'Internal server error during user initialization' }, 500);
  }
});

// Fallback user data initialization for existing users
app.post('/make-server-550b27f4/user/initialize-fallback', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) {
      console.log(`Auth error while initializing fallback user data: ${authError?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user data already exists
    const existingData = await kv.get(`user:${user.id}`);
    if (existingData) {
      console.log(`User data already exists for ${user.id}`);
      return c.json({ message: 'User data already initialized' });
    }

    // Get user info from auth metadata
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    const email = user.email || '';

    // Initialize user data in KV store
    const defaultUserData = {
      profile: {
        name,
        email,
        createdAt: new Date().toISOString()
      },
      preferences: {
        theme: 'light',
        gridSize: 4,
        appTitle: 'INVENTORY',
        customTheme: null
      },
      sections: [
        { id: 'clothing', name: 'Clothing', createdAt: new Date().toISOString() },
        { id: 'skincare', name: 'Skincare', createdAt: new Date().toISOString() },
        { id: 'haircare', name: 'Haircare', createdAt: new Date().toISOString() }
      ],
      currentSectionId: 'clothing',
      items: [
        {
          id: '1',
          title: 'Ralph Lauren Big Pony',
          description: 'Classic polo shirt with oversized pony logo',
          image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop',
          category: 'Tops',
          sectionId: 'clothing',
          dateAdded: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Supreme x Nike',
          description: 'Limited edition collaboration sneakers',
          image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop',
          category: 'Footwear',
          sectionId: 'clothing',
          dateAdded: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Kaws x Uniqlo',
          description: 'Artist collaboration graphic tee',
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
          category: 'Tops',
          sectionId: 'clothing',
          dateAdded: new Date().toISOString()
        },
        {
          id: '4',
          title: 'YEEZY 500',
          description: 'Chunky retro-inspired sneakers',
          image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop',
          category: 'Footwear',
          sectionId: 'clothing',
          dateAdded: new Date().toISOString()
        }
      ]
    };

    await kv.set(`user:${user.id}`, defaultUserData);
    console.log('Fallback user data initialized for:', user.id);

    return c.json({ 
      message: 'User data initialized successfully via fallback method'
    });
  } catch (error) {
    console.log(`Fallback user initialization error: ${error}`);
    return c.json({ error: 'Internal server error during fallback user initialization' }, 500);
  }
});

// Get user data (requires authentication)
app.get('/make-server-550b27f4/user/data', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || error) {
      console.log(`Auth error while getting user data: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`Fetching user data for user ID: ${user.id}`);
    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData) {
      console.log(`No user data found for user ${user.id}, initializing default data...`);
      
      // Auto-initialize user data for existing authenticated users
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      const email = user.email || '';

      const defaultUserData = {
        profile: {
          name,
          email,
          createdAt: new Date().toISOString()
        },
        preferences: {
          theme: 'light',
          gridSize: 4,
          appTitle: 'INVENTORY',
          customTheme: null,
          showValues: false,
          currency: 'USD'
        },
        sections: [
          { id: 'clothing', name: 'Clothing', createdAt: new Date().toISOString() },
          { id: 'skincare', name: 'Skincare', createdAt: new Date().toISOString() },
          { id: 'haircare', name: 'Haircare', createdAt: new Date().toISOString() }
        ],
        currentSectionId: 'clothing',
        items: [
          {
            id: '1',
            title: 'Ralph Lauren Big Pony',
            description: 'Classic polo shirt with oversized pony logo',
            image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop',
            category: 'Tops',
            sectionId: 'clothing',
            dateAdded: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Supreme x Nike',
            description: 'Limited edition collaboration sneakers',
            image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop',
            category: 'Footwear',
            sectionId: 'clothing',
            dateAdded: new Date().toISOString()
          },
          {
            id: '3',
            title: 'Kaws x Uniqlo',
            description: 'Artist collaboration graphic tee',
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
            category: 'Tops',
            sectionId: 'clothing',
            dateAdded: new Date().toISOString()
          },
          {
            id: '4',
            title: 'YEEZY 500',
            description: 'Chunky retro-inspired sneakers',
            image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop',
            category: 'Footwear',
            sectionId: 'clothing',
            dateAdded: new Date().toISOString()
          }
        ]
      };

      try {
        await kv.set(`user:${user.id}`, defaultUserData);
        console.log(`Successfully initialized user data for ${user.id}`);
        return c.json({ userData: defaultUserData });
      } catch (initError) {
        console.error(`Failed to initialize user data for ${user.id}:`, initError);
        
        // Return the default data even if we can't save it
        // This ensures the app works even if KV store has issues
        return c.json({ userData: defaultUserData });
      }
    }

    console.log(`Successfully retrieved user data for ${user.id}`);
    return c.json({ userData });
    
  } catch (error) {
    console.error(`Error fetching user data:`, error);
    
    // Instead of returning 500, try to provide a working fallback
    try {
      // Try to get user info for fallback
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (accessToken) {
        const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
        if (user && !authError) {
          console.log(`Providing fallback user data for ${user.id} due to error`);
          
          const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
          const email = user.email || '';

          const fallbackUserData = {
            profile: {
              name,
              email,
              createdAt: new Date().toISOString()
            },
            preferences: {
              theme: 'light',
              gridSize: 4,
              appTitle: 'INVENTORY',
              customTheme: null,
              showValues: false,
              currency: 'USD'
            },
            sections: [
              { id: 'clothing', name: 'Clothing', createdAt: new Date().toISOString() },
              { id: 'skincare', name: 'Skincare', createdAt: new Date().toISOString() },
              { id: 'haircare', name: 'Haircare', createdAt: new Date().toISOString() }
            ],
            currentSectionId: 'clothing',
            items: []
          };

          return c.json({ userData: fallbackUserData });
        }
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
    
    return c.json({ error: 'Internal server error while fetching user data' }, 500);
  }
});

// Update user preferences
app.put('/make-server-550b27f4/user/preferences', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || error) {
      console.log(`Auth error while updating preferences: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { preferences } = await c.req.json();
    if (!preferences) {
      return c.json({ error: 'Preferences data required' }, 400);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.log(`No user data found for user ${user.id} during preferences update`);
      return c.json({ error: 'User data not found' }, 404);
    }

    userData.preferences = { ...userData.preferences, ...preferences };
    await kv.set(`user:${user.id}`, userData);

    return c.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.log(`Error updating user preferences: ${error}`);
    return c.json({ error: 'Internal server error while updating preferences' }, 500);
  }
});

// Add new item
app.post('/make-server-550b27f4/items', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || error) {
      console.log(`Auth error while adding item: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const itemData = await c.req.json();
    if (!itemData.title || !itemData.sectionId) {
      return c.json({ error: 'Title and sectionId are required' }, 400);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.log(`No user data found for user ${user.id} during item creation`);
      return c.json({ error: 'User data not found' }, 404);
    }

    const newItem = {
      ...itemData,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString()
    };

    userData.items = [...userData.items, newItem];
    await kv.set(`user:${user.id}`, userData);

    return c.json({ item: newItem });
  } catch (error) {
    console.log(`Error adding item: ${error}`);
    return c.json({ error: 'Internal server error while adding item' }, 500);
  }
});

// Update item
app.put('/make-server-550b27f4/items/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || error) {
      console.log(`Auth error while updating item: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const itemId = c.req.param('id');
    const updatedItemData = await c.req.json();

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.log(`No user data found for user ${user.id} during item update`);
      return c.json({ error: 'User data not found' }, 404);
    }

    const itemIndex = userData.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return c.json({ error: 'Item not found' }, 404);
    }

    userData.items[itemIndex] = {
      ...updatedItemData,
      id: itemId,
      dateAdded: userData.items[itemIndex].dateAdded
    };
    
    await kv.set(`user:${user.id}`, userData);

    return c.json({ item: userData.items[itemIndex] });
  } catch (error) {
    console.log(`Error updating item: ${error}`);
    return c.json({ error: 'Internal server error while updating item' }, 500);
  }
});

// Delete item
app.delete('/make-server-550b27f4/items/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || error) {
      console.log(`Auth error while deleting item: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const itemId = c.req.param('id');

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.log(`No user data found for user ${user.id} during item deletion`);
      return c.json({ error: 'User data not found' }, 404);
    }

    userData.items = userData.items.filter(item => item.id !== itemId);
    await kv.set(`user:${user.id}`, userData);

    return c.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.log(`Error deleting item: ${error}`);
    return c.json({ error: 'Internal server error while deleting item' }, 500);
  }
});

// Update items order (for drag and drop)
app.put('/make-server-550b27f4/items/reorder', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.error('No authorization token provided for reorder');
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || error) {
      console.error(`Auth error while reordering items: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { itemIds, sectionId } = await c.req.json();
    
    console.log(`=== Reorder Request ===`);
    console.log(`User ID: ${user.id}`);
    console.log(`Section ID: ${sectionId}`);
    console.log(`Item IDs: [${itemIds?.join(', ')}]`);
    console.log(`Request timestamp: ${new Date().toISOString()}`);
    
    // Validate input data
    if (!Array.isArray(itemIds) || !sectionId) {
      console.error('Invalid request data:', { 
        itemIds: typeof itemIds, 
        itemIdsArray: Array.isArray(itemIds),
        sectionId,
        itemIdsLength: itemIds?.length 
      });
      return c.json({ error: 'ItemIds array and sectionId are required' }, 400);
    }

    if (itemIds.length === 0) {
      console.error('Empty itemIds array provided');
      return c.json({ error: 'ItemIds array cannot be empty' }, 400);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.error(`No user data found for user ${user.id} during item reordering`);
      return c.json({ error: 'User data not found' }, 404);
    }

    console.log(`Found user data with ${userData.items?.length || 0} total items`);

    // Get all items for this user
    const allItems = userData.items || [];
    console.log(`All item IDs in database: [${allItems.map(i => i.id).join(', ')}]`);
    
    // Split items into the section being reordered and other sections
    const otherSectionItems = allItems.filter(item => item.sectionId !== sectionId);
    const sectionItems = allItems.filter(item => item.sectionId === sectionId);
    
    console.log(`Section '${sectionId}' items found: ${sectionItems.length}`);
    console.log(`Section item IDs: [${sectionItems.map(i => i.id).join(', ')}]`);
    console.log(`Other section items: ${otherSectionItems.length}`);
    
    // Check if the requested section exists
    if (sectionItems.length === 0 && itemIds.length > 0) {
      console.error(`No items found in section ${sectionId} but ${itemIds.length} items were requested to be reordered`);
      // Check if the items exist in other sections
      const missingItems = itemIds.filter(id => !allItems.some(item => item.id === id));
      const wrongSectionItems = itemIds.filter(id => allItems.some(item => item.id === id && item.sectionId !== sectionId));
      
      console.error(`Items not found in database: [${missingItems.join(', ')}]`);
      console.error(`Items in wrong section: [${wrongSectionItems.join(', ')}]`);
      
      if (missingItems.length > 0) {
        return c.json({ 
          error: 'Item not found',
          details: {
            missingItems,
            wrongSectionItems,
            requestedSection: sectionId,
            availableSections: [...new Set(allItems.map(item => item.sectionId))]
          }
        }, 404);
      }
    }
    
    // Create a map of existing items in this section for quick lookup
    const itemMap = new Map(sectionItems.map(item => [item.id, item]));
    console.log(`Item map keys: [${Array.from(itemMap.keys()).join(', ')}]`);
    
    // Validate that all requested items exist in this section
    const notFoundItems = [];
    for (const itemId of itemIds) {
      if (!itemMap.has(itemId)) {
        notFoundItems.push(itemId);
        console.warn(`Item ${itemId} not found in section ${sectionId}`);
      }
    }
    
    // If ANY items are not found, this is an error condition
    if (notFoundItems.length > 0) {
      console.error(`Items not found in section ${sectionId}: [${notFoundItems.join(', ')}]`);
      
      // Provide detailed error information
      const allItemsInSection = sectionItems.map(item => ({ id: item.id, title: item.title }));
      const allSectionsWithItems = {};
      for (const item of allItems) {
        if (!allSectionsWithItems[item.sectionId]) {
          allSectionsWithItems[item.sectionId] = [];
        }
        allSectionsWithItems[item.sectionId].push({ id: item.id, title: item.title });
      }
      
      return c.json({ 
        error: 'Item not found',
        details: {
          notFoundItems,
          requestedSection: sectionId,
          itemsInRequestedSection: allItemsInSection,
          allSectionsWithItems,
          totalItemsInDatabase: allItems.length
        }
      }, 404);
    }
    
    // Rebuild the section items in the new order (all items are guaranteed to exist)
    const reorderedSectionItems = itemIds.map(itemId => itemMap.get(itemId)!);
    
    console.log(`Successfully mapped all ${reorderedSectionItems.length} items for reordering`);
    
    // Add any items that weren't in the reorder list (safety net - this shouldn't happen)
    const missingFromOrder = sectionItems.filter(item => !itemIds.includes(item.id));
    if (missingFromOrder.length > 0) {
      console.log(`Adding ${missingFromOrder.length} items that weren't in reorder list:`);
      missingFromOrder.forEach(item => {
        console.log(`- ${item.id}: ${item.title}`);
        reorderedSectionItems.push(item);
      });
    }
    
    // Update the user data with the new order
    userData.items = [...otherSectionItems, ...reorderedSectionItems];
    
    console.log(`Preparing to save ${userData.items.length} total items to database...`);
    console.log(`Reordered section now has ${reorderedSectionItems.length} items`);
    
    await kv.set(`user:${user.id}`, userData);

    console.log(`✅ Successfully reordered ${reorderedSectionItems.length} items in section ${sectionId}`);
    console.log(`✅ Save completed at ${new Date().toISOString()}`);
    
    return c.json({ 
      message: 'Items reordered successfully',
      reorderedCount: reorderedSectionItems.length,
      totalItems: userData.items.length,
      sectionId: sectionId
    });
  } catch (error) {
    console.error(`❌ Error reordering items:`, error);
    console.error(`❌ Error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return c.json({ 
      error: `Internal server error while reordering items: ${error.message}`,
      details: {
        errorType: error.name,
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

// Add new section
app.post('/make-server-550b27f4/sections', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || error) {
      console.log(`Auth error while adding section: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name } = await c.req.json();
    if (!name) {
      return c.json({ error: 'Section name is required' }, 400);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.log(`No user data found for user ${user.id} during section creation`);
      return c.json({ error: 'User data not found' }, 404);
    }

    const newSection = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString()
    };

    userData.sections = [...userData.sections, newSection];
    await kv.set(`user:${user.id}`, userData);

    return c.json({ section: newSection });
  } catch (error) {
    console.log(`Error adding section: ${error}`);
    return c.json({ error: 'Internal server error while adding section' }, 500);
  }
});

// Update section
app.put('/make-server-550b27f4/sections/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || error) {
      console.log(`Auth error while updating section: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sectionId = c.req.param('id');
    const { name } = await c.req.json();
    
    if (!name) {
      return c.json({ error: 'Section name is required' }, 400);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.log(`No user data found for user ${user.id} during section update`);
      return c.json({ error: 'User data not found' }, 404);
    }

    const sectionIndex = userData.sections.findIndex(section => section.id === sectionId);
    if (sectionIndex === -1) {
      return c.json({ error: 'Section not found' }, 404);
    }

    userData.sections[sectionIndex].name = name;
    await kv.set(`user:${user.id}`, userData);

    return c.json({ section: userData.sections[sectionIndex] });
  } catch (error) {
    console.log(`Error updating section: ${error}`);
    return c.json({ error: 'Internal server error while updating section' }, 500);
  }
});

// Delete section
app.delete('/make-server-550b27f4/sections/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || error) {
      console.log(`Auth error while deleting section: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sectionId = c.req.param('id');

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.log(`No user data found for user ${user.id} during section deletion`);
      return c.json({ error: 'User data not found' }, 404);
    }

    if (userData.sections.length <= 1) {
      return c.json({ error: 'Cannot delete the last section' }, 400);
    }

    // Move items from deleted section to first remaining section
    const remainingSection = userData.sections.find(s => s.id !== sectionId);
    if (remainingSection) {
      userData.items = userData.items.map(item => 
        item.sectionId === sectionId ? { ...item, sectionId: remainingSection.id } : item
      );
      
      // Update current section if it's being deleted
      if (userData.currentSectionId === sectionId) {
        userData.currentSectionId = remainingSection.id;
      }
    }

    userData.sections = userData.sections.filter(section => section.id !== sectionId);
    await kv.set(`user:${user.id}`, userData);

    return c.json({ 
      message: 'Section deleted successfully',
      newCurrentSectionId: userData.currentSectionId
    });
  } catch (error) {
    console.log(`Error deleting section: ${error}`);
    return c.json({ error: 'Internal server error while deleting section' }, 500);
  }
});

// Update current section
app.put('/make-server-550b27f4/user/current-section', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || error) {
      console.log(`Auth error while updating current section: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { currentSectionId } = await c.req.json();
    if (!currentSectionId) {
      return c.json({ error: 'Current section ID is required' }, 400);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.log(`No user data found for user ${user.id} during current section update`);
      return c.json({ error: 'User data not found' }, 404);
    }

    userData.currentSectionId = currentSectionId;
    await kv.set(`user:${user.id}`, userData);

    return c.json({ message: 'Current section updated successfully' });
  } catch (error) {
    console.log(`Error updating current section: ${error}`);
    return c.json({ error: 'Internal server error while updating current section' }, 500);
  }
});

// Health check endpoint
app.get('/make-server-550b27f4/health', (c) => {
  return c.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Create share token (requires authentication)
app.post('/make-server-550b27f4/share/create', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!user || error) {
      console.log(`Auth error while creating share: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { sectionId } = await c.req.json();
    if (!sectionId) {
      return c.json({ error: 'Section ID is required' }, 400);
    }

    // Get user data to validate section exists
    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.log(`No user data found for user ${user.id} during share creation`);
      return c.json({ error: 'User data not found' }, 404);
    }

    // Validate the section exists
    const section = userData.sections.find(s => s.id === sectionId);
    if (!section) {
      return c.json({ error: 'Section not found' }, 404);
    }

    // Generate unique share token
    const shareToken = `${user.id}_${sectionId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Store share data
    const shareData = {
      userId: user.id,
      sectionId: sectionId,
      sectionName: section.name,
      userProfile: {
        name: userData.profile.name,
        appTitle: userData.preferences.appTitle || 'INVENTORY'
      },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    await kv.set(`share:${shareToken}`, shareData);
    console.log(`Created share token for user ${user.id}, section ${sectionId}: ${shareToken}`);

    return c.json({ shareToken });
  } catch (error) {
    console.log(`Error creating share token: ${error}`);
    return c.json({ error: 'Internal server error while creating share' }, 500);
  }
});

// Get shared inventory data (public endpoint, no auth required)
app.get('/make-server-550b27f4/share/:token', async (c) => {
  try {
    const shareToken = c.req.param('token');
    if (!shareToken) {
      return c.json({ error: 'Share token is required' }, 400);
    }

    // Get share data
    const shareData = await kv.get(`share:${shareToken}`);
    if (!shareData) {
      return c.json({ error: 'Share not found or expired' }, 404);
    }

    // Check if share has expired
    if (new Date() > new Date(shareData.expiresAt)) {
      console.log(`Share token expired: ${shareToken}`);
      // Optionally clean up expired share
      await kv.del(`share:${shareToken}`);
      return c.json({ error: 'Share has expired' }, 404);
    }

    // Get the user's data
    const userData = await kv.get(`user:${shareData.userId}`);
    if (!userData) {
      console.log(`User data not found for shared token ${shareToken}`);
      return c.json({ error: 'Shared user data not found' }, 404);
    }

    // Validate the section still exists
    const section = userData.sections.find(s => s.id === shareData.sectionId);
    if (!section) {
      console.log(`Section ${shareData.sectionId} no longer exists for share ${shareToken}`);
      return c.json({ error: 'Shared section no longer exists' }, 404);
    }

    // Filter items to only include items from the shared section
    const sectionItems = userData.items.filter(item => item.sectionId === shareData.sectionId);
    
    // Prepare safe share response (don't expose sensitive user data)
    const shareResponse = {
      section: {
        id: section.id,
        name: section.name
      },
      items: sectionItems,
      userProfile: {
        name: shareData.userProfile.name,
        appTitle: shareData.userProfile.appTitle
      },
      sharedAt: shareData.createdAt
    };

    console.log(`Served shared data for token ${shareToken}: ${sectionItems.length} items from section '${section.name}'`);

    return c.json({ shareData: shareResponse });
  } catch (error) {
    console.log(`Error retrieving shared data: ${error}`);
    return c.json({ error: 'Internal server error while retrieving share' }, 500);
  }
});

// Get shared inventory as standalone HTML (public endpoint, no auth required)
app.get('/make-server-550b27f4/share/:token/html', async (c) => {
  try {
    const shareToken = c.req.param('token');
    if (!shareToken) {
      return c.html('<html><body><h1>Error: Share token is required</h1></body></html>', 400);
    }

    // Get share data - NO AUTHENTICATION REQUIRED FOR PUBLIC HTML EXPORT
    const shareData = await kv.get(`share:${shareToken}`);
    if (!shareData) {
      return c.html(`
        <html>
          <head><title>Page Not Found</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #ffffff; color: #000000;">
            <div style="max-width: 600px; margin: 0 auto; text-align: center;">
              <h1 style="color: #dc2626;">Page Not Found</h1>
              <p style="color: #6b7280;">This link is invalid or has expired.</p>
            </div>
          </body>
        </html>
      `, 404);
    }

    // Check if share has expired
    if (new Date() > new Date(shareData.expiresAt)) {
      console.log(`Share token expired: ${shareToken}`);
      await kv.del(`share:${shareToken}`);
      return c.html(`
        <html>
          <head><title>Page Expired</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #ffffff; color: #000000;">
            <div style="max-width: 600px; margin: 0 auto; text-align: center;">
              <h1 style="color: #dc2626;">Page Expired</h1>
              <p style="color: #6b7280;">This link has expired. Please ask for a new one.</p>
            </div>
          </body>
        </html>
      `, 404);
    }

    // Get the user's data - NO AUTHENTICATION REQUIRED FOR PUBLIC HTML EXPORT
    const userData = await kv.get(`user:${shareData.userId}`);
    if (!userData) {
      console.log(`User data not found for shared token ${shareToken}`);
      return c.html(`
        <html>
          <head><title>Data Not Found</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #ffffff; color: #000000;">
            <div style="max-width: 600px; margin: 0 auto; text-align: center;">
              <h1 style="color: #dc2626;">Data Not Found</h1>
              <p style="color: #6b7280;">The requested data could not be found.</p>
            </div>
          </body>
        </html>
      `, 404);
    }

    // Validate the section still exists
    const section = userData.sections.find(s => s.id === shareData.sectionId);
    if (!section) {
      console.log(`Section ${shareData.sectionId} no longer exists for share ${shareToken}`);
      return c.html(`
        <html>
          <head><title>Section Not Found</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #ffffff; color: #000000;">
            <div style="max-width: 600px; margin: 0 auto; text-align: center;">
              <h1 style="color: #dc2626;">Section Not Found</h1>
              <p style="color: #6b7280;">The requested section no longer exists.</p>
            </div>
          </body>
        </html>
      `, 404);
    }

    // Filter items to only include items from the shared section
    const sectionItems = userData.items.filter(item => item.sectionId === shareData.sectionId);
    
    // Generate HTML content
    const generateItemCard = (item: any) => {
      const formatDate = (dateString: string) => {
        try {
          return new Date(dateString).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
        } catch {
          return 'Unknown date';
        }
      };

      return `
        <div style="
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          height: fit-content;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
          <div style="
            aspect-ratio: 1;
            background: #f8f9fa;
            overflow: hidden;
            position: relative;
          ">
            <img 
              src="${item.image}" 
              alt="${item.title}"
              style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
              "
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            />
            <div style="
              position: absolute;
              inset: 0;
              display: none;
              align-items: center;
              justify-content: center;
              background: #f8f9fa;
              color: #6c757d;
              font-size: 14px;
            ">
              No Image
            </div>
          </div>
          <div style="padding: 16px;">
            <h3 style="
              margin: 0 0 8px 0;
              font-size: 16px;
              font-weight: 500;
              line-height: 1.4;
              color: #000000;
            ">${item.title}</h3>
            ${item.description ? `
              <p style="
                margin: 0 0 12px 0;
                font-size: 14px;
                color: #6c757d;
                line-height: 1.5;
              ">${item.description}</p>
            ` : ''}
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 12px;
              color: #6c757d;
            ">
              <span style="
                background: #f8f9fa;
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: 500;
              ">${item.category}</span>
              <span>Added ${formatDate(item.dateAdded)}</span>
            </div>
          </div>
        </div>
      `;
    };

    const itemsHTML = sectionItems.length > 0 
      ? sectionItems.map(generateItemCard).join('')
      : `
        <div style="
          grid-column: 1 / -1;
          text-align: center;
          padding: 80px 20px;
          color: #6c757d;
        ">
          <h3 style="margin: 0 0 8px 0; font-size: 18px;">No items found</h3>
          <p style="margin: 0; font-size: 14px;">This collection doesn't contain any items yet.</p>
        </div>
      `;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${shareData.userProfile.appTitle}</title>
  <style>
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      line-height: 1.5;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 48px;
    }
    
    .title {
      font-size: 36px;
      font-weight: 500;
      letter-spacing: 0.025em;
      margin: 0;
      color: #000000;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
      margin-top: 32px;
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 24px 16px;
      }
      
      .title {
        font-size: 28px;
      }
      
      .grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
      }
    }
    
    @media (max-width: 480px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1 class="title">${shareData.userProfile.appTitle}</h1>
    </header>
    
    <main>
      <div class="grid">
        ${itemsHTML}
      </div>
    </main>
  </div>
</body>
</html>
    `;

    console.log(`Generated HTML page: ${sectionItems.length} items from "${shareData.userProfile.appTitle}"`);

    return c.html(html);
  } catch (error) {
    console.log(`Error generating HTML page: ${error}`);
    return c.html(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #ffffff; color: #000000;">
          <div style="max-width: 600px; margin: 0 auto; text-align: center;">
            <h1 style="color: #dc2626;">Error</h1>
            <p style="color: #6b7280;">An error occurred while loading the page.</p>
          </div>
        </body>
      </html>
    `, 500);
  }
});

Deno.serve(app.fetch);