import React, { useState, useEffect } from 'react';
import {
    getFacultyCourses,
    getAssessmentsByCourse,
    getAssessmentSubmissions,
    deleteAssessment,
    setUpdateAssessment,
    gradeAssessment
} from '../../../services/servicesApi';
import CourseButton from '../../Components/CourseButton';
import { useNavigate } from 'react-router-dom';

const FacultyAssessments = () => {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courses, setCourses] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAssessments, setLoadingAssessments] = useState(false);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editAssessment, setEditAssessment] = useState(null);
    const [createMode, setCreateMode] = useState(false);
    const [newAssessment, setNewAssessment] = useState({
        assessment_id: null,
        title: '',
        assessment_type: 'assignment',
        total_marks: 100,
        weightage: 10,
        assessment_date: new Date().toISOString().slice(0, 16)
    });
    const [activeTab, setActiveTab] = useState('assessments');
    const [filter, setFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);

    const [isInputDialogOpen, setIsInputDialogOpen] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [inputAction, setInputAction] = useState(null);
    const [inputMax, setInputMax] = useState(100);
    const [validationMessage, setValidationMessage] = useState('');
    const [currentSubmission, setCurrentSubmission] = useState(null);

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
            setError("Failed to load courses");
            console.error("Error fetching courses:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCourseSelect = async (courseCode) => {
        const course = courses.find((c) => c.course_code === courseCode); // Find the course by course_code
        if (!course) {
            setError("Course not found");
            return;
        }
        setSelectedCourse(course);
        setLoadingAssessments(true);
        setLoadingSubmissions(true);
        try {
            const [assessmentsRes, submissionsRes] = await Promise.all([
                getAssessmentsByCourse(course.course_code),
                getAssessmentSubmissions(course.course_code, filter === 'graded' ? 1 : filter === 'ungraded' ? 0 : null)
            ]);
            setAssessments(assessmentsRes || []);
            setSubmissions(submissionsRes || []);
        } catch (err) {
            setError("Failed to load course data");
            console.error("Error fetching course data:", err);
        } finally {
            setLoadingAssessments(false);
            setLoadingSubmissions(false);
        }
    };

    const fetchSubmissions = async (gradedStatus) => {
        if (!selectedCourse) return;

        setLoadingSubmissions(true);
        try {
            const submissionsRes = await getAssessmentSubmissions(selectedCourse.course_code, gradedStatus);
            console.log("Fetched submissions:", submissionsRes);
            setSubmissions(submissionsRes || []);
        } catch (err) {
            setError("Failed to load submissions");
            console.error("Error fetching submissions:", err);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const handleEditAssessment = (assessment) => {
        setEditMode(true);
        setEditAssessment({ ...assessment });
        setCreateMode(false);
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setEditAssessment(null);
    };

    const handleUpdateAssessment = async () => {
        try {
            editAssessment.course_code = selectedCourse.course_code;
            await setUpdateAssessment(editAssessment);
            const assessmentsRes = await getAssessmentsByCourse(selectedCourse.course_code);
            setAssessments(assessmentsRes || []);
            setEditMode(false);
        } catch (err) {
            setError("Failed to update assessment");
            console.error("Error updating assessment:", err);
        }
    };

    const handleCreateAssessment = () => {
        setCreateMode(true);
        setEditMode(false);
        setNewAssessment({
            assessment_id: null,
            title: '',
            assessment_type: 'assignment',
            total_marks: 100,
            weightage: 10,
            assessment_date: new Date().toISOString().slice(0, 16)
        });
    };

    const handleSaveNewAssessment = async () => {
        if (!newAssessment.title || !newAssessment.assessment_date) {
            alert("Please fill in all required fields");
            return;
        }

        try {
            const assessmentData = {
                ...newAssessment,
                course_code: selectedCourse.course_code
            };
            await setUpdateAssessment(assessmentData);
            const assessmentsRes = await getAssessmentsByCourse(selectedCourse.course_code);
            setAssessments(assessmentsRes || []);
            setCreateMode(false);
        } catch (err) {
            setError("Failed to create assessment");
            console.error("Error creating assessment:", err);
        }
    };

    const handleDeleteAssessment = (assessment) => {
        setConfirmMessage(`Are you sure you want to delete this assessment? This will also delete all related submissions.`);
        setConfirmAction(async () => {
            try {
                await deleteAssessment({
                    assessment_id: assessment.assessment_id,
                    course_code: selectedCourse.course_code
                });
                const [assessmentsRes, submissionsRes] = await Promise.all([
                    getAssessmentsByCourse(selectedCourse.course_code),
                    getAssessmentSubmissions(selectedCourse.course_code, filter === 'graded' ? 1 : 0)
                ]);
                setAssessments(assessmentsRes || []);
                setSubmissions(submissionsRes || []);
            } catch (err) {
                setError("Failed to delete assessment");
                console.error("Error deleting assessment:", err);
            }
        });
        setIsConfirmOpen(true);
    };



    const handleGradeClick = (submission) => {
        setCurrentSubmission(submission);
        setInputMessage(`Enter marks for ${submission.student_name}\n(Max: ${submission.total_marks})`);
        setInputMax(submission.total_marks);
        setInputValue(submission.marks_obtained || ''); // Pre-fill existing marks
        setIsInputDialogOpen(true);
        setValidationMessage('');
    };

    const handleGradeSubmission = async () => {
        if (!currentSubmission) return;

        // Attempt to parse the input marks as a float
        const numericMarks = parseFloat(inputValue);

        // Check if the parsed marks are valid
        if (isNaN(numericMarks) || numericMarks < 0 || numericMarks > currentSubmission.total_marks) {
            setValidationMessage(`Marks must be between 0 and ${currentSubmission.total_marks}`);
            return;
        }

        try {
            setLoadingSubmissions(true);
            // Call the grading API
            await gradeAssessment({
                submission_id: currentSubmission.submission_id,
                marks_obtained: numericMarks,
                grader_id: user.user_id
            });

            // Refresh submissions after grading
            const submissionsRes = await getAssessmentSubmissions(
                selectedCourse.course_code,
                filter === 'graded' ? 1 : filter === 'ungraded' ? 0 : null
            );

            setSubmissions(submissionsRes || []);
            setIsInputDialogOpen(false);
        } catch (err) {
            setError("Failed to grade submission");
            console.error("Error grading submission:", err);
            setValidationMessage("Failed to submit marks. Please try again.");
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const getTypeBadge = (type) => {
        const typeColors = {
            quiz: 'bg-purple-900/30 text-purple-400',
            exam: 'bg-red-900/30 text-red-400',
            project: 'bg-indigo-900/30 text-indigo-400',
            assignment: 'bg-blue-900/30 text-blue-400',
            class_activity: 'bg-green-900/30 text-green-400'
        };

        return (
            <span className={`${typeColors[type] || 'bg-gray-700 text-gray-300'} text-xs px-2.5 py-1 rounded-full`}>
                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            Graded: 'bg-green-900/30 text-green-400',
            Submitted: 'bg-blue-900/30 text-blue-400',
            Overdue: 'bg-red-900/30 text-red-400',
            Pending: 'bg-yellow-900/30 text-yellow-400',
            Exam: 'bg-gray-700 text-gray-300'
        };

        return (
            <span className={`${statusColors[status] || 'bg-gray-700 text-gray-300'} text-xs px-2.5 py-1 rounded-full`}>
                {status}
            </span>
        );
    };

    const filteredSubmissions = () => {
        let result = submissions;

        // First apply the main filter (all/graded/ungraded)
        if (filter === 'graded') {
            result = result.filter(sub => sub.status === 'Graded' || sub.marks_obtained !== null);
        } else if (filter === 'ungraded') {
            result = result.filter(sub => sub.status !== 'Graded' && sub.marks_obtained === null);
        }

        // Then apply the status filter if not 'all'
        if (statusFilter !== 'all') {
            result = result.filter(sub => sub.status === statusFilter);
        }

        return result;
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c0c0c0]"></div>
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

    return (
        <div className="h-full w-full p-4 overflow-y-auto">
            {/* Header */}
            <div className="mb-4 bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                <h1 className="text-xl font-semibold text-gray-200">Course Assessments</h1>
                <p className="text-xs text-gray-400">Manage assessments and submissions for your courses</p>
            </div>

            {/* Course Selection */}
            <div className="mb-4">
                <h2 className="text-xs font-medium text-gray-400 mb-2">SELECT COURSE</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {courses.map((course) => (
                        <CourseButton
                            key={course.course_code}
                            course={course}
                            isSelected={selectedCourse?.course_code === course.course_code}
                            onClick={(courseCode) => handleCourseSelect(courseCode)}
                        />
                    ))}
                </div>
            </div>

            {selectedCourse && (
                <>
                    {/* Course Header */}
                    <div className="mb-3">
                        <h2 className="text-sm font-medium text-gray-200">
                            {selectedCourse.course_name} <span className="text-xs text-gray-400">({selectedCourse.course_code})</span>
                        </h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-700 mb-4">
                        <button
                            onClick={() => setActiveTab('assessments')}
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'assessments' ? 'text-[#c0c0c0] border-b-2 border-[#c0c0c0]' : 'text-gray-400 hover:text-gray-300'}`}
                        >
                            Assessments
                        </button>
                        <button
                            onClick={() => setActiveTab('submissions')}
                            className={`px-4 py-2 text-sm font-medium ${activeTab === 'submissions' ? 'text-[#c0c0c0] border-b-2 border-[#c0c0c0]' : 'text-gray-400 hover:text-gray-300'}`}
                        >
                            Submissions
                        </button>
                    </div>

                    {/* Assessments Tab */}
                    {activeTab === 'assessments' && (
                        <>
                            {/* Create/Edit Forms */}
                            {createMode ? (
                                <div className="bg-[#1c1c1c] rounded-xl p-4 mb-4 border border-[#55555555]">
                                    <h3 className="text-sm font-medium text-gray-200 mb-3">Create New Assessment</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Title*</label>
                                            <input
                                                type="text"
                                                value={newAssessment.title}
                                                onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                                                className="w-full bg-dark-glassy text-gray-200 p-2 rounded text-xs border border-[#555]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Type*</label>
                                            <select
                                                value={newAssessment.assessment_type}
                                                onChange={(e) => setNewAssessment({ ...newAssessment, assessment_type: e.target.value })}
                                                className="w-full bg-dark-glassy text-gray-200 p-2 rounded text-xs border border-[#555]"
                                            >
                                                <option value="assignment">Assignment</option>
                                                <option value="quiz">Quiz</option>
                                                <option value="project">Project</option>
                                                <option value="class_activity">Class Activity</option>
                                                <option value="exam">Exam</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Total Marks*</label>
                                                <input
                                                    type="number"
                                                    value={newAssessment.total_marks}
                                                    onChange={(e) => setNewAssessment({ ...newAssessment, total_marks: parseInt(e.target.value) || 0 })}
                                                    className="w-full bg-dark-glassy text-gray-200 p-2 rounded text-xs border border-[#555]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Weightage (%)*</label>
                                                <input
                                                    type="number"
                                                    value={newAssessment.weightage}
                                                    onChange={(e) => setNewAssessment({ ...newAssessment, weightage: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-dark-glassy text-gray-200 p-2 rounded text-xs border border-[#555]"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Due Date*</label>
                                            <input
                                                type="datetime-local"
                                                value={newAssessment.assessment_date}
                                                onChange={(e) => setNewAssessment({ ...newAssessment, assessment_date: e.target.value })}
                                                className="w-full bg-dark-glassy text-gray-200 p-2 rounded text-xs border border-[#555]"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => setCreateMode(false)}
                                                className="px-3 py-1 text-xs bg-dark-glassy hover:bg-[#333] text-gray-200 rounded border border-[#555] hover:border-[#c0c0c0]"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveNewAssessment}
                                                className="px-3 py-1 text-xs bg-blue-900/30 hover:bg-blue-900/40 text-blue-400 rounded border border-blue-900/50 hover:border-blue-400"
                                            >
                                                Create
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : editMode && editAssessment ? (
                                <div className="bg-[#1c1c1c] rounded-xl p-4 mb-4 border border-[#55555555]">
                                    <h3 className="text-sm font-medium text-gray-200 mb-3">Edit Assessment</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Title*</label>
                                            <input
                                                type="text"
                                                value={editAssessment.title}
                                                onChange={(e) => setEditAssessment({ ...editAssessment, title: e.target.value })}
                                                className="w-full bg-dark-glassy text-gray-200 p-2 rounded text-xs border border-[#555]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Type*</label>
                                            <select
                                                value={editAssessment.assessment_type}
                                                onChange={(e) => setEditAssessment({ ...editAssessment, assessment_type: e.target.value })}
                                                className="w-full bg-dark-glassy text-gray-200 p-2 rounded text-xs border border-[#555]"
                                            >
                                                <option value="assignment">Assignment</option>
                                                <option value="quiz">Quiz</option>
                                                <option value="project">Project</option>
                                                <option value="class_activity">Class Activity</option>
                                                <option value="exam">Exam</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Total Marks*</label>
                                                <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                    value={editAssessment.total_marks}
                                                        onChange={(e) => {
                                                            let value = parseInt(e.target.value) || 0;
                                                            if (value < 0) value = 0;
                                                            if (value > 50) value = 50;
                                                            setEditAssessment({ ...editAssessment, total_marks: parseInt(e.target.value) || 0 })
                                                        }}
                                                    className="w-full bg-dark-glassy text-gray-200 p-2 rounded text-xs border border-[#555]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Weightage (%)*</label>
                                                <input
                                                        type="number"
                                                        min="0"
                                                        max="50"
                                                    value={editAssessment.weightage}
                                                        onChange={(e) => {
                                                            let value = parseInt(e.target.value) || 0;
                                                            if (value < 0) value = 0;
                                                            if (value > 50) value = 50;
                                                            setEditAssessment({ ...editAssessment, weightage: parseFloat(e.target.value) || 0 });
                                                        }}
                                                    className="w-full bg-dark-glassy text-gray-200 p-2 rounded text-xs border border-[#555]"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Due Date*</label>
                                            <input
                                                type="datetime-local"
                                                value={new Date(editAssessment.assessment_date).toISOString().slice(0, 16)}
                                                onChange={(e) => setEditAssessment({ ...editAssessment, assessment_date: e.target.value })}
                                                className="w-full bg-dark-glassy text-gray-200 p-2 rounded text-xs border border-[#555]"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={handleCancelEdit}
                                                className="px-3 py-1 text-xs bg-dark-glassy hover:bg-[#333] text-gray-200 rounded border border-[#555] hover:border-[#c0c0c0]"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateAssessment}
                                                className="px-3 py-1 text-xs bg-blue-900/30 hover:bg-blue-900/40 text-blue-400 rounded border border-blue-900/50 hover:border-blue-400"
                                            >
                                                Update
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Assessments List */
                                <div className="space-y-2">
                                    <div className="flex justify-end mb-2">
                                        <button 
                                            onClick={handleCreateAssessment}
                                            className="text-xs px-3 opacity-50 py-1.5 bg-green-900/30 hover:bg-green-900/40 text-green-400 rounded border border-green-900/50 hover:border-green-400"
                                        >
                                            + Create Assessment
                                        </button>
                                    </div>

                                    {loadingAssessments ? (
                                        <div className="text-center py-4">
                                            <p className="text-xs text-gray-400">Loading assessments...</p>
                                        </div>
                                    ) : assessments.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {assessments.map((assessment) => (
                                                <div
                                                    key={assessment.assessment_id}
                                                    className="bg-dark-glassy rounded-xl p-3 border border-[#55555555] hover:border-[#555555] transition-all duration-300"
                                                    style={{ borderWidth: '0.75px' }}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-sm font-medium text-gray-200">
                                                                {assessment.title}
                                                            </h3>
                                                            {getTypeBadge(assessment.assessment_type)}
                                                        </div>
                                                    </div>

                                                    {/* Table-like row section */}
                                                    <div className="w-full bg-[#1c1c1c] rounded-lg px-3 py-1 mb-3 border-[#55555555] border-[0.75px]">
                                                        <div className="grid grid-cols-3 gap-4 text-xs">
                                                            <div className="space-y-1 border-r-[1.5px] border-[#555] pr-2">
                                                                <p className="text-gray-400 font-medium text-left">Due</p>
                                                                <p className="text-gray-200 text-left">
                                                                    {new Date(assessment.assessment_date).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-1 border-r-[1.5px] border-[#555] pr-2">
                                                                <p className="text-gray-400 font-medium text-left">Marks</p>
                                                                <p className="text-gray-200 text-left">{assessment.total_marks}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-gray-400 font-medium text-left">Weightage</p>
                                                                <p className="text-gray-200 text-left">{assessment.weightage || 'N/A'}%</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditAssessment(assessment)}
                                                            className="text-xs px-3 py-1.5 bg-dark-glassy hover:bg-[#333] text-gray-200 rounded border border-[#555] hover:border-[#c0c0c0] transition-all duration-300"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAssessment(assessment)}
                                                            className="text-xs px-3 py-1.5 bg-red-900/30 hover:bg-red-900/40 text-red-400 rounded border border-red-900/50 hover:border-red-400 transition-all duration-300"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 bg-[#1c1c1c] rounded-xl border border-dashed border-[#333]">
                                            <p className="text-xs text-gray-500">No assessments available for this course</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* Submissions Tab */}
                    {activeTab === 'submissions' && (
                        <div className="space-y-2">
                            {/* Submission Filters */}
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setFilter('all');
                                            fetchSubmissions(null);
                                        }}
                                        className={`px-2 py-1 text-xs rounded ${filter === 'all' ? 'bg-[#333] text-gray-200' : 'bg-dark-glassy hover:bg-[#333] text-gray-400'}`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => { setFilter('graded'); fetchSubmissions(1); }}
                                        className={`px-2 py-1 text-xs rounded ${filter === 'graded' ? 'bg-[#333] text-gray-200' : 'bg-dark-glassy hover:bg-[#333] text-gray-400'}`}
                                    >
                                        Graded
                                    </button>
                                    <button
                                        onClick={() => { setFilter('ungraded'); fetchSubmissions(0); }}
                                        className={`px-2 py-1 text-xs rounded ${filter === 'ungraded' ? 'bg-[#333] text-gray-200' : 'bg-dark-glassy hover:bg-[#333] text-gray-400'}`}
                                    >
                                        Ungraded
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="bg-dark-glassy text-gray-200 text-xs rounded p-1 border border-[#555]"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="Submitted">Submitted</option>
                                        <option value="Graded">Graded</option>
                                        <option value="Overdue">Overdue</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                            </div>

                            {loadingSubmissions ? (
                                <div className="text-center py-4">
                                    <p className="text-xs text-gray-400">Loading submissions...</p>
                                </div>
                            ) : filteredSubmissions().length > 0 ? (
                                <div className='grid grid-cols-3 md:grid-cols-3 gap-4'>
                                    {filteredSubmissions().map((submission) => (
                                        <div
                                            key={submission.submission_id}
                                            className="bg-dark-glassy w-full rounded-xl p-3 border border-[#55555555] hover:border-[#333] transition-all duration-300"
                                            style={{ borderWidth: '0.75px' }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-200">
                                                        {submission.assessment_title}
                                                    </h3>
                                                    <p className="text-xs text-left text-gray-400">{submission.student_id}</p>
                                                </div>
                                                <div>
                                                    {getStatusBadge(submission.status)}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                                                <div>
                                                    <p className="text-gray-400">Submitted:</p>
                                                    <p className="text-gray-200">
                                                        {submission.submission_date ?
                                                            new Date(submission.submission_date).toLocaleDateString() :
                                                            'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400">Marks:</p>
                                                    <p className="text-gray-200">
                                                        {submission.marks_obtained !== null ?
                                                            `${submission.marks_obtained}/${submission.total_marks}` :
                                                            'Not graded'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-400">Weight:</p>
                                                    <p className="text-gray-200">{submission.weightage}%</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex justify-end gap-1">
                                                {submission.file_upload && (
                                                    <a
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs px-2 py-1 bg-dark-glassy hover:bg-[#333] text-gray-200 rounded border border-[#555] hover:border-[#c0c0c0]"
                                                    >
                                                        View Submission
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleGradeClick(submission)}
                                                    className={`text-xs px-2 py-1 rounded ${submission.marks_obtained !== null ?
                                                        'bg-green-900/30 text-green-400 border border-green-900/50' :
                                                        'bg-dark-glassy hover:bg-[#333] text-gray-200 border border-[#555] hover:border-[#c0c0c0]'
                                                        }`}
                                                >
                                                    {submission.marks_obtained !== null ? 'Regrade' : 'Grade'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-[#1c1c1c] rounded-xl border border-dashed border-[#333]">
                                    <p className="text-xs text-gray-500">
                                        {filter === 'all'
                                            ? "No submissions available"
                                            : filter === 'graded'
                                                ? "No graded submissions found"
                                                : "No ungraded submissions found"}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Confirmation Dialog */}
            {isConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#1c1c1c] p-6 rounded-xl text-gray-200">
                        <p className="text-sm mb-4">{confirmMessage}</p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsConfirmOpen(false)}
                                className="px-3 py-1 text-xs bg-dark-glassy hover:bg-[#333] text-gray-200 rounded border border-[#555] hover:border-[#c0c0c0]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setIsConfirmOpen(false);
                                    confirmAction();
                                }}
                                className="px-3 py-1 text-xs bg-red-900/30 hover:bg-red-900/40 text-red-400 rounded border border-red-900/50 hover:border-red-400"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Dialog */}
            {isInputDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#1c1c1c] p-6 rounded-xl text-gray-200">
                        <p className="text-sm mb-4">{inputMessage}</p>
                        {validationMessage && <p className="text-red-400 text-xs mb-2">{validationMessage}</p>}
                        <input
                            type="number"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full bg-dark-glassy text-gray-200 p-2 rounded text-xs border border-[#555]"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => {
                                    setIsInputDialogOpen(false);
                                    setValidationMessage('');
                                }}
                                className="px-3 py-1 text-xs bg-dark-glassy hover:bg-[#333] text-gray-200 rounded border border-[#555] hover:border-[#c0c0c0]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGradeSubmission}
                                disabled={loadingSubmissions}
                                className="px-3 py-1 text-xs bg-blue-900/30 hover:bg-blue-900/40 text-blue-400 rounded border border-blue-900/50 hover:border-blue-400 disabled:opacity-50"
                            >
                                {loadingSubmissions ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyAssessments;