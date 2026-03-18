import { useState } from "react";
import { Send, Clock, CheckCircle, Users } from "lucide-react";
import AdminLayout from "./AdminLayout";

interface SentNotification {
  id: number;
  title: string;
  message: string;
  target: string;
  sentAt: string;
  recipientCount: number;
}

export default function NotificationSender() {
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([
    {
      id: 1,
      title: "버스 지연 안내",
      message: "캠퍼스 순환 A 노선이 10분 지연됩니다.",
      target: "전체",
      sentAt: "2024-03-14 09:30",
      recipientCount: 3482,
    },
    {
      id: 2,
      title: "신규 노선 개설",
      message: "천안역 직행 노선이 오늘부터 운행됩니다.",
      target: "통근버스 이용자",
      sentAt: "2024-03-14 07:00",
      recipientCount: 856,
    },
    {
      id: 3,
      title: "정기점검 안내",
      message: "이번 주 토요일 시스템 정기점검이 예정되어 있습니다.",
      target: "전체",
      sentAt: "2024-03-13 14:20",
      recipientCount: 3482,
    },
  ]);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target: "all",
    scheduleNow: true,
    scheduleDate: "",
    scheduleTime: "",
  });

  const handleSend = () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      alert("제목과 메시지를 입력해주세요.");
      return;
    }

    const targetMap: { [key: string]: string } = {
      all: "전체",
      campus: "캠퍼스 셔틀 이용자",
      commuter: "통근버스 이용자",
    };

    const newNotification: SentNotification = {
      id: Date.now(),
      title: formData.title,
      message: formData.message,
      target: targetMap[formData.target],
      sentAt: new Date().toLocaleString("ko-KR"),
      recipientCount: formData.target === "all" ? 3482 : formData.target === "campus" ? 2156 : 856,
    };

    setSentNotifications([newNotification, ...sentNotifications]);
    
    // Reset form
    setFormData({
      title: "",
      message: "",
      target: "all",
      scheduleNow: true,
      scheduleDate: "",
      scheduleTime: "",
    });

    alert("알림이 성공적으로 전송되었습니다!");
  };

  const templates = [
    { title: "버스 지연 안내", message: "버스 운행이 [시간]분 지연되고 있습니다. 양해 부탁드립니다." },
    { title: "운행 중단 안내", message: "악천후로 인해 [노선] 운행이 일시 중단됩니다." },
    { title: "신규 노선 안내", message: "[노선명] 노선이 [날짜]부터 운행됩니다." },
    { title: "시간표 변경 안내", message: "[노선] 버스 시간표가 [날짜]부터 변경됩니다." },
  ];

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[32px] mb-2">
            알림 전송
          </h1>
          <p className="font-['Public_Sans'] text-[#64748b] text-[16px]">
            사용자에게 푸시 알림을 전송하세요
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Send Form */}
          <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] mb-6">
              새 알림 보내기
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                  알림 제목
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                  placeholder="예: 버스 운행 지연 안내"
                />
              </div>

              <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                  알림 내용
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20 resize-none"
                  placeholder="알림 메시지를 입력하세요"
                />
              </div>

              <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-2">
                  수신 대상
                </label>
                <select
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="w-full h-[48px] px-4 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[16px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                >
                  <option value="all">전체 사용자 (3,482명)</option>
                  <option value="campus">캠퍼스 셔틀 이용자 (2,156명)</option>
                  <option value="commuter">통근버스 이용자 (856명)</option>
                </select>
              </div>

              <div>
                <label className="block font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-3">
                  전송 시간
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.scheduleNow}
                      onChange={() => setFormData({ ...formData, scheduleNow: true })}
                      className="w-4 h-4 text-[#1e3b8a] border-gray-300 focus:ring-[#1e3b8a]"
                    />
                    <span className="font-['Public_Sans'] text-[#0f172a] text-[15px]">즉시 전송</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={!formData.scheduleNow}
                      onChange={() => setFormData({ ...formData, scheduleNow: false })}
                      className="w-4 h-4 text-[#1e3b8a] border-gray-300 focus:ring-[#1e3b8a]"
                    />
                    <span className="font-['Public_Sans'] text-[#0f172a] text-[15px]">예약 전송</span>
                  </label>
                </div>

                {!formData.scheduleNow && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={formData.scheduleDate}
                      onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                      className="h-[44px] px-3 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[15px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                    />
                    <input
                      type="time"
                      value={formData.scheduleTime}
                      onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                      className="h-[44px] px-3 bg-white border border-[#cbd5e1] rounded-lg font-['Public_Sans'] text-[15px] text-[#0f172a] focus:outline-none focus:border-[#1e3b8a] focus:ring-2 focus:ring-[#1e3b8a]/20"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleSend}
                className="w-full h-[52px] bg-[#1e3b8a] text-white font-['Public_Sans'] font-bold text-[16px] rounded-lg shadow-sm hover:bg-[#1e3b8a]/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-6"
              >
                <Send className="w-5 h-5" />
                {formData.scheduleNow ? "전송하기" : "예약하기"}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[18px] mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                수신 대상 통계
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-['Public_Sans'] text-[#64748b] text-[13px]">전체 사용자</span>
                    <span className="font-['Public_Sans'] text-[#0f172a] text-[18px] font-bold">3,482</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-['Public_Sans'] text-[#64748b] text-[13px]">캠퍼스 셔틀</span>
                    <span className="font-['Public_Sans'] text-[#0f172a] text-[18px] font-bold">2,156</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-['Public_Sans'] text-[#64748b] text-[13px]">통근 버스</span>
                    <span className="font-['Public_Sans'] text-[#0f172a] text-[18px] font-bold">856</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[18px] mb-4">
                이번 달 발송
              </h3>
              <div className="text-center">
                <div className="font-['Public_Sans'] text-[#0f172a] text-[42px] font-bold mb-1">
                  843
                </div>
                <div className="font-['Public_Sans'] text-[#64748b] text-[14px]">
                  총 알림 전송
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] mb-4">
            빠른 템플릿
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template, index) => (
              <button
                key={index}
                onClick={() => setFormData({ ...formData, title: template.title, message: template.message })}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#1e3b8a] hover:bg-[#1e3b8a]/5 transition-all text-left"
              >
                <h4 className="font-['Public_Sans'] font-semibold text-[#0f172a] text-[14px] mb-1">
                  {template.title}
                </h4>
                <p className="font-['Public_Sans'] text-[#64748b] text-[12px] line-clamp-2">
                  {template.message}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Sent History */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[20px] mb-6">
            전송 내역
          </h2>
          <div className="space-y-4">
            {sentNotifications.map((notification) => (
              <div key={notification.id} className="p-5 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-['Public_Sans'] font-bold text-[#0f172a] text-[16px] flex-1">
                    {notification.title}
                  </h3>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[12px] font-semibold ml-4">
                    <CheckCircle className="w-3.5 h-3.5" />
                    전송완료
                  </span>
                </div>
                <p className="font-['Public_Sans'] text-[#64748b] text-[14px] mb-4">
                  {notification.message}
                </p>
                <div className="flex items-center gap-6 text-[13px]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#94a3b8]" />
                    <span className="font-['Public_Sans'] text-[#94a3b8]">
                      대상: <span className="text-[#0f172a] font-medium">{notification.target}</span>
                    </span>
                  </div>
                  <span className="font-['Public_Sans'] text-[#94a3b8]">
                    수신: <span className="text-[#0f172a] font-medium">{notification.recipientCount.toLocaleString()}명</span>
                  </span>
                  <div className="flex items-center gap-1.5 text-[#94a3b8] ml-auto">
                    <Clock className="w-4 h-4" />
                    <span className="font-['Public_Sans']">
                      {notification.sentAt}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
