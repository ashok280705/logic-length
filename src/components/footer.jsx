import React from 'react'
import { useNavigate } from 'react-router-dom'

const Footer = () => {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-gradient-to-r from-[#0a0119] via-[#0d0129] to-[#0a0119] text-white relative z-10 border-t border-[#2c0b7a]/30 overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,_rgba(99,32,221,0.05)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgba(99,32,221,0.05)_1px,_transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
      
      {/* Diagonal glowing line */}
      <div 
        className="absolute w-[200%] h-[30px] bg-gradient-to-r from-transparent via-[#6320dd]/10 to-transparent -rotate-45 -translate-x-full"
        style={{
          animation: 'slide-right 8s infinite linear',
          top: '30%'
        }}
      ></div>
      
      <div className="container mx-auto px-6 py-3 flex flex-wrap justify-between items-center relative">
        <div className="flex items-center space-x-2">
          <img 
            src="logo.png" 
            alt="LogicLength Logo" 
            className="h-8 animate-float perspective-element cursor-pointer"
            onClick={() => navigate('/home')}
          />
          <p className="text-xs text-[#b69fff] md:text-sm">
            © {currentYear} <span className="gradient-text font-medium">LogicLength</span>. All rights reserved.
          </p>
        </div>
        
        <div className="flex space-x-4 items-center">
          <a href="#" className="text-[#b69fff] hover:text-white transition-colors duration-300 text-xs">
            Privacy Policy
          </a>
          <span className="text-[#6320dd]">|</span>
          <a href="#" className="text-[#b69fff] hover:text-white transition-colors duration-300 text-xs">
            Terms of Service
          </a>
          <span className="text-[#6320dd]">|</span>
          <a href="#" className="text-[#b69fff] hover:text-white transition-colors duration-300 text-xs">
            Contact
          </a>
        </div>
        
        <div className="flex space-x-3">
          <a href="#" className="social-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
            </svg>
          </a>
          <a href="#" className="social-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a href="#" className="social-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
            </svg>
          </a>
          <a href="#" className="social-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
          </a>
        </div>
      </div>
      
      {/* Bottom border gradient */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#6320dd] to-transparent"></div>
      
      <style jsx>{`
        .social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 24px;
          width: 24px;
          background: rgba(43, 11, 122, 0.3);
          border-radius: 50%;
          transition: all 0.3s ease;
          color: #b69fff;
        }
        
        .social-icon:hover {
          transform: translateY(-3px);
          background: rgba(99, 32, 221, 0.5);
          color: white;
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
        }
        
        @keyframes slide-right {
          0% { transform: translateX(-100%) rotate(-45deg); }
          100% { transform: translateX(100%) rotate(-45deg); }
        }
      `}</style>
    </footer>
  )
}

export default Footer
