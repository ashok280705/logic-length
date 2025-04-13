import React from 'react'

const SidebarComponents = ({ link, label, active = false, badge = null, special = false }) => {
  return (
    <div className="relative group">
      {/* Special glow effect for premium items */}
      {special && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
      )}
      
      <button className={`
        w-full py-2.5 px-3 flex items-center justify-between 
        ${active 
          ? 'bg-gradient-to-r from-[#3a0ca3]/70 to-[#6922e1]/70 text-white' 
          : special 
            ? 'bg-[#1f0559]/60 text-gray-200 hover:text-white' 
            : 'bg-[#170045]/40 text-gray-300 hover:text-white hover:bg-[#1c0152]/60'
        }
        ${special ? 'border border-purple-500/20' : ''}
        rounded-xl transition-all duration-300 relative overflow-hidden group
      `}>
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${active 
              ? 'bg-white/20' 
              : special 
                ? 'bg-purple-500/30' 
                : 'bg-purple-500/10 group-hover:bg-purple-500/20'
            }
            transition-all duration-300
          `}>
            <img 
              src={link} 
              alt={label || "icon"} 
              className={`h-4 w-4 ${active ? 'filter brightness-110' : ''} group-hover:scale-110 transition-transform duration-300`} 
            />
          </div>
          <span className={`font-medium ${special ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200' : ''}`}>
            {label}
          </span>
        </div>
        
        {/* Badge indicator */}
        {badge && (
          <div className={`
            px-2 py-0.5 rounded-full text-xs font-medium 
            ${active 
              ? 'bg-white/20 text-white' 
              : special 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                : 'bg-purple-500/20 text-purple-300'
            }
          `}>
            {badge}
          </div>
        )}
        
        {/* Active indicator */}
        {active && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-300 via-white to-blue-300"></div>
        )}
        
        {/* Hover animation */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
      </button>
    </div>
  )
}

export default SidebarComponents
