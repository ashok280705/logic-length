import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TransactionHistory = ({ user }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  // Debug log when component mounts
  useEffect(() => {
    console.log("TransactionHistory component mounted");
  }, []);

  // Sample transaction history data - in a real app, this would come from an API
  const sampleTransactions = [
    { 
      id: 1, 
      type: 'purchase', 
      description: 'Coin Purchase', 
      amount: 100, 
      method: 'Credit Card',
      status: 'completed',
      date: new Date(2023, 7, 15, 14, 30) 
    },
    { 
      id: 2, 
      type: 'game', 
      description: 'Chess Game Entry', 
      amount: -10, 
      method: 'Wallet',
      status: 'completed',
      date: new Date(2023, 7, 14, 20, 15) 
    },
    { 
      id: 3, 
      type: 'win', 
      description: 'Chess Game Win', 
      amount: 20,
      method: 'Reward',
      status: 'completed', 
      date: new Date(2023, 7, 14, 20, 45) 
    },
    { 
      id: 4, 
      type: 'game', 
      description: 'Tic Tac Toe Entry', 
      amount: -5, 
      method: 'Wallet',
      status: 'completed',
      date: new Date(2023, 7, 13, 18, 30) 
    },
    { 
      id: 5, 
      type: 'win', 
      description: 'Tic Tac Toe Win', 
      amount: 10, 
      method: 'Reward',
      status: 'completed',
      date: new Date(2023, 7, 13, 18, 50) 
    },
    { 
      id: 6, 
      type: 'purchase', 
      description: 'Coin Purchase', 
      amount: 50, 
      method: 'PayPal',
      status: 'completed',
      date: new Date(2023, 7, 10, 10, 15) 
    },
    { 
      id: 7, 
      type: 'game', 
      description: 'Rock Paper Scissors Entry', 
      amount: -15, 
      method: 'Wallet',
      status: 'completed',
      date: new Date(2023, 7, 9, 21, 30) 
    },
    { 
      id: 8, 
      type: 'bonus', 
      description: 'Daily Login Bonus', 
      amount: 5, 
      method: 'System',
      status: 'completed',
      date: new Date(2023, 7, 8, 9, 10) 
    }
  ];

  useEffect(() => {
    // Simulate API call to get transaction history
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call
        // await axios.get('/api/transaction-history')
        
        // Using sample data for now
        setTimeout(() => {
          setTransactions(sampleTransactions);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Failed to fetch transaction history:', error);
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get color class for transaction type
  const getTransactionColor = (type) => {
    switch(type.toLowerCase()) {
      case 'purchase': return 'bg-blue-500/60';
      case 'win': return 'bg-green-500/60';
      case 'game': return 'bg-purple-500/60';
      case 'bonus': return 'bg-yellow-500/60';
      default: return 'bg-gray-500/60';
    }
  };

  // Calculate statistics
  const totalPurchased = transactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalSpent = Math.abs(transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0));
    
  const totalEarned = transactions
    .filter(t => t.type === 'win' || t.type === 'bonus')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#0c0124] text-white pt-[9vh]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Transaction History
          </h1>
          <button 
            onClick={() => navigate("/home")}
            className="bg-purple-600/50 hover:bg-purple-600/70 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-[#1a0050]/80 to-[#0c0124]/80 rounded-xl p-4 border border-purple-600/30 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Purchased</p>
                <p className="text-2xl font-bold">{totalPurchased}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#1a0050]/80 to-[#0c0124]/80 rounded-xl p-4 border border-purple-600/30 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Spent</p>
                <p className="text-2xl font-bold">{totalSpent}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#1a0050]/80 to-[#0c0124]/80 rounded-xl p-4 border border-purple-600/30 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Earned</p>
                <p className="text-2xl font-bold">{totalEarned}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="bg-gradient-to-b from-[#1a0050]/40 to-[#0c0124]/40 rounded-xl border border-purple-600/30 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="relative w-20 h-20">
                  <div className="w-20 h-20 border-purple-500 border-t-4 border-b-4 rounded-full animate-spin"></div>
                  <div className="w-12 h-12 border-blue-500 border-t-4 border-b-4 rounded-full animate-spin absolute top-4 left-4"></div>
                </div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No transaction history found.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#2a1664]/70">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Type</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Description</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Method</th>
                    <th className="py-3 px-4 text-center text-sm font-medium text-gray-300">Status</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-300">Amount</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-300">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2c0b7a]/30">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-[#2a1664]/20 transition-colors">
                      <td className="py-3 px-4 text-left whitespace-nowrap">
                        <span className={`inline-block py-1 px-3 rounded-full text-xs font-medium capitalize ${getTransactionColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left">
                        <span className="text-white font-medium">{transaction.description}</span>
                      </td>
                      <td className="py-3 px-4 text-left whitespace-nowrap">
                        <span className="text-gray-300">{transaction.method}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block py-1 px-3 rounded-full text-xs font-medium bg-green-500/20 text-green-400 capitalize">
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className={transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="text-gray-400 text-sm">{formatDate(transaction.date)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory; 