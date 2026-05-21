import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "./Navigation";
import { UserMenu } from "./UserMenu";
import { supabase } from "@/integrations/supabase/client";
import { useYear } from "@/contexts/YearContext";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Globe, Calendar, Bell, X } from "lucide-react";
import { useRecurringAutomation } from "@/hooks/useRecurringAutomation";
import { useSmartNotifications } from "@/hooks/useSmartNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { type Notification, useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

interface LayoutProps {
  children: ReactNode;
  userName?: string;
  userEmail?: string;
}

export const Layout = ({ children, userName, userEmail }: LayoutProps) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { selectedYear, setSelectedYear, selectedMonth, setSelectedMonth } = useYear();
  const [email, setEmail] = useState<string>(userEmail || "");
  
  // Initialize recurring automation
  useRecurringAutomation();
  useSmartNotifications();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  useEffect(() => {
    // If userEmail is not provided, fetch it from session
    if (!userEmail) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          setEmail(session.user.email);
        }
      });
    } else {
      setEmail(userEmail);
    }
  }, [userEmail]);

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationLabel = (type: string) => {
    switch (type) {
      case "bill":
        return "Bill";
      case "budget":
        return "Budget";
      case "goal":
        return "Goal";
      case "insurance":
        return "Insurance";
      case "warning":
        return "Warning";
      case "error":
        return "Error";
      case "success":
        return "Success";
      default:
        return "Info";
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Navigation />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold tracking-tight text-primary hidden md:block">
                Atlas Finance
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Global Year Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground mr-1 hidden sm:block">Year:</p>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-[85px] h-9">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027, 2028].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Global Month Selector */}
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground mr-1 hidden sm:block">Month:</p>
                <Select
                  value={selectedMonth === null ? "all" : selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger className="w-[125px] h-9">
                    <SelectValue placeholder="All Months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {[
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ].map((month, index) => (
                      <SelectItem key={month} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <Select
                  value={i18n.language}
                  onValueChange={(value) => i18n.changeLanguage(value)}
                >
                  <SelectTrigger className="w-[110px] h-9">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="th">ภาษาไทย</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center px-1 text-[10px]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[360px] max-w-[calc(100vw-2rem)]">
                  <div className="flex items-center justify-between gap-3 px-2 py-1.5">
                    <DropdownMenuLabel className="px-0">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={markAllAsRead}>
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="items-start gap-3 p-3"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge variant={notification.is_read ? "secondary" : "default"} className="shrink-0">
                              {getNotificationLabel(notification.type)}
                            </Badge>
                            <span className="truncate text-sm font-medium">{notification.title}</span>
                          </div>
                          <p className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <UserMenu userName={userName} userEmail={email} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
