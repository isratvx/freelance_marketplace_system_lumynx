import { useEffect, useMemo, useState } from 'react';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    skills: '',
    experience: '',
    portfolio_url: ''
  });

  const token = localStorage.getItem('token');

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        'http://localhost:5000/api/auth/profile',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Failed to load profile'
        );
      }

      setProfile(data.user);

      setFormData({
        full_name: data.user.full_name || '',
        bio: data.user.bio || '',
        skills: data.user.skills || '',
        experience: data.user.experience || '',
        portfolio_url: data.user.portfolio_url || ''
      });
    } catch (err) {
      alert(`Error loading profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [token]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please choose a JPG, PNG or WEBP image.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Profile picture must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadProfilePicture = async () => {
    if (!selectedImage) {
      return profile?.profile_picture || null;
    }

    const imageFormData = new FormData();

    imageFormData.append(
      'profile_picture',
      selectedImage
    );

    const res = await fetch(
      'http://localhost:5000/api/auth/profile-picture',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: imageFormData
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.message ||
          'Failed to upload profile picture'
      );
    }

    return data.profile_picture;
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const updatedPicture =
        await uploadProfilePicture();

      const res = await fetch(
        'http://localhost:5000/api/auth/profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            full_name: formData.full_name,
            bio: formData.bio,
            skills:
              profile.role === 'freelancer'
                ? formData.skills
                : '',
            experience:
              profile.role === 'freelancer'
                ? formData.experience
                : '',
            portfolio_url:
              profile.role === 'freelancer'
                ? formData.portfolio_url
                : ''
          })
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || 'Failed to update profile'
        );
      }

      const storedUser = JSON.parse(
        localStorage.getItem('user') || 'null'
      );

      if (storedUser) {
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...storedUser,
            full_name: formData.full_name,
            profile_picture: updatedPicture
          })
        );

        window.dispatchEvent(
          new Event('auth-change')
        );
      }

      setSelectedImage(null);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }

      setEditing(false);

      await fetchProfile();

      alert('Profile updated successfully');
    } catch (err) {
      alert(
        `Error updating profile: ${err.message}`
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    setSelectedImage(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }

    setFormData({
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      skills: profile?.skills || '',
      experience: profile?.experience || '',
      portfolio_url: profile?.portfolio_url || ''
    });
  };

  const formatRole = (role) => {
    if (!role) {
      return 'Client';
    }

    return (
      role.charAt(0).toUpperCase() +
      role.slice(1)
    );
  };

  const isFreelancer =
    profile?.role === 'freelancer';

  const profileInitial =
    profile?.full_name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || 'U';

  const skillsList = profile?.skills
    ? profile.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)
    : [];

  const profileImageUrl = useMemo(() => {
    if (previewUrl) {
      return previewUrl;
    }

    if (!profile?.profile_picture) {
      return '';
    }

    if (
      profile.profile_picture.startsWith('http://') ||
      profile.profile_picture.startsWith('https://')
    ) {
      return profile.profile_picture;
    }

    return `http://localhost:5000${profile.profile_picture}`;
  }, [previewUrl, profile?.profile_picture]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-purple-400/30 border-t-fuchsia-400" />

          <p className="text-[#a995b8]">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="lumynx-container">
        <div className="glass-panel p-8 text-center">
          <p className="text-rose-300">
            Please log in first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lumynx-container">
      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.26em] text-purple-300">
          Account
        </p>

        <h1 className="neon-title text-3xl font-black">
          My Profile
        </h1>

        <p className="mt-2 text-sm text-[#a995b8]">
          {isFreelancer
            ? 'Manage your personal and professional information.'
            : 'Manage your personal account information.'}
        </p>
      </div>

      {!editing ? (
        <div className="glass-panel overflow-hidden">

          {/* PROFILE HEADER */}
          <div className="relative border-b border-white/10 p-7 md:p-9">
            <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-purple-600/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">

              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={`${profile.full_name || 'User'} profile`}
                  className="h-28 w-28 flex-shrink-0 rounded-full border border-purple-300/25 object-cover shadow-[0_0_35px_rgba(168,85,247,0.3)]"
                />
              ) : (
                <div className="grid h-28 w-28 flex-shrink-0 place-items-center rounded-full border border-purple-300/25 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 text-4xl font-black text-white shadow-[0_0_35px_rgba(168,85,247,0.3)]">
                  {profileInitial}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-white">
                  {profile.full_name || 'User'}
                </h2>

                <p className="mt-1 break-all text-[#a995b8]">
                  {profile.email || 'No email'}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="status-lumynx border-purple-400/25 bg-purple-500/10 text-purple-200">
                    {formatRole(profile.role)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditing(true)}
                className="btn-neon sm:ml-auto"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* PROFILE INFORMATION */}
          <div className="grid gap-5 p-7 md:grid-cols-2 md:p-9">

            {/* BIO - BOTH CLIENT & FREELANCER */}
            <section
              className={`glass-card p-5 ${
                !isFreelancer ? 'md:col-span-2' : ''
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-300">
                About
              </p>

              <h3 className="mt-3 text-lg font-bold">
                Bio
              </h3>

              <p className="mt-2 whitespace-pre-wrap leading-7 text-[#bba9c7]">
                {profile.bio || 'Not added yet'}
              </p>
            </section>

            {/* FREELANCER ONLY */}
            {isFreelancer && (
              <>
                <section className="glass-card p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300">
                    Expertise
                  </p>

                  <h3 className="mt-3 text-lg font-bold">
                    Skills
                  </h3>

                  {skillsList.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {skillsList.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-sm text-purple-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[#bba9c7]">
                      Not added yet
                    </p>
                  )}
                </section>

                <section className="glass-card p-5 md:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                    Professional Background
                  </p>

                  <h3 className="mt-3 text-lg font-bold">
                    Experience
                  </h3>

                  <p className="mt-2 whitespace-pre-wrap leading-7 text-[#bba9c7]">
                    {profile.experience || 'Not added yet'}
                  </p>
                </section>

                <section className="glass-card p-5 md:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-300">
                    Work Samples
                  </p>

                  <h3 className="mt-3 text-lg font-bold">
                    Portfolio
                  </h3>

                  {profile.portfolio_url ? (
                    <a
                      href={profile.portfolio_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex break-all font-semibold text-purple-300 transition hover:text-fuchsia-300"
                    >
                      {profile.portfolio_url}
                    </a>
                  ) : (
                    <p className="mt-2 text-[#bba9c7]">
                      Not added yet
                    </p>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      ) : (

        /* EDIT PROFILE */

        <form
          onSubmit={handleUpdate}
          className="glass-panel p-7 md:p-9"
        >
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
              Edit Information
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              Update Profile
            </h2>
          </div>

          {/* PROFILE PICTURE */}
          <div className="mb-7 flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:flex-row sm:items-center">

            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Profile preview"
                className="h-24 w-24 flex-shrink-0 rounded-full border border-purple-300/25 object-cover shadow-[0_0_28px_rgba(168,85,247,0.25)]"
              />
            ) : (
              <div className="grid h-24 w-24 flex-shrink-0 place-items-center rounded-full border border-purple-300/25 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 text-3xl font-black text-white">
                {profileInitial}
              </div>
            )}

            <div>
              <p className="font-bold text-white">
                Profile Picture
              </p>

              <p className="mt-1 text-sm text-[#a995b8]">
                JPG, PNG or WEBP. Maximum size 5 MB.
              </p>

              <label className="btn-ghost mt-3 inline-flex cursor-pointer">
                Choose Image

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {selectedImage && (
                <p className="mt-2 text-xs text-purple-300">
                  Selected: {selectedImage.name}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-5">

            {/* NAME - EVERYONE */}
            <div>
              <label
                htmlFor="full_name"
                className="mb-2 block text-sm font-semibold text-[#ded1ea]"
              >
                Full Name
              </label>

              <input
                id="full_name"
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="input-lumynx"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* BIO - EVERYONE */}
            <div>
              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-semibold text-[#ded1ea]"
              >
                Bio
              </label>

              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="input-lumynx min-h-[110px] resize-y"
                rows="3"
                placeholder={
                  isFreelancer
                    ? 'Write a short description about yourself'
                    : 'Write a short description about yourself or your business'
                }
              />
            </div>

            {/* FREELANCER EDITING FIELDS */}
            {isFreelancer && (
              <>
                <div>
                  <label
                    htmlFor="skills"
                    className="mb-2 block text-sm font-semibold text-[#ded1ea]"
                  >
                    Skills
                  </label>

                  <input
                    id="skills"
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    className="input-lumynx"
                    placeholder="React, Node.js, MySQL"
                  />

                  <p className="mt-2 text-xs text-[#806f8d]">
                    Separate multiple skills using commas.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="experience"
                    className="mb-2 block text-sm font-semibold text-[#ded1ea]"
                  >
                    Experience
                  </label>

                  <textarea
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="input-lumynx min-h-[140px] resize-y"
                    rows="4"
                    placeholder="Describe your work history and experience"
                  />
                </div>

                <div>
                  <label
                    htmlFor="portfolio_url"
                    className="mb-2 block text-sm font-semibold text-[#ded1ea]"
                  >
                    Portfolio URL
                  </label>

                  <input
                    id="portfolio_url"
                    type="url"
                    name="portfolio_url"
                    value={formData.portfolio_url}
                    onChange={handleChange}
                    className="input-lumynx"
                    placeholder="https://your-portfolio.com"
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-neon"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}