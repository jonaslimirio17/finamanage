import { useNavigate } from "react-router-dom";
import logo from '@/assets/finamanage-logo.png';

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

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
      <img 
        src={logo} 
        alt="FinaManage" 
        className="h-14 w-auto"
        loading="eager"
      />
    </div>
  );
};
