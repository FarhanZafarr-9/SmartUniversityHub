import React from 'react';
import StudentAttendance from '../StudentPages/StudentAttendance';
import FacultyAttendance from '../FacultyPages/FacultyAttendance';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useEffect } from 'react';

// Import pages from StudentsPages and FacultyPages folders

const DefaultAttendance = () => {
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
            return <StudentAttendance user={userData.user} />;
        case 'faculty':
            return <FacultyAttendance user={userData.user} />;
        case 'admin':
            return <div>Admin dashboard is not implemented yet.</div>;
        default:
            console.error('Unknown user type:', userData.user.user_type);
            return <div>Invalid role. Please contact support.</div>;
    }
};

export default DefaultAttendance;