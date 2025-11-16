import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../Avatar.jsx';
import Button from '../ui/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { getRoleHomePath } from '../../utils/routes.js';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const homePath = user ? getRoleHomePath(user.role) : '/';

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-brand-primary text-white shadow-md">
      <div className="main-container flex items-center justify-between py-3">
        <Link to={homePath} className="flex items-center gap-3" aria-label="Return to home">
          <img src="/images/logo.jpg" alt="University of Benin logo" className="h-10 w-10 rounded-full object-cover" />
          <div className="leading-tight">
            <p className="text-lg font-semibold">University of Benin</p>
            <p className="text-xs text-indigo-200">Course Management Portal</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight">{user.full_name ?? user.email}</p>
                <p className="text-xs text-indigo-200">{user.role?.toUpperCase?.() ?? 'USER'}</p>
              </div>
              <Avatar name={user.full_name ?? user.email} src={user.avatar_url} />
              <Button variant="secondary" onClick={handleSignOut} aria-label="Sign out">
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="secondary">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Create account</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
