import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileSettings = ({ user }) => {
  const navigate = useNavigate();
  
  // Initial state with user data or empty values
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: user?.age || '',
    dob: user?.dob || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || 'India',
    pincode: user?.pincode || '',
    bio: user?.bio || ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [saveStatus, setSaveStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simulating API call to save profile data
    setSaveStatus('saving');
    
    setTimeout(() => {
      // In a real app, you would save to backend here
      console.log('Saving profile data:', formData);
      localStorage.setItem('userData', JSON.stringify({
        ...user,
        ...formData
      }));
      setSaveStatus('success');
      setIsEditing(false);
      
      // Reset status after some time
      setTimeout(() => setSaveStatus(null), 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0c0124] text-white pt-[9vh] pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="border-b border-[#2c0b7a]/30 pb-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Profile Settings
            </h1>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <button 
                onClick={() => navigate("/home")}
                className="px-4 py-2 text-sm bg-[#1a0050]/40 hover:bg-[#1a0050]/60 text-white rounded-lg border border-purple-500/20 transition-all"
              >
                Back to Home
              </button>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20"
                >
                  Edit Profile
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm bg-[#1a0050]/40 hover:bg-[#1a0050]/60 text-white rounded-lg border border-purple-500/20 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-[#1a0050]/40 to-[#09001a]/40 rounded-xl border border-purple-500/20 shadow-xl overflow-hidden backdrop-blur-sm">
              <div className="p-6 border-b border-[#2c0b7a]/30 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold mb-4 relative group overflow-hidden">
                  {formData.name ? formData.name[0].toUpperCase() : 'U'}
                  
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-xs">Change</span>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{formData.name || 'User'}</h2>
                <p className="text-purple-300 text-sm">{formData.username || '@username'}</p>
                
                <div className="w-full mt-4 pt-4 border-t border-[#2c0b7a]/30">
                  <div className="flex items-center text-purple-300 text-sm mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Member since 2023</span>
                  </div>
                  <div className="flex items-center text-purple-300 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{user?.coins || 0} coins available</span>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                <button 
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${activeSection === 'personal' ? 'bg-[#2a1664] text-white' : 'text-purple-300 hover:bg-[#2a1664]/50'}`}
                  onClick={() => setActiveSection('personal')}
                >
                  Personal Information
                </button>
                <button 
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${activeSection === 'contact' ? 'bg-[#2a1664] text-white' : 'text-purple-300 hover:bg-[#2a1664]/50'}`}
                  onClick={() => setActiveSection('contact')}
                >
                  Contact Details
                </button>
                <button 
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${activeSection === 'security' ? 'bg-[#2a1664] text-white' : 'text-purple-300 hover:bg-[#2a1664]/50'}`}
                  onClick={() => setActiveSection('security')}
                >
                  Security Settings
                </button>
                <button 
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${activeSection === 'preferences' ? 'bg-[#2a1664] text-white' : 'text-purple-300 hover:bg-[#2a1664]/50'}`}
                  onClick={() => setActiveSection('preferences')}
                >
                  Game Preferences
                </button>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-b from-[#1a0050]/40 to-[#09001a]/40 rounded-xl border border-purple-500/20 shadow-xl backdrop-blur-sm">
              <form onSubmit={handleSubmit}>
                {/* Section header */}
                <div className="border-b border-[#2c0b7a]/30 p-6">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    {activeSection === 'personal' && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Personal Information
                      </>
                    )}
                    {activeSection === 'contact' && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Contact Details
                      </>
                    )}
                    {activeSection === 'security' && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Security Settings
                      </>
                    )}
                    {activeSection === 'preferences' && (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Game Preferences
                      </>
                    )}
                  </h2>
                  <p className="text-purple-300 mt-1">
                    {activeSection === 'personal' && "Update your personal details and profile information"}
                    {activeSection === 'contact' && "Manage your contact information and address details"}
                    {activeSection === 'security' && "Manage your security settings and account protection"}
                    {activeSection === 'preferences' && "Set your game preferences and notification settings"}
                  </p>
                </div>
                
                <div className="p-6">
                  {/* Personal Information Section */}
                  {activeSection === 'personal' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">Full Name</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full bg-[#170042]/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 transition-all"
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">Username</label>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full bg-[#170042]/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 transition-all"
                            placeholder="Enter your username"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">Age</label>
                          <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full bg-[#170042]/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 transition-all"
                            placeholder="Enter your age"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">Date of Birth</label>
                          <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full bg-[#170042]/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 transition-all"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-1">Bio</label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          disabled={!isEditing}
                          rows="4"
                          className="w-full bg-[#170042]/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 transition-all"
                          placeholder="Tell us a bit about yourself"
                        ></textarea>
                      </div>
                    </div>
                  )}
                  
                  {/* Contact Details Section */}
                  {activeSection === 'contact' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">Email Address</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full bg-[#170042]/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 transition-all"
                            placeholder="Enter your email"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full bg-[#170042]/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 transition-all"
                            placeholder="Enter your phone number"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-1">Address</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full bg-[#170042]/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 transition-all"
                          placeholder="Street address"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">City</label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full bg-[#170042]/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 transition-all"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">State</label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full bg-[#170042]/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 transition-all"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-300 mb-1">PIN Code</label>
                          <input
                            type="text"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full bg-[#170042]/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 transition-all"
                            placeholder="PIN code"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-purple-300 mb-1">Country</label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className="w-full bg-[#170042]/50 border border-purple-500/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 transition-all"
                        >
                          <option value="India">India</option>
                          <option value="USA">USA</option>
                          <option value="UK">UK</option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {/* Security section */}
                  {activeSection === 'security' && (
                    <div className="bg-gradient-to-r from-[#1a0050]/20 to-[#09001a]/20 rounded-lg p-6 border border-purple-500/20">
                      <div className="flex items-center justify-center h-40">
                        <div className="text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-purple-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <h3 className="text-lg font-medium text-white">Security Settings</h3>
                          <p className="text-purple-300 mt-2">This feature will be available soon!</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Game preferences section */}
                  {activeSection === 'preferences' && (
                    <div className="bg-gradient-to-r from-[#1a0050]/20 to-[#09001a]/20 rounded-lg p-6 border border-purple-500/20">
                      <div className="flex items-center justify-center h-40">
                        <div className="text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-purple-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <h3 className="text-lg font-medium text-white">Game Preferences</h3>
                          <p className="text-purple-300 mt-2">This feature will be available soon!</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Form actions */}
                {isEditing && (
                  <div className="border-t border-[#2c0b7a]/30 p-6 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20 flex items-center"
                      disabled={saveStatus === 'saving'}
                    >
                      {saveStatus === 'saving' ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                )}
                
                {saveStatus === 'success' && (
                  <div className="px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-lg mx-6 mb-6 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-300">Profile updated successfully!</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings; 