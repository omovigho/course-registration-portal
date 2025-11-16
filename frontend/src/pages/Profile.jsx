import React, { useEffect, useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import api from '../api/api.js';
import { useToast } from '../components/ui/Toast.jsx';
import { useAuth } from '../hooks/useAuth.js';

const Profile = () => {
  const { user, updateStoredUser, refreshSession } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState({
    full_name: '',
    phone_number: '',
    bio: ''
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name ?? '',
        phone_number: user.phone_number ?? '',
        bio: user.bio ?? ''
      });
    }
  }, [user]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/users/me');
        setProfile({
          full_name: data.full_name ?? '',
          phone_number: data.phone_number ?? '',
          bio: data.bio ?? ''
        });
        updateStoredUser(data);
      } catch (error) {
        console.warn('Unable to refresh profile, continuing with cached data', error);
      }
    };

    loadProfile();
  }, [updateStoredUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (event) => {
    event?.preventDefault();

    try {
      setSaving(true);
      const { data } = await api.put('/users/me', profile);
      updateStoredUser(data);
      addToast({ title: 'Profile updated', variant: 'success' });
    } catch (error) {
      const detail = error.response?.data?.detail ?? 'Unable to update your profile.';
      addToast({ title: 'Update failed', description: detail, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setPendingAvatar(file);
    setShowConfirmModal(true);
  };

  const uploadAvatar = async () => {
    if (!pendingAvatar) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', pendingAvatar);
      const { data } = await api.put('/users/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateStoredUser(data);
      await refreshSession().catch(() => {});
      addToast({ title: 'Avatar updated', variant: 'success' });
    } catch (error) {
      if (error.response?.status === 404) {
        await uploadAvatarFallback(pendingAvatar);
      } else {
        const detail = error.response?.data?.detail ?? 'Avatar upload failed.';
        addToast({ title: 'Upload failed', description: detail, variant: 'error' });
      }
    } finally {
      setPendingAvatar(null);
      setShowConfirmModal(false);
    }
  };

  const uploadAvatarFallback = async (file) => {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const { data } = await api.put('/users/me', { avatar_url: dataUrl });
      updateStoredUser(data);
      addToast({ title: 'Avatar updated', description: 'Fallback upload completed.', variant: 'success' });
    } catch (fallbackError) {
      const detail = fallbackError.response?.data?.detail ?? 'Unable to update avatar with fallback method.';
      addToast({ title: 'Upload failed', description: detail, variant: 'error' });
    }
  };

  return (
    <section className="space-y-8">
      <div className="card flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={user?.avatar_url} name={user?.full_name ?? user?.email} size="lg" />
          <div>
            <p className="text-xl font-semibold text-brand-text">{user?.full_name ?? user?.email}</p>
            <p className="text-sm text-slate-600">{user?.email}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">{user?.role}</p>
          </div>
        </div>
        <div>
          <label
            htmlFor="avatar-upload"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-indigo-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5l4.5-4.5 4.5 4.5 7.5-7.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5h15" />
            </svg>
            Update avatar
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileChange}
          />
        </div>
      </div>

      <form className="card space-y-4" onSubmit={handleSaveProfile}>
        <h2 className="text-lg font-semibold text-brand-text">Personal information</h2>
        <Input
          label="Full name"
          name="full_name"
          value={profile.full_name}
          onChange={handleChange}
        />
        <Input
          label="Phone number"
          name="phone_number"
          value={profile.phone_number}
          onChange={handleChange}
          helperText="Include country code"
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="bio" className="text-sm font-medium text-slate-700">
            Short bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-brand-text shadow-sm focus:border-brand-primary focus:ring-4 focus:ring-indigo-100"
            placeholder="Share a short note about your academic interests"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>

      <Modal
        open={showConfirmModal}
        title="Upload new avatar"
        description="We will replace your current photo with the selected image."
        onClose={() => {
          setShowConfirmModal(false);
          setPendingAvatar(null);
        }}
        onConfirm={uploadAvatar}
        confirmText="Upload"
      />
    </section>
  );
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

export default Profile;
