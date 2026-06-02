import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchProfiles, addProfileThunk, removeProfileThunk, setActiveProfile, authenticatePin } from '../store/profileSlice';
import { UserPlus, Lock, CheckCircle, Trash2, ArrowRight } from 'lucide-react';
import IslamicPattern from '../components/IslamicPattern';

export const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { profiles, activeProfile, isAuthenticated } = useAppSelector((state) => state.profiles);

  // Profile creation state
  const [showCreate, setShowCreate] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [usePin, setUsePin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [createError, setCreateError] = useState('');

  // PIN verification state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    dispatch(fetchProfiles());
  }, [dispatch]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!newProfileName.trim()) {
      setCreateError('Profile name is required');
      return;
    }

    if (usePin) {
      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        setCreateError('PIN must be exactly 4 digits');
        return;
      }
      if (pin !== confirmPin) {
        setCreateError('PINs do not match');
        return;
      }
    }

    try {
      await dispatch(
        addProfileThunk({
          name: newProfileName.trim(),
          pinLock: usePin ? pin : null,
        })
      ).unwrap();
      
      // Reset form
      setNewProfileName('');
      setUsePin(false);
      setPin('');
      setConfirmPin('');
      setShowCreate(false);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create profile');
    }
  };

  const handleSelectProfile = (profile: any) => {
    dispatch(setActiveProfile(profile));
    setPinInput('');
    setPinError(false);
  };

  const handlePinKeyPress = (digit: string) => {
    if (pinInput.length >= 4) return;
    setPinError(false);
    
    const newInput = pinInput + digit;
    setPinInput(newInput);

    if (newInput.length === 4) {
      // Trigger authentication
      if (activeProfile?.pinLock === newInput) {
        dispatch(authenticatePin(newInput));
      } else {
        setTimeout(() => {
          setPinInput('');
          setPinError(true);
        }, 300);
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleDeleteProfile = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this profile? All its counters and history will be permanently wiped.')) {
      await dispatch(removeProfileThunk(id));
    }
  };

  // If a profile is selected but not authenticated, render PIN entry
  if (activeProfile && activeProfile.pinLock !== null && !isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6">
        <IslamicPattern opacity={0.07} />
        
        {/* Header */}
        <div className="text-center mt-12">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 animate-bounce">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold font-sans">Verification</h2>
          <p className="text-slate-400 text-sm mt-1">Please enter PIN to unlock <span className="text-emerald-400 font-semibold">{activeProfile.name}</span></p>
        </div>

        {/* Display Dots */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="flex gap-4 mb-4">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                  pinError 
                    ? 'border-red-500 bg-red-500/30' 
                    : idx < pinInput.length
                    ? 'border-emerald-500 bg-emerald-500 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : 'border-slate-600 bg-slate-800'
                }`}
              />
            ))}
          </div>
          {pinError && (
            <p className="text-red-400 text-sm font-medium animate-pulse">Incorrect PIN. Please try again.</p>
          )}
        </div>

        {/* Numeric Lockpad */}
        <div className="max-w-xs mx-auto w-full mb-12">
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handlePinKeyPress(digit)}
                className="h-16 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700/50 flex items-center justify-center text-2xl font-semibold transition-all duration-100"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={() => dispatch(setActiveProfile(null))}
              className="h-16 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 text-sm font-medium active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={() => handlePinKeyPress('0')}
              className="h-16 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700/50 flex items-center justify-center text-2xl font-semibold transition-all duration-100"
            >
              0
            </button>
            <button
              onClick={handlePinDelete}
              className="h-16 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 active:scale-95"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 font-medium">
          All data is stored locally on your device. No remote server is used.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-emerald-950 dark:text-slate-100 flex flex-col justify-between p-6 overflow-y-auto">
      <IslamicPattern opacity={0.04} />

      {/* Main Box */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center my-6">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-800 dark:text-amber-500 font-sans">
            Al-Dhikr
          </h1>
          <p className="text-slate-600 dark:text-emerald-300 text-sm mt-1">
            Smart Offline-First Digital Tasbih
          </p>
        </div>

        {/* Create Profile Panel */}
        {showCreate ? (
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl transition-all">
            <h3 className="text-xl font-bold mb-4 text-emerald-800 dark:text-amber-500 flex items-center gap-2">
              <UserPlus size={20} /> Create New Profile
            </h3>
            
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Profile Name
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Abdullah, Fatima"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-amber-500"
                />
              </div>

              {/* Security PIN toggle */}
              <div className="flex items-center justify-between py-2 border-t border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Lock Profile with PIN</h4>
                  <p className="text-xs text-slate-400">Protects count history with a local 4-digit lock.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePin}
                    onChange={(e) => setUsePin(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 dark:peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {usePin && (
                <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      Enter 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      pattern="\d*"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full px-4 py-3 text-center tracking-widest text-lg rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                      Confirm PIN
                    </label>
                    <input
                      type="password"
                      pattern="\d*"
                      maxLength={4}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full px-4 py-3 text-center tracking-widest text-lg rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {createError && (
                <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-900/30">
                  {createError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setCreateError('');
                  }}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-700/10 dark:shadow-amber-500/10 transition"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Profile Selector */
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                Choose Profile
              </h3>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 rounded-full text-xs font-bold transition-all"
              >
                <UserPlus size={14} /> Add New
              </button>
            </div>

            {profiles.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-slate-400 text-sm">No profiles found.</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition"
                >
                  Create Your First Profile
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProfile(p)}
                    className="group w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-800/50 dark:hover:bg-emerald-950/20 border border-slate-200/60 dark:border-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-900 rounded-2xl cursor-pointer transition-all duration-200 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-700/10 text-emerald-700 dark:bg-amber-500/10 dark:text-amber-500 flex items-center justify-center font-bold text-lg select-none">
                        {p.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-800 dark:group-hover:text-amber-400 transition-colors">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          {p.pinLock !== null ? (
                            <span className="inline-flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-500 font-medium">
                              <Lock size={10} /> PIN Secured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-xs text-slate-400">
                              <CheckCircle size={10} className="text-emerald-600" /> Free Profile
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteProfile(p.id!, e)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors duration-150"
                        title="Delete Profile"
                      >
                        <Trash2 size={16} />
                      </button>
                      <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <p className="text-center text-xs text-slate-400 dark:text-emerald-400/50 font-medium py-4 select-none">
        All data is stored locally on your device. No remote server is used.
      </p>
    </div>
  );
};
export default ProfileScreen;
