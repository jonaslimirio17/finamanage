import { useNavigate } from "react-router-dom";
import logo from "@/assets/finamanage-logo.png";

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
    <div className="h-24 min-w-[280px] overflow-hidden flex items-center">
      <img
        src={logo}
        alt="FinaManage"
        className={`h-24 cursor-pointer transition-transform hover:scale-105 ${className}`}
        style={{ transform: 'scale(1.7)', transformOrigin: 'left center' }}
        onClick={handleClick}
      />
    </div>
  );
};
