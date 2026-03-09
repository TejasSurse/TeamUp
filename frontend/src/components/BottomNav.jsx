import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNav = () => {
    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 glass-nav h-16 flex items-center justify-around z-50 px-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <NavLink
                to="/turfs"
                className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary scale-110' : 'text-gray-400'}`}
            >
                <i className="fa-solid fa-magnifying-glass text-xl"></i>
                <span className="text-[10px] font-bold">Explore</span>
            </NavLink>

            <NavLink
                to="/dashboard"
                className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary scale-110' : 'text-gray-400'}`}
            >
                <i className="fa-solid fa-calendar-check text-xl"></i>
                <span className="text-[10px] font-bold">Bookings</span>
            </NavLink>

            <NavLink
                to="/profile"
                className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary scale-110' : 'text-gray-400'}`}
            >
                <i className="fa-solid fa-user text-xl"></i>
                <span className="text-[10px] font-bold">Profile</span>
            </NavLink>
        </div>
    );
};

export default BottomNav;
