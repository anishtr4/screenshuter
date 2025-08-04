import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Eye, EyeOff, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/api';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting signup with:', { 
        name: formData.name, 
        email: formData.email 
      });
      
      const response = await apiClient.register(formData.email, formData.password, formData.name);

      console.log('Signup response:', response);

      if (response.token) {
        // Store token in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Hero section */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <div className="flex flex-col justify-center px-12 py-24">
            <div className="flex items-center mb-8">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Thundershot
              </span>
            </div>
            
            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Join the Future of
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> Screenshot Management</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Create an account to start capturing, organizing, and sharing your screenshots with powerful automation tools.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></div>
                <span>Automated screenshot capture</span>
              </div>
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                <span>Smart organization & collections</span>
              </div>
              <div className="flex items-center text-gray-300">
                <div className="w-2 h-2 bg-pink-400 rounded-full mr-3"></div>
                <span>Team collaboration features</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Signup form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Thundershot
              </h2>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Create Account</h3>
                <p className="text-gray-300">Join thousands of users managing screenshots efficiently</p>
              </div>
        
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg backdrop-blur-sm">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 backdrop-blur-sm transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 backdrop-blur-sm transition-all"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 backdrop-blur-sm transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-400 backdrop-blur-sm transition-all"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
              
              <p className="mt-6 text-center text-sm text-gray-300">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
