import React, { useEffect } from 'react';
import {
  Routes,
  Route,
  useLocation,
  Navigate,
  Outlet
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import './css/style.css';

import './charts/ChartjsConfig';

// Import pages
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Fintech from './pages/Fintech';
import Customers from './pages/ecommerce/Customers';
import UsersManagement from './pages/design/UsersManagement';
import Orders from './pages/ecommerce/Orders';
import Invoices from './pages/ecommerce/Invoices';
import Shop from './pages/ecommerce/Shop';
import Shop2 from './pages/ecommerce/Shop2';
import Product from './pages/ecommerce/Product';
import Cart from './pages/ecommerce/Cart';
import Cart2 from './pages/ecommerce/Cart2';
import Cart3 from './pages/ecommerce/Cart3';
import Pay from './pages/ecommerce/Pay';
import Campaigns from './pages/Campaigns';
import UsersTabs from './pages/community/UsersTabs';
import UsersTiles from './pages/community/UsersTiles';
import Profile from './pages/community/Profile';
import Feed from './pages/community/Feed';
import Forum from './pages/community/Forum';
import ForumPost from './pages/community/ForumPost';
import Meetups from './pages/community/Meetups';
import MeetupsPost from './pages/community/MeetupsPost';
import CreditCards from './pages/finance/CreditCards';
import Transactions from './pages/finance/Transactions';
import TransactionDetails from './pages/finance/TransactionDetails';
import JobListing from './pages/job/JobListing';
import JobPost from './pages/job/JobPost';
import CompanyProfile from './pages/job/CompanyProfile';
import Messages from './pages/Messages';
import TasksKanban from './pages/tasks/TasksKanban';
import TasksList from './pages/tasks/TasksList';
import Inbox from './pages/Inbox';
import Calendar from './pages/Calendar';
import Account from './pages/settings/Account';
import Notifications from './pages/settings/Notifications';
import Apps from './pages/settings/Apps';
import Plans from './pages/settings/Plans';
import Billing from './pages/settings/Billing';
import Feedback from './pages/settings/Feedback';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminKeys from './pages/admin/AdminKeys';
import ExternalUserLogs from './pages/admin/ExternalUserLogs';
import N8NAutomation from './pages/admin/N8NAutomation';
import N8NWorkflowDesign from './pages/admin/N8NWorkflowDesign';
import UserCreationDemo from './pages/UserCreationDemo';
import Changelog from './pages/utility/Changelog';
import Roadmap from './pages/utility/Roadmap';
import Faqs from './pages/utility/Faqs';
import EmptyState from './pages/utility/EmptyState';
import PageNotFound from './pages/utility/PageNotFound';
import KnowledgeBase from './pages/utility/KnowledgeBase';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import Onboarding01 from './pages/Onboarding01';
import Onboarding02 from './pages/Onboarding02';
import Onboarding03 from './pages/Onboarding03';
import Onboarding04 from './pages/Onboarding04';
import ButtonPage from './pages/component/ButtonPage';
import FormPage from './pages/component/FormPage';
import DropdownPage from './pages/component/DropdownPage';
import AlertPage from './pages/component/AlertPage';
import ModalPage from './pages/component/ModalPage';
import PaginationPage from './pages/component/PaginationPage';
import TabsPage from './pages/component/TabsPage';
import BreadcrumbPage from './pages/component/BreadcrumbPage';
import BadgePage from './pages/component/BadgePage';
import AvatarPage from './pages/component/AvatarPage';
import TooltipPage from './pages/component/TooltipPage';
import AccordionPage from './pages/component/AccordionPage';
import IconsPage from './pages/component/IconsPage';
import DesignPage1 from './pages/design/Page1';
import DesignPage2 from './pages/design/Page2';
import DesignPage3 from './pages/design/Page3';
import DesignPage4 from './pages/design/Page4';
import DesignPage5 from './pages/design/Page5';
import DynamoDBTables from './pages/design/DynamoDBTables';
import DynamoDBTablesNew from './pages/design/DynamoDBTablesNew';

// Import ProtectedRoute component
import ProtectedRoute from './components/ProtectedRoute';

// Layout component for protected routes that require authentication
const ProtectedLayout = () => {
  return (
    <ProtectedRoute requireAuth>
      <Outlet />
    </ProtectedRoute>
  );
};

// Layout for routes that require both authentication and completed onboarding
const OnboardingLayout = () => {
  return (
    <ProtectedRoute requireAuth requireOnboarding>
      <Outlet />
    </ProtectedRoute>
  );
};

// Layout for public routes (signin, signup, etc.)
const PublicLayout = () => {
  return (
    <ProtectedRoute requireAuth={false}>
      <Outlet />
    </ProtectedRoute>
  );
};

function App() {
  const location = useLocation();

  useEffect(() => {
    // Only scroll to top for main page changes, not sidebar navigation
    // Check if this is a major route change (not just admin sub-routes)
    const isMajorRouteChange = !location.pathname.includes('/admin/') && 
                              !location.pathname.includes('/ecommerce/') &&
                              !location.pathname.includes('/settings/') &&
                              !location.pathname.includes('/component/');
    
    if (isMajorRouteChange) {
      // Smooth scroll to top only for major route changes
      document.querySelector('html').style.scrollBehavior = 'smooth';
      window.scroll({ top: 0 });
      // Reset scroll behavior after a short delay
      setTimeout(() => {
        document.querySelector('html').style.scrollBehavior = '';
      }, 100);
    }
  }, [location.pathname]);

  return (
    <AuthProvider>
      <Routes>
        {/* Public routes - accessible without authentication */}
        <Route element={<PublicLayout />}>
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/utility/404" element={<PageNotFound />} />
        </Route>

        {/* Onboarding routes - requires authentication but not completed onboarding */}
        <Route element={<OnboardingLayout />}>
          <Route path="/onboarding/1" element={<Onboarding01 />} />
          <Route path="/onboarding/2" element={<Onboarding02 />} />
          <Route path="/onboarding/3" element={<Onboarding03 />} />
          <Route path="/onboarding/complete" element={<Onboarding04 />} />
        </Route>

        {/* Protected routes - requires authentication and completed onboarding */}
        <Route element={<ProtectedLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/dashboard/analytics" element={<Analytics />} />
          <Route path="/dashboard/fintech" element={<Fintech />} />
          
          {/* E-commerce */}
          <Route path="/ecommerce/customers" element={<Customers />} />
          <Route path="/ecommerce/orders" element={<Orders />} />
          <Route path="/ecommerce/invoices" element={<Invoices />} />
          <Route path="/ecommerce/shop" element={<Shop />} />
          <Route path="/ecommerce/shop-2" element={<Shop2 />} />
          <Route path="/ecommerce/product" element={<Product />} />
          <Route path="/ecommerce/cart" element={<Cart />} />
          <Route path="/ecommerce/cart-2" element={<Cart2 />} />
          <Route path="/ecommerce/cart-3" element={<Cart3 />} />
          <Route path="/ecommerce/pay" element={<Pay />} />
          
          {/* Community */}
          <Route path="/community/users-tabs" element={<UsersTabs />} />
          <Route path="/community/users-tiles" element={<UsersTiles />} />
          <Route path="/community/profile" element={<Profile />} />
          <Route path="/community/feed" element={<Feed />} />
          <Route path="/community/forum" element={<Forum />} />
          <Route path="/community/forum-post" element={<ForumPost />} />
          <Route path="/community/meetups" element={<Meetups />} />
          <Route path="/community/meetups-post" element={<MeetupsPost />} />
          
          {/* Finance */}
          <Route path="/finance/cards" element={<CreditCards />} />
          <Route path="/finance/transactions" element={<Transactions />} />
          <Route path="/finance/transaction-details" element={<TransactionDetails />} />
          
          {/* Jobs */}
          <Route path="/job/job-listing" element={<JobListing />} />
          <Route path="/job/job-post" element={<JobPost />} />
          <Route path="/job/company-profile" element={<CompanyProfile />} />
          
          {/* Apps */}
          <Route path="/messages" element={<Messages />} />
          <Route path="/tasks/kanban" element={<TasksKanban />} />
          <Route path="/tasks/list" element={<TasksList />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/calendar" element={<Calendar />} />
          
          {/* Settings */}
          <Route path="/settings/account" element={<Account />} />
          <Route path="/settings/notifications" element={<Notifications />} />
          <Route path="/settings/apps" element={<Apps />} />
          <Route path="/settings/plans" element={<Plans />} />
          <Route path="/settings/billing" element={<Billing />} />
          <Route path="/settings/feedback" element={<Feedback />} />
          
          {/* Admin */}
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/admin/keys" element={<AdminKeys />} />
          <Route path="/admin/logs" element={<ExternalUserLogs />} />
          <Route path="/admin/n8n-automation" element={<N8NAutomation />} />
          <Route path="/admin/n8n-workflow-design" element={<N8NWorkflowDesign />} />
          <Route path="/user-creation-demo" element={<UserCreationDemo />} />
          
          {/* Utility */}
          <Route path="/utility/changelog" element={<Changelog />} />
          <Route path="/utility/roadmap" element={<Roadmap />} />
          <Route path="/utility/faqs" element={<Faqs />} />
          <Route path="/utility/empty-state" element={<EmptyState />} />
          <Route path="/utility/knowledge-base" element={<KnowledgeBase />} />
          
          {/* Components */}
          <Route path="/component/button" element={<ButtonPage />} />
          <Route path="/component/form" element={<FormPage />} />
          <Route path="/component/dropdown" element={<DropdownPage />} />
          <Route path="/component/alert" element={<AlertPage />} />
          <Route path="/component/modal" element={<ModalPage />} />
          <Route path="/component/pagination" element={<PaginationPage />} />
          <Route path="/component/tabs" element={<TabsPage />} />
          <Route path="/component/breadcrumb" element={<BreadcrumbPage />} />
          <Route path="/component/badge" element={<BadgePage />} />
          <Route path="/component/avatar" element={<AvatarPage />} />
          <Route path="/component/tooltip" element={<TooltipPage />} />
          <Route path="/component/accordion" element={<AccordionPage />} />
          <Route path="/component/icons" element={<IconsPage />} />

          {/* Design */}
          <Route path="/design/page-1" element={<DesignPage1 />} />
          <Route path="/design/page-2" element={<DesignPage2 />} />
          <Route path="/design/page-3" element={<DesignPage3 />} />
          <Route path="/design/page-4" element={<DesignPage4 />} />
          <Route path="/design/page-5" element={<DesignPage5 />} />
          <Route path="/design/users-management" element={<UsersManagement />} />
          <Route path="/design/dynamodb-tables" element={<DynamoDBTables />} />
          <Route path="/design/dynamodb-tables-new" element={<DynamoDBTablesNew />} />
        </Route>

        {/* 404 - Keep at the bottom */}
        <Route path="*" element={<Navigate to="/utility/404" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
