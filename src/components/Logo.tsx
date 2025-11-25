import { useNavigate } from "react-router-dom";
import logo from "@/assets/finamanage-logo.svg";

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
    <img
      src={logo}
      alt="FinaManage"
      className={`h-12 cursor-pointer ${className}`}
      onClick={handleClick}
    />
  );
};
