import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Upload, FileText, ArrowLeft } from "lucide-react";
import { AppMenu } from "@/components/AppMenu";

// TEMPORÁRIO: Bypass de autenticação para análise por IAs
const BYPASS_AUTH = true;

const ImportCSV = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (BYPASS_AUTH) {
      // Mock user para bypass
      setUser({ id: 'demo-user', email: 'demo@finmanage.com' } as User);
      return;
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['.csv', '.ofx'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!validTypes.includes(fileExtension)) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo CSV ou OFX.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 20MB)
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 20MB.",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('profile_id', user.id);

      const { data, error } = await supabase.functions.invoke('import-csv', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Importação concluída!",
        description: `${data.inserted} transações importadas, ${data.duplicates} duplicadas ignoradas${data.failed > 0 ? `, ${data.failed} falharam` : ''}.`,
      });

      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Erro ao importar",
        description: error.message || "Ocorreu um erro ao processar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">FinManage</h1>
          <AppMenu user={user} />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-6 w-6" />
                Importar Extrato Bancário
              </CardTitle>
              <CardDescription>
                Faça upload de um arquivo CSV ou OFX para importar suas transações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-input">Selecione o arquivo</Label>
                  <Input
                    id="file-input"
                    type="file"
                    accept=".csv,.ofx"
                    onChange={handleFileChange}
                    disabled={importing}
                  />
                  <p className="text-sm text-muted-foreground">
                    Formatos aceitos: CSV, OFX (máximo 20MB)
                  </p>
                </div>

                {file && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Formato do arquivo CSV</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  O arquivo CSV deve conter as seguintes colunas:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><strong>date</strong>: Data da transação (DD/MM/AAAA ou AAAA-MM-DD)</li>
                  <li><strong>amount</strong>: Valor da transação (use ponto como separador decimal)</li>
                  <li><strong>description</strong>: Descrição da transação</li>
                  <li><strong>merchant</strong> (opcional): Nome do estabelecimento</li>
                  <li><strong>currency</strong> (opcional): Moeda (padrão: BRL)</li>
                  <li><strong>type</strong> (opcional): income ou expense</li>
                  <li><strong>category</strong> (opcional): Categoria da transação</li>
                </ul>
              </div>

              <Button
                onClick={handleImport}
                disabled={!file || importing}
                className="w-full"
              >
                {importing ? "Importando..." : "Importar Transações"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ImportCSV;
