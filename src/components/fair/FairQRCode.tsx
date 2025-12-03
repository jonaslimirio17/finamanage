import { useRef, forwardRef, useImperativeHandle } from "react";
import { QRCode } from "react-qrcode-logo";
import wheelIcon from "@/assets/wheel-icon.png";

interface FairQRCodeProps {
  size?: number;
  utmSource?: string;
  utmCampaign?: string;
  utmMedium?: string;
  showFrame?: boolean;
  baseUrl?: string;
}

export interface FairQRCodeRef {
  download: (filename?: string) => void;
}

export const FairQRCode = forwardRef<FairQRCodeRef, FairQRCodeProps>(
  (
    {
      size = 300,
      utmSource = "qrcode",
      utmCampaign = "feira_empreendedorismo_2025",
      utmMedium = "print",
      showFrame = true,
      baseUrl = window.location.origin,
    },
    ref
  ) => {
    const qrRef = useRef<QRCode>(null);

    const qrUrl = `${baseUrl}/feira?utm_source=${utmSource}&utm_campaign=${utmCampaign}&utm_medium=${utmMedium}`;

    useImperativeHandle(ref, () => ({
      download: (filename = "finamanage-feira-qrcode") => {
        const canvas = document.querySelector("#fair-qrcode canvas") as HTMLCanvasElement;
        if (canvas) {
          const link = document.createElement("a");
          link.download = `${filename}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        }
      },
    }));

    return (
      <div className="flex flex-col items-center gap-4">
        {showFrame ? (
          <div className="bg-white p-6 rounded-2xl shadow-xl border-4 border-primary">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">🎡 Gire a Roleta!</h3>
              <p className="text-sm text-gray-600">Ganhe descontos exclusivos</p>
            </div>
            <div id="fair-qrcode" className="flex justify-center">
              <QRCode
                ref={qrRef}
                value={qrUrl}
                size={size}
                logoImage={wheelIcon}
                logoWidth={size * 0.25}
                logoHeight={size * 0.25}
                logoOpacity={1}
                qrStyle="dots"
                eyeRadius={8}
                fgColor="#221E1F"
                bgColor="#FFFFFF"
                removeQrCodeBehindLogo={true}
              />
            </div>
            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">Aponte a câmera e participe!</p>
              <p className="text-sm font-semibold text-primary mt-1">finamanage.com/feira</p>
            </div>
          </div>
        ) : (
          <div id="fair-qrcode" className="bg-white p-4 rounded-lg">
            <QRCode
              ref={qrRef}
              value={qrUrl}
              size={size}
              logoImage={wheelIcon}
              logoWidth={size * 0.25}
              logoHeight={size * 0.25}
              logoOpacity={1}
              qrStyle="dots"
              eyeRadius={8}
              fgColor="#221E1F"
              bgColor="#FFFFFF"
              removeQrCodeBehindLogo={true}
            />
          </div>
        )}
      </div>
    );
  }
);

FairQRCode.displayName = "FairQRCode";
