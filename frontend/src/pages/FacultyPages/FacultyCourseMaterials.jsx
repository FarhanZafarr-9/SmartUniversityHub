import React, { useState, useEffect } from 'react';
import { getFacultyCourses, getCourseMaterialByCourseId, getUploadRequestsByCourseId, updateUploadRequestStatus, deleteUploadRequest, insertCourseMaterial, updateCourseMaterial, deleteCourseMaterial } from '../../../services/servicesApi';

const FacultyCourseMaterials = () => {
    const [facultyCourses, setFacultyCourses] = useState([]);
    const [courseMaterials, setCourseMaterials] = useState({});
    const [uploadRequests, setUploadRequests] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
    const [newMaterial, setNewMaterial] = useState({
        course_code: '',
        file_name: '',
        file_path: '',
        file_size: 0,
        category: '',
        section: ''
    });
    const [selectedMaterialForEdit, setSelectedMaterialForEdit] = useState(null);
    const [showEditMaterialModal, setShowEditMaterialModal] = useState(false);
    const [showDeleteMaterialModal, setShowDeleteMaterialModal] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser).user;
            setUser(parsedUser);
            fetchFacultyCourses(parsedUser.user_id);
        } else {
            setError("Please login to view course materials");
            setLoading(false);
        }
    }, []);

    const fetchFacultyCourses = async (facultyId) => {
        try {
            setLoading(true);
            const coursesRes = await getFacultyCourses(facultyId);
            setFacultyCourses(Array.isArray(coursesRes) ? coursesRes : []);
            await fetchCourseMaterials(coursesRes);
            await fetchUploadRequests(coursesRes);
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

    const fetchUploadRequests = async (courses) => {
        const requests = {};
        await Promise.all(courses.map(async (course) => {
            try {
                const requestsRes = await getUploadRequestsByCourseId(course.course_code, null);
                requests[course.course_code] = requestsRes || [];
            } catch (err) {
                console.error(`Failed to fetch upload requests for ${course.course_code}:`, err);
                requests[course.course_code] = [];
            }
        }));
        setUploadRequests(requests);
    };

    const handleStatusUpdate = async (status) => {
        try {
            if (selectedRequest) {
                await updateUploadRequestStatus(selectedRequest.request_id, status, user.user_id);
                setShowStatusModal(false);
                setSelectedRequest(null);
                await fetchUploadRequests(facultyCourses);
                await fetchCourseMaterials(facultyCourses);
            }
        } catch (error) {
            setError('Failed to update request status');
        }
    };

    const handleDeleteRequest = async () => {
        try {
            if (selectedRequest) {
                await deleteUploadRequest(selectedRequest.request_id);
                setShowStatusModal(false);
                setSelectedRequest(null);
                await fetchUploadRequests(facultyCourses);
            }
        } catch (error) {
            setError('Failed to delete request');
        }
    };

    const handleAddMaterialSubmit = async () => {
        try {
            const { course_code, file_name, file_path, file_size, category, section } = newMaterial;
            await insertCourseMaterial({
                course_code,
                file_name,
                file_path,
                file_size,
                category,
                section,
                uploaded_by: user.user_id
            });
            setShowAddMaterialModal(false);
            setNewMaterial({
                course_code: '',
                file_name: '',
                file_path: '',
                file_size: 0,
                category: '',
                section: ''
            });
            await fetchCourseMaterials(facultyCourses);
        } catch (error) {
            setError('Failed to add new material');
        }
    };

    const handleEditMaterial = async (materialId, materialData) => {
        try {
            await updateCourseMaterial(materialId, materialData);
            setShowEditMaterialModal(false);
            setSelectedMaterialForEdit(null);
            await fetchCourseMaterials(facultyCourses);
        } catch (error) {
            setError('Failed to update material');
        }
    };

    const handleDeleteMaterial = async (materialId) => {
        try {
            await deleteCourseMaterial(materialId);
            setShowDeleteMaterialModal(false);
            setSelectedMaterial(null);
            await fetchCourseMaterials(facultyCourses);
        } catch (error) {
            setError('Failed to delete material');
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

    const allRequests = Object.values(uploadRequests).flat();
    const filteredRequests = allRequests.filter(request => {
        if (filterStatus === 'all') return true;
        return request.status === filterStatus;
    });

    return (
        <div className="h-full w-full m-4 overflow-y-scroll bg-dark-semi-dark p-6">
            {/* Header */}
            <div className="mb-8 bg-[#282828] rounded-xl shadow-sm p-6 border-[01.75px] border-[#55555555]">
                <h1 className="text-3xl font-bold text-dark-accent-light mb-2">Course Materials</h1>
                <p className="text-gray-500">Manage materials and upload requests for your courses</p>
            </div>

            {/* Main Content */}
            <div className="space-y-8">
                {/* Materials Section */}
                <div className="bg-dark-glassy rounded-xl shadow-sm p-6 border-[01.75px] border-[#55555555]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-200">Course Materials</h2>
                        {/* Add New Material Button */}
                        <button
                            onClick={() => setShowAddMaterialModal(true)}
                            className="bg-dark-glassy hover:border-[#c0c0c0] border-[0.75px] border-[#55555555] text-white font-medium py-2 px-4 rounded-lg mb-8 transition-all duration-300"
                        >
                            + Add New Material
                        </button>
                    </div>

                    {facultyCourses.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">You don't have any courses assigned yet</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Courses with Materials */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {facultyCourses.filter(c => courseMaterials[c.course_code]?.length > 0).map(course => (
                                    <div key={course.course_code} className="border border-[#55555555] bg-dark-semi-dark rounded-xl p-4 hover:shadow-md transition-shadow">
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
                                                    className="p-3 border-[0.75px] border-transparent bg-[#55555555] rounded-lg hover:border-[#555555] cursor-pointer transition-colors duration-300"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-medium text-gray-200 truncate">{material.file_name}</p>
                                                        <span className="text-xs bg-[#121212] px-3 py-2 rounded-lg">
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
                            {facultyCourses.filter(c => !courseMaterials[c.course_code]?.length).length > 0 && (
                                <div className="pt-4 border-t">
                                    <h3 className="text-sm font-medium text-gray-300 mb-3">COURSES WITHOUT MATERIALS</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {facultyCourses.filter(c => !courseMaterials[c.course_code]?.length).map(course => (
                                            <div key={course.course_code} className="p-3 border-transparent bg-dark-semi-dark rounded-lg hover:border-[#555555] border-[0.75px] transition-all duration-300 ">
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-dark-glassy rounded-xl border-[0.75px] border-[#55555555] shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4 pb-2 border-b-[0.75px] border-[#cecece]">
                            <h3 className="text-lg font-semibold text-gray-200">{selectedMaterial.file_name}</h3>
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

                        <div className="mt-4 flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setSelectedMaterialForEdit(selectedMaterial);
                                    setShowEditMaterialModal(true);
                                }}
                                className="px-5 py-1 bg-[#343434] border-[0.75px] hover:border-[#c0c0c0] text-white rounded-md border-[#55555555] transition-colors duration-300"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedMaterial(selectedMaterial);
                                    setShowDeleteMaterialModal(true);
                                }}
                                className="px-5 py-1 bg-red-500 border-[0.75px] hover:border-[#c0c0c0] text-white rounded-md border-[#55555555] transition-colors duration-300"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Modal */}
            {showStatusModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-dark-glassy rounded-xl border-[#555555] border-[0.75px] shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4 border-b-[#555] border-b-[02.75px] pb-3">
                            <h3 className="text-lg font-semibold text-gray-200">Manage Request</h3>
                            <button
                                onClick={() => {
                                    setShowStatusModal(false);
                                    setSelectedRequest(null);
                                }}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-gray-200 font-medium">File Name:</p>
                                <p className="text-gray-300 font-medium">{selectedRequest.file_name}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-gray-200 font-medium">Course Code:</p>
                                <p className="text-gray-300 font-medium">{selectedRequest.course_code}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-gray-200 font-medium">Current Status:</p>
                                <p className="text-gray-300 font-medium">{selectedRequest.status}</p>
                            </div>

                            <div className="flex justify-end space-x-3 pt-2">
                                {selectedRequest.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate('approved')}
                                            className="px-2 bg-green-900/30 text-green-400 border border-green-900/50 rounded-md hover:bg-green-900/50 transition-all duration-200"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate('rejected')}
                                            className="px-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded-md hover:bg-red-900/50 transition-all duration-200"
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={handleDeleteRequest}
                                    className="px-2 py-1 bg-gray-900/30 text-gray-400 border border-gray-900/50 rounded-md hover:bg-gray-900/50 transition-all duration-200"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add New Material Modal */}
            {showAddMaterialModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-dark-glassy rounded-xl border-[#555555] border-[0.75px] shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-gray-200">Add New Material</h3>
                            <button
                                onClick={() => setShowAddMaterialModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">Course Code</label>
                                <select
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={newMaterial.course_code}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, course_code: e.target.value })}
                                >
                                    <option value="" disabled>Select a course</option>
                                    {facultyCourses.map(course => (
                                        <option key={course.course_code} value={course.course_code}>
                                            {course.course_name} ({course.course_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">File Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={newMaterial.file_name}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, file_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">File Path (URL)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={newMaterial.file_path}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, file_path: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">File Size (KB)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="655360"
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={newMaterial.file_size}
                                    onChange={(e) => {
                                        let value = parseInt(e.target.value) || 0;
                                        if (value < 0) value = 0;
                                        if (value > 655360) value = 655360; // 50 MB in KB
                                        setNewMaterial({ ...newMaterial, file_size: parseInt(e.target.value) || 0 })
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">Category</label>
                                <select
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={newMaterial.category}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                                >
                                    <option value="" disabled>Select a category</option>
                                    <option value="lecture_notes">Lecture Notes</option>
                                    <option value="assignments">Assignments</option>
                                    <option value="extra_resources">Extra Resources</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">Section</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={newMaterial.section}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, section: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    onClick={() => setShowAddMaterialModal(false)}
                                    className="px-4 py-2 bg-[#343434] border-[0.75px] hover:border-[#545454] text-white rounded-md border-[#55555555] transition-colors duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddMaterialSubmit}
                                    className="px-4 py-2 bg-[#343434] border-[0.75px] hover:border-[#545454] text-white rounded-md border-[#55555555] transition-colors duration-300"
                                >
                                    Add Material
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Material Modal */}
            {showEditMaterialModal && selectedMaterialForEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-dark-glassy rounded-xl border-[#555555] border-[0.75px] shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-gray-200">Edit Material</h3>
                            <button
                                onClick={() => {
                                    setShowEditMaterialModal(false);
                                    setSelectedMaterialForEdit(null);
                                }}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">File Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={selectedMaterialForEdit.file_name}
                                    onChange={(e) => setSelectedMaterialForEdit({ ...selectedMaterialForEdit, file_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">File Path (URL)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={selectedMaterialForEdit.file_path}
                                    onChange={(e) => setSelectedMaterialForEdit({ ...selectedMaterialForEdit, file_path: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">File Size (KB)</label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={selectedMaterialForEdit.file_size}
                                    onChange={(e) => setSelectedMaterialForEdit({ ...selectedMaterialForEdit, file_size: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">Category</label>
                                <select
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={selectedMaterialForEdit.category}
                                    onChange={(e) => setSelectedMaterialForEdit({ ...selectedMaterialForEdit, category: e.target.value })}
                                >
                                    <option value="lecture_notes">Lecture Notes</option>
                                    <option value="assignments">Assignments</option>
                                    <option value="extra_resources">Extra Resources</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-1">Section</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-[#1c1c1c] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#555555]"
                                    value={selectedMaterialForEdit.section}
                                    onChange={(e) => setSelectedMaterialForEdit({ ...selectedMaterialForEdit, section: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowEditMaterialModal(false);
                                        setSelectedMaterialForEdit(null);
                                    }}
                                    className="px-4 py-2 bg-[#343434] border-[0.75px] hover:border-[#c0c0c0] text-white rounded-md border-[#55555555] transition-colors duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleEditMaterial(selectedMaterialForEdit.material_id, selectedMaterialForEdit)}
                                    className="px-4 py-2 bg-[#343434] border-[0.75px] hover:border-[#c0c0c0] text-white rounded-md border-[#55555555] transition-colors duration-300"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Material Modal */}
            {showDeleteMaterialModal && selectedMaterial && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-dark-glassy rounded-xl border-[#555555] border-[0.75px] shadow-xl max-w-md w-full p-6 ">
                        <div className="flex justify-between items-start mb-6 border-b-[0.75px] border-[#cecece] pb-2">
                            <h3 className="text-lg font-semibold text-gray-200">Delete Material</h3>
                            <button
                                onClick={() => {
                                    setShowDeleteMaterialModal(false);
                                    setSelectedMaterial(null);
                                }}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-gray-200">Are you sure you want to delete this material?</p>
                            <p className="text-gray-200 font-medium">File Name: {selectedMaterial.file_name}</p>

                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowDeleteMaterialModal(false);
                                        setSelectedMaterial(null);
                                    }}
                                    className="px-4 py-1 bg-[#343434] border-[0.75px] hover:border-[#c0c0c0] text-white rounded-md border-[#55555555] transition-colors duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteMaterial(selectedMaterial.material_id)}
                                    className="px-4 py-1 bg-red-900/30 text-red-400 border-red-900/50 border-[0.75px] hover:border-[#c0c0c0] rounded-md transition-colors duration-300"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Upload Requests Section */}
            {filteredRequests.length > 0 && (
                <div className="mt-12 bg-dark-glassy rounded-xl shadow-sm p-6 border-[01.75px] border-[#55555555] mb-8">

                    <div className='flex items-center justify-between'>
                        <h2 className="text-xl font-semibold text-gray-200 mb-4">Upload Requests</h2>
                        {/* Filter Dropdown */}
                        <div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className=" bg-[#282828] hover:border-[#c0c0c0] border-[0.75px] border-[#55555555] text-white font-medium py-2 px-4 rounded-lg mb-8 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-[#c0c0c0]"
                            >
                                <option value="all">All Requests</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredRequests.map((request, idx) => (
                            <div
                                key={idx}
                                className="border border-[#55555555] bg-dark-semi-dark rounded-xl p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-gray-100">{request.file_name}</h3>
                                    <span className="bg-[#fefefe] text-[#121212] text-xs px-2 py-1 rounded-md">
                                        {request.course_code}
                                    </span>
                                </div>
                                <div className="flex items-center mb-2">
                                    <span className="text-xs bg-[#121212] px-3 py-2 rounded-md text-gray-200">
                                        {request.status}
                                    </span>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    {request.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setShowStatusModal(true);
                                                }}
                                                className="px-2 py-1 bg-green-900/30 text-green-400 border border-green-900/50 rounded text-xs hover:bg-green-900/50 transition-all duration-200"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setShowStatusModal(true);
                                                }}
                                                className="px-2 py-1 bg-red-900/30 text-red-400 border border-red-900/50 rounded text-xs hover:bg-red-900/50 transition-all duration-200"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => {
                                            setSelectedRequest(request);
                                            setShowStatusModal(true);
                                        }}
                                        className="px-2 py-1 bg-gray-900/30 text-gray-400 border border-gray-900/50 rounded text-xs hover:bg-gray-900/50 transition-all duration-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>


    );
};

export default FacultyCourseMaterials;