import React from 'react';
import { useCollapse } from './CollapseContext';
import { useLocation } from 'react-router-dom';
import NavTop from './NavBar/NavTop';
import NavMid from './NavBar/NavMid';
import NavBottom from './NavBar/NavBottom';
import Divider from './Divider';
import { useState } from 'react';
import { useEffect } from 'react';


const Navbar = () => {
  const { isCollapsed, toggleNavbar } = useCollapse();
  const location = useLocation();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Check both location state and localStorage
    const data = location.state?.response ||
      JSON.parse(localStorage.getItem('currentUser'));

    if (data) {
      setUserData(data.user);
    } else {
      console.warn('No user data found');
    }
  }, [location.state]);

  if (!userData) {
    return <></>;
  }


  const pages = ['dashboard', 'attendance', 'profile', 'courses', 'settings', 'grades', 'assessments', 'fees', 'materials', 'timetable', 'configs','admin'];

  if (!pages.includes(location.pathname.split('/')[1])) {
    return null;
  }

  const initials = (
    userData?.name && typeof userData.name === 'string'
      ? userData.name
        .split(' ')
        .filter(part => part.trim() !== '')
        .map(part => part[0].toUpperCase())
        .join(' ')
      : ''
  );


  return (
    <div
      className={`flex flex-col ${isCollapsed ? 'w-20' : 'w-56'} h-[96dvh] 
      bg-dark-semi-dark ml-3 rounded-2xl shadow-dark items-center transition-all ease-linear
      p-2 duration-300 border-[0.75px] border-[#55555555] overflow-y-hidden overflow-x-hidden`}
    >
      <NavTop isCollapsed={isCollapsed} toggleNavbar={toggleNavbar} />
      <Divider margin='25px 0 15px 0' />
      <NavMid isCollapsed={isCollapsed} role={`${userData.user_type}`} />
      <Divider margin='25px 0' />
      <NavBottom isCollapsed={isCollapsed} name={`${userData?.name}`} user_id={`${userData.user_id}`} initials={`${initials}`} />
    </div>
  );
};

export default Navbar;
