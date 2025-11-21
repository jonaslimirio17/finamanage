import { z } from "zod";

// Password validation schema with comprehensive security requirements
export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(128, "A senha deve ter no máximo 128 caracteres")
  .refine((password) => /[a-z]/.test(password), {
    message: "A senha deve conter pelo menos uma letra minúscula",
  })
  .refine((password) => /[A-Z]/.test(password), {
    message: "A senha deve conter pelo menos uma letra maiúscula",
  })
  .refine((password) => /[0-9]/.test(password), {
    message: "A senha deve conter pelo menos um número",
  })
  .refine((password) => /[^a-zA-Z0-9]/.test(password), {
    message: "A senha deve conter pelo menos um caractere especial",
  });

// Check if password is leaked using HaveIBeenPwned API via our edge function
export async function checkPasswordLeaked(password: string): Promise<{
  leaked: boolean;
  count?: number;
  message?: string;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-leaked-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ password }),
      }
    );

    if (!response.ok) {
      throw new Error('Falha ao verificar senha');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking password:', error);
    // Fail open: if we can't check, allow the password
    // This prevents service disruption while maintaining security
    return { leaked: false, error: 'Não foi possível verificar a senha no momento' };
  }
}

// Get password strength level (0-4)
export function getPasswordStrength(password: string): number {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  return Math.min(strength, 4);
}

// Get password strength label and color
export function getPasswordStrengthInfo(strength: number): {
  label: string;
  color: string;
} {
  const strengthMap = {
    0: { label: 'Muito fraca', color: 'bg-destructive' },
    1: { label: 'Fraca', color: 'bg-destructive' },
    2: { label: 'Média', color: 'bg-yellow-500' },
    3: { label: 'Forte', color: 'bg-primary' },
    4: { label: 'Muito forte', color: 'bg-green-500' },
  };
  
  return strengthMap[strength as keyof typeof strengthMap] || strengthMap[0];
}

// Validate password against all requirements
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const result = passwordSchema.safeParse(password);
  
  if (result.success) {
    return { isValid: true, errors: [] };
  }
  
  return {
    isValid: false,
    errors: result.error.errors.map((err) => err.message),
  };
}
