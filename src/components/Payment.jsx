import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateUserCoins } from '../services/authService.js';

const Payment = ({ onSuccess, zoneMode = 'prime' }) => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState(null);
  const [verifyMode, setVerifyMode] = useState(false);
  const [currentZone, setCurrentZone] = useState(zoneMode);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user data when component mounts
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserData(user);
    }

    // Check if there's a pending package to verify
    const pendingPkg = localStorage.getItem('pendingPackage');
    if (pendingPkg) {
      setVerifyMode(true);
    }
    
    // Sync with passed zone mode prop
    setCurrentZone(zoneMode);
    
    // Also check localStorage for most recent active zone
    const storedZone = localStorage.getItem('activeZone');
    if (storedZone && storedZone !== zoneMode) {
      setCurrentZone(storedZone);
      console.log('Zone overridden from localStorage:', storedZone);
    }
    
    console.log('Payment component initialized with zone:', currentZone);
  }, [zoneMode]);

  const packages = [
    { coins: 100, price: 1, name: 'Starter Pack' },
    { coins: 500, price: 5, name: 'Popular Pack' },
    { coins: 1000, price: 10, name: 'Pro Pack' },
    { coins: 2000, price: 20, name: 'Premium Pack' }
  ];

  const handlePackageSelection = (pkg) => {
    console.log('Package selected:', pkg);
    setSelectedPackage(pkg);
    setError(null); // Clear any previous errors
  };

  const handlePayment = () => {
    if (!selectedPackage) {
      setError('Please select a package first');
      return;
    }

    setLoading(true);
    
    // Refresh zone state from localStorage before processing
    const activeZone = localStorage.getItem('activeZone') || currentZone;
    console.log('Processing payment in zone:', activeZone);
    
    // Direct addition in Coin Zone, payment gateway in Prime Zone
    if (activeZone === 'coin') {
      // For Coin Zone: directly add coins without payment gateway
      handleDirectCoinAddition(userData, selectedPackage.coins, selectedPackage, onSuccess, setSuccess, setSelectedPackage, setUserData);
    } else {
      // For Prime Zone: Use normal payment flow
      // Store selected package in localStorage for verification when user returns
      localStorage.setItem('pendingPackage', JSON.stringify({
        ...selectedPackage,
        timestamp: Date.now() // Add timestamp for verification
      }));
      
      // Redirect to Razorpay payment link
      try {
        // Using the provided Razorpay payment link
        window.open('https://razorpay.me/@logic-length', '_blank');
        setVerifyMode(true);
      } catch (error) {
        console.error('Failed to redirect to payment page:', error);
        setError('Failed to open payment page. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Direct coin addition handler when a package is selected
  const handleDirectCoinAddition = async (userData, coinsToAdd, packageData, onSuccess, setSuccess, setSelectedPackage, setUserData) => {
    try {
      console.log("Processing direct coin addition:", coinsToAdd);
      
      // Call Firebase to update user coins
      const result = await updateUserCoins(coinsToAdd, 'purchase', null);
      
      if (!result.success) {
        console.error("Failed to update coins:", result.error);
        alert("Failed to add coins: " + result.error);
        return;
      }
      
      // Update state with the result from Firebase
      setUserData(result.userData);
      setSuccess(true);
      setSelectedPackage(null);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(coinsToAdd);
      }
      
      // Navigate back to previous page after a short delay
      setTimeout(() => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = '/home';
        }
      }, 1500);
      
    } catch (error) {
      console.error("Error during coin addition:", error);
      alert("An error occurred: " + error.message);
    }
  };

  const handleVerifyPayment = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get pending package from localStorage
      const pendingPackageStr = localStorage.getItem('pendingPackage');
      if (!pendingPackageStr) {
        throw new Error('No pending payment found. Please select a package first.');
      }
      
      const pendingPackage = JSON.parse(pendingPackageStr);
      
      // Verify user is logged in
      if (!userData) {
        throw new Error('Please login to continue');
      }
      
      // Get fresh user data from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User data not found');
      
      const user = JSON.parse(userStr);
      
      // Calculate new coin balance
      const currentCoins = parseInt(user.coins) || 0;
      const coinsToAdd = parseInt(pendingPackage.coins);
      const totalCoins = currentCoins + coinsToAdd;
      
      console.log('Current coins:', currentCoins);
      console.log('Adding coins:', coinsToAdd);
      console.log('New total:', totalCoins);

      // Create updated user object
      const updatedUser = {
        ...user,
        coins: totalCoins,
        transactions: [
          ...(user.transactions || []),
          {
            amount: coinsToAdd,
            paymentId: 'manual_verify_' + Date.now(),
            type: 'purchase',
            date: new Date().toISOString(),
            price: pendingPackage.price
          }
        ]
      };

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state
      setUserData(updatedUser);
      setSuccess(true);
      setSelectedPackage(null);
      setVerifyMode(false);
      
      // Clear pending package
      localStorage.removeItem('pendingPackage');
      
      // Call success callback
      if (onSuccess) {
        onSuccess(coinsToAdd);
      }
      
      // Broadcast coin update event to refresh all components
      window.dispatchEvent(new CustomEvent('coinBalanceUpdated', { 
        detail: { newBalance: totalCoins } 
      }));
      
      // Force a reload of the main page to update all coin displays
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      setError(error.message || 'Failed to verify payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get current zone from localStorage (most up-to-date source)
  const getActiveZone = () => {
    return localStorage.getItem('activeZone') || currentZone;
  };

  return (
    <div className="p-6 bg-[#170b2d] rounded-lg max-w-4xl mx-auto futuristic-border">
      <h2 className="text-2xl text-white mb-6 text-center super-neon font-bold">
        {getActiveZone() === 'coin' ? 'Add Coins Directly' : 'Purchase Coins'}
      </h2>
      
      {userData && (
        <div className="mb-6 text-center">
          <p className="text-white">Current Balance: <span className="rainbow-text text-xl font-bold">{userData.coins || 0}</span> coins</p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-900 text-white rounded-lg border border-red-500 animate-pulse">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-800 text-white rounded-lg border border-green-500 animate-pulse">
          <p className="text-center font-bold">✨ Coins added successfully! ✨</p>
          <p className="text-center">Your {getActiveZone() === 'coin' ? 'coins have been added to your account' : 'purchase has been approved'}.</p>
        </div>
      )}
      
      {verifyMode && getActiveZone() === 'prime' ? (
        <div className="mb-6 p-4 bg-[#2a2a4d] rounded-lg border border-[#6320dd] animate-pulse">
          <p className="text-white text-center mb-3">
            Have you completed your payment on Razorpay?
          </p>
          <p className="text-[#b69fff] text-sm text-center mb-4">
            Click the button below to verify your payment and add coins to your account.
          </p>
          <button
            className="w-full py-3 rounded-lg text-lg font-semibold transition-all cybr-btn bg-gradient-to-r from-[#4e1ebb] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6320dd]/50"
            onClick={handleVerifyPayment}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying Payment...
              </span>
            ) : (
              'Verify Payment & Get Coins'
            )}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {packages.map((pkg) => (
              <div
                key={pkg.coins}
                className={`p-4 rounded-lg cursor-pointer transition-all perspective-element holo-card ${
                  selectedPackage?.coins === pkg.coins
                    ? 'bg-[#4e1ebb] border-2 border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                    : 'bg-[#1f1f3a] hover:bg-[#2a2a4d] border border-[#3b0e9b]'
                }`}
                onClick={() => handlePackageSelection(pkg)}
              >
                <div className="text-center relative">
                  {selectedPackage?.coins === pkg.coins && (
                    <div className="absolute -top-2 -right-2 bg-[#8b5cf6] text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      SELECTED
                    </div>
                  )}
                  <h3 className="text-xl text-white mb-2 font-bold">{pkg.name}</h3>
                  <p className="text-3xl text-[#b69fff] font-bold mb-2">₹{pkg.price}</p>
                  <div className="bg-[#2a2a4d] rounded-lg p-2 mb-2">
                    <p className="text-2xl text-yellow-500 font-bold">{pkg.coins} coins</p>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    {(pkg.coins / pkg.price).toFixed(0)} coins/₹
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <button
            className={`mt-6 w-full py-3 rounded-lg text-lg font-semibold transition-all cybr-btn ${
              !selectedPackage 
                ? 'bg-[#2a2a4d] text-gray-300 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#4e1ebb] to-[#8b5cf6] text-white hover:shadow-lg hover:shadow-[#6320dd]/50'
            }`}
            onClick={handlePayment}
            disabled={!selectedPackage || loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : selectedPackage ? (
              getActiveZone() === 'coin' ? `Add ${selectedPackage.coins} Coins Directly` : `Pay ₹${selectedPackage.price} on Razorpay`
            ) : (
              'Select a package'
            )}
          </button>
          
          {!success && (
            <div className="mt-3 text-center">
              <p className="text-[#b69fff] text-sm">Click a package above to select it</p>
            </div>
          )}
        </>
      )}
      
      <div className="mt-6 text-center">
        <p className="text-[#b69fff] text-xs">
          {getActiveZone() === 'coin' 
            ? 'Direct coin addition with no payment required' 
            : 'Payments secured by Razorpay'}
        </p>
      </div>
      
      {/* Debug info - remove in production */}
      <div className="mt-2 text-center text-xs text-purple-400/50">
        Current Zone: {getActiveZone()}
      </div>
    </div>
  );
};

export default Payment; 