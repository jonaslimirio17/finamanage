import { QRCode } from "react-qrcode-logo";
import wheelIcon from "@/assets/wheel-icon.png";
import finamanageLogo from "@/assets/finamanage-logo-white.png";

interface FairSlideProps {
  utmSource?: string;
  utmCampaign?: string;
  utmMedium?: string;
  variant?: "dark" | "light";
  baseUrl?: string;
}

export const FairSlide = ({
  utmSource = "qrcode",
  utmCampaign = "feira_empreendedorismo_2025",
  utmMedium = "slide",
  variant = "dark",
  baseUrl = window.location.origin,
}: FairSlideProps) => {
  const isDark = variant === "dark";
  const qrUrl = `${baseUrl}/feira?utm_source=${utmSource}&utm_campaign=${utmCampaign}&utm_medium=${utmMedium}`;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: "1920px",
        height: "1080px",
        background: isDark
          ? "linear-gradient(135deg, #221E1F 0%, #1a1718 40%, #2d4a5e 100%)"
          : "linear-gradient(135deg, #EDE8DE 0%, #f5f2ec 40%, #d4e8f5 100%)",
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
        style={{ background: "#65C6F4" }}
      />
      <div
        className="absolute -bottom-48 -right-48 w-[600px] h-[600px] rounded-full opacity-15"
        style={{ background: "#65C6F4" }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full opacity-10"
        style={{ background: "#9b59b6" }}
      />

      {/* Main content container */}
      <div className="relative z-10 h-full flex">
        {/* Left side - Information (60%) */}
        <div className="w-[60%] h-full flex flex-col justify-center px-24">
          {/* Logo */}
          <img
            src={finamanageLogo}
            alt="FinaManage"
            className="h-16 w-auto mb-12 object-contain"
            style={{ maxWidth: "280px" }}
          />

          {/* Main headline */}
          <h1
            className="text-7xl font-bold mb-6 leading-tight"
            style={{
              fontFamily: "Poppins, sans-serif",
              color: isDark ? "#EDE8DE" : "#221E1F",
            }}
          >
            🎡 GIRE A ROLETA
            <br />
            <span style={{ color: "#65C6F4" }}>E GANHE PRÊMIOS!</span>
          </h1>

          {/* Benefits list */}
          <div className="space-y-4 mt-8">
            <div
              className="flex items-center gap-4 text-3xl"
              style={{
                fontFamily: "Poppins, sans-serif",
                color: isDark ? "#EDE8DE" : "#221E1F",
              }}
            >
              <span
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: "#9b59b6" }}
              >
                ✨
              </span>
              <span>
                Até <strong style={{ color: "#65C6F4" }}>3 meses GRÁTIS</strong>
              </span>
            </div>
            <div
              className="flex items-center gap-4 text-3xl"
              style={{
                fontFamily: "Poppins, sans-serif",
                color: isDark ? "#EDE8DE" : "#221E1F",
              }}
            >
              <span
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: "#2ecc71" }}
              >
                💰
              </span>
              <span>
                Até <strong style={{ color: "#65C6F4" }}>50% de desconto</strong>
              </span>
            </div>
            <div
              className="flex items-center gap-4 text-3xl"
              style={{
                fontFamily: "Poppins, sans-serif",
                color: isDark ? "#EDE8DE" : "#221E1F",
              }}
            >
              <span
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: "#f1c40f" }}
              >
                🎯
              </span>
              <span>
                <strong style={{ color: "#65C6F4" }}>100%</strong> de chance de ganhar!
              </span>
            </div>
          </div>

          {/* Tagline */}
          <p
            className="text-2xl mt-12 opacity-80"
            style={{
              fontFamily: "Poppins, sans-serif",
              color: isDark ? "#EDE8DE" : "#221E1F",
            }}
          >
            Gestão financeira inteligente para universitários
          </p>
        </div>

        {/* Right side - QR Code (40%) */}
        <div className="w-[40%] h-full flex flex-col items-center justify-center pr-16">
          <div
            className="p-10 rounded-3xl shadow-2xl"
            style={{
              background: isDark ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,1)",
              boxShadow: "0 25px 80px rgba(101, 198, 244, 0.4)",
            }}
          >
            <QRCode
              value={qrUrl}
              size={380}
              logoImage={wheelIcon}
              logoWidth={95}
              logoHeight={95}
              logoOpacity={1}
              qrStyle="dots"
              eyeRadius={8}
              fgColor="#221E1F"
              bgColor="#FFFFFF"
              removeQrCodeBehindLogo={true}
            />
          </div>

          {/* Instructions */}
          <div
            className="mt-8 text-center"
            style={{
              fontFamily: "Poppins, sans-serif",
              color: isDark ? "#EDE8DE" : "#221E1F",
            }}
          >
            <p className="text-3xl font-semibold mb-2">
              📱 Aponte a câmera
            </p>
            <p className="text-2xl" style={{ color: "#65C6F4" }}>
              finamanage.com/feira
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0 py-6 px-24 flex items-center justify-between"
        style={{
          background: isDark
            ? "linear-gradient(90deg, rgba(101,198,244,0.2) 0%, rgba(155,89,182,0.2) 100%)"
            : "linear-gradient(90deg, rgba(101,198,244,0.3) 0%, rgba(155,89,182,0.3) 100%)",
        }}
      >
        <p
          className="text-2xl font-medium"
          style={{
            fontFamily: "Poppins, sans-serif",
            color: isDark ? "#EDE8DE" : "#221E1F",
          }}
        >
          🎓 Feira de Empreendedorismo 2025
        </p>
        <div className="flex items-center gap-6">
          <span
            className="px-4 py-2 rounded-full text-xl font-medium"
            style={{ background: "#9b59b6", color: "#fff" }}
          >
            3 meses grátis
          </span>
          <span
            className="px-4 py-2 rounded-full text-xl font-medium"
            style={{ background: "#2ecc71", color: "#fff" }}
          >
            1 mês grátis
          </span>
          <span
            className="px-4 py-2 rounded-full text-xl font-medium"
            style={{ background: "#f1c40f", color: "#221E1F" }}
          >
            50% off
          </span>
          <span
            className="px-4 py-2 rounded-full text-xl font-medium"
            style={{ background: "#e74c3c", color: "#fff" }}
          >
            30% off
          </span>
          <span
            className="px-4 py-2 rounded-full text-xl font-medium"
            style={{ background: "#65C6F4", color: "#221E1F" }}
          >
            10% off
          </span>
        </div>
      </div>
    </div>
  );
};
