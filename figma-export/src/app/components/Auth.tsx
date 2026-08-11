import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { signUp, signIn, SignupData, SigninData } from '../utils/api';

interface AuthProps {
  onAuthSuccess: () => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Sign up flow - this will also authenticate the user
        if (!name.trim()) {
          throw new Error('Name is required');
        }
        
        const signupData: SignupData = { email, password, name: name.trim() };
        await signUp(signupData);
        
        // No need to manually sign in - signUp already authenticates the user
        onAuthSuccess();
      } else {
        // Sign in flow
        const signinData: SigninData = { email, password };
        await signIn(signinData);
        onAuthSuccess();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-fg)' }}>
      <Card className="w-full max-w-md p-6"
            style={{ 
              backgroundColor: 'var(--theme-bg)', 
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-fg)'
            }}>
        <div className="text-center mb-6">
          <h1 className="text-2xl tracking-wide mb-2" style={{ color: 'var(--theme-fg)' }}>
            INVENTORY
          </h1>
          <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name" style={{ color: 'var(--theme-fg)' }}>
                Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required={isSignUp}
                disabled={isLoading}
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-fg)'
                }}
                className="transition-colors duration-300"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" style={{ color: 'var(--theme-fg)' }}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
              style={{
                backgroundColor: 'var(--theme-accent)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-fg)'
              }}
              className="transition-colors duration-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" style={{ color: 'var(--theme-fg)' }}>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              minLength={6}
              style={{
                backgroundColor: 'var(--theme-accent)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-fg)'
              }}
              className="transition-colors duration-300"
            />
          </div>

          {error && (
            <div className="p-3 rounded-md" 
                 style={{ 
                   backgroundColor: 'rgba(212, 24, 61, 0.1)', 
                   borderColor: '#d4183d',
                   color: '#d4183d',
                   border: '1px solid'
                 }}>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full transition-all duration-300"
            disabled={isLoading}
            style={{
              backgroundColor: 'var(--theme-fg)',
              color: 'var(--theme-bg)',
              borderColor: 'var(--theme-fg)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--theme-fg)';
                e.currentTarget.style.borderColor = 'var(--theme-fg)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'var(--theme-fg)';
                e.currentTarget.style.color = 'var(--theme-bg)';
                e.currentTarget.style.borderColor = 'var(--theme-fg)';
              }
            }}
          >
            {isLoading 
              ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
              : (isSignUp ? 'Create Account' : 'Sign In')
            }
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--theme-muted)' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              disabled={isLoading}
              className="underline hover:no-underline transition-all duration-300"
              style={{ color: 'var(--theme-fg)' }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}