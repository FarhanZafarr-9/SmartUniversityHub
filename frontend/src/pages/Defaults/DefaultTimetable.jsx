import React from 'react';
import StudentTimetable from '../StudentPages/StudentTimetable';
import FacultyTimetable from '../FacultyPages/FacultyTimetable';
import AdminTimetable from '../AdminPages/AdminTimetable';

const DefaultTimetable = () => {

    const userType = localStorage.getItem('currentUser')
        ? JSON.parse(localStorage.getItem('currentUser'))?.user?.user_type
        : null;

    if (userType === 'student') {
        return <StudentTimetable />;
    }
    if (userType === 'faculty') {
        return <FacultyTimetable />;
    }
    if (userType === 'admin') {
        return <AdminTimetable />;
    }
    return (
        <div className="h-full w-full p-6 overflow-y-auto bg-dark-semi-dark rounded-xl border border-[#55555555]">
            <div className="mb-6 bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                <h1 className="text-xl font-semibold text-gray-200">Timetable</h1>
                <p className="text-sm text-gray-400">View your weekly schedule</p>
            </div>
            <p className="text-gray-400">User type not recognized. Please contact support.</p>
        </div>
    );
};

export default DefaultTimetable;