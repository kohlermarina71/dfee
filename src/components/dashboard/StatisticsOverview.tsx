import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Calendar,
  TrendingUp,
  CreditCard,
  DollarSign,
  X,
  AlertCircle,
  Phone,
  Mail,
  Trash2,
} from "lucide-react";
import { getAllMembers, Member, updateMember } from "@/services/memberService";
import { getAllPayments } from "@/services/paymentService";
import { useRecentActivities } from "@/hooks/useRecentActivities";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, formatDate } from "@/lib/utils";

interface StatisticCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

const StatisticCard = (
  {
    icon,
    value,
    label,
    trend,
    isLoading = false,
    onClick,
  }: StatisticCardProps & { onClick?: () => void } = {
    icon: <Users className="h-6 w-6" />,
    value: "0",
    label: "Statistic",
    trend: {
      value: 0,
      isPositive: true,
    },
    isLoading: false,
  },
) => {
  return (
    <Card
      className={`overflow-hidden bg-white/10 backdrop-blur-lg border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 ${onClick ? "cursor-pointer hover:scale-105" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {isLoading
                ? "..."
                : typeof value === "number"
                  ? formatNumber(value)
                  : value}
            </div>
            <div className="text-sm text-gray-300 mt-1">{label}</div>
            {!isLoading && trend && (
              <div
                className={`text-xs mt-2 flex items-center ${trend.isPositive ? "text-green-400" : "text-red-400"}`}
              >
                {trend.isPositive ? "↑" : "↓"} {formatNumber(trend.value)}%
                <span className="ml-1">
                  {trend.isPositive ? "increase" : "decrease"}
                </span>
              </div>
            )}
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 p-3 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatisticsOverview = () => {
  const [statistics, setStatistics] = useState({
    totalMembers: 0,
    todayAttendance: 0,
    weeklyAttendance: 0,
    pendingPayments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [trends, setTrends] = useState({
    totalMembers: { value: 0, isPositive: true },
    todayAttendance: { value: 0, isPositive: true },
    weeklyAttendance: { value: 0, isPositive: true },
    pendingPayments: { value: 0, isPositive: false },
    revenue: { value: 0, isPositive: true },
  });
  const [isUnpaidMembersSheetOpen, setIsUnpaidMembersSheetOpen] =
    useState(false);
  const [unpaidMembers, setUnpaidMembers] = useState<Member[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isTodayAttendeesSheetOpen, setIsTodayAttendeesSheetOpen] =
    useState(false);
  const [todayAttendees, setTodayAttendees] = useState<
    (Member & { isSessionPayment?: boolean })[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all members
        const members = await getAllMembers();
        const totalMembers = members.length;

        // Fetch all payments first
        const payments = await getAllPayments();

        // Calculate today's attendance (including single sessions)
        const today = new Date().toISOString().split("T")[0];
        const todayAttendanceMembers = members.filter(
          (member) =>
            member.lastAttendance &&
            member.lastAttendance.split("T")[0] === today,
        );

        // Add single session attendees from today's payments
        const todaySessionPayments = payments.filter(
          (payment) =>
            payment.subscriptionType === "حصة واحدة" &&
            payment.date.split("T")[0] === today,
        );

        // Create session payment members for display
        const sessionPaymentMembers = todaySessionPayments.map(
          (payment, index) => ({
            id: payment.memberId,
            name:
              payment.notes?.split(" - ")[1]?.split(" (")[0] ||
              `زائر ${index + 1}`,
            membershipStatus: "active" as const,
            lastAttendance: payment.date,
            paymentStatus: "paid" as const,
            isSessionPayment: true,
            phone: payment.notes?.match(/\(([^)]+)\)/)?.[1] || "",
          }),
        );

        // Combine regular members and session payment members
        const allTodayAttendees = [
          ...todayAttendanceMembers,
          ...sessionPaymentMembers,
        ];
        setTodayAttendees(allTodayAttendees);

        const totalTodayAttendance = allTodayAttendees.length;

        // Calculate weekly attendance
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString();

        const weeklyAttendance = members.filter((member) => {
          if (!member.lastAttendance) return false;
          return new Date(member.lastAttendance) >= new Date(oneWeekAgoStr);
        }).length;
        // Include members with zero sessions and unpaid status
        const unpaidMembersList = members.filter(
          (member) =>
            member.paymentStatus === "unpaid" ||
            member.paymentStatus === "partial" ||
            member.membershipStatus === "pending" ||
            (member.sessionsRemaining !== undefined &&
              member.sessionsRemaining === 0),
        );
        const pendingPayments = unpaidMembersList.length;
        setUnpaidMembers(unpaidMembersList);

        // Calculate trends based on real data
        // For this example, we'll compare with previous week
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const twoWeeksAgoStr = twoWeeksAgo.toISOString();

        const previousWeekAttendance = members.filter((member) => {
          if (!member.lastAttendance) return false;
          const attendanceDate = new Date(member.lastAttendance);
          return (
            attendanceDate >= new Date(twoWeeksAgoStr) &&
            attendanceDate < new Date(oneWeekAgoStr)
          );
        }).length;

        // Calculate trend percentages
        const weeklyTrendPercentage =
          previousWeekAttendance > 0
            ? Math.round(
                ((weeklyAttendance - previousWeekAttendance) /
                  previousWeekAttendance) *
                  100,
              )
            : 0;

        const membersTrendPercentage = 5; // Placeholder - would calculate from historical data
        const todayTrendPercentage = 8; // Placeholder - would compare with previous day

        setStatistics({
          totalMembers,
          todayAttendance: totalTodayAttendance,
          weeklyAttendance,
          pendingPayments,
        });

        setTrends({
          totalMembers: {
            value: membersTrendPercentage,
            isPositive: membersTrendPercentage >= 0,
          },
          todayAttendance: {
            value: todayTrendPercentage,
            isPositive: todayTrendPercentage >= 0,
          },
          weeklyAttendance: {
            value: Math.abs(weeklyTrendPercentage),
            isPositive: weeklyTrendPercentage >= 0,
          },
          pendingPayments: { value: 2, isPositive: false },
          revenue: { value: 0, isPositive: true },
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up interval to refresh data every 5 minutes
    const intervalId = setInterval(() => {
      fetchData();
    }, 300000); // 5 minutes

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const handleRemoveFromUnpaidList = async (member: Member) => {
    setIsUpdating(member.id);
    try {
      // Update member payment status to paid and membership status to active
      const updatedMember = {
        ...member,
        paymentStatus: "paid" as const,
        membershipStatus: "active" as const,
      };

      await updateMember(updatedMember);

      // Remove from local unpaid list
      setUnpaidMembers((prev) => prev.filter((m) => m.id !== member.id));

      // Update statistics
      setStatistics((prev) => ({
        ...prev,
        pendingPayments: prev.pendingPayments - 1,
      }));
    } catch (error) {
      console.error("Error updating member:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="w-full bg-background">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatisticCard
          icon={<Users className="h-6 w-6 text-blue-400" />}
          value={statistics.totalMembers}
          label="إجمالي الأعضاء"
          trend={trends.totalMembers}
          isLoading={isLoading}
        />

        <StatisticCard
          icon={<Calendar className="h-6 w-6 text-purple-400" />}
          value={statistics.todayAttendance}
          label="حضور اليوم"
          trend={trends.todayAttendance}
          isLoading={isLoading}
          onClick={() => setIsTodayAttendeesSheetOpen(true)}
        />

        <StatisticCard
          icon={<TrendingUp className="h-6 w-6 text-indigo-400" />}
          value={statistics.weeklyAttendance}
          label="حضور الأسبوع"
          trend={trends.weeklyAttendance}
          isLoading={isLoading}
        />

        <StatisticCard
          icon={<CreditCard className="h-6 w-6 text-pink-400" />}
          value={statistics.pendingPayments}
          label="مدفوعات معلقة"
          trend={trends.pendingPayments}
          isLoading={isLoading}
          onClick={() => setIsUnpaidMembersSheetOpen(true)}
        />
      </div>

      {/* Unpaid Members Sheet */}
      <Sheet
        open={isUnpaidMembersSheetOpen}
        onOpenChange={setIsUnpaidMembersSheetOpen}
      >
        <SheetContent
          side="right"
          className="w-full sm:w-[400px] bg-gray-900 text-white"
        >
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold text-white">
                الأعضاء غير المدفوعين
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUnpaidMembersSheetOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SheetDescription className="text-gray-300">
              قائمة بالأعضاء الذين لديهم مدفوعات معلقة أو حصص منتهية
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {unpaidMembers.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">لا توجد مدفوعات معلقة</p>
              </div>
            ) : (
              unpaidMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={member.profileImage}
                        alt={member.name}
                      />
                      <AvatarFallback className="bg-gray-700 text-white">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-white truncate">
                          {member.name}
                        </h3>
                        <Badge
                          variant={
                            member.paymentStatus === "unpaid"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {member.paymentStatus === "unpaid"
                            ? "غير مدفوع"
                            : member.paymentStatus === "partial"
                              ? "جزئي"
                              : "معلق"}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs text-gray-400">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Phone className="h-3 w-3" />
                          <span>{member.phone}</span>
                        </div>
                        {member.email && (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Mail className="h-3 w-3" />
                            <span>{member.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFromUnpaidList(member)}
                          disabled={isUpdating === member.id}
                          className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                        >
                          {isUpdating === member.id ? (
                            "جاري التحديث..."
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 ml-1" />
                              إزالة
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Today's Attendees Sheet */}
      <Sheet
        open={isTodayAttendeesSheetOpen}
        onOpenChange={setIsTodayAttendeesSheetOpen}
      >
        <SheetContent
          side="right"
          className="w-full sm:w-[400px] bg-gray-900 text-white"
        >
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold text-white">
                حضور اليوم
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTodayAttendeesSheetOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SheetDescription className="text-gray-300">
              قائمة بالأعضاء الذين حضروا اليوم (
              {formatDate(new Date().toISOString())})
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {todayAttendees.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">لا يوجد حضور اليوم</p>
              </div>
            ) : (
              todayAttendees.map((attendee, index) => (
                <div
                  key={attendee.id || index}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={attendee.imageUrl}
                        alt={attendee.name}
                      />
                      <AvatarFallback className="bg-gray-700 text-white">
                        {attendee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-white truncate">
                          {attendee.name}
                        </h3>
                        <Badge
                          variant={
                            attendee.isSessionPayment ? "secondary" : "default"
                          }
                          className="text-xs"
                        >
                          {attendee.isSessionPayment ? "حصة واحدة" : "عضو"}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs text-gray-400">
                        {attendee.phone && (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Phone className="h-3 w-3" />
                            <span>{attendee.phone}</span>
                          </div>
                        )}
                        {attendee.email && (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Mail className="h-3 w-3" />
                            <span>{attendee.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Calendar className="h-3 w-3" />
                          <span>
                            وقت الحضور: {formatDate(attendee.lastAttendance)}
                          </span>
                        </div>
                        {!attendee.isSessionPayment &&
                          attendee.sessionsRemaining !== undefined && (
                            <div className="text-blue-400">
                              الحصص المتبقية: {attendee.sessionsRemaining}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default StatisticsOverview;
