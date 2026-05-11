export const SUBSCRIPTION_PLANS = {
  course_monthly: {
    code: "course_monthly",
    title: "Курс: месяц",
    amount: 990,
    currency: "RUB",
    periodLabel: "30 дней",
  },
  course_yearly: {
    code: "course_yearly",
    title: "Курс: год",
    amount: 9990,
    currency: "RUB",
    periodLabel: "12 месяцев",
  },
};

export function resolveSubscriptionPlan(planCode) {
  return SUBSCRIPTION_PLANS[String(planCode || "").trim()] ?? SUBSCRIPTION_PLANS.course_monthly;
}
