import React, { useState, useEffect } from 'react';
import {
    getFacultyCourses,
    getCourseStudents,
    updateAttendance,
    getAttendanceByDate,
    getFacultyLeaveRequests,
    processLeaveRequest,
} from '../../../services/servicesApi';
import CourseButton from '../../Components/CourseButton';
import DatePicker from '../../Components/DatePicker';

const FacultyAttendance = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [students, setStudents] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]); // State for leave requests
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [user, setUser] = useState(null);
    const [filter, setFilter] = useState('all');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser).user;
            setUser(parsedUser);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchCourses();
        }
    }, [user]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const coursesRes = await getFacultyCourses(user.user_id);
            setCourses(coursesRes || []);
        } catch (err) {
            setError('Failed to load courses');
            console.error('Error fetching courses:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDateToLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const loadStudentsAndAttendance = async (courseCode, date, filterValue = filter) => {
        setIsFetching(true);
        setError(null);

        try {
            const allStudents = await getCourseStudents(courseCode, filterValue);
            const attendanceRecords = await getAttendanceByDate(courseCode, user.user_id, formatDateToLocal(date));
            console.log('Attendance Records:', attendanceRecords);
            console.log(formatDateToLocal(date));
            const mergedStudents = allStudents.map((student) => {
                const attendanceRecord = attendanceRecords.find(
                    (record) => record.student_id === student.user_id
                );

                return {
                    ...student,
                    status: attendanceRecord ? attendanceRecord.status : 'absent',
                    attendance_id: attendanceRecord ? attendanceRecord.attendance_id : null,
                };
            });

            setStudents(mergedStudents);
        } catch (err) {
            setError('Failed to load data');
            console.error('Error loading data:', err);
        } finally {
            setIsFetching(false);
        }
    };

    const loadLeaveRequests = async (date) => {
        try {
            if (!selectedCourse) {
                setLeaveRequests([]); // Clear leave requests if no course is selected
                return;
            }

            const leaveRequestsRes = await getFacultyLeaveRequests(user.user_id);

            const filteredRequests = leaveRequestsRes.filter(
                (request) =>
                    new Date(request.request_date).toDateString() === date.toDateString() && // Match the selected date
                    request.status === 'Pending' && // Only include pending requests
                    request.course_id === selectedCourse // Match the selected course
            );

            setLeaveRequests(filteredRequests);
        } catch (err) {
            setError('Failed to load leave requests');
            console.error('Error fetching leave requests:', err);
        }
    };
    const handleDateChange = async (newDate) => {
        setSelectedDate(newDate);
        if (selectedCourse) {
            await loadStudentsAndAttendance(selectedCourse, newDate);
            await loadLeaveRequests(newDate); // Load leave requests for the selected course and date
        }
    };

    const handleApproveLeave = async (requestId, studentId, courseCode, section = 'A') => {
        try {
            
            await processLeaveRequest(requestId, user.user_id, 'approved', 'Leave approved');
            
            await updateAttendance({
                student_id: studentId,
                course_code: selectedCourse,
                faculty_id: user.user_id,
                date: formatDateToLocal(selectedDate),
                status: 'present',
                section: section,
            });
            setSuccess('Leave approved and attendance updated');
            await loadLeaveRequests(selectedDate); // Refresh leave requests

            if (selectedCourse) {
                await loadStudentsAndAttendance(selectedCourse, selectedDate);
            }
        } catch (err) {
            setError('Failed to approve leave');
            console.error('Error approving leave:', err);
        }
    };

    const handleRejectLeave = async (requestId) => {
        try {
            await processLeaveRequest(requestId, user.user_id, 'rejected', 'Leave rejected');
            setSuccess('Leave rejected');
            await loadLeaveRequests(selectedDate); // Refresh leave requests
        } catch (err) {
            setError('Failed to reject leave');
            console.error('Error rejecting leave:', err);
        }
    };

    const handleCourseClick = async (courseCode) => {
        setSelectedCourse(courseCode);
        if (courseCode) {
            await loadStudentsAndAttendance(courseCode, selectedDate);
            await loadLeaveRequests(selectedDate); // Load leave requests for the selected course and date
        }
    };
    
    const handleFilterClick = async (filterValue) => {
        setFilter(filterValue);
        if (selectedCourse) {
            await loadStudentsAndAttendance(selectedCourse, selectedDate, filterValue);
        }
    };

    const handleAttendanceChange = async (studentId, newStatus, section) => {
        try {
            setStudents((prev) =>
                prev.map((student) =>
                    student.user_id === studentId ? { ...student, status: newStatus } : student
                )
            );
            console.log(selectedDate.toISOString().split('T')[0], newStatus, section);
            await updateAttendance({
                student_id: studentId,
                course_code: selectedCourse,
                faculty_id: user.user_id,
                date: formatDateToLocal(selectedDate),
                status: newStatus,
                section: section,
            });
        } catch (error) {
            console.error('Error updating attendance:', error);
            setError('Failed to update attendance');
        }
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        <div className="h-full w-full m-4 overflow-y-auto bg-dark-semi-dark p-6">
            <div className="bg-[#282828] rounded-lg p-3 mb-2 border-[0.75px] border-[#55555555]">
                <h1 className="text-3xl font-bold text-dark-accent-light mb-2">Faculty Attendance</h1>
                <p className="text-gray-500">Manage attendance and leave requests for your classes.</p>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
                    <p>{success}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar: Course Selection and Date Picker */}
                <div className="col-span-1 space-y-6">
                    {/* Course Selection */}
                    <div className="bg-dark-glassy p-5 rounded-xl hover:shadow-md hover:border-[#c0c0c0] border-[0.75px] border-[#55555555] transition-all duration-300">
                        <label className="block text-md font-medium text-gray-300 border-b-[0.75px] border-[#555555] pb-4 mb-4">
                            Select Course
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {courses.map((course) => (
                                <CourseButton
                                    key={course.course_code}
                                    course={course}
                                    isSelected={selectedCourse === course.course_code}
                                    onClick={handleCourseClick}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="bg-dark-glassy p-5 rounded-xl hover:shadow-md hover:border-[#c0c0c0] border-[0.75px] border-[#55555555] transition-all duration-300">
                        <label className="block text-md font-medium text-gray-300 border-b-[0.75px] border-[#555555] pb-4 mb-4">
                            Select Date
                        </label>
                        <DatePicker selectedDate={selectedDate} onDateChange={handleDateChange} />
                    </div>
                </div>

                {/* Attendance Table */}
                <div className="col-span-2">
                    {selectedCourse && (
                        <div className="bg-[#1c1c1c] rounded-xl shadow-sm overflow-hidden border-[0.75px] border-[#55555555]">
                            {isFetching ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            ) : students.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[#444444]">
                                        <thead className="bg-[#121212]">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-r-[0.75px] border-[#555]">
                                                    ID
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-r-[0.75px] border-[#555]">
                                                    Name
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-r-[0.75px] border-[#555]">
                                                    Section
                                                </th>
                                                <th className="px-4 py-2 text-xs font-medium text-gray-300 uppercase tracking-wider border-r-[0.75px] border-[#555]">
                                                    Status
                                                </th>
                                                <th className="px-8 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#444444]">
                                            {students.map((student) => (
                                                <tr
                                                    key={student.user_id}
                                                    className="hover:bg-[#363636] bg-dark-glassy transition-colors duration-300"
                                                >
                                                    <td className="px-4 py-2 text-left whitespace-nowrap text-sm text-gray-300 border-r-[0.75px] border-[#555]">
                                                        {student.user_id}
                                                    </td>
                                                    <td className="px-4 py-2 text-left whitespace-nowrap text-sm text-gray-300 border-r-[0.75px] border-[#555]">
                                                        {student.name}
                                                    </td>
                                                    <td className="px-4 py-2 text-left whitespace-nowrap text-sm text-gray-300 border-r-[0.75px] border-[#555]">
                                                        {student.section}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 border-r-[0.75px] border-[#555]">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${student.status === 'present'
                                                                ? 'bg-green-900/30 text-green-400'
                                                                : student.status === 'leave'
                                                                    ? 'bg-yellow-900/30 text-yellow-400'
                                                                    : 'bg-red-900/30 text-red-400'
                                                                }`}
                                                        >
                                                            {student.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-2 whitespace-nowrap">
                                                        <div className="flex space-x-1">
                                                            <button
                                                                onClick={() =>
                                                                    handleAttendanceChange(
                                                                        student.user_id,
                                                                        'leave',
                                                                        student.section
                                                                    )
                                                                }
                                                                className={`px-3 py-1 rounded-md text-xs font-medium border ${student.status === 'leave'
                                                                    ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
                                                                    : 'bg-dark-glassy text-gray-400 border-[#555] hover:bg-[#333]'
                                                                    }`}
                                                            >
                                                                Leave
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleAttendanceChange(
                                                                        student.user_id,
                                                                        'present',
                                                                        student.section
                                                                    )
                                                                }
                                                                className={`px-3 py-1 rounded-md text-xs font-medium border ${student.status === 'present'
                                                                    ? 'bg-green-900/30 text-green-400 border-green-700'
                                                                    : 'bg-dark-glassy text-gray-400 border-[#555] hover:bg-[#333]'
                                                                    }`}
                                                            >
                                                                Present
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleAttendanceChange(
                                                                        student.user_id,
                                                                        'absent',
                                                                        student.section
                                                                    )
                                                                }
                                                                className={`px-3 py-1 rounded-md text-xs font-medium border ${student.status === 'absent'
                                                                    ? 'bg-red-900/30 text-red-400 border-red-700'
                                                                    : 'bg-dark-glassy text-gray-400 border-[#555] hover:bg-[#333]'
                                                                    }`}
                                                            >
                                                                Absent
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-[#1e1e1e] rounded-xl border border-dashed border-gray-300">
                                    No students found for this course and filter.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Sidebar: Leave Requests */}
                <div className="col-span-1 space-y-6">
                    <div className="bg-dark-glassy p-5 rounded-xl hover:shadow-md hover:border-[#c0c0c0] border-[0.75px] border-[#55555555] transition-all duration-300">
                        <label className="block text-md font-medium text-gray-300 mb-4 border-b-[0.75px] border-[#555555] pb-4">
                            Leave Requests
                        </label>
                        {leaveRequests.length > 0 ? (
                            <div className="space-y-4">
                                {leaveRequests.map((request) => (
                                    <div
                                        key={request.request_id}
                                        className="bg-[#1e1e1e] p-4 rounded-lg border border-[#555555]"
                                    >
                                        <p className="text-sm text-gray-300">
                                            <span className="font-medium">Student:</span> {request.student_name} ({request.student_id})
                                        </p>
                                        <p className="text-sm text-gray-300">
                                            <span className="font-medium">Reason:</span> {request.leave_reason}
                                        </p>
                                        <div className="flex space-x-2 mt-2">
                                            <button
                                                onClick={() =>
                                                    handleApproveLeave(
                                                        request.request_id,
                                                        request.student_id,
                                                        request.course_code,
                                                        request.section
                                                    )
                                                }
                                                className="px-3 py-1 rounded-md text-xs font-medium bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/40"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleRejectLeave(request.request_id)}
                                                className="px-3 py-1 rounded-md text-xs font-medium bg-red-900/30 text-red-400 border border-red-700 hover:bg-red-900/40"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No leave requests for the selected date.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyAttendance;