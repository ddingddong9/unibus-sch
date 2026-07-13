import { useEffect, useState } from "react";
import { Send, Clock, CheckCircle, Users, RefreshCw } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { api } from "../services/api";

interface SentNotification {
  id: number;
  title: string;
  message: string;
  target: string;
  sentAt: string;
  recipientCount: number;
}

const targetMap: Record<string, { label: string; category: "general" | "route" | "system" }> = {
  all: { label: "전체 사용자", category: "general" },
  campus: { label: "셔틀버스 이용자", category: "route" },
  commuter: { label: "통학버스 이용자", category: "route" },
  system: { label: "시스템 공지 대상", category: "system" },
};

export default function NotificationSender() {
  const [sentNotifications, setSentNotifications] = useState<SentNotification[]>([]);
  const [userCounts, setUserCounts] = useState({ all: 0, campus: 0, commuter: 0, system: 0 });
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target: "all",
    scheduleNow: true,
    scheduleDate: "",
    scheduleTime: "",
  });

  const loadNotificationContext = async () => {
    try {
      setLoadingHistory(true);
      const [notices, users] = await Promise.all([api.getNotices(), api.getUsers()]);
      const activeUsers = users.filter((user: any) => user.role === "user");
      const drivers = users.filter((user: any) => user.role === "driver");

      setUserCounts({
        all: users.length,
        campus: activeUsers.length + drivers.length,
        commuter: activeUsers.length,
        system: users.length,
      });

      setSentNotifications(
        notices.slice(0, 8).map((notice, index) => ({
          id: Number(new Date(notice.createdAt).getTime()) || index,
          title: notice.title,
          message: notice.content,
          target: notice.category === "system" ? "시스템" : notice.category === "route" ? "운행정보" : "전체",
          sentAt: new Date(notice.createdAt).toLocaleString("ko-KR"),
          recipientCount: users.length,
        }))
      );
    } catch (error) {
      console.error("Failed to load notification context:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadNotificationContext();
  }, []);

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      alert("제목과 메시지를 입력해주세요.");
      return;
    }

    if (!formData.scheduleNow) {
      alert("예약 전송은 아직 지원하지 않습니다. 지금은 즉시 전송으로 보내주세요.");
      return;
    }

    const target = targetMap[formData.target] || targetMap.all;
    setSending(true);
    try {
      const result = await api.sendNotification({
        title: formData.title.trim(),
        message: formData.message.trim(),
        target: formData.target,
      });
      const { notice, push } = result;

      const newNotification: SentNotification = {
        id: Date.now(),
        title: notice.title,
        message: notice.content,
        target: target.label,
        sentAt: new Date(notice.createdAt).toLocaleString("ko-KR"),
        recipientCount: userCounts[formData.target as keyof typeof userCounts] || userCounts.all,
      };

      setSentNotifications([newNotification, ...sentNotifications]);

      setFormData({
        title: "",
        message: "",
        target: "all",
        scheduleNow: true,
        scheduleDate: "",
        scheduleTime: "",
      });

      if (push.attempted === 0) {
        alert("알림 공지는 생성됐지만, 아직 백그라운드 푸시를 받을 기기가 없습니다. 사용자 앱의 설정 > 알림에서 권한을 허용해야 구독이 등록됩니다.");
      } else {
        alert(`알림이 발송되었습니다. 백그라운드 푸시 ${push.sent}/${push.attempted}건 전송 완료`);
      }
    } catch (error: any) {
      alert(error.message || "알림 전송에 실패했습니다.");
    } finally {
      setSending(false);
    }
  };

  const templates = [
    { title: "버스 지연 안내", message: "버스 운행이 [시간]분 지연되고 있습니다. 양해 부탁드립니다." },
    { title: "운행 중단 안내", message: "악천후로 인해 [노선] 운행이 일시 중단됩니다." },
    { title: "신규 노선 안내", message: "[노선명] 노선이 [날짜]부터 운행됩니다." },
    { title: "시간표 변경 안내", message: "[노선] 버스 시간표가 [날짜]부터 변경됩니다." },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 font-['Public_Sans'] text-[26px] font-bold text-[#0f172a] sm:text-[32px]">
            알림 전송
          </h1>
          <p className="font-['Public_Sans'] text-[#64748b] text-[16px]">
            공지사항 기반 실시간 알림을 전송하세요
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Send Form */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 xl:col-span-2">
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
                  <option value="all">전체 사용자 ({userCounts.all.toLocaleString()}명)</option>
                  <option value="campus">셔틀버스 이용자 ({userCounts.campus.toLocaleString()}명)</option>
                  <option value="commuter">통학버스 이용자 ({userCounts.commuter.toLocaleString()}명)</option>
                  <option value="system">시스템 공지 대상 ({userCounts.system.toLocaleString()}명)</option>
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
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                disabled={sending}
                className="w-full h-[52px] bg-[#1e3b8a] text-white font-['Public_Sans'] font-bold text-[16px] rounded-lg shadow-sm hover:bg-[#1e3b8a]/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
              >
                {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {sending ? "전송 중..." : formData.scheduleNow ? "전송하기" : "예약하기"}
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
                    <span className="font-['Public_Sans'] text-[#0f172a] text-[18px] font-bold">{userCounts.all.toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-['Public_Sans'] text-[#64748b] text-[13px]">셔틀버스</span>
                    <span className="font-['Public_Sans'] text-[#0f172a] text-[18px] font-bold">{userCounts.campus.toLocaleString()}</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-['Public_Sans'] text-[#64748b] text-[13px]">통학 버스</span>
                    <span className="font-['Public_Sans'] text-[#0f172a] text-[18px] font-bold">{userCounts.commuter.toLocaleString()}</span>
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
                  {sentNotifications.length.toLocaleString()}
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
            {loadingHistory ? (
              <div className="py-10 text-center text-[#94a3b8] font-['Public_Sans'] text-[14px]">
                전송 내역 불러오는 중...
              </div>
            ) : sentNotifications.length === 0 ? (
              <div className="py-10 text-center text-[#94a3b8] font-['Public_Sans'] text-[14px]">
                아직 전송한 알림이 없습니다.
              </div>
            ) : sentNotifications.map((notification) => (
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
