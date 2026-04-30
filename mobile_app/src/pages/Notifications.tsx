import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Bell,
  ArrowRight,
  Shield,
  Zap,
  Gift,
  Info,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const typeIcons: Record<string, any> = {
  transaction: Zap,
  promo: Gift,
  security: Shield,
  system: Info,
  payment_reminder: ArrowRight,
};

const typeColors: Record<string, string> = {
  transaction: "bg-blue-50 text-blue-600",
  promo: "bg-violet-50 text-violet-600",
  security: "bg-red-50 text-red-600",
  system: "bg-slate-50 text-slate-600",
  payment_reminder: "bg-amber-50 text-amber-600",
};

export default function Notifications() {
  const { data: notifications, isLoading } = trpc.notification.list.useQuery({
    limit: 50,
  });
  const { data: unreadCount, refetch: refetchUnread } =
    trpc.notification.unreadCount.useQuery();
  const utils = trpc.useUtils();

  const markRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      refetchUnread();
    },
  });

  const markAllRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      refetchUnread();
      toast.success("All notifications marked as read");
    },
  });

  const deleteNotification = trpc.notification.delete.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      refetchUnread();
    },
  });

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-1 -ml-1 hover:bg-slate-50 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Notifications</h1>
              {unreadCount ? (
                <p className="text-xs text-blue-600">{unreadCount} unread</p>
              ) : null}
            </div>
          </div>
          {unreadCount ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Read All
            </Button>
          ) : null}
        </div>
      </div>

      <div className="p-4 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : !notifications?.length ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const Icon = typeIcons[notif.type] || Info;
              const colorClass = typeColors[notif.type] || "bg-slate-50 text-slate-600";

              return (
                <div
                  key={notif.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm transition-colors ${
                    !notif.isRead ? "border-l-4 border-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {notif.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notif.isRead && (
                            <button
                              onClick={() => markRead.mutate({ id: notif.id })}
                              className="p-1 hover:bg-slate-100 rounded"
                              title="Mark as read"
                            >
                              <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification.mutate({ id: notif.id })}
                            className="p-1 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-slate-300 mt-1">
                        {notif.createdAt
                          ? new Date(notif.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
