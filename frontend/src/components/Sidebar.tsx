import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt, faCogs, faMoneyCheckAlt, faCar, faClipboardList,
  faUsers, faUserTie, faUserSecret, faFileInvoice, faChartBar, faDatabase,
  faChevronDown, faChevronRight, faPlus, faList, faEnvelope, faCity,
  faBuilding, faBoxOpen, faMapMarkerAlt, faReceipt, faBell, faCheckCircle,
  faTimesCircle, faUser, faUserPlus, faUserFriends, faTruck, faCarSide,
  faCarAlt, faMoneyBillWave, faCashRegister, faClipboardCheck, faFileAlt,
  faCrown, faUserPen,
  faCalendarAlt,
  faCalendarCheck,
  faFileLines
} from '@fortawesome/free-solid-svg-icons';
import { NavLink } from 'react-router-dom'; // ✅ Changed from Link to NavLink

// Interface for menu items
interface MenuItem {
  label: string;
  path?: string;
  icon: any;
  children?: MenuItem[];
}

// Menu items
const menu: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: faTachometerAlt,
    path: '/dashboard',
  },
  {
    label: 'Master',
    icon: faCrown,
    children: [
      {
        label: 'Tax',
        icon: faList,
        children: [
          { label: 'Add Tax', path: '/master/tax/add', icon: faPlus },
          { label: 'List Tax', path: '/master/tax/list', icon: faList },
        ],
      },
      {
        label: 'Pickup Area',
        icon: faMapMarkerAlt,
        children: [
          { label: 'Add Pickup Area', path: '/master/pickuparea/add', icon: faPlus },
          { label: 'Pickup Area Info', path: '/master/pickuparea/info', icon: faList },
        ],
      },
      {
        label: 'Pickup City',
        icon: faCity,
        children: [
          { label: 'Add Pickup City', path: '/master/pickupcity/add', icon: faPlus },
          { label: 'List Pickup City', path: '/master/pickupcity/list', icon: faList },
        ],
      },
      {
        label: 'Company',
        icon: faBuilding,
        children: [
          { label: 'Add Company', path: '/master/company/add', icon: faPlus },
          { label: 'List Company', path: '/master/company/list', icon: faList },
        ],
      },
      {
        label: 'Package',
        icon: faBoxOpen,
        children: [
          { label: 'Add Package', path: '/master/package/add', icon: faPlus },
          { label: 'List Package', path: '/master/package/list', icon: faList },
        ],
      },
    ],
  },
  {
    label: 'Configuration',
    icon: faCogs,
    children: [
      { label: 'Configuration', path: '/configuration/master', icon: faCogs },
      { label: 'Email Configuration', path: '/configuration/email', icon: faEnvelope }
    ],
  },
  {
    label: 'Payment Mode',
    icon: faMoneyCheckAlt,
    children: [
      { label: 'Add Payment Mode', path: '/paymentmode/add', icon: faPlus },
      { label: 'List Payment Mode', path: '/paymentmode/list', icon: faList },
    ],
  },
  {
    label: 'Vehicle',
    icon: faCar,
    children: [
      {
        label: 'Vehicle Type',
        icon: faList,
        children: [
          { label: 'Add Vehicle Type', path: '/vehicle/vehicletype/add', icon: faPlus },
          { label: 'List Vehicle Type', path: '/vehicle/vehicletype/list', icon: faCarSide },
        ],
      },
      {
        label: 'Vehicle Model',
        icon: faList,
        children: [
          { label: 'Add Vehicle Model', path: '/vehicle/vehiclemodel/add', icon: faPlus },
          { label: 'List Vehicle Model', path: '/vehicle/vehiclemodel/list', icon: faCarAlt },
        ],
      },
      {
        label: 'Vehicle Master',
        icon: faList,
        children: [
          { label: 'Add Vehicle Master', path: '/vehicle/vehiclemaster/add', icon: faPlus },
          { label: 'List Vehicle Master', path: '/vehicle/vehiclemaster/list', icon: faTruck },
        ],
      },
    ],
  },
  {
    label: 'Orders',
    icon: faClipboardList,
    children: [
      { label: 'Confirm Pending List', path: '/orders/confirmpending', icon: faClipboardCheck },
      { label: 'Close Pending List', path: '/orders/closepending', icon: faTimesCircle },
      { label: 'Payment Pending List', path: '/orders/paymentpending', icon: faMoneyBillWave },
      { label: 'Completed List', path: '/orders/completed', icon: faCheckCircle },
      { label: 'Payment List', path: '/orders/paymentlist', icon: faCashRegister },
      { label: 'List Cancel Order', path: '/orders/cancelled', icon: faTimesCircle },
    ],
  },
  {
    label: 'Users',
    icon: faUsers,
    children: [
      { label: 'Add User', path: '/users/adduser', icon: faUserPen },
      { label: 'User List', path: '/users/list', icon: faUserFriends }
    ],
  },
   {
    label: 'Monthly Bookings',
    icon: faCalendarAlt,
    children: [
      { label: 'Monthly Invoice', path: '/booking/monthlybooking', icon: faCalendarCheck },
      { label: 'Monthly Report', path: '/booking/monthlyreport', icon: faFileLines },
      { label: 'OnCall Invoice', path: '/booking/oncallinvoice', icon: faFileLines },
    ],
  },
  {
    label: 'Owners',
    icon: faUserTie,
    children: [
      { label: 'Add Owner', path: '/vendors/add', icon: faUserPlus },
      { label: 'List Owner', path: '/vendors/list', icon: faUser },
    ],
  },
  {
    label: 'Drivers',
    icon: faUserSecret,
    children: [
      { label: 'Add Driver', path: '/drivers/add', icon: faUserPlus },
      { label: 'List Driver', path: '/drivers/list', icon: faUser },
      { label: 'List Assigned Task', path: '/drivers/assignedlist', icon: faTruck },
        { label: 'Trip Details', path: '/drivers/tripdetails', icon: faTruck },
    ],
  },
  
  {
    label: 'Invoice',
    icon: faFileInvoice,
    children: [
      { label: 'Pending Invoices', path: '/invoice/pending', icon: faReceipt },
      { label: 'Invoice Reminder', path: '/invoice/reminder', icon: faBell },
      { label: 'Payment For Invoices', path: '/invoice/paymentfor', icon: faMoneyBillWave },
      { label: 'Paid Invoice List', path: '/invoice/paid', icon: faCheckCircle },
      { label: 'All Invoice List', path: '/invoice/all', icon: faList },
      { label: 'Invoice Pay Holder', path: '/invoice/payholder', icon: faFileAlt },
    ],
  },
  {
    label: 'Reports',
    icon: faChartBar,
    children: [
      { label: 'Order Summary', path: '/reports/order-summary', icon: faClipboardCheck },
      { label: 'Company Order Summary', path: '/reports/company-order-summary', icon: faBuilding },
      { label: 'Overall Invoice Report', path: '/reports/overall-invoice-report', icon: faFileInvoice },
    ],
  },
  { label: 'Uploads', icon: faDatabase, path: '/uploads' },
  { label: 'Cache', icon: faDatabase, path: '/cache' },
];

const Sidebar: React.FC = () => {
  const [openDropdown, setOpenDropdown] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const toggleDropdown = (label: string) => {
    setOpenDropdown((prev: any) =>
      prev.includes(label)
        ? prev.filter((item: any) => item !== label)
        : [...prev, label]
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen flex flex-col shadow-lg transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-70'}
        z-40 bg-[#275981] text-[#ebf4f6]
      `}
      style={{ backdropFilter: 'blur(10px)' }}
    >
  {/* Logo/Header */}
<div className="sticky top-0 z-10">
  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
    {/* Logo */}
    <img 
      src="/images/favicon1.jpeg" 
      alt="Driver logo" 
      className="h-11 w-12 rounded-full" 
    />

    {/* Text */}
    <span className="text-xl font-bold text-white">
      Grace Cabs
    </span>
  </div>
</div>


      {/* Menu */}
      <nav className="flex-1 overflow-y-hidden hover:overflow-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent py-4 text-[#e8e9f2]">
        <ul className="space-y-1">
          {menu.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <>
                  {/* Parent Menu */}
                  <button
                    className={`flex items-center w-full px-6 py-3 transition-colors duration-200 ${collapsed ? 'justify-center' : ''
                      } hover:bg-white hover:text-black`}
                    onClick={() => toggleDropdown(item.label)}
                  >
                    <FontAwesomeIcon icon={item.icon} className={`text-lg ${collapsed ? '' : 'mr-3'}`} />
                    {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                    {!collapsed && (
                      <FontAwesomeIcon
                        icon={openDropdown.includes(item.label) ? faChevronDown : faChevronRight}
                        className="ml-auto"
                      />
                    )}
                  </button>

                  {/* Submenus */}
                  {openDropdown.includes(item.label) && !collapsed && (
                    <ul className="ml-8 mt-1 space-y-1">
                      {item.children.map((subItem) => (
                        <li key={subItem.label}>
                          {subItem.children ? (
                            <>
                              {/* Submenu with children */}
                              <button
                                className="flex items-center w-full px-4 py-2 hover:bg-white hover:text-black transition-colors duration-200"
                                onClick={() => toggleDropdown(`${item.label}-${subItem.label}`)}
                              >
                                <FontAwesomeIcon icon={subItem.icon} className="mr-2 text-base" />
                                <span className="flex-1 text-left">{subItem.label}</span>
                                <FontAwesomeIcon
                                  icon={openDropdown.includes(`${item.label}-${subItem.label}`) ? faChevronDown : faChevronRight}
                                  className="text-xs"
                                />
                              </button>

                              {/* Final Nested Links */}
                              {openDropdown.includes(`${item.label}-${subItem.label}`) && (
                                <ul className="ml-6 mt-1 space-y-1">
                                  {subItem.children?.map((child) => (
                                    <li key={child.label}>
                                      <NavLink
                                        to={child.path || '#'}
                                        className={({ isActive }) =>
                                          `flex items-center px-4 py-1.5 transition-colors duration-200 rounded-md 
                                          ${isActive ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`
                                        }
                                      >
                                        <FontAwesomeIcon icon={child.icon} className="mr-2" />
                                        {child.label}
                                      </NavLink>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </>
                          ) : (
                            // Direct Submenu Link
                            <NavLink
                              to={subItem.path || '#'}
                              className={({ isActive }) =>
                                `flex items-center px-4 py-2 transition-colors duration-200 rounded-md 
                                ${isActive ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`
                              }
                            >
                              <FontAwesomeIcon icon={subItem.icon} className="mr-2 text-base" />
                              {subItem.label}
                            </NavLink>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                // Single-level menu
                <NavLink
                  to={item.path || '#'}
                  className={({ isActive }) =>
                    `flex items-center px-6 py-3 transition-colors duration-200 rounded-md 
                    ${collapsed ? 'justify-center' : ''} 
                    ${isActive ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`
                  }
                >
                  <FontAwesomeIcon icon={item.icon} className={`text-lg ${collapsed ? '' : 'mr-3'}`} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

