import React from 'react';

const Header = () => {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-black antialiased items-center justify-center">
      {/* Grid Background */}
      <div className="pointer-events-none absolute inset-0 select-none opacity-30">
        <div 
          className="absolute inset-0 [background-size:40px_40px] [background-image:linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)]"
          style={{
            maskImage: 'radial-gradient(ellipse 100% 60% at 50% 50%, black 0%, black 40%, transparent 80%)',
          }}
        />
      </div>
      
      {/* Main 45-degree Light Beam - Much Brighter */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute bg-gradient-to-b from-white/40 via-white/25 via-white/15 to-transparent"
          style={{
            width: '400px',
            height: '200vh',
            left: '20%',
            top: '-50vh',
            transform: 'rotate(45deg)',
            filter: 'blur(30px)',
            animation: 'light-sweep 12s ease-in-out infinite alternate'
          }}
        />
        
        {/* Secondary 45-degree beam from opposite direction */}
        <div 
          className="absolute bg-gradient-to-b from-white/35 via-white/20 via-white/10 to-transparent"
          style={{
            width: '300px',
            height: '180vh',
            right: '25%',
            top: '-40vh',
            transform: 'rotate(-45deg)',
            filter: 'blur(25px)',
            animation: 'light-sweep-reverse 15s ease-in-out infinite alternate-reverse'
          }}
        />
        
        {/* Intense center beam */}
        <div 
          className="absolute bg-gradient-to-b from-white/30 via-white/15 to-transparent"
          style={{
            width: '200px',
            height: '150vh',
            left: '50%',
            top: '-25vh',
            transform: 'translateX(-50%) rotate(45deg)',
            filter: 'blur(20px)',
            animation: 'center-glow 8s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* Intense Radial Lights */}
      <div className="absolute top-10 left-10 h-[500px] w-[500px] rounded-full bg-gradient-radial from-white/25 via-white/10 to-transparent blur-3xl opacity-80" />
      <div className="absolute bottom-20 right-20 h-[400px] w-[400px] rounded-full bg-gradient-radial from-white/20 via-white/8 to-transparent blur-2xl opacity-70" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-radial from-white/15 via-white/5 to-transparent blur-3xl opacity-60" />
      
      {/* Bright Corner Lights */}
      <div className="absolute top-0 left-0 h-96 w-96 bg-gradient-to-br from-white/30 to-transparent blur-3xl opacity-50" />
      <div className="absolute bottom-0 right-0 h-96 w-96 bg-gradient-to-tl from-white/25 to-transparent blur-3xl opacity-45" />
      
      {/* Enhanced Atmospheric Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.4 + Math.random() * 0.4,
              animation: `particle-float ${4 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 8}s`
            }}
          />
        ))}
      </div>
      
      {/* Main Content with Enhanced Glow */}
      <div className="relative z-10 mx-auto w-full max-w-7xl p-4 text-center">
        <h1 
          className="bg-gradient-to-b from-white via-white to-gray-200 bg-clip-text text-6xl md:text-8xl lg:text-[10rem] xl:text-[12rem] font-bold text-transparent leading-none tracking-tight mb-8"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5)) drop-shadow(0 0 40px rgba(255,255,255,0.3))',
            animation: 'text-glow 4s ease-in-out infinite alternate'
          }}
        >
          Hexagon
        </h1>
        <p 
          className="mx-auto max-w-2xl text-lg md:text-xl font-normal text-neutral-200 leading-relaxed"
          style={{ 
            textShadow: '0 0 10px rgba(255,255,255,0.3)',
            animation: 'fade-in-up 2s ease-out 0.5s both' 
          }}
        >
          Build, train and deploy — fast, secure, and beautifully simple.
        </p>
      </div>
      
      <style jsx>{`
        @keyframes light-sweep {
          0% { 
            transform: rotate(42deg) translateX(-100px); 
            opacity: 0.6;
          }
          50% { 
            transform: rotate(48deg) translateX(0px); 
            opacity: 0.9;
          }
          100% { 
            transform: rotate(45deg) translateX(50px); 
            opacity: 0.7;
          }
        }
        
        @keyframes light-sweep-reverse {
          0% { 
            transform: rotate(-42deg) translateX(100px); 
            opacity: 0.5;
          }
          50% { 
            transform: rotate(-48deg) translateX(0px); 
            opacity: 0.8;
          }
          100% { 
            transform: rotate(-45deg) translateX(-50px); 
            opacity: 0.6;
          }
        }
        
        @keyframes center-glow {
          0%, 100% { 
            opacity: 0.4; 
            transform: translateX(-50%) rotate(43deg) scale(1);
          }
          50% { 
            opacity: 0.7; 
            transform: translateX(-50%) rotate(47deg) scale(1.1);
          }
        }
        
        @keyframes text-glow {
          0% { 
            filter: drop-shadow(0 0 20px rgba(255,255,255,0.4)) drop-shadow(0 0 40px rgba(255,255,255,0.2));
          }
          100% { 
            filter: drop-shadow(0 0 30px rgba(255,255,255,0.7)) drop-shadow(0 0 60px rgba(255,255,255,0.4));
          }
        }
        
        @keyframes particle-float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1); 
            opacity: 0.3;
          }
          25% { 
            transform: translateY(-20px) translateX(10px) scale(1.2); 
            opacity: 0.7;
          }
          50% { 
            transform: translateY(-30px) translateX(-10px) scale(1); 
            opacity: 0.5;
          }
          75% { 
            transform: translateY(-15px) translateX(15px) scale(1.1); 
            opacity: 0.8;
          }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
};

export default Header;