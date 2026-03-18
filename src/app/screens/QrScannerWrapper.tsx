import { useState } from "react";
import { useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";
import { useLanguage } from "../contexts/LanguageContext";

export default function QrScannerWrapper() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleScan = () => {
    setScanning(true);
    // Simulate scanning
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
      setTimeout(() => setScanned(false), 3000);
    }, 2000);
  };

  return (
    <div className="bg-[#0f172a] content-stretch flex flex-col items-start relative size-full">
      <div className="content-stretch flex flex-col items-center justify-between p-[24px] relative size-full">
        {/* Header */}
        <div className="w-full flex items-center justify-between pt-[24px]">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center justify-center size-[40px] bg-[rgba(255,255,255,0.1)] rounded-full hover:bg-[rgba(255,255,255,0.2)] active:scale-95 transition-all"
          >
            <svg className="w-3 h-5" fill="none" viewBox="0 0 12 20" stroke="white" strokeWidth="2">
              <path d="M11 1L1 10L11 19" />
            </svg>
          </button>

          <div className="flex flex-col items-center">
            <p className="font-['Public_Sans'] font-bold text-white text-[18px] leading-[22.5px]">{t("QR 스캐너", "QR Scanner")}</p>
            <p className="font-['Public_Sans'] font-bold text-[#64748b] text-[12px] leading-[16px] tracking-[1px] uppercase">
              {t("버스 탑승하기", "Board Your Bus")}
            </p>
          </div>

          <div className="w-[40px]" />
        </div>

        {/* Scanner Area */}
        <div className="flex-1 flex items-center justify-center w-full max-w-[300px]">
          <div className="relative w-full aspect-square">
            {/* Scanner Frame */}
            <div className="absolute inset-0 border-4 border-white/30 rounded-[24px]">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-[40px] h-[40px] border-t-4 border-l-4 border-white rounded-tl-[20px]" />
              <div className="absolute top-0 right-0 w-[40px] h-[40px] border-t-4 border-r-4 border-white rounded-tr-[20px]" />
              <div className="absolute bottom-0 left-0 w-[40px] h-[40px] border-b-4 border-l-4 border-white rounded-bl-[20px]" />
              <div className="absolute bottom-0 right-0 w-[40px] h-[40px] border-b-4 border-r-4 border-white rounded-br-[20px]" />

              {/* Scanning Line */}
              {scanning && (
                <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-white to-transparent animate-scan" />
              )}

              {/* Success Overlay */}
              {scanned && (
                <div className="absolute inset-0 bg-green-500/20 rounded-[20px] flex items-center justify-center backdrop-blur-sm">
                  <div className="bg-green-500 rounded-full p-4">
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* QR Grid Pattern */}
            <div className="absolute inset-[20px] grid grid-cols-8 grid-rows-8 gap-1 opacity-30">
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  className={`${Math.random() > 0.5 ? "bg-white" : "bg-transparent"} rounded-sm`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="w-full space-y-6 pb-[100px]">
          <div className="text-center space-y-2">
            <p className="font-['Public_Sans'] font-bold text-white text-[20px] leading-[28px]">
              {scanning ? t("스캔 중...", "Scanning...") : scanned ? t("탑승 확인 완료!", "Boarding Confirmed!") : t("QR 코드 스캔", "Scan QR Code")}
            </p>
            <p className="font-['Public_Sans'] font-normal text-[#94a3b8] text-[14px] leading-[20px]">
              {scanning
                ? t("화면을 고정해주세요", "Please hold steady")
                : scanned
                ? t("SCH-01 버스에 오신 것을 환영합니다", "Welcome aboard SCH-01")
                : t("프레임 안에 QR 코드를 맞춰주세요", "Align the QR code within the frame")}
            </p>
          </div>

          {!scanning && !scanned && (
            <button
              onClick={handleScan}
              className="w-full bg-[#1e3a8a] h-[56px] rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(30,59,138,0.2)] hover:bg-[#1e3a8a]/90 active:scale-[0.98] transition-all"
            >
              <p className="font-['Public_Sans'] font-bold text-white text-[16px] leading-[24px]">
                {t("스캔 시작", "Start Scanning")}
              </p>
            </button>
          )}

          <div className="bg-[rgba(255,255,255,0.05)] rounded-[16px] p-4 space-y-3">
            <p className="font-['Public_Sans'] font-bold text-white text-[14px] leading-[20px]">
              {t("사용 방법:", "How to use:")}
            </p>
            <ul className="space-y-2">
              <li className="flex gap-3">
                <span className="font-['Public_Sans'] font-bold text-[#1e3a8a] text-[14px]">1.</span>
                <span className="font-['Public_Sans'] font-normal text-[#cbd5e1] text-[14px] leading-[20px]">
                  {t("이 화면을 버스 운전사에게 보여주세요", "Show this screen to the bus driver")}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-['Public_Sans'] font-bold text-[#1e3a8a] text-[14px]">2.</span>
                <span className="font-['Public_Sans'] font-normal text-[#cbd5e1] text-[14px] leading-[20px]">
                  {t("버스에 있는 QR 코드를 스캐너와 맞춰주세요", "Align the QR code on the bus with the scanner")}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-['Public_Sans'] font-bold text-[#1e3a8a] text-[14px]">3.</span>
                <span className="font-['Public_Sans'] font-normal text-[#cbd5e1] text-[14px] leading-[20px]">
                  {t("승차 확인이 될 때까지 기다려주세요", "Wait for confirmation before boarding")}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      <style>{`
        @keyframes scan {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}