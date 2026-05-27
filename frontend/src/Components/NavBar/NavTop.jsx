import React from 'react'
import icons from '/src/assets/icons';
import logo from '../../assets/logo.svg'

const NavTop = ({ isCollapsed, toggleNavbar }) => {
    return (
        <div className={`flex shadow ${isCollapsed ? 'w-[90%]' : 'w-[98%]'} p-5 rounded-xl bg-dark-glassy mt-3 transition-all ease-linear duration-300 border-[0.75px] border-[#5555551f] hover:border-[#c0c0c0]`}>
            
            <icons.FaArrowLeft
                onClick={toggleNavbar}
                className={`text-white hover:cursor-pointer hover:scale-125 transform ${isCollapsed ? 'rotate-180 ' : 'translate-x-8 '} transition all ease-linear duration-300`}
            />
        </div>
    )
}

export default NavTop