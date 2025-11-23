import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { adminSignInSchema } from '../utils/validators';
import type { AdminSignInFormData } from '../utils/validators';
import { Lock, Mail } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminSignInFormData>({
    resolver: zodResolver(adminSignInSchema),
  });

  const onSubmit = async (data: AdminSignInFormData) => {
    try {
      setIsLoading(true);
      setError('');
      await login(data);
      navigate('/');
    } catch (err: unknown) {
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Check for network errors
        if (err.message.includes('Cannot connect to backend') || 
            err.message.includes('ECONNREFUSED') ||
            err.message.includes('Network Error')) {
          errorMessage = `Cannot connect to backend server at ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}. Please ensure the backend is running.`;
        }
      } else if (err && typeof err === 'object' && 'isNetworkError' in err && 'message' in err) {
        errorMessage = typeof (err as { message: unknown }).message === 'string' 
          ? (err as { message: string }).message 
          : errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Penniwyse Admin
            </h1>
            <p className="text-gray-600">Sign in to access the admin dashboard</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                label="Email"
                type="email"
                placeholder="admin@taxable.com"
                error={errors.email?.message}
                {...register('email')}
                icon={<Mail className="w-5 h-5" />}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register('password')}
                icon={<Lock className="w-5 h-5" />}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

