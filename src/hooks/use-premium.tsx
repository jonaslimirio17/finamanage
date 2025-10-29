import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const usePremium = () => {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsPremium(false);
          setIsLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("subscription_plan, subscription_expires_at")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        const isUserPremium = profile?.subscription_plan === "premium" && 
          (!profile?.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date());

        setIsPremium(isUserPremium);
      } catch (error) {
        console.error("Error checking premium status:", error);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, []);

  const requirePremium = () => {
    if (isLoading) return false;
    
    if (!isPremium) {
      toast({
        title: "Conteúdo Premium",
        description: "Esta página é exclusiva para assinantes Premium. Faça upgrade do seu plano!",
        variant: "destructive",
      });
      navigate("/plans");
      return false;
    }
    
    return true;
  };

  return { isPremium, isLoading, requirePremium };
};
