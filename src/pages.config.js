/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Companies from './pages/Companies';
import CompanyAdmins from './pages/CompanyAdmins';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Drivers from './pages/Drivers';
import LandingPage from './pages/LandingPage';
import Locations from './pages/Locations';
import Maintenance from './pages/Maintenance';
import Manufacturers from './pages/Manufacturers';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import VehicleCategories from './pages/VehicleCategories';
import VehicleStatuses from './pages/VehicleStatuses';
import VehicleTypes from './pages/VehicleTypes';
import Vehicles from './pages/Vehicles';
import MaintenancePrograms from './pages/MaintenancePrograms';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Companies": Companies,
    "CompanyAdmins": CompanyAdmins,
    "Dashboard": Dashboard,
    "Documents": Documents,
    "Drivers": Drivers,
    "LandingPage": LandingPage,
    "Locations": Locations,
    "Maintenance": Maintenance,
    "Manufacturers": Manufacturers,
    "Profile": Profile,
    "Reports": Reports,
    "VehicleCategories": VehicleCategories,
    "VehicleStatuses": VehicleStatuses,
    "VehicleTypes": VehicleTypes,
    "Vehicles": Vehicles,
    "MaintenancePrograms": MaintenancePrograms,
}

export const pagesConfig = {
    mainPage: "LandingPage",
    Pages: PAGES,
    Layout: __Layout,
};