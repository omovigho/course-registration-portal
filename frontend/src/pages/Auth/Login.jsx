import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { isValidEmail } from '../../utils/validators.js';
import { getRoleHomePath } from '../../utils/routes.js';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  const [formState, setFormState] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formState.email) {
      nextErrors.email = 'Email is required';
    } else if (!isValidEmail(formState.email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!formState.password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      const account = await login(formState);
      addToast({
        title: 'Login successful',
        description: 'Welcome back to the course portal!',
        variant: 'success'
      });
      const nextPath = getRoleHomePath(account?.role);
      navigate(nextPath, { replace: true });
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to sign you in. Please verify your details.';
      addToast({ title: 'Login failed', description: detail, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-text">Sign In</h1>
      <p className="mt-1 text-sm text-slate-600">Access your personalised UNIBEN course workspace.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          value={formState.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={formState.password}
          onChange={handleChange}
          error={errors.password}
          required
        />

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        New to the portal?{' '}
        <Link to="/signup" className="font-medium text-brand-primary hover:text-brand-accent">
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default Login;
