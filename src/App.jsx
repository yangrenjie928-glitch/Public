import { useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LearningPage from "./pages/LearningPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import ProfileDashboard from "./pages/ProfileDashboard";
import TrialLessonPage from "./pages/TrialLessonPage";
import CampaignChineseMonthPage from "./pages/CampaignChineseMonthPage";
import AuthPage from "./pages/AuthPage";
import LevelTestPage from "./pages/LevelTestPage";
import AiPracticeGamePage from "./pages/AiPracticeGamePage";
import FunnelGroupSuccessPage from "./pages/FunnelGroupSuccessPage";
import FunnelTrialLessonPage from "./pages/FunnelTrialLessonPage";
import FunnelEngagementPage from "./pages/FunnelEngagementPage";
import FunnelOfferPage from "./pages/FunnelOfferPage";
import FunnelPaymentPage from "./pages/FunnelPaymentPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import CheckoutCancelPage from "./pages/CheckoutCancelPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import GroupDashboardPage from "./pages/GroupDashboardPage";
import PersonalCustomPage from "./pages/PersonalCustomPage";
import PremiumCustomPage from "./pages/PremiumCustomPage";
import PkArenaPage from "./pages/PkArenaPage";
import AdminRoute from "./components/auth/AdminRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import AdminContentPage from "./pages/admin/AdminContentPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminFunnelPage from "./pages/admin/AdminFunnelPage";
import { useAuth } from "./context/AuthContext";

function App() {
  const { loading } = useAuth();
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("page-enter");
  const exitTimerRef = useRef(null);

  const finishTransition = () => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setDisplayLocation(location);
    setTransitionStage("page-enter");
  };

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage("page-exit");
      // Fallback: some browsers/user settings may skip animation events.
      exitTimerRef.current = setTimeout(() => {
        finishTransition();
      }, 260);
    }
  }, [location, displayLocation]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container-main py-12">
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft">
            <p className="text-sm font-bold text-slate-500">App Loading...</p>
            <h1 className="mt-2 text-xl font-black text-slate-900">Загружаем данные аккаунта</h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Подготавливаем профиль и маршруты, чтобы страница открылась без сбоев.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-main py-8">
        <div
          className={transitionStage}
          onAnimationEnd={() => {
            if (transitionStage === "page-exit") {
              finishTransition();
            }
          }}
        >
          <Routes location={displayLocation}>
            <Route path="/" element={<HomePage />} />
            <Route path="/learning/trial" element={<TrialLessonPage />} />
            <Route path="/test" element={<LevelTestPage />} />
            <Route path="/ai-practice" element={<AiPracticeGamePage />} />
            <Route path="/campaign/chinese-month" element={<CampaignChineseMonthPage />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/learning/custom" element={<PersonalCustomPage />} />
            <Route path="/learning/custom-premium" element={<PremiumCustomPage />} />
            <Route path="/learning/group-dashboard" element={<GroupDashboardPage />} />
            <Route path="/pk-arena" element={<PkArenaPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />
            <Route path="/profile" element={<ProfileDashboard />} />
            <Route path="/funnel/group-success" element={<FunnelGroupSuccessPage />} />
            <Route path="/funnel/trial-lesson" element={<FunnelTrialLessonPage />} />
            <Route path="/funnel/engagement" element={<FunnelEngagementPage />} />
            <Route path="/funnel/offer" element={<FunnelOfferPage />} />
            <Route path="/funnel/payment" element={<FunnelPaymentPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminOverviewPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="courses" element={<AdminCoursesPage />} />
              <Route path="events" element={<AdminEventsPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="funnel" element={<AdminFunnelPage />} />
            </Route>
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
