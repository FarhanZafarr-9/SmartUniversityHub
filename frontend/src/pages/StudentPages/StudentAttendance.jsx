import React, { useState, useEffect } from 'react';
import { getAttendanceByCourse, getStudentCourses, createLeaveRequest, getStudentLeaveRequests } from '../../../services/servicesApi';
import CourseButton from '../../Components/CourseButton';
import StatsCard from '../../components/StatsCard';
import SummaryCard from '../../components/SummaryCard';
import AttendanceRow from '../../components/AttendanceRow';

const StudentAttendance = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        totalClasses: 0,
        presentCount: 0,
        absentCount: 0,
        leaveCount: 0,
        attendancePercentage: 0,
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [leaveRequestDetails, setLeaveRequestDetails] = useState({
        date: '',
        reason: '',
    });

    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser).user;
            setUser(parsedUser);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchEnrolledCourses();
        }
    }, [user]);


    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = String(date.getFullYear()).slice(-2); // Get the last two digits of the year
        return `${day}-${month}-${year}`;
    };

    const fetchEnrolledCourses = async () => {
        try {
            setLoading(true);
            const enrolledRes = await getStudentCourses(user.user_id, 'enrolled');
            setCourses(enrolledRes || []);

            if (enrolledRes && enrolledRes.length > 0) {
                setSelectedCourse(enrolledRes[0].course_code);
                await fetchAttendanceRecords(enrolledRes[0].course_code);
            }
        } catch (err) {
            setError('Failed to load enrolled courses');
            console.error('Error fetching enrolled courses:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceRecords = async (courseCode) => {
        if (!user || !courseCode) return;

        try {
            setLoading(true);

            // Fetch attendance records
            const records = await getAttendanceByCourse(courseCode, user.user_id, user.section);

            // Fetch leave requests
            const leaveRequests = await getStudentLeaveRequests(user.user_id, '');

            // Merge leave request statuses into attendance records
            const updatedRecords = records.map((record) => {
                const leaveRequest = leaveRequests.find(
                    (request) => request.request_date === record.date && request.course_code === courseCode
                );
                return {
                    ...record,
                    status: leaveRequest ? leaveRequest.status.toLowerCase() : record.status,
                };
            });

            const total = updatedRecords.length;
            const present = updatedRecords.filter((r) => r.status === 'present').length;
            const absent = updatedRecords.filter((r) => r.status === 'absent').length;
            const leave = updatedRecords.filter((r) => r.status === 'leave' || r.status === 'pending').length;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

            setStats({
                totalClasses: total,
                presentCount: present,
                absentCount: absent,
                leaveCount: leave,
                attendancePercentage: percentage,
            });

            setAttendanceRecords(updatedRecords);
        } catch (err) {
            setError('Failed to load attendance records');
            console.error('Error fetching attendance records:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCourseClick = async (courseCode) => {
        setSelectedCourse(courseCode);
        await fetchAttendanceRecords(courseCode);
    };

    const openLeaveRequestModal = (date) => {
        setLeaveRequestDetails({ date, reason: '' });
        setIsModalOpen(true);
    };

    const submitLeaveRequest = async () => {
        try {
            const { date, reason } = leaveRequestDetails;

            if (!reason.trim()) {
                setError('Please provide a reason for your leave request.');
                return;
            }

            await createLeaveRequest({
                student_id: user.user_id,
                course_code: selectedCourse,
                request_date: date,
                leave_reason: reason,
                faculty_id: '',
                section: user.section,
            });

            setSuccess('Leave request submitted successfully.');
            setIsModalOpen(false);

            // Update the attendance record to show "Pending" status
            setAttendanceRecords((prevRecords) =>
                prevRecords.map((record) =>
                    record.date === date
                        ? { ...record, status: 'pending' }
                        : record
                )
            );
        } catch (err) {
            setError('Failed to submit leave request.');
            console.error('Error submitting leave request:', err);
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

    if (error)
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md">
                    <p>{error}</p>
                </div>
            </div>
        );

    return (
        <div className="h-full w-full m-4 overflow-y-auto bg-dark-semi-dark p-6">
            <div className="bg-[#282828] border-[0.75px] border-[#55555555] rounded-xl p-4 mb-6">
                <h1 className="text-3xl font-bold text-dark-accent-light mb-4">My Attendance</h1>
                <p className="text-gray-500">View your attendance records for each course.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 mt-6">
                <div className="col-span-1 space-y-6">
                    <div className="bg-dark-glassy rounded-xl hover:shadow-md hover:border-[#c0c0c0] border-[0.75px] border-[#55555555] transition-all duration-300 pb-3">
                        <label className="flex text-md font-semibold text-white text-left border-b-[1.75px] border-[#55555555] pb-2 pl-4 pt-2 mb-3">
                            Select Course
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mx-4">
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

                    <div className="bg-dark-glassy rounded-xl hover:shadow-md hover:border-[#c0c0c0] border-[0.75px] border-[#55555555] transition-all duration-300 pb-2">
                        <div className="text-md font-semibold text-white text-left border-b-[1.75px] border-[#55555555] pb-2 pl-4 mb-4 pt-2">
                            {selectedCourse}
                        </div>
                        <StatsCard label="Total Classes" value={stats.totalClasses} isRounded="t" />
                        <StatsCard label="Attendance Percentage" value={stats.attendancePercentage} />
                        <StatsCard label="Section" value={user.section} isRounded="b" />
                    </div>
                </div>

                <div className="col-span-3 lg:col-span-2">
                    {selectedCourse && (
                        <div className="bg-[#1c1c1c] rounded-xl shadow-sm overflow-hidden border-[0.75px] border-[#55555555]">
                            {attendanceRecords.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[#444444]">
                                        <thead className="bg-[#121212]">
                                            <tr>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                    Attendance No.
                                                </th>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-300 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#444444]">
                                            {attendanceRecords.map((record, index) => (
                                                <tr key={index} className="hover:bg-[#363636] bg-dark-glassy transition-colors duration-300">
                                                    <td className="px-6 py-4 text-sm text-gray-300">{index + 1}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-300">{formatDate(record.date)}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-300">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'present'
                                                                    ? 'bg-green-900/30 text-green-400'
                                                                    : record.status === 'leave'
                                                                        ? 'bg-yellow-900/30 text-yellow-400'
                                                                        : record.status === 'pending'
                                                                            ? 'bg-blue-900/30 text-blue-400'
                                                                            : 'bg-red-900/30 text-red-400'
                                                                }`}
                                                        >
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-300">
                                                        {record.status === 'absent' && (
                                                            <button
                                                                onClick={() => openLeaveRequestModal(record.date)}
                                                                className="px-3 py-1 rounded-md text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-700 hover:bg-blue-900/40"
                                                            >
                                                                Request Leave
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-[#1e1e1e] rounded-xl border border-dashed border-gray-500">
                                    No attendance records found for this course.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="col-span-1 space-y-6">
                    <div className="bg-dark-glassy rounded-xl mb-4 pb-4 hover:shadow-md hover:border-[#c0c0c0] border-[0.75px] border-[#55555555] transition-all duration-300">
                        <div className="text-md font-semibold text-white mb-4 pt-2 pl-3 text-left border-b-[1.75px] border-[#55555555] pb-2">
                            Attendance Summary
                        </div>
                        <SummaryCard
                            label="Present"
                            count={stats.presentCount}
                            bgColor="bg-green-900/20"
                            borderColor="green-700"
                            textColor="green-400"
                            rounded="rounded-t-md"
                        />
                        <SummaryCard
                            label="Leave"
                            count={stats.leaveCount}
                            bgColor="bg-yellow-900/20"
                            borderColor="yellow-700"
                            textColor="yellow-400"
                        />
                        <SummaryCard
                            label="Absent"
                            count={stats.absentCount}
                            bgColor="bg-red-900/20"
                            borderColor="red-700"
                            textColor="red-400"
                            rounded="rounded-b-md"
                        />
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-[#1c1c1c] rounded-lg p-6 w-96">
                        <h2 className="text-lg font-semibold text-gray-300 mb-4">Request Leave</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                            <input
                                type="text"
                                value={leaveRequestDetails.date}
                                disabled
                                className="w-full px-3 py-2 bg-gray-800 text-gray-300 rounded-md border border-gray-600"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Reason</label>
                            <textarea
                                value={leaveRequestDetails.reason}
                                onChange={(e) =>
                                    setLeaveRequestDetails((prev) => ({ ...prev, reason: e.target.value }))
                                }
                                className="w-full px-3 py-2 bg-gray-800 text-gray-300 rounded-md border border-gray-600"
                                rows="4"
                            ></textarea>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitLeaveRequest}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentAttendance;