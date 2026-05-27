import React from 'react';
import StudentDashboard from '../StudentPages/StudentDashboard';
import FacultyDashboard from '../FacultyPages/FacultyDashboard';
import AdminDashboard from '../AdminPages/AdminDashboard'; // Import AdminDashboard
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useEffect } from 'react';

// Import pages from StudentsPages and FacultyPages folders

const DefaultDashboard = () => {
    const location = useLocation();
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Check both location state and localStorage
        const data = location.state?.response ||
            JSON.parse(localStorage.getItem('currentUser'));

        if (data) {
            setUserData(data);
        } else {
            console.warn('No user data found');
        }
    }, [location.state]);

    if (!userData) {
        return <div>Please log in to access the dashboard.</div>;
    }

    if (!userData.user) {
        console.error('User data malformed:', userData);
        return <div>User data incomplete. Please log in again.</div>;
    }

    switch (userData.user.user_type.toLowerCase()) { // Case-insensitive check
        case 'student':
            return <StudentDashboard user={userData.user} />;
        case 'faculty':
            return <FacultyDashboard user={userData.user} />;
        case 'admin':
            return <AdminDashboard user={userData.user} />; // Render AdminDashboard for admin users
        default:
            console.error('Unknown user type:', userData.user.user_type);
            return <div>Invalid role. Please contact support.</div>;
    }
};

export default DefaultDashboard;