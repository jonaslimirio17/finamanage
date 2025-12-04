import { useNavigate } from "react-router-dom";

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

// Inline SVG for zero network requests - optimized for performance
const LogoSVG = () => (
  <svg 
    viewBox="0 0 280 70" 
    width="280"
    height="70"
    aria-label="FinaManage Logo"
    className="h-16 w-auto"
  >
    {/* Icon - Triangle/Chart symbol */}
    <circle cx="35" cy="35" r="28" fill="hsl(var(--primary))" />
    <path 
      d="M22 45 L35 20 L48 45 M26 38 L44 38" 
      stroke="hsl(var(--primary-foreground))" 
      strokeWidth="3.5" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* Text */}
    <text 
      x="75" 
      y="45" 
      fill="currentColor" 
      fontFamily="Poppins, system-ui, sans-serif" 
      fontSize="32" 
      fontWeight="600"
    >
      Fina<tspan fill="hsl(var(--primary))">Manage</tspan>
    </text>
  </svg>
);

export const Logo = ({ className = "", onClick }: LogoProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate("/");
    }
  };

  return (
    <div 
      className={`flex items-center cursor-pointer transition-transform hover:scale-105 ${className}`}
      onClick={handleClick}
    >
      <LogoSVG />
    </div>
  );
};
