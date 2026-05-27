import React, { useState, useEffect } from 'react';
import { getAllCourses, updateCourseInfo, createCourse } from '../../../services/servicesApi';

const AdminCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editCourse, setEditCourse] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCourse, setNewCourse] = useState({
        course_code: '',
        course_name: '',
        department: '',
        max_enrolled: 0,
        current_enrolled: 0,
        credit_hours: 0,
        core_or_elective: 'core',
        semester: 1
    });

    const [user, setUser] = useState(null);

    // Fetch user from localStorage
    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser).user;
            setUser(parsedUser);
            console.log('User loaded:', parsedUser);
        }
    }, []);

    // Fetch all courses
    const fetchCourses = async () => {
        if (!user) return; // Ensure user is available before fetching courses
        try {
            setLoading(true);
            const result = await getAllCourses(user.user_id);
            console.log('Fetched courses:', result);
            setCourses(result || []);
        } catch (err) {
            setError('Failed to fetch courses');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch courses whenever the user is set
    useEffect(() => {
        if (user) {
            fetchCourses();
        }
    }, [user]); // Dependency on `user`

    // Handle course creation
    const handleCreateCourse = async () => {
        try {
            const exists = courses.some(c => c.course_code === newCourse.course_code || (c.course_name === newCourse.course_name && c.department === newCourse.department));
            if (exists) { console.log('Course already exists'); return; }

            // Send the new course to the API
            const response = await createCourse({ ...newCourse, admin_id: user.user_id });
            console.log('Created course response:', response);

            // Extract the created course from the response
            const createdCourse = response.course;

            // Add the new course to the local state
            setCourses((prevCourses) => [...prevCourses, createdCourse]);

            // Close the modal and reset the newCourse state
            setShowCreateModal(false);
            setNewCourse({
                course_code: '',
                course_name: '',
                department: '',
                max_enrolled: 10,
                current_enrolled: 0,
                credit_hours: 0,
                core_or_elective: 'core',
                semester: 1
            });
        } catch (err) {
            console.error('Failed to create course:', err);
            setError('Failed to create course');
        }
    };

    const handleUpdateCourse = async (updatedCourse) => {
        try {
            // Call the API to update the course
            const exists = courses.some(c => c.course_code !== updatedCourse.course_code && c.course_name === updatedCourse.new_course_name && c.department === updatedCourse.new_department);
            if (exists) { console.log('Course already exists'); return; }

            const response = await updateCourseInfo({
                admin_id: user.user_id,
                course_code: updatedCourse.course_code,
                new_course_name: updatedCourse.course_name,
                new_department: updatedCourse.department,
                new_max_enrolled: updatedCourse.max_enrolled,
                new_credit_hours: updatedCourse.credit_hours,
                new_core_or_elective: updatedCourse.core_or_elective,
                new_semester: updatedCourse.semester
            });

            console.log('Updated course response:', response);

            // Update the course in the local state
            setCourses((prevCourses) =>
                prevCourses.map((course) =>
                    course.course_code === response.course_code ? response : course
                )
            );

            // Close the modal
            setShowEditModal(false);
        } catch (err) {
            console.error('Failed to update course:', err);
            setError('Failed to update course');
        }
    };

    return (
        <div className="h-full w-full p-6 overflow-y-auto bg-dark-semi-dark rounded-xl border border-[#55555555]">
            {/* Header */}
            <div className="mb-6 bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                <h1 className="text-xl font-semibold text-gray-200">Manage Courses</h1>
                <p className="text-sm text-gray-400">View, edit, or create courses</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-200"></div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="text-sm px-4 py-2 bg-green-900/40 hover:bg-green-900/40 text-green-400 rounded border border-green-900/40 hover:border-green-400"
                        >
                            + Create Course
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {courses.map((course, index) => (
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
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        onClick={() => {
                                            console.log('Editing course:', course); // Debugging log
                                            setEditCourse(course);
                                            setShowEditModal(true);
                                        }}
                                        className="px-3 py-1 text-sm bg-blue-900/30 hover:bg-blue-900/40 text-blue-400 rounded border border-blue-900/50 hover:border-blue-400"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-dark-glassy rounded-xl p-6 w-full max-w-lg border border-[#55555555]">
                        <h2 className="text-lg font-medium text-gray-200 mb-4">Create Course</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Course Code</label>
                                <input
                                    type="text"
                                    value={newCourse.course_code}
                                    onChange={(e) =>
                                        setNewCourse({ ...newCourse, course_code: e.target.value })
                                    }
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Course Name</label>
                                <input
                                    type="text"
                                    value={newCourse.course_name}
                                    onChange={(e) =>
                                        setNewCourse({ ...newCourse, course_name: e.target.value })
                                    }
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Department</label>
                                <input
                                    type="text"
                                    value={newCourse.department}
                                    onChange={(e) =>
                                        setNewCourse({ ...newCourse, department: e.target.value })
                                    }
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Credits</label>
                                    <input
                                        type="number"
                                        value={newCourse.credit_hours}
                                        min="0"
                                        max="4"
                                        onChange={(e) => {
                                            let value = parseInt(e.target.value) || 0;
                                            if (value < 0) value = 0;
                                            if (value > 4) value = 4;

                                            setNewCourse({
                                                ...newCourse,
                                                credit_hours: parseInt(e.target.value) || 0
                                            })
                                        }}
                                        className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Max Enrolled</label>
                                    <input
                                        type="number"
                                        value={newCourse.max_enrolled}
                                        min="10"
                                        max="50"
                                        onChange={(e) => {
                                            let value = parseInt(e.target.value) || 0;
                                            if (value < 10) value = 10;
                                            if (value > 50) value = 50;

                                            setNewCourse({
                                                ...newCourse,
                                                max_enrolled: parseInt(e.target.value) || 0
                                            })
                                        }}
                                        className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Semester</label>
                                <input
                                    type="number"
                                    value={newCourse.semester}
                                    min="1"
                                    max="8"
                                    onChange={(e) => {
                                        let value = parseInt(e.target.value) || 0;
                                        if (value < 1) value = 1;
                                        if (value > 8) value = 8;

                                        setNewCourse({
                                            ...newCourse,
                                            semester: parseInt(e.target.value) || 0
                                        })
                                    }}
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Type</label>
                                <select
                                    value={newCourse.core_or_elective}
                                    onChange={(e) =>
                                        setNewCourse({ ...newCourse, core_or_elective: e.target.value })
                                    }
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                >
                                    <option value="core">Core</option>
                                    <option value="elective">Elective</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-3 py-1 text-sm bg-dark-glassy hover:bg-[#333] text-gray-200 rounded border border-[#55555555] hover:border-[#c0c0c0]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateCourse}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editCourse && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-dark-glassy rounded-xl p-6 w-full max-w-lg border border-[#55555555]">
                        <h2 className="text-lg font-medium text-gray-200 mb-4">Edit Course</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Course Name</label>
                                <input
                                    type="text"
                                    value={editCourse.course_name}
                                    onChange={(e) =>
                                        setEditCourse({ ...editCourse, course_name: e.target.value })
                                    }
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Department</label>
                                <input
                                    type="text"
                                    value={editCourse.department}
                                    onChange={(e) =>
                                        setEditCourse({ ...editCourse, department: e.target.value })
                                    }
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Credits</label>
                                    <input
                                        type="number"
                                        value={editCourse.credit_hours}
                                        min="0"
                                        max="4"
                                        onChange={(e) => {
                                            let value = parseInt(e.target.value) || 0;
                                            if (value < 0) value = 0;
                                            if (value > 4) value = 4;
                                            setEditCourse({
                                                ...editCourse,
                                                credit_hours: value,
                                            });
                                        }}
                                        className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Max Enrolled</label>
                                    <input
                                        type="number"
                                        value={editCourse.max_enrolled}
                                        min="10"
                                        max="50"
                                        onChange={(e) => {
                                            let value = parseInt(e.target.value) || 0;
                                            if (value < 10) value = 10;
                                            if (value > 50) value = 50;

                                            setEditCourse({
                                                ...editCourse,
                                                max_enrolled: parseInt(e.target.value) || 0
                                            })
                                        }}
                                        className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Semester</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="8"
                                    value={editCourse.semester}
                                    onChange={(e) => {
                                        let value = parseInt(e.target.value) || 0;
                                        if (value < 1) value = 1;
                                        if (value > 8) value = 8;

                                        setEditCourse({
                                            ...editCourse,
                                            semester: parseInt(e.target.value) || 0
                                        })
                                    }}
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Type</label>
                                <select
                                    value={editCourse.core_or_elective}
                                    onChange={(e) =>
                                        setEditCourse({ ...editCourse, core_or_elective: e.target.value })
                                    }
                                    className="w-full bg-[#1c1c1c] text-gray-200 p-2 rounded border border-[#55555555]"
                                >
                                    <option value="core">Core</option>
                                    <option value="elective">Elective</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-3 py-1 text-sm bg-dark-glassy hover:bg-[#333] text-gray-200 rounded border border-[#55555555] hover:border-[#c0c0c0]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleUpdateCourse(editCourse)}
                                className="px-3 py-1 text-sm bg-blue-900/30 hover:bg-blue-900/40 text-blue-400 rounded border border-blue-900/50 hover:border-blue-400"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCourses;