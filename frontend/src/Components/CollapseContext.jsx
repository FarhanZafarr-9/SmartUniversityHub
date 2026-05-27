import React, { createContext, useContext, useState } from 'react';

const CollapseContext = createContext();

export const CollapseProvider = ({ children = null }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const toggleNavbar = () => {
        setIsCollapsed(prev => !prev);
    };

    return (
        <CollapseContext.Provider value={{ isCollapsed, toggleNavbar }}>
            {children}
        </CollapseContext.Provider>
    );
};

export const useCollapse = () => useContext(CollapseContext);