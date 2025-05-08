import React from 'react';
import { useNavigate } from 'react-router-dom';

const Cards1 = (props) => {
  const navigate = useNavigate();

  // Navigate to appropriate route based on title
  const navigateToGames = () => {
    console.log(`${props.title} card clicked`);
    if (props.title === "MULTIPLAYER") {
      navigate("/multiplayer-games");
    } else if (props.title === "SINGLE PLAYER") {
      navigate("/single-player-games");
    }
  };

  return (
    <button 
      onClick={navigateToGames}
      className="w-full max-w-sm h-[40vh] bg-gradient-to-b from-[#170045] to-[#06013a] rounded-xl overflow-hidden shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all duration-300 border-2 border-purple-500/20 hover:border-purple-500/40 focus:outline-none sm:max-w-[280px] md:max-w-[320px] lg:max-w-[360px] xl:max-w-[400px]"
    >
      <div className="h-3/4 flex items-center justify-center p-3">
        <img 
          src={props.image} 
          alt={props.title} 
          className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-300 hover:scale-105"
        />
      </div>
      
      <div className="h-1/4 flex items-center justify-center bg-gradient-to-r from-[#150139] to-[#250354]">
        <p className="text-white text-center font-bold text-xl tracking-wider">{props.title}</p>
      </div>
    </button>
  );
};

export default Cards1;
