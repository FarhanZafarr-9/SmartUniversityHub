import React from 'react';
import { logout } from '../../../services/servicesApi';
import { Link } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

const NavBottom = ({ isCollapsed, name, initials, user_id }) => {
    const handleLogout = async () => {
        try {
            await logout(); // Call the logout function
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    return (
        <div
            className={`flex ${isCollapsed ? 'flex-col' : ''} justify-center items-center w-full min-h-[60px] gap-2`}
        >
            {/* Profile Link */}
            <Link
                to="/profile"
                className={`flex flex-col border-[0.75px] border-[#55555555] hover:border-[#f0f0f0] hover:cursor-pointer w-full
                    } rounded-md bg-dark-glassy items-center justify-center mb-3 transition-all ease-linear duration-300`}
            >
                {isCollapsed ? (
                    <p className="text-[#f0f0f0] font-bold text-md tracking-tight">{initials}</p>
                ) : (
                    <div
                        className={`flex items-center justify-between px-3 transition-all duration-300 ease-linear ${isCollapsed ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                            }`}
                    >
                        <div>
                            <p className="text-[#f0f0f0] font-semibold text-sm">{name}</p>
                            <p className="text-[#b0b0b0] font-medium text-left text-opacity-90 text-xs tracking-wider">
                                {user_id}
                            </p>
                        </div>
                    </div>
                )}
            </Link>
            <button
                onClick={handleLogout}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-red-900/30 hover:bg-red-900/40 text-red-400 border border-red-900/50 hover:border-red-400 transition-all duration-300 mb-3"
                title="Logout"
            >
                <FiLogOut size={16} />
            </button>
        </div>
    );
};

export default NavBottom;