import React from 'react'

const SidebarSmallComp = ({ image, alt, onClick }) => {
  return (
    <button 
      className="group w-full p-3 flex items-center justify-center bg-gradient-to-r from-[#1a0050]/40 to-[#270063]/40 hover:from-[#1a0050]/60 hover:to-[#270063]/60 border border-purple-500/10 hover:border-purple-500/30 backdrop-blur-md rounded-xl transition-all duration-500 relative overflow-hidden"
      onClick={onClick}
    >
      {/* Background light effect */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
      
      {/* Icon container */}
      <div className="relative w-8 h-8 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
        <div className="absolute inset-0 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-all duration-300"></div>
        <img 
          src={image} 
          alt={alt || "icon"}
          className="relative w-4 h-4 object-contain transition-all duration-300"
          onError={(e) => console.error("Image failed to load:", image)}
        />
      </div>
    </button>
  )
}

export default SidebarSmallComp
