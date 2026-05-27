import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavItem = ({ icon: Icon, label, to, isCollapsed }) => {

    const location = useLocation();
    const isActive = (location.pathname === to);

    return (
        <Link
            className={`flex shadow-light gap-4 items-center transition-all ease-linear duration-300 border-[0.75px] p-2 py-1 rounded-lg group ${!isActive ? 'bg-dark-glassy border-[#5555552f] hover:border-[#555555]' : 'bg-dark-dark-card border-dark-dark-card hover:border-[#555555]'} `}
            to={to}
        >
            <Icon className={`min-w-4 mt-2 ml-3 mb-2 hover:cursor-pointer `} />
            <span
                className={` font-semibold z-10 text-sm rounded-md transition-all ease-linear duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none ' : ''}`}
            >
                {label}
            </span>
        </Link>
    );
};

export default NavItem;