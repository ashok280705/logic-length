import React from 'react'

const cards2 = (props) => {
  return (
    <div className="perspective-container">
      <div className="h-[40vh] w-[12vw] p-2 bg-gradient-to-t from-[#100136] to-[#1b0060] rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center group perspective-element holo-card futuristic-border">
        {/* Particle overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(139,92,246,0.8)_1px,_transparent_1px)] bg-[length:12px_12px]"></div>
        </div>
        
        <div className="overflow-hidden rounded-lg w-full h-[85%] flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#3b0e9b] opacity-0 group-hover:opacity-50 transition-opacity duration-300 z-10"></div>
          
          {/* Glow behind image */}
          <div className="absolute inset-0 bg-[#6320dd] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 z-0"></div>
          
          <img 
            src={props.link} 
            alt={props.title} 
            className="relative h-auto w-[90%] object-contain transition-transform duration-500 group-hover:scale-110 z-10"
          />
          
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 -translate-x-full group-hover:translate-x-full transition-all duration-1000 z-20"></div>
        </div>
        <p className="text-center text-white font-semibold mt-3 tracking-wider group-hover:super-neon transition-all duration-300">{props.title}</p>
      </div>
    </div>
  )
}

export default cards2
