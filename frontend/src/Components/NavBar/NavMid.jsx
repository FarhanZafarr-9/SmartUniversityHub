import React from 'react';
import icons from '/src/assets/icons';
import NavItem from './NavItem';

const NavMid = ({ isCollapsed, role }) => {
    // Main navigation items (reference only, not used directly)
    const mainNavItems = [
        { icon: icons.RiDashboardFill, label: 'Dashboard', to: '/dashboard' },
        { icon: icons.FaBook, label: 'Courses', to: '/courses' },
        { icon: icons.FaFolder, label: 'Materials', to: '/materials' },
        { icon: icons.FaCalendarAlt, label: 'Timetable', to: '/timetable' },
        { icon: icons.FaClipboardList, label: 'Assessments', to: '/assessments' },
        { icon: icons.FaChartBar, label: 'Grades', to: '/grades' },
        { icon: icons.FaUserCheck, label: 'Attendance', to: '/attendance' },
        { icon: icons.FaFileInvoiceDollar, label: 'Fees', to: '/fees' },
        { icon: icons.FaUser, label: 'Profile', to: '/profile' },
        { icon: icons.TbSettingsFilled, label: 'Settings', to: '/settings' }
    ];

    // Role-specific navigation items
    const studentNavItems = [
        { icon: icons.FaBook, label: 'Courses', to: '/courses' },
        { icon: icons.FaFolder, label: 'Materials', to: '/materials' },
        { icon: icons.FaCalendarAlt, label: 'Timetable', to: '/timetable' },
        { icon: icons.FaClipboardList, label: 'Assessments', to: '/assessments' },
        { icon: icons.FaChartBar, label: 'Grades', to: '/grades' },
        { icon: icons.FaUserCheck, label: 'Attendance', to: '/attendance' },
        { icon: icons.FaFileInvoiceDollar, label: 'Fees', to: '/fees' },
        { icon: icons.FaUser, label: 'Profile', to: '/profile' }
    ];

    const facultyNavItems = [
        { icon: icons.FaBook, label: 'Courses', to: '/courses' },
        { icon: icons.FaFolder, label: 'Materials', to: '/materials' },
        { icon: icons.FaCalendarAlt, label: 'Timetable', to: '/timetable' },
        { icon: icons.FaClipboardList, label: 'Assessments', to: '/assessments' },
        { icon: icons.FaUserCheck, label: 'Attendance', to: '/attendance' },
        { icon: icons.FaUser, label: 'Profile', to: '/profile' }
    ];

    const adminNavItems = [
        { icon: icons.FaBook, label: 'Courses', to: '/courses' }, // Updated icon for Courses
        { icon: icons.FaCalendarAlt, label: 'Timetable', to: '/timetable' },
        { icon: icons.FaCogs, label: 'Configs', to: '/admin/configs' }, // Added icon for Configs
        { icon: icons.FaClipboardList, label: 'Management', to: '/admin/management' }, // Added Management item
        { icon: icons.FaFileInvoiceDollar, label: 'Fees', to: '/fees' },
        { icon: icons.FaUser, label: 'Profile', to: '/profile' }
    ];

    // Determine which nav items to display based on role
    let navItems = [];
    if (role === 'student') {
        navItems = studentNavItems;
    } else if (role === 'faculty') {
        navItems = facultyNavItems;
    } else if (role === 'admin') {
        navItems = adminNavItems;
    }

    return (
        <div className={`flex flex-col gap-3 mb-auto ${isCollapsed ? 'w-[90%]' : 'w-[98%]'} py-3 px-0 rounded-xl transition-all ease-linear duration-300`}>
            {navItems.map((item, index) => (
                <NavItem key={index} icon={item.icon} label={item.label} to={item.to} isCollapsed={isCollapsed} />
            ))}
        </div>
    );
};

export default NavMid;