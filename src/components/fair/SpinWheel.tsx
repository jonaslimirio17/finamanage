import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface Prize {
  label: string;
  color: string;
  probability: number;
}

interface SpinWheelProps {
  onSpinEnd: (prize: Prize) => void;
  disabled?: boolean;
}

// Valores com desconto limitado a 6 meses (R$19,90/mês):
// - 1 mês grátis = R$19,90
// - 2 meses grátis = R$39,80
// - 3 meses grátis = R$59,70
// - 30% desc/6m = R$35,82
// - 50% desc/6m = R$59,70
// Custo esperado por lead: ~R$26,50
const prizes: Prize[] = [
  { label: "1 mês grátis", color: "hsl(var(--primary))", probability: 50 },
  { label: "2 meses grátis", color: "hsl(142 76% 36%)", probability: 20 },
  { label: "3 meses grátis", color: "hsl(48 96% 53%)", probability: 5 },
  { label: "30% off 6 meses", color: "hsl(0 84% 60%)", probability: 17 },
  { label: "50% off 6 meses", color: "hsl(271 91% 65%)", probability: 8 },
];

const SpinWheel = ({ onSpinEnd, disabled }: SpinWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const selectPrize = (): Prize => {
    const random = Math.random() * 100;
    let cumulative = 0;
    for (const prize of prizes) {
      cumulative += prize.probability;
      if (random <= cumulative) {
        return prize;
      }
    }
    return prizes[0];
  };

  const spin = () => {
    if (isSpinning || disabled) return;

    setIsSpinning(true);
    const selectedPrize = selectPrize();
    const prizeIndex = prizes.indexOf(selectedPrize);
    
    // Calculate the angle for the selected prize
    const segmentAngle = 360 / prizes.length;
    const prizeAngle = prizeIndex * segmentAngle + segmentAngle / 2;
    
    // Add extra rotations for visual effect (5-8 full rotations)
    const extraRotations = (5 + Math.random() * 3) * 360;
    const finalRotation = rotation + extraRotations + (360 - prizeAngle);
    
    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      onSpinEnd(selectedPrize);
    }, 4000);
  };

  const segmentAngle = 360 / prizes.length;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[24px] border-t-foreground" />
        </div>
        
        {/* Wheel */}
        <div
          ref={wheelRef}
          className="w-72 h-72 md:w-80 md:h-80 rounded-full relative overflow-hidden shadow-2xl border-4 border-foreground"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
              : "none",
          }}
        >
          {prizes.map((prize, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = (index + 1) * segmentAngle;
            const midAngle = startAngle + segmentAngle / 2;
            
            // Calculate the path for the segment
            const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
            const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
            const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
            const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
            
            const largeArc = segmentAngle > 180 ? 1 : 0;
            
            return (
              <svg
                key={index}
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
              >
                <path
                  d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={prize.color}
                />
                <text
                  x="50"
                  y="50"
                  fill="white"
                  fontSize="5"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${midAngle}, 50, 50) translate(25, 0)`}
                  style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
                >
                  {prize.label}
                </text>
              </svg>
            );
          })}
          
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background border-4 border-foreground flex items-center justify-center">
            <span className="text-xs font-bold text-foreground">GIRE</span>
          </div>
        </div>
      </div>

      <Button
        onClick={spin}
        disabled={isSpinning || disabled}
        size="lg"
        className="text-lg px-8 py-6 animate-pulse hover:animate-none"
      >
        {isSpinning ? "Girando..." : "🎰 Girar a Roleta!"}
      </Button>
    </div>
  );
};

export default SpinWheel;
