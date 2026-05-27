import React, { useState, useEffect } from 'react';
import { getAllRooms, getAllSlots, getAllCourses, upsertTimetableSession, getFacultyAssignments } from '../../../services/servicesApi';

const AdminTimetable = () => {
    const [rooms, setRooms] = useState([]);
    const [slots, setSlots] = useState([]);
    const [courses, setCourses] = useState([]);
    const [facultyAssignments, setFacultyAssignments] = useState([]); // Add this state
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const user_id = localStorage.getItem('currentUser')
        ? JSON.parse(localStorage.getItem('currentUser'))?.user?.user_id
        : null;

    // Fetch all rooms, slots, courses, and faculty assignments
    const fetchData = async () => {
        try {
            setLoading(true);
            const [fetchedRooms, fetchedSlots, fetchedCourses, fetchedFacultyAssignments] = await Promise.all([
                getAllRooms(),
                getAllSlots(),
                getAllCourses(user_id),
                getFacultyAssignments(), // Fetch faculty assignments
            ]);
            setRooms(fetchedRooms);
            setSlots(fetchedSlots);
            setCourses(fetchedCourses);
            setFacultyAssignments(fetchedFacultyAssignments); // Store faculty assignments
            console.log('Fetched data:', { fetchedRooms, fetchedSlots, fetchedCourses, fetchedFacultyAssignments });
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Generate timetable automatically
    const generateTimetable = () => {
        const newTimetable = [];
        const usedSlots = new Set();

        // Sort courses by priority (e.g., credit hours)
        const sortedCourses = [...courses].sort((a, b) => b.credit_hours - a.credit_hours);

        sortedCourses.forEach((course) => {
            let sessionsRequired = course.credit_hours === 3 ? 2 : 1; // 3-credit courses get 2 sessions, others get 1
            const sections = course.core_or_elective !== 'core' ? ['A1', 'A2'] : ['A1', 'A2', 'B1', 'B2']; // Assign sections based on course type
            let sectionIndex = 0;

            slots.forEach((slot) => {
                if (sessionsRequired === 0) return;

                // Find an available room and slot
                for (const room of rooms) {
                    const slotKey = `${slot.slot_id}-${room.room_id}`;
                    if (!usedSlots.has(slotKey)) {
                        // Find a faculty member for the course and section
                        const assignedFaculty = facultyAssignments.find(
                            (assignment) =>
                                assignment.course_code === course.course_code &&
                                assignment.section === sections[sectionIndex % sections.length]
                        );

                        newTimetable.push({
                            session_id: null, // New session
                            course_code: course.course_code,
                            course_name: course.course_name,
                            room_number: room.room_number,
                            day_of_week: slot.day_of_week,
                            start_time: slot.start_time,
                            end_time: slot.end_time,
                            faculty_id: assignedFaculty?.faculty_id || null, // Assign faculty if available
                            section: sections[sectionIndex % sections.length], // Assign section in a round-robin manner
                            department: course.department,
                        });
                        usedSlots.add(slotKey);
                        sectionIndex++;
                        sessionsRequired--;
                        break;
                    }
                }
            });
        });

        setTimetable(newTimetable);
    };

    // Save timetable to the database
    const saveTimetable = async () => {
        try {
            setLoading(true);
            await Promise.all(
                timetable.map((session) =>
                    upsertTimetableSession({
                        session_id: session.session_id, // Null for new sessions
                        course_code: session.course_code,
                        faculty_id: session.faculty_id,
                        section: session.section,
                        day_of_week: session.day_of_week,
                        start_time: session.start_time,
                        end_time: session.end_time,
                        room_number: session.room_number,
                        department: session.department,
                        admin_id: user_id, // Replace with actual admin ID
                    })
                )
            );
            alert('Timetable saved successfully!');
        } catch (err) {
            console.error('Failed to save timetable:', err);
            setError('Failed to save timetable. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full w-full p-6 overflow-y-auto bg-dark-semi-dark rounded-xl border border-[#55555555]">
            {/* Header */}
            <div className="mb-6 bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                <h1 className="text-xl font-semibold text-gray-200">Admin Timetable</h1>
                <p className="text-sm text-gray-400">Manage and generate the timetable for courses</p>
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
                <>
                    {/* Available Rooms and Slots */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                            <h2 className="text-lg font-medium text-gray-200 mb-4">Available Rooms</h2>
                            {rooms.map((room) => (
                                <p key={room.room_id} className="text-sm text-gray-400">
                                    {room.room_number} ({room.is_lab ? 'Lab' : 'Classroom'})
                                </p>
                            ))}
                        </div>
                        <div className="bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                            <h2 className="text-lg font-medium text-gray-200 mb-4">Available Slots</h2>
                            {slots.map((slot) => (
                                <p key={slot.slot_id} className="text-sm text-gray-400">
                                    {slot.day_of_week}, {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                                    {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            ))}
                        </div>
                    </div>

                    {/* Timetable Actions */}
                    <div className="flex justify-end gap-4 mb-6">
                        <button
                            onClick={generateTimetable}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Generate Timetable
                        </button>
                        <button
                            onClick={saveTimetable}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Save Timetable
                        </button>
                    </div>

                    {/* Generated Timetable */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {timetable.map((session, index) => (
                            <div key={index} className="bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                                <p className="text-sm text-gray-400">
                                    <span className="font-semibold text-gray-200">Course:</span> {session.course_name} ({session.course_code})
                                </p>
                                <p className="text-sm text-gray-400">
                                    <span className="font-semibold text-gray-200">Room:</span> {session.room_number}
                                </p>
                                <p className="text-sm text-gray-400">
                                    <span className="font-semibold text-gray-200">Day:</span> {session.day_of_week}
                                </p>
                                <p className="text-sm text-gray-400">
                                    <span className="font-semibold text-gray-200">Time:</span>{' '}
                                    {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                                    {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminTimetable;