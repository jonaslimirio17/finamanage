import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Upload, FileText, ArrowLeft, Camera, PenLine, Image, Loader2 } from "lucide-react";
import { AppMenu } from "@/components/AppMenu";
import { Logo } from "@/components/Logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ImportStatement = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    description: "",
    merchant: "",
    type: "expense" as "expense" | "income",
    category: "",
  });
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.toLowerCase().endsWith('.heic')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione uma imagem (JPG, PNG, WEBP).",
          variant: "destructive",
        });
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }

      setImageFile(selectedFile);
      setExtractedData(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const processReceiptImage = async () => {
    if (!imageFile || !user) return;

    setProcessingImage(true);
    setExtractedData(null);

    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(imageFile);
      });
      
      const imageBase64 = await base64Promise;

      // Call the extract-receipt-data edge function
      const { data, error } = await supabase.functions.invoke('extract-receipt-data', {
        body: { imageBase64 },
      });

      if (error) throw error;

      if (data) {
        setExtractedData(data);
        toast({
          title: "Recibo processado!",
          description: "Verifique os dados extraídos e confirme.",
        });
      }
    } catch (error: any) {
      console.error('Error processing receipt:', error);
      toast({
        title: "Erro ao processar",
        description: error.message || "Não foi possível extrair dados do recibo.",
        variant: "destructive",
      });
    } finally {
      setProcessingImage(false);
    }
  };

  const saveExtractedData = async () => {
    if (!extractedData || !user) return;

    setSavingManual(true);

    try {
      // Get or create account
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('profile_id', user.id)
        .limit(1);

      let accountId: string;
      
      if (accounts && accounts.length > 0) {
        accountId = accounts[0].id;
      } else {
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert({
            profile_id: user.id,
            provider: 'manual',
            provider_account_id: `manual_${user.id}`,
            account_type: 'checking',
            balance: 0,
          })
          .select('id')
          .single();

        if (accountError) throw accountError;
        accountId = newAccount.id;
      }

      // Insert transaction - map expense/income to debit/credit
      const dbType = (extractedData.type === 'income' || extractedData.type === 'credit') ? 'credit' : 'debit';
      
      // Validate extracted date - use current date if too old (> 1 year)
      let finalDate = new Date().toISOString().split('T')[0];
      if (extractedData.date) {
        const extractedDate = new Date(extractedData.date);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        if (extractedDate >= oneYearAgo && extractedDate <= new Date()) {
          finalDate = extractedData.date;
        }
      }
      
      const { error } = await supabase.from('transactions').insert({
        profile_id: user.id,
        account_id: accountId,
        date: finalDate,
        amount: Math.abs(extractedData.amount || 0),
        type: dbType,
        merchant: extractedData.merchant || null,
        category: extractedData.category || 'Sem categoria',
        raw_description: extractedData.raw_description || '',
        imported_from: 'receipt_photo',
        currency: 'BRL',
      });

      if (error) throw error;

      toast({
        title: "Transação salva!",
        description: "A transação foi adicionada com sucesso. Redirecionando...",
      });

      // Reset
      setImageFile(null);
      setImagePreview(null);
      setExtractedData(null);

      // Redirect to dashboard to show updated data
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a transação.",
        variant: "destructive",
      });
    } finally {
      setSavingManual(false);
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
      
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!manualForm.amount || !manualForm.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o valor e a descrição.",
        variant: "destructive",
      });
      return;
    }

    setSavingManual(true);

    try {
      // Get or create account
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('profile_id', user.id)
        .limit(1);

      let accountId: string;
      
      if (accounts && accounts.length > 0) {
        accountId = accounts[0].id;
      } else {
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert({
            profile_id: user.id,
            provider: 'manual',
            provider_account_id: `manual_${user.id}`,
            account_type: 'checking',
            balance: 0,
          })
          .select('id')
          .single();

        if (accountError) throw accountError;
        accountId = newAccount.id;
      }

      // Insert transaction - map expense/income to debit/credit
      const dbType = manualForm.type === 'income' ? 'credit' : 'debit';
      
      const { error } = await supabase.from('transactions').insert({
        profile_id: user.id,
        account_id: accountId,
        date: manualForm.date,
        amount: Math.abs(parseFloat(manualForm.amount)),
        type: dbType,
        merchant: manualForm.merchant || null,
        category: manualForm.category || 'Sem categoria',
        raw_description: manualForm.description,
        imported_from: 'manual',
        currency: 'BRL',
      });

      if (error) throw error;

      toast({
        title: "Transação adicionada!",
        description: "A transação foi salva com sucesso.",
      });

      // Reset form
      setManualForm({
        date: new Date().toISOString().split('T')[0],
        amount: "",
        description: "",
        merchant: "",
        type: "expense",
        category: "",
      });

    } catch (error: any) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a transação.",
        variant: "destructive",
      });
    } finally {
      setSavingManual(false);
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
          <Logo />
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
              <CardTitle>Adicionar Transações</CardTitle>
              <CardDescription>
                Escolha como deseja adicionar suas transações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Extrato</span>
                  </TabsTrigger>
                  <TabsTrigger value="photo" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    <span className="hidden sm:inline">Foto/Recibo</span>
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="flex items-center gap-2">
                    <PenLine className="h-4 w-4" />
                    <span className="hidden sm:inline">Manual</span>
                  </TabsTrigger>
                </TabsList>

                {/* File Import Tab */}
                <TabsContent value="file" className="space-y-6">
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
                      <li><strong>amount</strong>: Valor da transação</li>
                      <li><strong>description</strong>: Descrição da transação</li>
                      <li><strong>merchant</strong> (opcional): Nome do estabelecimento</li>
                      <li><strong>type</strong> (opcional): income ou expense</li>
                      <li><strong>category</strong> (opcional): Categoria</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleImport}
                    disabled={!file || importing}
                    className="w-full"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      "Importar Transações"
                    )}
                  </Button>
                </TabsContent>

                {/* Photo/Receipt Tab */}
                <TabsContent value="photo" className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="image-input" className="cursor-pointer">
                          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                            <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Upload de Imagem</p>
                          </div>
                        </Label>
                        <Input
                          id="image-input"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={processingImage}
                        />
                      </div>
                      
                      <div>
                        <div 
                          onClick={handleCameraCapture}
                          className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                        >
                          <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Tirar Foto</p>
                        </div>
                        <Input
                          ref={cameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={processingImage}
                        />
                      </div>
                    </div>

                    {imagePreview && (
                      <div className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden border border-border">
                          <img 
                            src={imagePreview} 
                            alt="Preview do recibo" 
                            className="w-full max-h-64 object-contain bg-muted"
                          />
                        </div>
                        
                        {!extractedData && (
                          <Button
                            onClick={processReceiptImage}
                            disabled={processingImage}
                            className="w-full"
                          >
                            {processingImage ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                              </>
                            ) : (
                              "Processar Recibo"
                            )}
                          </Button>
                        )}
                      </div>
                    )}

                    {extractedData && (
                      <div className="space-y-4 p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold">Dados Extraídos</h4>
                        <div className="grid gap-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Data:</span>
                            <span>{extractedData.date || 'Não identificada'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor:</span>
                            <span>R$ {extractedData.amount?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Estabelecimento:</span>
                            <span>{extractedData.merchant || 'Não identificado'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Categoria:</span>
                            <span>{extractedData.category || 'Sem categoria'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tipo:</span>
                            <span>{extractedData.type === 'income' ? 'Receita' : 'Despesa'}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setExtractedData(null);
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={saveExtractedData}
                            disabled={savingManual}
                            className="flex-1"
                          >
                            {savingManual ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              "Confirmar"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Manual Entry Tab */}
                <TabsContent value="manual">
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="manual-date">Data *</Label>
                        <Input
                          id="manual-date"
                          type="date"
                          value={manualForm.date}
                          onChange={(e) => setManualForm(prev => ({ ...prev, date: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-type">Tipo *</Label>
                        <Select
                          value={manualForm.type}
                          onValueChange={(value: "expense" | "income") => 
                            setManualForm(prev => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger id="manual-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expense">Despesa</SelectItem>
                            <SelectItem value="income">Receita</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manual-amount">Valor (R$) *</Label>
                      <Input
                        id="manual-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={manualForm.amount}
                        onChange={(e) => setManualForm(prev => ({ ...prev, amount: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manual-description">Descrição *</Label>
                      <Textarea
                        id="manual-description"
                        placeholder="Ex: Compras do mês no supermercado"
                        value={manualForm.description}
                        onChange={(e) => setManualForm(prev => ({ ...prev, description: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="manual-merchant">Estabelecimento</Label>
                        <Input
                          id="manual-merchant"
                          placeholder="Ex: Carrefour"
                          value={manualForm.merchant}
                          onChange={(e) => setManualForm(prev => ({ ...prev, merchant: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-category">Categoria</Label>
                        <Select
                          value={manualForm.category}
                          onValueChange={(value) => 
                            setManualForm(prev => ({ ...prev, category: value }))
                          }
                        >
                          <SelectTrigger id="manual-category">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Alimentação">Alimentação</SelectItem>
                            <SelectItem value="Transporte">Transporte</SelectItem>
                            <SelectItem value="Moradia">Moradia</SelectItem>
                            <SelectItem value="Saúde">Saúde</SelectItem>
                            <SelectItem value="Educação">Educação</SelectItem>
                            <SelectItem value="Lazer">Lazer</SelectItem>
                            <SelectItem value="Compras">Compras</SelectItem>
                            <SelectItem value="Salário">Salário</SelectItem>
                            <SelectItem value="Investimentos">Investimentos</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={savingManual}
                      className="w-full"
                    >
                      {savingManual ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Adicionar Transação"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ImportStatement;
