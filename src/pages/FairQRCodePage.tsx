import { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Download, QrCode, Settings, ArrowLeft } from "lucide-react";
import { FairQRCode, FairQRCodeRef } from "@/components/fair/FairQRCode";
import { Link } from "react-router-dom";

const FairQRCodePage = () => {
  const [utmSource, setUtmSource] = useState("qrcode");
  const [utmCampaign, setUtmCampaign] = useState("feira_empreendedorismo_2025");
  const [utmMedium, setUtmMedium] = useState("print");
  const [showFrame, setShowFrame] = useState(true);
  const [size, setSize] = useState<300 | 600 | 1200>(300);

  const qrRef = useRef<FairQRCodeRef>(null);

  const handleDownload = () => {
    const sizeLabel = size === 300 ? "small" : size === 600 ? "medium" : "large";
    qrRef.current?.download(`finamanage-feira-qrcode-${sizeLabel}`);
  };

  const sizeOptions = [
    { value: 300, label: "Pequeno (300px)", desc: "Redes sociais" },
    { value: 600, label: "Médio (600px)", desc: "Flyers, cartões" },
    { value: 1200, label: "Grande (1200px)", desc: "Banners, posters" },
  ] as const;

  return (
    <>
      <Helmet>
        <title>QR Code da Feira | FinaManage</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/feira"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a feira
          </Link>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <QrCode className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">QR Code da Feira</h1>
            </div>
            <p className="text-muted-foreground">
              Gere e baixe o QR code com a roleta para seus materiais impressos
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Preview */}
            <div className="flex flex-col items-center justify-center">
              <FairQRCode
                ref={qrRef}
                size={size}
                utmSource={utmSource}
                utmCampaign={utmCampaign}
                utmMedium={utmMedium}
                showFrame={showFrame}
              />
              <Button onClick={handleDownload} className="mt-6 gap-2" size="lg">
                <Download className="h-5 w-5" />
                Baixar QR Code
              </Button>
            </div>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Size Selection */}
                <div className="space-y-3">
                  <Label>Tamanho</Label>
                  <div className="grid gap-2">
                    {sizeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSize(option.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          size === option.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium">{option.label}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          - {option.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frame Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Moldura decorativa</Label>
                    <p className="text-sm text-muted-foreground">
                      Inclui título e texto explicativo
                    </p>
                  </div>
                  <Switch checked={showFrame} onCheckedChange={setShowFrame} />
                </div>

                {/* UTM Parameters */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Parâmetros UTM (rastreamento)
                  </h4>

                  <div className="space-y-2">
                    <Label htmlFor="utm_source">UTM Source</Label>
                    <Input
                      id="utm_source"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      placeholder="qrcode"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utm_campaign">UTM Campaign</Label>
                    <Input
                      id="utm_campaign"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      placeholder="feira_empreendedorismo_2025"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utm_medium">UTM Medium</Label>
                    <Input
                      id="utm_medium"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      placeholder="print"
                    />
                  </div>
                </div>

                {/* Generated URL Preview */}
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground">URL gerada:</Label>
                  <p className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                    {window.location.origin}/feira?utm_source={utmSource}&utm_campaign=
                    {utmCampaign}&utm_medium={utmMedium}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default FairQRCodePage;
