'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Search, Users, Lock } from 'lucide-react';
import { BsEyeSlash, BsEye,BsArrowRepeat,BsBarChartLine,BsPeople } from 'react-icons/bs';
import { authService } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authService.login({ email, password });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Section */}
      <div className="flex-1 bg-gradient-to-br from-teal-600 to-teal-800 text-white p-12 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-16">
            <div className="w-8 h-8 bg-orange-500 rounded"></div>
            <span className="text-xl font-semibold">Kifiya</span>
          </div>
          
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Agentic HR Survey<br />
                Platform
              </h1>
              <p className="text-teal-100 text-lg mb-12 max-w-md">
                Data-driven decisions start with understanding your people.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <BsArrowRepeat className="h-6 w-6 text-orange-400" />
                <span className="text-teal-100">Turn Feedback into Action.</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <BsBarChartLine className="h-6 w-6 text-orange-400" />
                <span className="text-teal-100">See What Drives Engagement at Every Level.</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <BsPeople className="h-6 w-6 text-orange-400" />
                <span className="text-teal-100">No more guesswork — get clear, visual insights into morale, satisfaction, and workplace culture</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 bg-white flex items-center justify-center p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Sign in to AHRS</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={checked => setRememberMe(checked === true)}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600">
                  Remember me
                </Label>
              </div>
              <Link href="/auth/forgot-password" className="text-sm text-orange-500 hover:text-orange-600">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : 'Login'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="h-12 border-gray-300 hover:bg-gray-50">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="ml-2 text-sm">Google</span>
              </Button>
              
              <Button variant="outline" className="h-12 border-gray-300 hover:bg-gray-50">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M23.5 12.2c0-1.4-.1-2.7-.3-4H12.2v7.5h6.4c-.3 1.5-1.1 2.8-2.4 3.8v3.1h3.9c2.3-2.1 3.6-5.2 3.6-8.9z"/>
                  <path fill="currentColor" d="M12.2 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3.1c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.7v3.1C3.8 21.9 7.7 24 12.2 24z"/>
                  <path fill="currentColor" d="M5.6 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V6.7H1.7C.6 8.9 0 10.4 0 12s.6 3.1 1.7 5.3l3.9-3.1z"/>
                  <path fill="currentColor" d="M12.2 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C18.1 1.2 15.4 0 12.2 0 7.7 0 3.8 2.1 1.7 5.3l3.9 3.1c.9-2.8 3.5-4.9 6.6-4.9z"/>
                </svg>
                <span className="ml-2 text-sm">Microsoft</span>
              </Button>
              
              <Button variant="outline" className="h-12 border-gray-300 hover:bg-gray-50">
                <div className="w-5 h-5 bg-blue-600 rounded-sm flex items-center justify-center">
                  <span className="text-white text-xs font-bold">N</span>
                </div>
                <span className="ml-2 text-sm">NationalID</span>
              </Button>
            </div>

            <div className="text-center">
              <span className="text-gray-600">New to Kifiya? </span>
              <Link href="/auth/register" className="text-orange-500 hover:text-orange-600 font-medium">
                Create an account
              </Link>
            </div>

            <div className="text-center text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-orange-500 hover:text-orange-600">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-orange-500 hover:text-orange-600">
                Privacy Policy
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}