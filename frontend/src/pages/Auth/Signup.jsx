import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { isValidEmail, isStrongPassword } from '../../utils/validators.js';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { addToast } = useToast();

  const [formState, setFormState] = useState({
    full_name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formState.full_name) {
      nextErrors.full_name = 'Full name is required';
    }
    if (!formState.email) {
      nextErrors.email = 'Email is required';
    } else if (!isValidEmail(formState.email)) {
      nextErrors.email = 'Enter a valid email address';
    }
    if (!formState.password) {
      nextErrors.password = 'Password is required';
    } else if (!isStrongPassword(formState.password)) {
      nextErrors.password = 'Use at least 8 characters with letters and numbers';
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
      await signup(formState);
      addToast({
        title: 'Account created',
        description: 'You can now sign in with your new credentials.',
        variant: 'success'
      });
      navigate('/login');
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to create your account right now.';
      addToast({ title: 'Signup failed', description: detail, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-text">Create an account</h1>
      <p className="mt-1 text-sm text-slate-600">Join the UNIBEN Course Management Portal.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <Input
          label="Full name"
          name="full_name"
          value={formState.full_name}
          onChange={handleChange}
          error={errors.full_name}
          autoComplete="name"
          required
        />

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
          autoComplete="new-password"
          value={formState.password}
          onChange={handleChange}
          helperText="Minimum 8 characters with letters and numbers"
          error={errors.password}
          required
        />

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </Button>

        <p className="text-xs text-slate-500">
          Roles such as student or lecturer are assigned after account creation by completing onboarding or by an
          administrator.
        </p>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-primary hover:text-brand-accent">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Signup;
