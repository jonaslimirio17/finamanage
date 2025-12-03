import { useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Download, Monitor, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { FairSlide } from "@/components/fair/FairSlide";

const FairSlidePage = () => {
  const [utmSource, setUtmSource] = useState("qrcode");
  const [utmCampaign, setUtmCampaign] = useState("feira_empreendedorismo_2025");
  const [utmMedium, setUtmMedium] = useState("slide");
  const [variant, setVariant] = useState<"dark" | "light">("dark");
  const [isExporting, setIsExporting] = useState(false);

  const slideContainerRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async (scale: number, filename: string) => {
    const slideElement = document.getElementById("fair-slide-export");
    if (!slideElement) return;

    setIsExporting(true);

    try {
      const canvas = await html2canvas(slideElement, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (error) {
      console.error("Error exporting slide:", error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Slide Promocional | Feira FinaManage</title>
        <meta
          name="description"
          content="Gere e baixe o slide promocional para a Feira de Empreendedorismo"
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <Link
          to="/feira/qrcode"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para QR Code
        </Link>

        <h1 className="text-3xl font-bold mb-8">Slide Promocional da Feira</h1>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Preview area */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Preview (16:9)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Scaled preview container */}
                <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted">
                  <div className="aspect-video w-full overflow-hidden">
                    <div
                      ref={slideContainerRef}
                      style={{
                        transform: "scale(0.35)",
                        transformOrigin: "top left",
                        width: "1920px",
                        height: "1080px",
                      }}
                    >
                      <div id="fair-slide-export">
                        <FairSlide
                          utmSource={utmSource}
                          utmCampaign={utmCampaign}
                          utmMedium={utmMedium}
                          variant={variant}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Download buttons */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleDownload(1, "slide-feira-1920x1080")}
                    disabled={isExporting}
                    className="w-full"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Full HD (1920×1080)
                  </Button>
                  <Button
                    onClick={() => handleDownload(2, "slide-feira-3840x2160")}
                    disabled={isExporting}
                    variant="outline"
                    className="w-full"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    4K (3840×2160)
                  </Button>
                  <Button
                    onClick={() => handleDownload(1.5, "slide-feira-2880x1620")}
                    disabled={isExporting}
                    variant="secondary"
                    className="w-full"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    2K (2880×1620)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <div className="xl:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="variant-toggle">Tema Escuro</Label>
                  <Switch
                    id="variant-toggle"
                    checked={variant === "dark"}
                    onCheckedChange={(checked) =>
                      setVariant(checked ? "dark" : "light")
                    }
                  />
                </div>

                {/* UTM Parameters */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="utm-source">UTM Source</Label>
                    <Input
                      id="utm-source"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      placeholder="qrcode"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utm-campaign">UTM Campaign</Label>
                    <Input
                      id="utm-campaign"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      placeholder="feira_empreendedorismo_2025"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utm-medium">UTM Medium</Label>
                    <Input
                      id="utm-medium"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      placeholder="slide"
                    />
                  </div>
                </div>

                {/* URL Preview */}
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">URL do QR Code:</p>
                  <code className="text-xs break-all text-foreground">
                    {`${window.location.origin}/feira?utm_source=${utmSource}&utm_campaign=${utmCampaign}&utm_medium=${utmMedium}`}
                  </code>
                </div>

                {/* Usage tips */}
                <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-foreground">Dicas de uso:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>Full HD:</strong> Ideal para monitores e TVs</li>
                    <li>• <strong>4K:</strong> Para projetores de alta resolução</li>
                    <li>• <strong>2K:</strong> Equilíbrio entre qualidade e tamanho</li>
                  </ul>
                </div>

                {/* Link to QR page */}
                <Link to="/feira/qrcode">
                  <Button variant="outline" className="w-full">
                    Baixar apenas o QR Code
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FairSlidePage;
