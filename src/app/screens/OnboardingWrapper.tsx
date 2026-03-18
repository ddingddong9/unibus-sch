import { useState } from "react";
import { useNavigate } from "react-router";

export default function OnboardingWrapper() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Real-time Bus Tracking",
      description: "Track campus shuttle locations in real-time and never miss your bus",
      icon: "🚌",
      color: "from-[#1e3a8a] to-[#3b82f6]",
    },
    {
      title: "QR Code Boarding",
      description: "Quick and contactless boarding with QR code scanning",
      icon: "📱",
      color: "from-[#059669] to-[#10b981]",
    },
    {
      title: "Smart Notifications",
      description: "Get notified when your bus is approaching your stop",
      icon: "🔔",
      color: "from-[#7c3aed] to-[#a78bfa]",
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/login");
    }
  };

  const handleSkip = () => {
    navigate("/login");
  };

  return (
    <div className="bg-white content-stretch flex flex-col items-center justify-between p-[24px] relative size-full">
      {/* Skip Button */}
      <div className="w-full flex justify-end pt-[24px]">
        <button
          onClick={handleSkip}
          className="font-['Public_Sans'] font-semibold text-[#1e3a8a] text-[14px] hover:underline"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[320px]">
        {/* Icon */}
        <div className={`bg-gradient-to-br ${slides[currentSlide].color} rounded-[32px] size-[160px] flex items-center justify-center mb-8 shadow-lg`}>
          <span className="text-[80px]">{slides[currentSlide].icon}</span>
        </div>

        {/* Title */}
        <h1 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[28px] leading-[35px] text-center mb-4 tracking-[-0.7px]">
          {slides[currentSlide].title}
        </h1>

        {/* Description */}
        <p className="font-['Public_Sans'] font-normal text-[#64748b] text-[16px] leading-[24px] text-center">
          {slides[currentSlide].description}
        </p>
      </div>

      {/* Bottom Section */}
      <div className="w-full space-y-6 pb-[24px]">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-[8px] rounded-full transition-all ${
                index === currentSlide
                  ? "bg-[#1e3a8a] w-[32px]"
                  : "bg-[#e2e8f0] w-[8px] hover:bg-[#cbd5e1]"
              }`}
            />
          ))}
        </div>

        {/* Next/Get Started Button */}
        <button
          onClick={handleNext}
          className="w-full bg-[#1e3a8a] h-[56px] rounded-[12px] font-['Public_Sans'] font-bold text-white text-[16px] shadow-[0px_10px_15px_-3px_rgba(30,59,138,0.2),0px_4px_6px_-4px_rgba(30,59,138,0.2)] hover:bg-[#1e3a8a]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>{currentSlide < slides.length - 1 ? "Next" : "Get Started"}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
