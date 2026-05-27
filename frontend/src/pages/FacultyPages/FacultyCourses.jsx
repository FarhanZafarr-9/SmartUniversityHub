import React, { useState, useEffect } from 'react';
import {
    getStudentCourses,
    getFacultyCourses,
    createFacultyCourseAssignment,
    getSystemConfigs,
} from '../../../services/servicesApi';

const FacultyCourses = () => {
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [courses, setCourses] = useState([]);
    const [facultyCourses, setFacultyCourses] = useState([]);
    const [maxCourses, setMaxCourses] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser).user;
            setUser(parsedUser);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                await fetchFacultyCourses();
                await fetchAllCourses();
                await fetchMaxCoursesConfig();
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    useEffect(() => {
        if (facultyCourses.length > 0) {
            fetchAllCourses();
        }
    }, [facultyCourses]);

    const fetchFacultyCourses = async () => {
        try {
            const facultyCoursesRes = await getFacultyCourses(user.user_id);
            setFacultyCourses(facultyCoursesRes || []);
        } catch (err) {
            setError('Failed to load faculty courses');
            console.error('Error fetching faculty courses:', err);
        }
    };

    const fetchAllCourses = async () => {
        try {
            const allCoursesRes = await getStudentCourses(user.user_id, 'all');
            const filteredCourses = allCoursesRes.filter(
                (course) => !facultyCourses.some((fc) => fc.course_code === course.course_code)
            );
            setCourses(filteredCourses || []);
        } catch (err) {
            setError('Failed to load all courses');
            console.error('Error fetching all courses:', err);
        }
    };

    const fetchMaxCoursesConfig = async () => {
        try {
            const configRes = await getSystemConfigs(user.user_id, 'max_courses');
            if (configRes.length > 0) {
                setMaxCourses(parseInt(configRes[0].config_value, 10));
            }
        } catch (err) {
            setError('Failed to fetch system configuration');
            console.error('Error fetching max_courses config:', err);
        }
    };

    const assignCourseToFaculty = async (courseCode, section = 'A') => {
        if (facultyCourses.length >= maxCourses) {
            setError(`You cannot teach more than ${maxCourses} courses.`);
            return;
        }

        try {
            await createFacultyCourseAssignment({
                facultyId: user.user_id,
                courseCode: courseCode,
                section: section,
            });

            setSuccess('Course assigned successfully.');
            await fetchFacultyCourses(); // Refresh faculty courses
        } catch (err) {
            setError('Failed to assign course');
            console.error('Error assigning course:', err);
        }
    };

    // Calculate statistics
    const totalCourses = courses.length;
    const activeStudents = facultyCourses.reduce((sum, course) => sum + course.current_enrolled, 0);
    const avgClassSize = facultyCourses.length > 0 ? Math.round(activeStudents / facultyCourses.length) : 0;

    if (loading)
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );

    if (error)
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md">
                    <p>{error}</p>
                </div>
            </div>
        );

    if (!user)
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 max-w-md">
                    <p>Please login to access this page</p>
                </div>
            </div>
        );

    return (
        <div className="h-full w-full m-4 overflow-y-scroll bg-dark-semi-dark p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-dark-accent-light mb-2">Courses</h1>
                <p className="text-gray-500">Manage and view all courses in the university</p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-dark-glassy p-5 rounded-xl hover:shadow-md hover:border-[#c0c0c0] border-[0.75px] border-[#55555555] transition-all duration-300">
                    <h2 className="text-xl font-semibold text-gray-200 mb-2">Total Courses</h2>
                    <p className="text-4xl font-bold">{totalCourses}</p>
                </div>

                <div className="bg-dark-glassy p-5 rounded-xl hover:shadow-md hover:border-[#c0c0c0] border-[0.75px] border-[#55555555] transition-all duration-300">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-lg font-medium text-gray-300">Active Students</h3>
                            <p className="text-3xl font-bold">{activeStudents}</p>
                            <p className="text-sm text-gray-400">Enrolled in all courses</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-300">Average Class Size</h3>
                            <p className="text-3xl font-bold">{avgClassSize}</p>
                            <p className="text-sm text-gray-400">Students per course</p>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-glassy p-5 rounded-xl hover:shadow-md hover:border-[#c0c0c0] border-[0.75px] border-[#55555555] transition-all duration-300">
                    <h2 className="text-xl font-semibold text-gray-200 mb-2">Courses Teaching</h2>
                    <p className="text-4xl font-bold">{facultyCourses.length}</p>
                </div>
            </div>

            {/* Faculty Courses */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-dark-accent-light mb-4 p-2 bg-dark-glassy border-[0.75px] border-[#55555555] rounded-md">Courses Currently Teaching</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {facultyCourses.map((course) => (
                        <div
                            key={course.course_code}
                            className="bg-dark-glassy rounded-xl p-3 hover:shadow-md border border-[#55555555] hover:border-[#c0c0c0] transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4 border-b-[0.75px] border-[#555555] pb-4">
                                <h3 className="font-medium text-gray-200 text-base">{course.course_name}</h3>
                                <span className="bg-[#333] text-[#ccc] text-xs px-2 py-1 rounded-lg">
                                    {course.course_code}
                                </span>
                            </div>
                            <div className="space-y-2 mt-2">
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Dept:</p>
                                    <p className="text-gray-300">{course.department}</p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Enrolled:</p>
                                    <p className="text-gray-300">
                                        {course.current_enrolled}/{course.max_enrolled}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Credits:</p>
                                    <p className="text-gray-300">{course.credit_hours}</p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Type:</p>
                                    <p className="text-gray-300 capitalize">{course.core_or_elective}</p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Semester:</p>
                                    <p className="text-gray-300">{course.semester}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Available Courses */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-dark-accent-light mb-4 p-2 bg-dark-glassy border-[0.75px] border-[#55555555] rounded-md">Available Courses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div
                            key={course.course_code}
                            className="bg-dark-glassy rounded-xl p-3 hover:shadow-md border border-[#55555555] hover:border-[#c0c0c0] transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4 border-b-[0.75px] border-[#555555] pb-4">
                                <h3 className="font-medium text-gray-200 text-base">{course.course_name}</h3>
                                <span className="bg-[#333] text-[#ccc] text-xs px-2 py-1 rounded-lg">
                                    {course.course_code}
                                </span>
                            </div>
                            <div className="space-y-2 mt-2">
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Dept:</p>
                                    <p className="text-gray-300">{course.department}</p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Enrolled:</p>
                                    <p className="text-gray-300">
                                        {course.current_enrolled}/{course.max_enrolled}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Credits:</p>
                                    <p className="text-gray-300">{course.credit_hours}</p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Type:</p>
                                    <p className="text-gray-300 capitalize">{course.core_or_elective}</p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Semester:</p>
                                    <p className="text-gray-300">{course.semester}</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={() => assignCourseToFaculty(course.course_code, course.section)}
                                    className="bg-[#333] rounded-md p-[8px] hover:shadow-md border border-[#55555555] hover:border-[#c0c0c0] transition-all duration-300 justify-start flex items-center text-sm text-gray-200 "
                                >
                                    Teach Course
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FacultyCourses;