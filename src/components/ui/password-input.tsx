import * as React from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

export interface PasswordRequirement {
  label: string;
  regex: RegExp;
  met: boolean;
}

export interface PasswordInputProps extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  showRequirements?: boolean;
  showStrengthBar?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, value, onChange, showRequirements = true, showStrengthBar = true, onValidationChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const requirements: PasswordRequirement[] = [
      { label: "Mínimo de 8 caracteres", regex: /.{8,}/, met: false },
      { label: "Pelo menos 1 letra maiúscula (A-Z)", regex: /[A-Z]/, met: false },
      { label: "Pelo menos 1 letra minúscula (a-z)", regex: /[a-z]/, met: false },
      { label: "Pelo menos 1 número (0-9)", regex: /[0-9]/, met: false },
      { label: "Pelo menos 1 caractere especial (!@#$%^&*())", regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, met: false },
    ];

    const updatedRequirements = requirements.map(req => ({
      ...req,
      met: req.regex.test(value)
    }));

    const metCount = updatedRequirements.filter(req => req.met).length;
    const allMet = metCount === requirements.length;

    React.useEffect(() => {
      onValidationChange?.(allMet);
    }, [allMet, onValidationChange]);

    const getStrengthLevel = () => {
      if (metCount <= 2) return { label: "Fraca", color: "bg-destructive" };
      if (metCount <= 4) return { label: "Média", color: "bg-yellow-500" };
      return { label: "Forte", color: "bg-green-500" };
    };

    const strength = getStrengthLevel();
    const strengthPercentage = (metCount / requirements.length) * 100;

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            ref={ref}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {showStrengthBar && value.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Força da senha:</span>
              <span className={cn("font-medium", {
                "text-destructive": strength.label === "Fraca",
                "text-yellow-600 dark:text-yellow-500": strength.label === "Média",
                "text-green-600 dark:text-green-500": strength.label === "Forte",
              })}>
                {strength.label}
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all duration-300", strength.color)}
                style={{ width: `${strengthPercentage}%` }}
              />
            </div>
          </div>
        )}

        {showRequirements && value.length > 0 && (
          <div className="space-y-1.5 text-xs">
            {updatedRequirements.map((req, index) => (
              <div
                key={index}
                className={cn("flex items-center gap-2 transition-colors", {
                  "text-green-600 dark:text-green-500": req.met,
                  "text-muted-foreground": !req.met,
                })}
              >
                {req.met ? (
                  <Check className="h-3.5 w-3.5 flex-shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                <span>{req.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
