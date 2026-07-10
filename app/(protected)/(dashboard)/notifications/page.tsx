'use client';

import { useState } from 'react';
import { useNotifications } from '@/components/providers/notification-provider';
import { Content } from '@/components/layouts/crm/components/content';
import { 
  Bell, 
  Trash2, 
  Check, 
  CheckCheck, 
  FileText, 
  ArrowRight, 
  Inbox,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toPascalCase } from '@/lib/utils';
import { useRouter } from 'next/navigation';

function formatRelativeTime(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return '';
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    deleteNotif, 
    clearAll,
    hasMore,
    loadMore
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'read') return n.isRead;
    return true;
  });

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    
    if (notif.metadata?.propertyId) {
      router.push(`/property-details/${notif.metadata.propertyId}`);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => markAsRead(n.id)));
  };

  return (
    <Content className="bg-linear-to-b from-[#F5FFFF] to-[#FFFFFF] min-h-[calc(100vh-118px)] py-8 px-4 md:px-8">
      <div className="max-w-[800px] w-full mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black text-[#1F2A44] uppercase font-asap tracking-tight flex items-center gap-3">
              <Bell className="size-7 text-[#1CA7A6]" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-[#F44336] text-white text-xs font-bold px-2.5 py-0.5 rounded-full lowercase font-inter h-5 flex items-center justify-center animate-pulse">
                  {unreadCount} unread
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 font-inter">
              Stay updated with property reports and system activities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllRead}
                className="border-gray-200 text-gray-600 hover:text-[#1CA7A6] hover:border-[#1CA7A6] hover:bg-[#1CA7A6]/5 font-bold text-xs uppercase tracking-wider h-10 px-4 rounded-xl transition-all shadow-none"
              >
                <CheckCheck className="size-4 mr-2" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                onClick={clearAll}
                className="border-red-100 text-red-500 hover:text-white hover:bg-red-50 hover:border-red-500 font-bold text-xs uppercase tracking-wider h-10 px-4 rounded-xl transition-all shadow-none"
              >
                <Trash2 className="size-4 mr-2" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Tabs / Filters */}
        <div className="flex items-center justify-between border-b border-gray-100/55 pb-2">
          <div className="flex gap-1 bg-gray-100/50 p-1 rounded-xl">
            {(['all', 'unread', 'read'] as const).map((tab) => {
              const count = tab === 'all' 
                ? notifications.length 
                : tab === 'unread' 
                ? notifications.filter(n => !n.isRead).length
                : notifications.filter(n => n.isRead).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-white text-[#1CA7A6] shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab}
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab
                      ? 'bg-[#1CA7A6]/10 text-[#1CA7A6]'
                      : 'bg-gray-200/60 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="size-8 text-[#1CA7A6] animate-spin" />
              <span className="text-sm font-medium text-gray-500 font-inter">Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="size-16 rounded-full bg-[#1CA7A6]/5 flex items-center justify-center text-[#1CA7A6] mb-4">
                <Inbox className="size-8" />
              </div>
              <h3 className="text-lg font-bold text-[#1F2A44] font-asap uppercase">
                No notifications found
              </h3>
              <p className="text-sm text-gray-500 font-inter mt-1 max-w-[320px]">
                {activeTab === 'all' 
                  ? "You don't have any notifications right now."
                  : activeTab === 'unread'
                  ? "You don't have any unread notifications."
                  : "You don't have any read notifications."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isClickable = !!notif.metadata?.propertyId;
              return (
                <div
                  key={notif.id}
                  onClick={() => isClickable && handleNotificationClick(notif)}
                  className={`group relative flex items-start gap-4 p-4 md:p-5 rounded-2xl border transition-all duration-200 ${
                    !notif.isRead 
                      ? 'bg-[#1CA7A6]/5 border-[#1CA7A6]/20 shadow-[0_4px_16px_rgba(28,167,166,0.05)]' 
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  } ${isClickable ? 'cursor-pointer hover:shadow-md' : ''}`}
                >
                  {/* Left Icon */}
                  <div className={`size-10 md:size-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    !notif.isRead
                      ? 'bg-[#1CA7A6]/10 text-[#1CA7A6]'
                      : 'bg-gray-50 text-gray-500 group-hover:bg-[#1CA7A6]/5 group-hover:text-[#1CA7A6]'
                  }`}>
                    <FileText className="size-5 md:size-6" />
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        !notif.isRead
                          ? 'bg-[#1CA7A6]/15 text-[#1CA7A6]'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {toPascalCase(notif.type)}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium font-inter">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <h4 className={`text-sm md:text-base font-bold text-[#1F2A44] leading-snug font-asap ${
                      !notif.isRead ? 'font-extrabold' : ''
                    }`}>
                      {notif.title}
                    </h4>
                    
                    <p className="text-xs md:text-sm text-gray-600 font-inter leading-relaxed">
                      {notif.message}
                    </p>

                    {isClickable && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[#1CA7A6] uppercase tracking-wider pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Property Details
                        <ArrowRight className="size-3" />
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-1.5 shrink-0 self-center" onClick={(e) => e.stopPropagation()}>
                    {!notif.isRead && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        title="Mark as read"
                        className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#1CA7A6] hover:bg-[#1CA7A6]/10 transition-colors"
                      >
                        <Check className="size-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotif(notif.id)}
                      title="Delete notification"
                      className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {/* Unread indicator bar */}
                  {!notif.isRead && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#1CA7A6] rounded-r-full" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
              className="border-gray-200 text-gray-600 hover:text-[#1CA7A6] hover:border-[#1CA7A6] hover:bg-[#1CA7A6]/5 font-bold text-xs uppercase tracking-wider h-11 px-8 rounded-xl transition-all shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin animate-duration-1000" />
                  Loading...
                </>
              ) : (
                "Load More Notifications"
              )}
            </Button>
          </div>
        )}
      </div>
    </Content>
  );
}
