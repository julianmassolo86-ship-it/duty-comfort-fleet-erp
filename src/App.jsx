import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import MantenimientoForms from './pages/MantenimientoForms';
import Novedades from './pages/Novedades';
import Inventory from './pages/Inventory';
import FuelUps from './pages/FuelUps';
import VehicleModels from './pages/VehicleModels';
import InspectorPanel from './pages/InspectorPanel';
import FuelUpPanel from './pages/FuelUpPanel';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import DeliveryNotes from './pages/DeliveryNotes';
import StockMovements from './pages/StockMovements';
import TiresDashboard from './pages/TiresDashboard';
import TiresStock from './pages/TiresStock';
import TireAlerts from './pages/TireAlerts';
import TireRotations from './pages/TireRotations';
import SparePartCategories from './pages/SparePartCategories';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/MantenimientoForms" element={<LayoutWrapper currentPageName="MantenimientoForms"><MantenimientoForms /></LayoutWrapper>} />
      <Route path="/Novedades" element={<LayoutWrapper currentPageName="Novedades"><Novedades /></LayoutWrapper>} />
      <Route path="/Inventory" element={<LayoutWrapper currentPageName="Inventory"><Inventory /></LayoutWrapper>} />
      <Route path="/FuelUps" element={<LayoutWrapper currentPageName="FuelUps"><FuelUps /></LayoutWrapper>} />
      <Route path="/VehicleModels" element={<LayoutWrapper currentPageName="VehicleModels"><VehicleModels /></LayoutWrapper>} />
      <Route path="/InspectorPanel" element={<LayoutWrapper currentPageName="InspectorPanel"><InspectorPanel /></LayoutWrapper>} />
      <Route path="/FuelUpPanel" element={<LayoutWrapper currentPageName="FuelUpPanel"><FuelUpPanel /></LayoutWrapper>} />
      <Route path="/Suppliers" element={<LayoutWrapper currentPageName="Suppliers"><Suppliers /></LayoutWrapper>} />
      <Route path="/PurchaseOrders" element={<LayoutWrapper currentPageName="PurchaseOrders"><PurchaseOrders /></LayoutWrapper>} />
      <Route path="/DeliveryNotes" element={<LayoutWrapper currentPageName="DeliveryNotes"><DeliveryNotes /></LayoutWrapper>} />
      <Route path="/StockMovements" element={<LayoutWrapper currentPageName="StockMovements"><StockMovements /></LayoutWrapper>} />
      <Route path="/TiresDashboard" element={<LayoutWrapper currentPageName="TiresDashboard"><TiresDashboard /></LayoutWrapper>} />
      <Route path="/TiresStock" element={<LayoutWrapper currentPageName="TiresStock"><TiresStock /></LayoutWrapper>} />
      <Route path="/TireAlerts" element={<LayoutWrapper currentPageName="TireAlerts"><TireAlerts /></LayoutWrapper>} />
      <Route path="/TireRotations" element={<LayoutWrapper currentPageName="TireRotations"><TireRotations /></LayoutWrapper>} />
      <Route path="/SparePartCategories" element={<LayoutWrapper currentPageName="SparePartCategories"><SparePartCategories /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App