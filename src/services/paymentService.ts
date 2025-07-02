import localforage from "localforage";
import { Member } from "./memberService";
import { formatNumber, formatDate } from "@/lib/utils";

export interface Payment {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  subscriptionType: string;
  paymentMethod: "cash" | "card" | "transfer";
  notes?: string;
  status?: "completed" | "pending" | "cancelled";
  invoiceNumber?: string;
  receiptUrl?: string;
}

export interface MemberActivity {
  id?: string;
  memberId: string;
  memberName?: string;
  memberImage?: string;
  activityType: "check-in" | "membership-renewal" | "payment" | "other";
  timestamp: string;
  details: string;
}

// Initialize the databases
const paymentsDB = localforage.createInstance({
  name: "gym-tracker",
  storeName: "payments",
});

const activitiesDB = localforage.createInstance({
  name: "gym-tracker",
  storeName: "activities",
});

// Initialize with sample data if empty
const initPaymentsDB = async () => {
  const keys = await paymentsDB.keys();
  if (keys.length === 0) {
    const samplePayments: Payment[] = [
      {
        id: "1",
        memberId: "1",
        amount: 1000,
        date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        subscriptionType: "شهري",
        paymentMethod: "cash",
        status: "completed",
        invoiceNumber: "INV-001",
      },
      {
        id: "2",
        memberId: "2",
        amount: 1800,
        date: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
        subscriptionType: "30 حصة",
        paymentMethod: "card",
        status: "completed",
        invoiceNumber: "INV-002",
      },
      {
        id: "3",
        memberId: "5",
        amount: 1000,
        date: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
        subscriptionType: "15 حصة",
        paymentMethod: "transfer",
        status: "completed",
        invoiceNumber: "INV-003",
      },
    ];

    for (const payment of samplePayments) {
      await paymentsDB.setItem(payment.id, payment);
    }
  }
};

// Get all payments
export const getAllPayments = async (): Promise<Payment[]> => {
  await initPaymentsDB();
  const payments: Payment[] = [];
  await paymentsDB.iterate((value: Payment) => {
    payments.push(value);
  });
  return payments;
};

// Get payments by member ID
export const getPaymentsByMemberId = async (
  memberId: string,
): Promise<Payment[]> => {
  const allPayments = await getAllPayments();
  return allPayments.filter((payment) => payment.memberId === memberId);
};

// Get a payment by ID
export const getPaymentById = async (id: string): Promise<Payment | null> => {
  return await paymentsDB.getItem(id);
};

// Add a new payment
export const addPayment = async (
  payment: Omit<Payment, "id">,
): Promise<Payment> => {
  const id = Date.now().toString();
  const invoiceNumber = `INV-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;

  const newPayment = {
    ...payment,
    id,
    status: "completed",
    invoiceNumber,
    date: payment.date || new Date().toISOString(),
  };

  await paymentsDB.setItem(id, newPayment);

  // Import here to avoid circular dependency
  const { getMemberById, addActivity, resetMemberSessions } = await import(
    "./memberService"
  );

  // Add payment activity if we have member info
  if (payment.memberId) {
    const member = await getMemberById(payment.memberId);
    if (member) {
      await addActivity({
        memberId: member.id,
        memberName: member.name,
        memberImage: member.imageUrl,
        activityType: "payment",
        timestamp: new Date().toISOString(),
        details: `دفع ${formatNumber(payment.amount)} - ${payment.subscriptionType}`,
      });

      // Reset member sessions when payment is completed
      await resetMemberSessions(payment.memberId);
    }
  }

  return newPayment;
};

// Update a payment
export const updatePayment = async (payment: Payment): Promise<Payment> => {
  const updatedPayment = {
    ...payment,
    // Preserve original date and invoice number if they exist
    date: payment.date || new Date().toISOString(),
    invoiceNumber:
      payment.invoiceNumber ||
      `INV-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`,
    status: payment.status || "completed",
  };

  await paymentsDB.setItem(payment.id, updatedPayment);
  return updatedPayment;
};

// Add or update payment with specific ID (for imports)
export const addOrUpdatePaymentWithId = async (
  payment: Payment,
): Promise<Payment> => {
  const updatedPayment = {
    ...payment,
    date: payment.date || new Date().toISOString(),
    invoiceNumber: payment.invoiceNumber || `INV-${Date.now()}`,
    status: payment.status || "completed",
  };

  await paymentsDB.setItem(payment.id, updatedPayment);
  return updatedPayment;
};

// Add a session payment for non-subscribed members
export const addSessionPayment = async (
  memberName: string,
  memberPhone?: string,
): Promise<{ payment: Payment; memberId: string }> => {
  // Create a temporary member ID for the session
  const memberId = `session_${Date.now()}`;

  const payment: Omit<Payment, "id"> = {
    memberId,
    amount: 200, // 200 DZD for a session
    date: new Date().toISOString(),
    subscriptionType: "حصة واحدة",
    paymentMethod: "cash",
    notes: `دفع حصة واحدة - ${memberName}${memberPhone ? ` (${memberPhone})` : ""}`,
    status: "completed",
  };

  const newPayment = await addPayment(payment);

  // Add activity for this session payment
  await addActivity({
    memberId,
    memberName,
    activityType: "payment",
    timestamp: new Date().toISOString(),
    details: `دفع حصة واحدة - ${formatNumber(200)} دج`,
  });

  // Add check-in activity
  await addActivity({
    memberId,
    memberName,
    activityType: "check-in",
    timestamp: new Date().toISOString(),
    details: `تسجيل حضور حصة واحدة`,
  });

  return { payment: newPayment, memberId };
};

// Delete a payment
export const deletePayment = async (id: string): Promise<void> => {
  await paymentsDB.removeItem(id);
};

// Calculate subscription price based on type
export const calculateSubscriptionPrice = (
  subscriptionType: string,
): number => {
  if (!subscriptionType || typeof subscriptionType !== "string") {
    return 1000; // Default price
  }

  switch (subscriptionType.trim()) {
    case "شهري":
      return 1500;
    case "13 حصة":
      return 1000;
    case "15 حصة":
      return 1800;
    case "30 حصة":
      return 1800;
    case "حصة واحدة":
      return 200;
    default:
      return 1000;
  }
};

// Get payment statistics
export const getPaymentStatistics = async () => {
  const payments = await getAllPayments();

  // Helper function to safely sum amounts
  const safeSum = (paymentList: Payment[]) => {
    return paymentList.reduce((sum, payment) => {
      const amount = Number(payment.amount);
      return sum + (isNaN(amount) || !isFinite(amount) ? 0 : amount);
    }, 0);
  };

  // Calculate today's revenue
  const today = new Date().toISOString().split("T")[0];
  const todayPayments = payments.filter(
    (payment) => payment.date && payment.date.split("T")[0] === today,
  );

  // Calculate this week's revenue
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekPayments = payments.filter(
    (payment) => payment.date && new Date(payment.date) >= oneWeekAgo,
  );

  // Calculate this month's revenue
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const monthPayments = payments.filter(
    (payment) => payment.date && new Date(payment.date) >= oneMonthAgo,
  );

  const totalRevenue = safeSum(payments);
  const todayRevenue = safeSum(todayPayments);
  const weekRevenue = safeSum(weekPayments);
  const monthRevenue = safeSum(monthPayments);

  return {
    totalRevenue,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    paymentCount: payments.length,
    averagePayment: payments.length > 0 ? totalRevenue / payments.length : 0,
    subscriptionTypeBreakdown: payments.reduce(
      (acc: Record<string, number>, payment) => {
        const type = payment.subscriptionType || "غير محدد";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {},
    ),
    recentPayments: payments
      .filter((payment) => payment.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
  };
};

// Update payment status based on attendance
export const updatePaymentStatusByAttendance = async (
  memberId: string,
  attendanceDate: string,
): Promise<void> => {
  try {
    // Get all payments for this member
    const memberPayments = await getPaymentsByMemberId(memberId);

    if (memberPayments.length === 0) {
      // If no payments exist for this member, get member info and create a session payment
      const { getMemberById } = await import("./memberService");
      const member = await getMemberById(memberId);

      if (member) {
        // Create a single session payment record
        await addSessionPayment(memberId, member.name);
      }
      return;
    }

    // Get the most recent payment
    const latestPayment = memberPayments.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0];

    // Update the payment with attendance information
    const updatedPayment = {
      ...latestPayment,
      lastAttendanceDate: attendanceDate,
      // Add a note about the attendance
      notes: latestPayment.notes
        ? `${latestPayment.notes} | حضور بتاريخ ${formatDate(attendanceDate)}`
        : `حضور بتاريخ ${formatDate(attendanceDate)}`,
    };

    // Save the updated payment
    await updatePayment(updatedPayment);

    // Add an activity for this update
    await addActivity({
      memberId,
      activityType: "check-in",
      timestamp: new Date().toISOString(),
      details: `تم تحديث حالة الدفع بناءً على الحضور`,
    });
  } catch (error) {
    console.error("Error updating payment status based on attendance:", error);
  }
};
