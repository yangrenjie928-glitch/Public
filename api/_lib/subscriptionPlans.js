export const SUBSCRIPTION_PLANS = {
  course_monthly: {
    code: "course_monthly",
    title: "Course Monthly",
    amount: 990,
    currency: "RUB",
    periodMonths: 1,
  },
  course_yearly: {
    code: "course_yearly",
    title: "Course Yearly",
    amount: 9990,
    currency: "RUB",
    periodMonths: 12,
  },
};

export function resolvePlan(planCode) {
  return SUBSCRIPTION_PLANS[String(planCode || "").trim()] ?? null;
}
