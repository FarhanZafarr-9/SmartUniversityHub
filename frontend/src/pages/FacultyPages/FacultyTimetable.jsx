import React, { useState, useEffect } from 'react';
import { getFacultyCourses, getTimetableByCourse } from '../../../services/servicesApi';

const FacultyTimetable = () => {
    const [courses, setCourses] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const facultyId = JSON.parse(localStorage.getItem('currentUser'))?.user?.user_id;

    // Fetch courses and timetable
    const fetchTimetableData = async () => {
        try {
            setLoading(true);

            // Fetch courses taught by the faculty
            const taughtCourses = await getFacultyCourses(facultyId);
            setCourses(taughtCourses);

            // Fetch timetable for each course
            const timetablePromises = taughtCourses.map((course) =>
                getTimetableByCourse(course.course_code)
            );
            const timetableResults = await Promise.all(timetablePromises);

            // Combine all timetable sessions into a single array
            const combinedTimetable = timetableResults.flat();
            setTimetable(combinedTimetable);

        } catch (err) {
            console.error('Failed to fetch timetable data:', err);
            setError('Failed to load timetable. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimetableData();
    }, []);

    // Group timetable by day of the week
    const groupedTimetable = timetable.reduce((acc, session) => {
        const day = session.day_of_week;
        if (!acc[day]) acc[day] = [];
        acc[day].push(session);
        return acc;
    }, {});

    // Days of the week for the calendar
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div className="h-full w-full p-6 overflow-y-auto bg-dark-semi-dark rounded-xl border border-[#55555555]">
            {/* Header */}
            <div className="mb-6 bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                <h1 className="text-xl font-semibold text-gray-200">Faculty Timetable</h1>
                <p className="text-sm text-gray-400">View your weekly schedule</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="float-right text-red-900"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Loading Spinner */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-200"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {daysOfWeek.map((day) => (
                        <div key={day} className="bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                            <h2 className="text-lg font-medium text-gray-200 mb-4">{day}</h2>
                            {groupedTimetable[day]?.length > 0 ? (
                                groupedTimetable[day].map((session) => (
                                    <div
                                        key={session.session_id}
                                        className="mb-4 p-3 bg-[#1c1c1c] rounded-lg border border-[#55555555]"
                                    >
                                        <p className="text-sm text-gray-400">
                                            <span className="font-semibold text-gray-200">Course:</span> {session.course_code}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            <span className="font-semibold text-gray-200">Time:</span>{' '}
                                            {new Date(session.start_time).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}{' '}
                                            -{' '}
                                            {new Date(session.end_time).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            <span className="font-semibold text-gray-200">Location:</span> {session.room_number}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400">No sessions scheduled</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FacultyTimetable;