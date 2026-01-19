import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hexagon, Wrench } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        companyName: formData.companyName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest bg-glow-spotlight py-12 px-4">
      {/* Circuitry background overlay */}
      <div className="fixed inset-0 bg-circuitry bg-parallax-slow pointer-events-none opacity-50" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 relative mb-4">
            <Hexagon className="w-16 h-16 text-viridian animate-pulse-glow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Wrench className="w-8 h-8 text-forest" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-viridian font-orbitron glow-viridian-text">MAINT HUB</h1>
          <p className="mt-2 text-viridian/60">Property Management Platform</p>
        </div>

        <div className="card-holo">
          <h2 className="text-xl font-semibold mb-6 text-viridian font-orbitron">Register your company</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-viridian/80 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-viridian/80 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-viridian/80 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-viridian/80 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-viridian/80 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-viridian/80 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-2.5"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-viridian/60">
            Already have an account?{' '}
            <Link to="/login" className="text-viridian hover:text-viridian/80 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
