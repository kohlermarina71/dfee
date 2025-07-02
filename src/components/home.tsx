import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import StatisticsOverview from "./dashboard/StatisticsOverview";
import AttendanceChart from "./dashboard/AttendanceChart";
import RecentActivities from "./dashboard/RecentActivities";
import MembersList from "./attendance/MembersList";
import QrScannerDialog from "./attendance/QrScannerDialog";
import TopMobileNavigation from "./layout/TopMobileNavigation";
import PaymentForm from "./payments/PaymentForm";
import PaymentsList from "./payments/PaymentsList";
import PaymentsPage from "./payments/PaymentsPage";
import ReportsPage from "./reports/ReportsPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Home,
  Users,
  CreditCard,
  BarChart3,
  Search,
  LogOut,
} from "lucide-react";

const BackgroundBlob = ({ className }: { className?: string }) => (
  <motion.div
    className={`absolute rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl ${className}`}
    animate={{
      x: [0, 10, 0],
      y: [0, 15, 0],
      scale: [1, 1.05, 1],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      repeatType: "reverse",
    }}
  >
    <div className="w-[800px] h-[600px]"></div>
  </motion.div>
);

const SidebarItem = ({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <motion.div
    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${active ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-600" : "hover:bg-white/30"}`}
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
  >
    <div className={`${active ? "text-blue-600" : "text-gray-600"}`}>
      {icon}
    </div>
    <span
      className={`font-medium ${active ? "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" : "text-gray-700"}`}
    >
      {label}
    </span>
  </motion.div>
);

const Sidebar = ({
  activeItem,
  setActiveItem,
}: {
  activeItem: string;
  setActiveItem: (item: string) => void;
}) => {
  return (
    <Card className="h-full w-64 bg-bluegray-700/30 backdrop-blur-md border-bluegray-600 shadow-lg overflow-hidden hidden lg:block">
      <div className="p-6 flex flex-col h-full">
        <div className="mb-8 flex justify-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Yacin Gym
          </h2>
        </div>

        <div className="space-y-2">
          <SidebarItem
            icon={<Home size={20} />}
            label="Dashboard"
            active={activeItem === "dashboard"}
            onClick={() => setActiveItem("dashboard")}
          />
          <SidebarItem
            icon={<Users size={20} />}
            label="Attendance"
            active={activeItem === "attendance"}
            onClick={() => setActiveItem("attendance")}
          />
          <SidebarItem
            icon={<CreditCard size={20} />}
            label="Payments"
            active={activeItem === "payments"}
            onClick={() => setActiveItem("payments")}
          />
          <SidebarItem
            icon={<BarChart3 size={20} />}
            label="Reports"
            active={activeItem === "reports"}
            onClick={() => setActiveItem("reports")}
          />
        </div>
      </div>
    </Card>
  );
};

const MobileNavigation = ({
  activeItem,
  setActiveItem,
}: {
  activeItem: string;
  setActiveItem: (item: string) => void;
}) => {
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <>
      <Card className="fixed bottom-0 left-0 right-0 bg-bluegray-700/80 backdrop-blur-md border-bluegray-600 shadow-lg lg:hidden z-10">
        <div className="flex justify-around items-center p-3 pb-5 relative">
          <motion.div
            className={`p-2 rounded-full ${activeItem === "dashboard" ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20" : ""}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveItem("dashboard")}
          >
            <Home
              size={22}
              className={
                activeItem === "dashboard" ? "text-blue-600" : "text-gray-400"
              }
            />
          </motion.div>

          <motion.div
            className={`p-2 rounded-full ${activeItem === "attendance" ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20" : ""}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveItem("attendance")}
          >
            <Users
              size={22}
              className={
                activeItem === "attendance" ? "text-blue-600" : "text-gray-400"
              }
            />
          </motion.div>

          <motion.div
            className={`p-2 rounded-full ${activeItem === "payments" ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20" : ""}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveItem("payments")}
          >
            <CreditCard
              size={22}
              className={
                activeItem === "payments" ? "text-blue-600" : "text-gray-400"
              }
            />
          </motion.div>

          <motion.div
            className={`p-2 rounded-full ${activeItem === "reports" ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20" : ""}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveItem("reports")}
          >
            <BarChart3
              size={22}
              className={
                activeItem === "reports" ? "text-blue-600" : "text-gray-400"
              }
            />
          </motion.div>
        </div>
      </Card>
    </>
  );
};

const HomePage = () => {
  // Check if we just logged in and remove the flag
  React.useEffect(() => {
    const loginSuccess = localStorage.getItem("loginSuccess");
    if (loginSuccess) {
      localStorage.removeItem("loginSuccess");
    }
  }, []);
  const [activeTab, setActiveTab] = React.useState("dashboard");
  return (
    <div className="min-h-screen bg-gradient-to-br from-bluegray-800 to-bluegray-900 relative overflow-hidden text-white">
      {/* Background blobs */}
      <BackgroundBlob className="w-96 h-96 top-0 left-0 opacity-50" />
      <BackgroundBlob className="w-96 h-96 bottom-0 right-0 opacity-50" />
      <BackgroundBlob className="w-64 h-64 top-1/2 left-1/2 opacity-30" />
      <div className="container mx-auto px-4 py-8 flex h-screen">
        {/* Sidebar */}
        <div className="mr-6">
          <Sidebar activeItem={activeTab} setActiveItem={setActiveTab} />
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            defaultValue="dashboard"
            className="w-full"
          >
            <TabsList className="mb-6 bg-bluegray-700/50 backdrop-blur-sm hidden md:flex">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20"
              >
                Attendance
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20"
              >
                Payments
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-purple-500/20"
              >
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden md:block">
                Dashboard
              </h1>

              <StatisticsOverview />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500 hover:border-slate-600/60 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-emerald-500/30">
                      <BarChart3 size={20} className="text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                      نظرة عامة على الحضور
                    </h2>
                  </div>
                  <AttendanceChart />
                </Card>

                <RecentActivities limit={5} />
              </div>
            </TabsContent>

            <TabsContent value="attendance">
              <MembersList />
            </TabsContent>

            <TabsContent value="payments">
              <PaymentsPage />
            </TabsContent>

            <TabsContent value="reports">
              <ReportsPage />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Mobile Navigation */}
      <TopMobileNavigation
        activeItem={activeTab}
        setActiveItem={setActiveTab}
      />
      <MobileNavigation activeItem={activeTab} setActiveItem={setActiveTab} />
      {/* Add padding to account for top and bottom navigation bars on mobile */}
      <div className="pt-14 pb-20 lg:pt-0 lg:pb-0 md:hidden" />
    </div>
  );
};

export default HomePage;
