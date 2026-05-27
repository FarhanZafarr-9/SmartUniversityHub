import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import DefaultDashboard from './DefaultDashboard';
import NotFound from './Notfound';
import DefaultAttendance from './DefaultAttendance';
import DefaultGrades from './DefaultGrades';
import DefaultProfile from './DefaultProfile';
import DefaultCourses from './DefaultCourses';
import DefaultCourseMaterials from './DefaultCourseMaterials';
import DefaultAssessments from './DefaultAssessments';
import DefaultFeemanagement from './DefaultFeemanagement';
import DefaultTimetable from './DefaultTimetable';
import Settings from './Settings';
import AdminConfigs from '../AdminPages/AdminConfigs';
import AdminManagement from '../AdminPages/AdminManagement';
import { Navigate } from 'react-router-dom';


const Pages = () => {
    return (
        <div className={`flex flex-grow text-white h-[96dvh] font-semibold justify-center items-center rounded-xl bg-dark-semi-dark shadow-dark transition-all ease-linear duration-300 ml-4 mr-4 border-[0.75px] border-[#55555555] overflow-hidden`}>
            <Routes>
                {/* Authentication Routes */}
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Main App Routes */}
                <Route path="/dashboard" element={<DefaultDashboard />} />
                <Route path="/profile" element={<DefaultProfile />} />

                {/* Academic Routes */}
                <Route path="/timetable" element={<DefaultTimetable />} />
                <Route path="/courses" element={<DefaultCourses />} />
                <Route path="/materials" element={<DefaultCourseMaterials />} />
                <Route path='/admin/configs' element={<AdminConfigs />} />
                <Route path='/admin/management' element={<AdminManagement />} />
                <Route path="/grades" element={<DefaultGrades />} />
                <Route path="/assessments" element={<DefaultAssessments />} />
                <Route path="/attendance" element={<DefaultAttendance />} />
                <Route path="/settings" element={<Settings />} />


                {/* Administrative Routes */}
                <Route path="/fees" element={<DefaultFeemanagement />} />

                {/* Fallback Route */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </div>
    );
}

export default Pages;