import React, { useState, useEffect } from 'react';
import { getStudentCourses, getCourseMaterialByCourseId, insertUploadRequest, getUploadRequestsByCourseId } from '../../../services/servicesApi';

const StudentCourseMaterials = () => {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [courseMaterials, setCourseMaterials] = useState({});
    const [uploadRequests, setUploadRequests] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newUpload, setNewUpload] = useState({
        course_code: '',
        file_name: '',
        file_path: '',
        file_size: 0,
        status: 'pending',
    });

    const [courseCodes, setCourseCodes] = useState([]);

    useEffect(() => {
        // Extract course codes from enrolledCourses
        if (enrolledCourses.length > 0) {
            const codes = enrolledCourses.map(course => ({
                value: course.course_code,
                label: `${course.course_name} (${course.course_code})`
            }));
            setCourseCodes(codes);
        }
    }, [enrolledCourses]);

    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser).user;
            setUser(parsedUser);
            fetchCourses(parsedUser.user_id);
        } else {
            setError("Please login to view course materials");
            setLoading(false);
        }
    }, []);

    const fetchCourses = async (student_Id) => {
        try {
            setLoading(true);
            const enrolledRes = await getStudentCourses(student_Id, 'enrolled');
            setEnrolledCourses(Array.isArray(enrolledRes) ? enrolledRes : []);
            await fetchCourseMaterials(enrolledRes);
            await fetchUploadRequests(enrolledRes, student_Id);
        } catch (err) {
            setError("Failed to load course data");
        } finally {
            setLoading(false);
        }
    };

    const fetchCourseMaterials = async (courses) => {
        const materials = {};
        await Promise.all(courses.map(async (course) => {
            try {
                const materialsRes = await getCourseMaterialByCourseId(course.course_code);
                materials[course.course_code] = materialsRes || [];
            } catch (err) {
                console.error(`Failed to fetch materials for ${course.course_code}:`, err);
                materials[course.course_code] = [];
            }
        }));
        setCourseMaterials(materials);
    };

    const fetchUploadRequests = async (courses, student_Id) => {
        const requests = {};
        await Promise.all(courses.map(async (course) => {
            try {
                const requestsRes = await getUploadRequestsByCourseId(course.course_code, student_Id);
                requests[course.course_code] = requestsRes || [];
            } catch (err) {
                console.error(`Failed to fetch upload requests for ${course.course_code}:`, err);
                requests[course.course_code] = [];
            }
        }));
        setUploadRequests(requests);
    };

    const handleUploadRequestSubmit = async () => {
        try {
            const { file_name, file_path, file_size, status, course_code } = newUpload;
            const student_id = user.user_id;

            // Validate course_code
            if (!course_code) {
                setError('Please select a course');
                return;
            }

            await insertUploadRequest({ student_id, course_code, file_name, file_path, file_size, status });
            setShowUploadModal(false);
            setNewUpload({ file_name: '', file_path: '', file_size: 0, status: 'pending', course_code: '' });
            await fetchUploadRequests(enrolledCourses, student_id);
        } catch (error) {
            setError('Failed to submit upload request');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center h-screen">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md">
                <p>{error}</p>
            </div>
        </div>
    );

    if (!user) return (
        <div className="flex justify-center items-center h-screen">
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 max-w-md">
                <p>Please login to access this page</p>
            </div>
        </div>
    );

    const sortedCourses = [...enrolledCourses].sort((a, b) => {
        const aMaterialsCount = courseMaterials[a.course_code]?.length || 0;
        const bMaterialsCount = courseMaterials[b.course_code]?.length || 0;

        // Sort by the number of materials in descending order
        return bMaterialsCount - aMaterialsCount;
    });

    const pendingRequests = Object.values(uploadRequests).flat().filter(
        request => request.status === 'pending'
    );

    return (
        <div className="h-full w-full m-4 overflow-y-scroll bg-dark-semi-dark p-6">
            {/* Header */}
            <div className="mb-8 bg-dark-glassy rounded-xl shadow-md p-6 border-[0.75px] border-[#55555555]">
                <h1 className="text-3xl font-bold text-dark-accent-light mb-2">Course Materials</h1>
                <p className="text-gray-500">Access all learning materials for your enrolled courses</p>
            </div>

            {pendingRequests.length > 0 && (
                <div className="bg-dark-glassy rounded-xl shadow-sm p-6 border-[01.75px] border-[#55555555] mb-8">
                    <h2 className="text-xl text-left font-semibold text-gray-200 mb-4">Pending Upload Requests</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingRequests.map((request, idx) => (
                            <div
                                key={idx}
                                className=" border-[#55555555] border-[0.75px] bg-[#1c1c1c] rounded-xl p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-gray-100">{request.file_name}</h3>
                                    <span className="bg-[#fefefe] text-[#121212] text-xs px-2 py-1 rounded-lg">
                                        {request.course_code}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-xs bg-[#121212] px-3 py-1 rounded-lg text-gray-200">
                                        {request.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="space-y-8">
                {/* Materials Section */}
                <div className="bg-dark-glassy rounded-xl shadow-sm p-6 border-[01.75px] border-[#55555555]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-200">Available Materials</h2>
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="hover:bg-[#fefefe] bg-[#1c1c1c] text-[#fcfcfc] hover:text-[#121212] px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300"
                        >
                            + Upload Request
                        </button>
                    </div>

                    {enrolledCourses.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">You haven't enrolled in any courses yet</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Courses with Materials */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {sortedCourses.filter(c => courseMaterials[c.course_code]?.length > 0).map(course => (
                                    <div key={course.course_code} className="border-[0.75px] border-[#55555555] bg-[#1a1a1a] rounded-xl p-4 px-6 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-medium text-gray-100">{course.course_name}</h3>
                                            <span className="bg-[#fefefe] text-[#121212] text-xs px-2 py-1 rounded-lg">
                                                {course.course_code}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {courseMaterials[course.course_code]?.map((material, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setSelectedMaterial(material)}
                                                    className="p-3 border-[0.25px] border-[#55555555] bg-[#282828] rounded-lg hover:border-[#555555] cursor-pointer transition-colors duration-300"
                                                >
                                                    <div className="flex justify-between items-center ">
                                                        <p className="text-sm text-gray-200 truncate">{material.file_name}</p>
                                                        <span className="text-xs bg-[#1c1c1c] px-3 py-2 rounded-lg">
                                                            {material.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Courses without Materials */}
                            {sortedCourses.filter(c => !courseMaterials[c.course_code]?.length).length > 0 && (
                                <div className="pt-4 border-t">
                                    <h3 className="text-sm font-medium text-gray-300 mb-3">COURSES WITHOUT MATERIALS</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {sortedCourses.filter(c => !courseMaterials[c.course_code]?.length).map(course => (
                                            <div key={course.course_code} className="p-3 border-[#55555555] bg-[#1c1c1c] rounded-lg hover:border-[#555555] border-[0.75px] transition-all duration-300 ">
                                                <p className="text-gray-100">{course.course_name}</p>
                                                <p className="text-xs text-gray-400 mt-1 italic">No materials available</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Material Detail Modal */}
            {selectedMaterial && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
                    <div className="bg-dark-glassy rounded-xl border-[0.75px] border-[#55555555] shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4 pb-2 border-b-[0.75px] border-[#cecece]">
                            <h3 className="text-lg font-semibold text-gray-200 ">{selectedMaterial.file_name}</h3>
                            <button
                                onClick={() => setSelectedMaterial(null)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-100">Category:</span>
                                <span className="text-gray-100">{selectedMaterial.category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-100">File Size:</span>
                                <span className="text-gray-100">{selectedMaterial.file_size} KB</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-100">Section:</span>
                                <span className="text-gray-100">{selectedMaterial.section}</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <a
                                href={selectedMaterial.file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center w-full px-4 py-2 border-[0.75px] hover:border-[#c0c0c0] border-[#55555555] bg-[#55555555] text-[#fcfcfc] rounded-md transition-colors duration-300"
                            >
                                Download Material
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-dark-glassy rounded-xl border-[#555555] border-[0.75px] shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-gray-100">New Upload Request</h3>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">


                            {/* Course Code Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Course</label>
                                <select
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={newUpload.course_code}
                                    onChange={(e) => setNewUpload({ ...newUpload, course_code: e.target.value })}
                                >
                                    <option value="" disabled>Select a course</option>
                                    {courseCodes.map((code, idx) => (
                                        <option key={idx} value={code.value}>{code.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">File Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={newUpload.file_name}
                                    onChange={(e) => setNewUpload({ ...newUpload, file_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">File Path (URL)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={newUpload.file_path}
                                    onChange={(e) => setNewUpload({ ...newUpload, file_path: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">File Size (KB)</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={newUpload.file_size}
                                    onChange={(e) => setNewUpload({ ...newUpload, file_size: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-4 py-2 bg-[#343434] border-[0.75px] hover:border-[#545454] text-white rounded-md border-[#55555555] transition-colors duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUploadRequestSubmit}
                                    className="px-4 py-2 bg-[#343434] border-[0.75px] hover:border-[#545454] text-white rounded-md border-[#55555555] transition-colors duration-300"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentCourseMaterials;