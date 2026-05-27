import React, { useState, useEffect } from 'react';
import {
    getStudentCourses,
    studentEnroll,
    studentDrop,
    getSystemConfigs
} from '../../../services/servicesApi';

const StudentCourses = () => {
    const [viewMode, setViewMode] = useState('grid');
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [maxcourses, setmaxcourses] = useState(0);
    const [maxCredits, setMaxCredits] = useState(0);



    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser).user;
            setUser(parsedUser);
            fetchCourses(parsedUser.user_id);
        } else {
            setError("User not found. Please login.");
            setLoading(false);
        }
    }, []);

    const fetchCourses = async (student_Id) => {
        try {
            setLoading(true);
            const enrolledRes = await getStudentCourses(student_Id, 'enrolled');
            const availableRes = await getStudentCourses(student_Id, 'available');
            setEnrolledCourses(Array.isArray(enrolledRes) ? enrolledRes : []);
            setAvailableCourses(Array.isArray(availableRes) ? availableRes : []);
        } catch (err) {
            setError("Failed to fetch courses.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCourse = async (courseCode, credits) => {
        if (!user) return setError("User not found. Please login.");
        try {

            const enrolment_end = await getSystemConfigs(user.user_id, 'enrolment_end')[0]?.config_value;
            const currentDate = new Date();
            const enrolmentEndDate = new Date(enrolment_end);
            if (currentDate > enrolmentEndDate) {
                return setError("Enrolment period has ended. You cannot enroll in new courses.");
            }
            
            const maxCredits = parseFloat((await getSystemConfigs(user.user_id, 'max_credits'))[0]?.config_value);
            const maxCourses = parseFloat((await getSystemConfigs(user.user_id, 'max_courses'))[0]?.config_value);
            
            if (enrolledCourses.length >= maxCourses) {
                return setError(`You can only enroll in ${maxCourses} courses.`);
            }
            const totalCredits = enrolledCourses.reduce((acc, course) => acc + (course.credit_hours || 0), 0);
            
            if (totalCredits + credits > maxCredits) {
                return setError(`You can only enroll in ${maxCredits} credits.`);
            }


            await studentEnroll({
                student_id: user.user_id,
                course_code: courseCode,
                section: user.section
            });
            await fetchCourses(user.user_id);
        } catch (err) {
            setError("Failed to enroll in course.");
        }
    };

    const handleDropCourse = async (courseCode) => {
        if (!user) return setError("User not found. Please login.");
        try {
            await studentDrop({
                student_id: user.user_id,
                course_code: courseCode
            });
            await fetchCourses(user.user_id);
        } catch (err) {
            console.error("Drop course error:", err);
            setError(err.message || "Failed to drop course.");
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen text-gray-200">Loading...</div>;
    if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
    if (!user) return <div className="flex justify-center items-center h-screen text-gray-200">You are not logged in.</div>;

    // Stats Calculation
    const totalCredits = enrolledCourses.reduce((acc, course) => acc + (course.credit_hours || 0), 0);
    const totalCores = enrolledCourses.filter(c => c.core_or_elective === 'core').length;
    const totalElectives = enrolledCourses.filter(c => c.core_or_elective === 'elective').length;

    const CourseCard = ({ course, action }) => (
        <div
            key={course.course_code}
            className="bg-dark-glassy rounded-xl p-3 hover:shadow-md border border-[#55555555] hover:border-[#c0c0c0] transition-all duration-300"
        >
            <div className="flex justify-between items-start mb-4 border-b-[0.75px] border-[#555555] pb-4">
                <h3 className="font-medium text-gray-200 text-base">{course.course_name}</h3>
                <div>
                    <span className="bg-[#333] text-[#ccc] text-xs p-2 rounded-lg">
                        {course.course_code}
                    </span>
                    {action && <span className="ml-2">{action}</span>}
                </div>


            </div>
            <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center text-sm">
                    <p className="text-gray-400">Dept:</p>
                    <p className="text-gray-300">{course.department}</p>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <p className="text-gray-400">Enrolled:</p>
                    <p className="text-gray-300">{course.current_enrolled}/{course.max_enrolled}</p>
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
    );

    return (
        <div className="h-full w-full bg-transparent text-gray-200 px-6 py-8 overflow-y-scroll scrollbar-hide rounded-xl">
            <div className="text-xl font-semibold text-dark-accent-light mb-4 p-2 bg-dark-glassy border-[0.75px] border-[#55555555] rounded-md">
                <h1 className="text-xl font-bold mb-2">My Courses</h1>
                <p className="text-xs text-gray-400">Manage your enrolled and available courses.</p>
            </div>

            {/* Stats Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-dark-glassy p-5 hover:shadow-md rounded-xl hover:border-[#c0c0c0] border-[0.75px] border-[#55555555]
                transtion-all duration-300">
                    <h2 className="text-xl text-gray-300">Total Enrolled</h2>
                    <p className="text-lg font-bold text-blue-400">{enrolledCourses.length}</p>
                </div>
                <div className="bg-dark-glassy p-5 hover:shadow-md rounded-xl hover:border-[#c0c0c0] border-[0.75px] border-[#55555555]
                transtion-all duration-300">
                    <h2 className="text-xl text-gray-300">Credit Hours</h2>
                    <p className="text-lg font-bold text-green-400">{totalCredits}</p>
                </div>
                <div className="bg-dark-glassy p-5 hover:shadow-md rounded-xl hover:border-[#c0c0c0] border-[0.75px] border-[#55555555]
                transtion-all duration-300">
                    <h2 className="text-xl text-gray-300">Core Courses</h2>
                    <p className="text-lg font-bold text-blue-300">{totalCores}</p>
                </div>
                <div className="bg-dark-glassy p-5 hover:shadow-md rounded-xl hover:border-[#c0c0c0] border-[0.75px] border-[#55555555]
                transtion-all duration-300">
                    <h2 className="text-xl text-gray-300">Electives</h2>
                    <p className="text-lg font-bold text-yellow-400">{totalElectives}</p>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex justify-end mb-6">
                <div className="inline-flex rounded-md shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1 border-[0.75px] border-[#55555555] rounded-l-lg ${viewMode !== 'grid' ? 'bg-dark-glassy' : 'bg-[#121212]'} hover:border-[#555555] transition-all duration-300`}
                    >
                        Grid View
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1 border-[0.75px] border-[#55555555] rounded-r-lg ${viewMode === 'grid' ? 'bg-dark-glassy' : 'bg-[#121212]'}
                        hover:border-[#555555] transition-all duration-300`}
                    >
                        List View
                    </button>
                </div>
            </div>

            {/* Enrolled Courses */}
            <div className="mb-10">
                <h2 className="text-xl font-semibold text-dark-accent-light mb-4 p-2 bg-dark-glassy border-[0.75px] border-[#55555555] rounded-md">Enrolled Courses</h2>
                {!Array.isArray(enrolledCourses) || enrolledCourses.length === 0 ? (
                    <p className="text-gray-500">You haven't enrolled in any courses yet.</p>
                ) : (
                    <div className={`${viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4 ' : 'flex flex-col gap-3'}`}>
                        {enrolledCourses.map(course => (
                            <CourseCard
                                key={course.course_code}
                                course={course}
                                action={
                                    <button
                                        onClick={() => handleDropCourse(course.course_code)}
                                        className="bg-red-900/30 hover:bg-red-900/60 p-2 px-3 text-xs rounded-md text-red-400 transition-all duration-300"
                                    >
                                        Drop
                                    </button>
                                }
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Available Courses */}
            <div>
                <h2 className="text-xl font-semibold text-dark-accent-light mb-4 p-2 bg-dark-glassy border-[0.75px] border-[#55555555] rounded-md">Available Courses</h2>
                {!Array.isArray(availableCourses) || availableCourses.length === 0 ? (
                    <p className="text-gray-500">No courses available to enroll.</p>
                ) : (
                    <div className={`${viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-3'}`}>
                        {availableCourses.map(course => (
                            <CourseCard
                                key={course.course_code}
                                course={course}
                                action={
                                    <button
                                        onClick={() => handleAddCourse(course.course_code, course.credit_hours)}
                                        className="bg-green-900/30 hover:bg-green-900/60 p-2 px-3 text-xs rounded-md text-green-400 transition-all duration-300"
                                    >
                                        Enroll
                                    </button>
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentCourses;