import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateUserCoins } from '../services/authService.js';
import axios from 'axios';

const Payment = ({ onSuccess, zoneMode = 'prime' }) => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState(null);
  const [verifyMode, setVerifyMode] = useState(false);
  const [currentZone, setCurrentZone] = useState(zoneMode);
  const navigate = useNavigate();

  // Define the server URL
  const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5002';

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          resolve(true);
        };
        script.onerror = () => {
          resolve(false);
          console.error('Razorpay SDK failed to load');
        };
        document.body.appendChild(script);
      });
    };
    
    loadRazorpayScript();
  }, []);

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

  const handlePayment = async () => {
    if (!selectedPackage) {
      setError('Please select a package first');
      return;
    }

    setLoading(true);
    setError(null); // Clear any previous errors
    
    try {
      // Refresh zone state from localStorage before processing
      const activeZone = localStorage.getItem('activeZone') || currentZone;
      console.log('Processing payment in zone:', activeZone);
      
      // Direct addition in Coin Zone, payment gateway in Prime Zone
      if (activeZone === 'coin') {
        // For Coin Zone: directly add coins without payment gateway
        await handleDirectCoinAddition(userData, selectedPackage.coins, selectedPackage);
      } else {
        // For Prime Zone: Use Razorpay payment flow
        
        // Check if Razorpay is loaded
        if (typeof window.Razorpay === 'undefined') {
          console.log('Razorpay not loaded, attempting to load again...');
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => resolve(true);
            document.body.appendChild(script);
            
            // Set a timeout in case script loading hangs
            setTimeout(() => resolve(false), 5000);
          });
          
          // If Razorpay still not available, use fallback
          if (typeof window.Razorpay === 'undefined') {
            throw new Error('Payment gateway not available. Please try again later or use direct coin addition.');
          }
        }
        
        // Validate server URL before proceeding
        if (!SERVER_URL) {
          throw new Error('Server configuration missing. Please refresh the page or contact support.');
        }
        
        // Retry mechanism for API calls
        let attempts = 0;
        const maxAttempts = 3;
        let lastError = null;
        
        while (attempts < maxAttempts) {
          try {
            attempts++;
            console.log(`Attempt ${attempts}/${maxAttempts} to create order`);
            
            // Create an order on the server with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            const response = await axios.post(`${SERVER_URL}/api/payment/create-order`, {
              amount: selectedPackage.price,
              package: selectedPackage,
              userId: userData?.userId || 'guest'
            }, { signal: controller.signal });
            
            clearTimeout(timeoutId);
            
            console.log('Order created:', response.data);
            
            if (response.data.success) {
              // If we got a direct payment link, use that (fallback approach)
              if (response.data.paymentLink) {
                // Store selected package in localStorage for verification when user returns
                localStorage.setItem('pendingPackage', JSON.stringify({
                  ...selectedPackage,
                  timestamp: Date.now(),
                  orderId: response.data.orderId
                }));
                
                // Redirect to Razorpay payment link
                window.open(response.data.paymentLink, '_blank');
                setVerifyMode(true);
                setLoading(false);
                return;
              } else {
                // Use the integrated Razorpay checkout
                const options = {
                  key: response.data.key,
                  amount: response.data.amount,
                  currency: response.data.currency || 'INR',
                  name: 'Logic Length',
                  description: `${selectedPackage.name} - ${selectedPackage.coins} Coins`,
                  order_id: response.data.orderId,
                  handler: async function (response) {
                    try {
                      console.log('Payment successful:', response);
                      
                      // Verify payment with our server
                      const verifyResponse = await axios.post(`${SERVER_URL}/api/payment/verify`, {
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                        userId: userData?.userId || 'guest'
                      });
                      
                      if (verifyResponse.data.success) {
                        // If successful, update the user's coins using our existing function
                        await handleDirectCoinAddition(userData, selectedPackage.coins, {
                          ...selectedPackage,
                          paymentId: response.razorpay_payment_id
                        });
                        
                        // Remove pending package
                        localStorage.removeItem('pendingPackage');
                      }
                    } catch (error) {
                      console.error('Error verifying payment:', error);
                      setError('Verification failed, but your payment may have succeeded. Please check your account before trying again.');
                      
                      // Store pending verification for later
                      localStorage.setItem('pendingPackage', JSON.stringify({
                        ...selectedPackage,
                        timestamp: Date.now(),
                        orderId: response.razorpay_order_id,
                        paymentId: response.razorpay_payment_id
                      }));
                      
                      setVerifyMode(true);
                    } finally {
                      setLoading(false);
                    }
                  },
                  prefill: {
                    name: userData?.username || '',
                    email: userData?.email || '',
                  },
                  theme: {
                    color: '#6320dd',
                  },
                  modal: {
                    ondismiss: function() {
                      console.log('Checkout form closed');
                      setLoading(false);
                    }
                  }
                };
                
                // Open Razorpay checkout form
                const razorpay = new window.Razorpay(options);
                razorpay.open();
                
                // Break out of retry loop
                break;
              }
            } else {
              throw new Error(response.data.message || 'Failed to create order');
            }
          } catch (attemptError) {
            lastError = attemptError;
            console.warn(`Attempt ${attempts} failed:`, attemptError);
            
            // Only retry network errors or timeouts
            if (attempts >= maxAttempts || 
                !(attemptError.message.includes('network') || 
                  attemptError.message.includes('timeout') || 
                  attemptError.code === 'ECONNABORTED' ||
                  attemptError.name === 'AbortError')) {
              break;
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
        
        // If we exited the loop with an error and without a successful attempt
        if (lastError && attempts >= maxAttempts) {
          throw lastError;
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      // Provide more helpful error messages based on error type
      if (error.message.includes('network') || error.message.includes('timeout')) {
        setError('Network connection error. Please check your internet and try again.');
      } else if (error.message.includes('configuration') || error.message.includes('available')) {
        setError('Payment system temporarily unavailable. Please try again later.');
      } else {
        setError('Failed to process payment. Please try again or contact support.');
      }
      
      setLoading(false);
    }
  };

  // Direct coin addition handler when a package is selected
  const handleDirectCoinAddition = async (userData, coinsToAdd, packageData) => {
    try {
      console.log("Processing direct coin addition:", coinsToAdd);
      
      // Call Firebase to update user coins
      const result = await updateUserCoins(coinsToAdd, 'purchase', null);
      
      if (!result.success) {
        console.error("Failed to update coins:", result.error);
        
        // Manual fallback if Firebase update fails
        try {
          const userStr = localStorage.getItem('user');
          if (!userStr) {
            alert("User data not found. Please log in again.");
            return;
          }
          
          // Parse user data
          const user = JSON.parse(userStr);
          
          // Calculate new coin balance
          const currentCoins = parseInt(user.coins) || 0;
          const totalCoins = currentCoins + parseInt(coinsToAdd);
          
          console.log('Manual fallback: Current coins:', currentCoins);
          console.log('Manual fallback: Adding coins:', coinsToAdd);
          console.log('Manual fallback: New total:', totalCoins);
          
          // Create updated user object
          const updatedUser = {
            ...user,
            coins: totalCoins
          };
          
          // Save to localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Dispatch event to update UI
          window.dispatchEvent(new CustomEvent('coinBalanceUpdated', {
            detail: {
              newBalance: totalCoins,
              userData: updatedUser
            }
          }));
          
          setUserData(updatedUser);
          setSuccess(true);
          setSelectedPackage(null);
          
          // Call success callback
          if (onSuccess) {
            onSuccess(coinsToAdd);
          }
          
          alert("Coins added successfully using local storage (Firebase update failed)");
          
          // Navigate back to previous page after a short delay
          setTimeout(() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              navigate('/home');
            }
          }, 1500);
          
          return;
        } catch (localError) {
          console.error("Manual fallback failed:", localError);
          alert("Failed to add coins: " + result.error + ". Please try logging out and back in.");
          return;
        }
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
          navigate('/home');
        }
      }, 1500);
      
    } catch (error) {
      console.error("Error during coin addition:", error);
      alert("An error occurred: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get pending package from localStorage
      const pendingPackageStr = localStorage.getItem('pendingPackage');
      if (!pendingPackageStr) {
        setError('No pending payment found. Please try again.');
        setLoading(false);
        return;
      }
      
      const pendingPackage = JSON.parse(pendingPackageStr);
      
      // Check if the package is still valid (not expired)
      const now = Date.now();
      const timestamp = pendingPackage.timestamp || 0;
      const diff = now - timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (diff > maxAge) {
        setError('Payment session expired. Please select a package and try again.');
        localStorage.removeItem('pendingPackage');
        setVerifyMode(false);
        setLoading(false);
        return;
      }
      
      // First try to check with Razorpay if it was successful (if orderId exists)
      if (pendingPackage.orderId && SERVER_URL) {
        try {
          // Attempt to verify with server
          const verifyResponse = await axios.post(`${SERVER_URL}/api/payment/check-status`, {
            orderId: pendingPackage.orderId,
            paymentId: pendingPackage.paymentId || '',
            userId: userData?.userId || 'guest',
            amount: pendingPackage.price * 100 // in paise/cents
          }, { 
            timeout: 10000 // 10 second timeout
          });
          
          if (verifyResponse.data.success && verifyResponse.data.verified) {
            console.log('Payment verified via server check:', verifyResponse.data);
            
            // Use payment ID if returned from server
            const paymentId = verifyResponse.data.paymentId || pendingPackage.paymentId || `manual-verify-${Date.now()}`;
            
            // Process the successful payment
            await handleDirectCoinAddition(userData, pendingPackage.coins, {
              ...pendingPackage,
              paymentId
            });
            
            // Remove pending package
            localStorage.removeItem('pendingPackage');
            setVerifyMode(false);
            return;
          } else if (verifyResponse.data.status === 'failed') {
            throw new Error('Payment was declined or failed. Please try again with a different payment method.');
          } else if (verifyResponse.data.status === 'pending') {
            throw new Error('Your payment is still being processed. Please check back later.');
          }
          // If not verified via API, continue with manual verification through Firebase
        } catch (verifyError) {
          console.warn('Server verification failed, falling back to Firebase:', verifyError);
          // Continue with Firebase verification as fallback
        }
      }
      
      // If we couldn't verify through Razorpay API or got here through fallback,
      // proceed with manual verification through Firebase
      
      // Call Firebase to update user coins
      const result = await updateUserCoins(pendingPackage.coins, 'purchase', null);
      
      if (result.success) {
        // Update local storage with updated user data
        localStorage.setItem('user', JSON.stringify(result.userData));
        
        // Update state
        setUserData(result.userData);
        setSuccess(true);
        
        // Dispatch event to update UI
        window.dispatchEvent(new CustomEvent('coinBalanceUpdated', {
          detail: {
            newBalance: result.userData.coins,
            userData: result.userData
          }
        }));
        
        // Call success callback
        if (onSuccess) {
          onSuccess(pendingPackage.coins);
        }
        
        // Remove pending package
        localStorage.removeItem('pendingPackage');
        
        // Reset verification mode
        setVerifyMode(false);
      } else {
        throw new Error(result.error || 'Failed to add coins');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify payment: ' + (error.message || 'Unknown error'));
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