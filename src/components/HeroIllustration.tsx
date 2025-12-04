import { useEffect, useState } from "react";

const HeroIllustration = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Mobile Version - Simplified */}
      <svg
        viewBox="0 0 280 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-xl md:hidden"
      >
        <defs>
          <linearGradient id="bgGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="primaryGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(270, 70%, 50%)" />
          </linearGradient>
          <linearGradient id="successGradientMobile" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <filter id="shadowMobile" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Background */}
        <ellipse cx="140" cy="130" rx="130" ry="110" fill="url(#bgGradientMobile)" />

        {/* Smartphone */}
        <g filter="url(#shadowMobile)">
          <rect x="70" y="20" width="140" height="220" rx="18" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
          <rect x="78" y="38" width="124" height="184" rx="4" fill="hsl(var(--background))" />
          <rect x="120" y="26" width="40" height="5" rx="2.5" fill="hsl(var(--muted))" />
          <rect x="120" y="228" width="40" height="4" rx="2" fill="hsl(var(--muted))" />
        </g>

        {/* Dashboard content */}
        <text x="90" y="56" fontSize="9" fontWeight="600" fill="hsl(var(--foreground))">Dashboard</text>
        
        {/* Balance card */}
        <rect x="86" y="62" width="108" height="42" rx="6" fill="url(#primaryGradientMobile)" />
        <text x="94" y="78" fontSize="7" fill="white" opacity="0.8">Saldo atual</text>
        <text x="94" y="94" fontSize="12" fontWeight="700" fill="white">R$ 2.450,00</text>

        {/* Pie chart */}
        <g transform="translate(140, 140)">
          <circle r="24" fill="none" stroke="#f97316" strokeWidth="10" strokeDasharray="38 114" transform="rotate(-90)" />
          <circle r="24" fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray="30 122" strokeDashoffset="-38" transform="rotate(-90)" />
          <circle r="24" fill="none" stroke="#22c55e" strokeWidth="10" strokeDasharray="22 130" strokeDashoffset="-68" transform="rotate(-90)" />
          <circle r="24" fill="none" stroke="#a855f7" strokeWidth="10" strokeDasharray="62 90" strokeDashoffset="-90" transform="rotate(-90)" />
          <circle r="14" fill="hsl(var(--background))" />
          <text y="3" fontSize="7" textAnchor="middle" fill="hsl(var(--foreground))" fontWeight="600">Gastos</text>
        </g>

        {/* Goal progress */}
        <g transform="translate(86, 180)">
          <text fontSize="6" fill="hsl(var(--muted-foreground))">Meta: Viagem</text>
          <rect y="8" width="108" height="6" rx="3" fill="hsl(var(--muted))" />
          <rect y="8" width="72" height="6" rx="3" fill="url(#successGradientMobile)">
            <animate attributeName="width" from="0" to="72" dur="1.5s" fill="freeze" begin={mounted ? "0s" : "indefinite"} />
          </rect>
          <text x="110" y="13" fontSize="5" fill="hsl(var(--muted-foreground))" textAnchor="end">66%</text>
        </g>

        {/* Mini stats */}
        <g transform="translate(86, 198)">
          <rect width="52" height="20" rx="4" fill="hsl(var(--muted))" opacity="0.5" />
          <text x="6" y="9" fontSize="5" fill="hsl(var(--muted-foreground))">Receitas</text>
          <text x="6" y="16" fontSize="6" fontWeight="600" fill="#22c55e">+R$ 3.200</text>
          <rect x="56" width="52" height="20" rx="4" fill="hsl(var(--muted))" opacity="0.5" />
          <text x="62" y="9" fontSize="5" fill="hsl(var(--muted-foreground))">Despesas</text>
          <text x="62" y="16" fontSize="6" fontWeight="600" fill="#ef4444">-R$ 750</text>
        </g>

        {/* Single floating card */}
        <g className={mounted ? "animate-float-slow" : ""}>
          <rect x="10" y="100" width="55" height="36" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" filter="url(#shadowMobile)" />
          <text x="20" y="118" fontSize="10">🍔</text>
          <text x="32" y="116" fontSize="6" fontWeight="500" fill="hsl(var(--foreground))">iFood</text>
          <text x="32" y="126" fontSize="7" fontWeight="600" fill="#ef4444">-R$ 45</text>
        </g>

        {/* Decorative dots */}
        <circle cx="250" cy="80" r="5" fill="hsl(var(--primary))" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="30" cy="180" r="4" fill="#22c55e" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Desktop Version - Full */}
      <svg
        viewBox="0 0 400 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-2xl hidden md:block"
      >
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(270, 70%, 50%)" />
          </linearGradient>
          <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15" />
          </filter>
          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Background shape */}
        <ellipse cx="200" cy="160" rx="180" ry="140" fill="url(#bgGradient)" />

        {/* Smartphone frame */}
        <g filter="url(#shadow)">
          <rect x="120" y="30" width="160" height="260" rx="20" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
          <rect x="128" y="50" width="144" height="220" rx="4" fill="hsl(var(--background))" />
          <rect x="175" y="35" width="50" height="6" rx="3" fill="hsl(var(--muted))" />
          <rect x="175" y="278" width="50" height="4" rx="2" fill="hsl(var(--muted))" />
        </g>

        {/* Dashboard content */}
        <text x="140" y="72" fontSize="10" fontWeight="600" fill="hsl(var(--foreground))">Dashboard</text>
        
        {/* Balance card */}
        <rect x="136" y="80" width="128" height="50" rx="8" fill="url(#primaryGradient)" />
        <text x="146" y="98" fontSize="8" fill="white" opacity="0.8">Saldo atual</text>
        <text x="146" y="118" fontSize="14" fontWeight="700" fill="white">R$ 2.450,00</text>

        {/* Pie chart */}
        <g transform="translate(170, 170)">
          <circle r="28" fill="none" stroke="#f97316" strokeWidth="12" strokeDasharray="44 132" transform="rotate(-90)" />
          <circle r="28" fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray="35 141" strokeDashoffset="-44" transform="rotate(-90)" />
          <circle r="28" fill="none" stroke="#22c55e" strokeWidth="12" strokeDasharray="26 150" strokeDashoffset="-79" transform="rotate(-90)" />
          <circle r="28" fill="none" stroke="#a855f7" strokeWidth="12" strokeDasharray="71 105" strokeDashoffset="-105" transform="rotate(-90)" />
          <circle r="16" fill="hsl(var(--background))" />
          <text y="4" fontSize="8" textAnchor="middle" fill="hsl(var(--foreground))" fontWeight="600">Gastos</text>
        </g>

        {/* Goal progress bar */}
        <g transform="translate(136, 215)">
          <text fontSize="7" fill="hsl(var(--muted-foreground))">Meta: Viagem</text>
          <rect y="10" width="128" height="8" rx="4" fill="hsl(var(--muted))" />
          <rect y="10" width="85" height="8" rx="4" fill="url(#successGradient)">
            <animate attributeName="width" from="0" to="85" dur="1.5s" fill="freeze" begin={mounted ? "0s" : "indefinite"} />
          </rect>
          <text x="130" y="16" fontSize="6" fill="hsl(var(--muted-foreground))" textAnchor="end">66%</text>
        </g>

        {/* Mini stats */}
        <g transform="translate(136, 240)">
          <rect width="60" height="24" rx="4" fill="hsl(var(--muted))" opacity="0.5" />
          <text x="8" y="10" fontSize="5" fill="hsl(var(--muted-foreground))">Receitas</text>
          <text x="8" y="19" fontSize="7" fontWeight="600" fill="#22c55e">+R$ 3.200</text>
          <rect x="68" width="60" height="24" rx="4" fill="hsl(var(--muted))" opacity="0.5" />
          <text x="76" y="10" fontSize="5" fill="hsl(var(--muted-foreground))">Despesas</text>
          <text x="76" y="19" fontSize="7" fontWeight="600" fill="#ef4444">-R$ 750</text>
        </g>

        {/* Floating transaction cards */}
        <g filter="url(#cardShadow)" className={mounted ? "animate-float-slow" : ""}>
          <rect x="20" y="80" width="90" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
          <circle cx="40" cy="100" r="10" fill="#f97316" opacity="0.2" />
          <text x="38" y="104" fontSize="10" textAnchor="middle">🍔</text>
          <text x="55" y="98" fontSize="7" fontWeight="500" fill="hsl(var(--foreground))">iFood</text>
          <text x="55" y="110" fontSize="8" fontWeight="600" fill="#ef4444">-R$ 45,90</text>
          <text x="55" y="120" fontSize="5" fill="hsl(var(--muted-foreground))">Alimentação</text>
        </g>

        <g filter="url(#cardShadow)" className={mounted ? "animate-float-medium" : ""}>
          <rect x="290" y="60" width="90" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
          <circle cx="310" cy="80" r="10" fill="#3b82f6" opacity="0.2" />
          <text x="308" y="84" fontSize="10" textAnchor="middle">🎬</text>
          <text x="325" y="78" fontSize="7" fontWeight="500" fill="hsl(var(--foreground))">Netflix</text>
          <text x="325" y="90" fontSize="8" fontWeight="600" fill="#ef4444">-R$ 55,90</text>
          <text x="325" y="100" fontSize="5" fill="hsl(var(--muted-foreground))">Streaming</text>
        </g>

        <g filter="url(#cardShadow)" className={mounted ? "animate-float-fast" : ""}>
          <rect x="300" y="180" width="90" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
          <circle cx="320" cy="200" r="10" fill="#22c55e" opacity="0.2" />
          <text x="318" y="204" fontSize="10" textAnchor="middle">💰</text>
          <text x="335" y="198" fontSize="7" fontWeight="500" fill="hsl(var(--foreground))">Freelance</text>
          <text x="335" y="210" fontSize="8" fontWeight="600" fill="#22c55e">+R$ 800</text>
          <text x="335" y="220" fontSize="5" fill="hsl(var(--muted-foreground))">Receita</text>
        </g>

        {/* WhatsApp icon */}
        <g filter="url(#cardShadow)" className={mounted ? "animate-float-slow" : ""}>
          <circle cx="50" cy="220" r="22" fill="#25D366" />
          <path
            d="M50 210c-6.627 0-12 5.373-12 12 0 2.122.553 4.118 1.519 5.853L38 234l6.309-1.654A11.945 11.945 0 0050 234c6.627 0 12-5.373 12-12s-5.373-12-12-12zm6.99 17.16c-.29.816-1.687 1.559-2.323 1.66-.636.1-1.227.285-4.024-.84-3.373-1.357-5.533-4.82-5.698-5.044-.165-.223-1.35-1.797-1.35-3.427 0-1.63.854-2.434 1.157-2.768.303-.335.66-.418.88-.418.22 0 .44.002.633.011.203.01.476-.077.745.568.276.66.938 2.29 1.02 2.456.082.165.137.358.027.577-.11.22-.165.357-.33.55-.165.192-.347.43-.495.577-.165.165-.337.344-.145.675.193.33.858 1.416 1.842 2.294 1.265 1.128 2.332 1.477 2.662 1.642.33.165.522.137.715-.083.192-.22.825-.963 1.045-1.294.22-.33.44-.275.742-.165.303.11 1.92.906 2.25 1.07.33.165.55.248.633.385.082.137.082.797-.208 1.564z"
            fill="white"
            transform="translate(-7, -8) scale(0.7)"
          />
        </g>

        {/* Decorative elements */}
        <circle cx="320" cy="270" r="8" fill="hsl(var(--primary))" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="160" r="5" fill="hsl(var(--accent))" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="350" cy="140" r="4" fill="#22c55e" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.8;0.5" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </svg>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 3s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .animate-float-fast {
          animation: float-fast 3.5s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default HeroIllustration;
