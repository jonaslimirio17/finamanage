import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PasswordInput } from "@/components/ui/password-input";
import { Mail, Lock } from "lucide-react";
import { checkPasswordLeaked } from "@/lib/passwordValidation";
import { TwoFactorVerification } from "@/components/auth/TwoFactorVerification";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [phone, setPhone] = useState("");
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Check if it's a password recovery flow
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setIsResettingPassword(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      }
      if (session && event !== 'PASSWORD_RECOVERY') {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedPrivacyPolicy) {
      toast({
        title: "Política de Privacidade",
        description: "Você precisa aceitar a Política de Privacidade para criar uma conta.",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: "Senha inválida",
        description: "Por favor, atenda a todos os requisitos de senha.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if password has been leaked
      const leakCheck = await checkPasswordLeaked(password);
      
      if (leakCheck.leaked) {
        toast({
          title: "⚠️ Senha Comprometida",
          description: leakCheck.message || "Esta senha foi encontrada em vazamentos de dados. Por favor, escolha uma senha diferente.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            nome: nome,
            phone: phone,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao FinaManage.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if error is MFA required
        if (error.message?.includes('MFA') || error.message?.includes('factor')) {
          throw error;
        }
        throw error;
      }

      // Check if MFA is required
      if (data.user) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verifiedFactor = factors?.totp?.find((f: any) => f.status === 'verified');
        
        if (verifiedFactor) {
          setMfaFactorId(verifiedFactor.id);
          setShowMFAVerification(true);
          setLoading(false);
          return;
        }
      }

      toast({
        title: "Login realizado!",
        description: "Redirecionando para o dashboard...",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMFAVerified = () => {
    toast({
      title: "Login realizado!",
      description: "Redirecionando para o dashboard...",
    });
    navigate("/dashboard");
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "E-mail enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, verifique se as senhas são iguais.",
        variant: "destructive",
      });
      return;
    }

    if (!isNewPasswordValid) {
      toast({
        title: "Senha inválida",
        description: "Por favor, atenda a todos os requisitos de senha.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if password has been leaked
      const leakCheck = await checkPasswordLeaked(newPassword);
      
      if (leakCheck.leaked) {
        toast({
          title: "⚠️ Senha Comprometida",
          description: leakCheck.message || "Esta senha foi encontrada em vazamentos de dados. Por favor, escolha uma senha diferente.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi alterada com sucesso. Você já pode fazer login.",
      });
      
      setIsResettingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showMFAVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <TwoFactorVerification
          factorId={mfaFactorId}
          onVerified={handleMFAVerified}
          onBack={() => {
            setShowMFAVerification(false);
            setMfaFactorId("");
          }}
        />
      </div>
    );
  }

  if (isResettingPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Redefinir Senha</CardTitle>
            <CardDescription className="text-center">
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <PasswordInput
                  id="new-password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={setNewPassword}
                  onValidationChange={setIsNewPasswordValid}
                  showRequirements={true}
                  showStrengthBar={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <PasswordInput
                  id="confirm-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  onValidationChange={setIsConfirmPasswordValid}
                  showRequirements={false}
                  showStrengthBar={false}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !isNewPasswordValid || !isConfirmPasswordValid || newPassword !== confirmPassword}
              >
                {loading ? "Atualizando..." : "Atualizar senha"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setIsResettingPassword(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Voltar para login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">FinaManage</CardTitle>
          <CardDescription className="text-center">
            Gerencie suas finanças de forma inteligente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Link 
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline block w-full text-right"
                >
                  Esqueci minha senha
                </Link>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nome">Nome completo</Label>
                  <Input
                    id="signup-nome"
                    type="text"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Celular</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <PasswordInput
                    id="signup-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                    onValidationChange={setIsPasswordValid}
                    showRequirements={true}
                    showStrengthBar={true}
                  />
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy-policy"
                    checked={acceptedPrivacyPolicy}
                    onCheckedChange={(checked) => setAcceptedPrivacyPolicy(checked as boolean)}
                  />
                  <label
                    htmlFor="privacy-policy"
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    Li e aceito a{" "}
                    <Link
                      to="/privacy-policy"
                      className="text-primary hover:underline"
                      target="_blank"
                    >
                      Política de Privacidade
                    </Link>
                  </label>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !isPasswordValid || !acceptedPrivacyPolicy}
                >
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
