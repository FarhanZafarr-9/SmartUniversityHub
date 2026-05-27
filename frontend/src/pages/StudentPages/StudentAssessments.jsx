import React, { useState, useEffect } from 'react';
import { getStudentCourses, getAssessmentsByCourse, submitAssessment, fetchAssessmentsByStudent } from '../../../services/servicesApi';
import CourseButton from '../../Components/CourseButton';

const StudentAssessments = () => {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courses, setCourses] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [submittedAssessments, setSubmittedAssessments] = useState([]);
    const [gradedAssessments, setGradedAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAssessments, setLoadingAssessments] = useState(false);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [filter, setFilter] = useState('All');

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
            const enrolledRes = await getStudentCourses(user.user_id, 'enrolled');
            setCourses(enrolledRes || []);
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
        try {
            const [assessmentsRes, submittedRes, gradedRes] = await Promise.all([
                getAssessmentsByCourse(course.course_code),
                fetchAssessmentsByStudent(user.user_id, course.course_code, 0),
                fetchAssessmentsByStudent(user.user_id, course.course_code, 1)
            ]);

            setAssessments(assessmentsRes || []);
            setSubmittedAssessments(submittedRes || []);
            setGradedAssessments(gradedRes || []);
        } catch (err) {
            setError("Failed to load assessments");
            console.error("Error fetching assessments:", err);
        } finally {
            setLoadingAssessments(false);
        }
    };

    const handleSubmitAssignment = async (assessment) => {
        if (isOverdue(assessment)) {
            setError("Cannot submit - this assignment is overdue");
            return;
        }

        try {
            await submitAssessment({
                assessment_id: assessment.assessment_id,
                student_id: user.user_id,
                file_upload: `submissions/${user.user_id}_${assessment.assessment_id}.pdf`
            });

            // Refresh data after submission
            const [assessmentsRes, submittedRes, gradedRes] = await Promise.all([
                getAssessmentsByCourse(selectedCourse.course_code),
                fetchAssessmentsByStudent(user.user_id, selectedCourse.course_code, 0),
                fetchAssessmentsByStudent(user.user_id, selectedCourse.course_code, 1)
            ]);

            setAssessments(assessmentsRes || []);
            setSubmittedAssessments(submittedRes || []);
            setGradedAssessments(gradedRes || []);

        } catch (err) {
            setError("Failed to submit assignment");
            console.error("Error submitting assignment:", err);
        }
    };

    const isOverdue = (assessment) => {

        if (isGraded(assessment.assessment_id) || isSubmitted(assessment.assessment_id) || !assessment.assessment_date)
            return false;

        const dueDate = new Date(assessment.assessment_date);
        const now = new Date();
        return now > dueDate;
    };

    const isSubmitted = (assessmentId) => {
        return submittedAssessments.some(a => a.assessment_id === assessmentId);
    };

    const isGraded = (assessmentId) => {
        return gradedAssessments.some(a => a.assessment_id === assessmentId);
    };

    const getGrade = (assessmentId) => {
        const graded = gradedAssessments.find(a => a.assessment_id === assessmentId);
        return graded ? `${graded.marks_obtained}/${graded.total_marks}` : null;
    };

    const getStatusBadge = (assessment) => {
        if (isGraded(assessment.assessment_id)) {
            return (
                <span className="bg-green-900/30 text-green-400 text-xs px-2.5 py-1 rounded-full flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5"></span>
                    Graded: {getGrade(assessment.assessment_id)}
                </span>
            );
        }
        if (isSubmitted(assessment.assessment_id)) {
            return (
                <span className="bg-blue-900/30 text-blue-400 text-xs px-2.5 py-1 rounded-full flex items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-400 mr-1.5"></span>
                    Submitted
                </span>
            );
        }
        if (isOverdue(assessment)) {
            return (
                <span className="bg-red-900/30 text-red-400 text-xs px-2.5 py-1 rounded-full flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-400 mr-1.5"></span>
                    Overdue
                </span>
            );
        }
        return (
            <span className="bg-yellow-900/30 text-yellow-400 text-xs px-2.5 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1.5"></span>
                Pending
            </span>
        );
    };

    const getTypeBadge = (type) => {
        const typeColors = {
            quiz: 'bg-purple-900/30 text-purple-400',
            exam: 'bg-red-900/30 text-red-400',
            project: 'bg-indigo-900/30 text-indigo-400',
            assignment: 'bg-blue-900/30 text-blue-400'
        };

        return (
            <span className={`${typeColors[type] || 'bg-gray-700 text-gray-300'} text-xs px-2.5 py-1 rounded-full`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
        );
    };

    const filteredAssessments = () => {
        if (filter === 'All') {
            return assessments;
        } else if (filter === 'Submitted') {
            return assessments.filter(assessment => isSubmitted(assessment.assessment_id));
        } else if (filter === 'Graded') {
            return assessments.filter(assessment => isGraded(assessment.assessment_id));
        }
        return assessments;
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
        <div className="h-full w-full p-6 overflow-y-auto bg-transparent">
            {/* Header */}
            <div className="mb-6 bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                <h1 className="text-2xl font-bold text-gray-200">My Assessments</h1>
                <p className="text-sm text-gray-400">View and submit assessments for your enrolled courses</p>
            </div>

            {/* Course Selection */}
            <div className="mb-6 grid grid-cols-3 items-center gap-2 bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Select a Course</h2>
                <div className="grid grid-cols-4 gap-2">
                    {courses.map((course) => (
                        <CourseButton
                            key={course.course_code}
                            course={course}
                            isSelected={selectedCourse?.course_code === course.course_code}
                            onClick={handleCourseSelect}
                        />
                    ))}
                </div>
            </div>

            {selectedCourse && (
                <>
                    {/* Course Header */}
                    <div className="bg-dark-glassy rounded-xl p-4 mb-4 border border-[#55555555]">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-200">
                                    {selectedCourse.course_name}
                                </h2>
                                <p className="text-sm text-left text-gray-400">{selectedCourse.course_code}</p>
                            </div>
                            <div className="text-xs text-gray-400">
                                Instructor: {selectedCourse.instructor_name || 'Not assigned'}
                            </div>
                        </div>
                    </div>

                    {/* Filter Options */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Filter Assessments</h2>
                            <div className="text-xs text-gray-500">
                                {filteredAssessments().length} items
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => setFilter('All')}
                                className={`px-3 py-1.5 border-[0.75px] text-xs rounded-md transition-all duration-300 ${filter === 'All' ? 'bg-[#1c1c1c] text-gray-200 border-[#55555555]' : 'bg-dark-glassy hover:bg-[#333] border-transparent text-gray-300'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('Submitted')}
                                className={`px-3 py-1.5 text-xs border-[0.75px] rounded-md transition-all duration-300 ${filter === 'Submitted' ? 'bg-[#1c1c1c] text-gray-200 border-[#55555555]' : 'bg-dark-glassy hover:bg-[#333] border-transparent text-gray-300'}`}
                            >
                                Submitted
                            </button>
                            <button
                                onClick={() => setFilter('Graded')}
                                className={`px-3 py-1.5 text-xs border-[0.75px] rounded-md transition-all duration-300 ${filter === 'Graded' ? 'bg-[#1c1c1c] text-gray-200  border-[#55555555]' : 'bg-dark-glassy hover:bg-[#333] border-transparent text-gray-300'}`}
                            >
                                Graded
                            </button>
                        </div>
                    </div>

                    {/* Assessments List */}
                    <div className="grid grid-cols-2 gap-4">
                        {loadingAssessments ? (
                            <div className="text-center py-8 ">
                                <p className="text-gray-400">Loading assessments...</p>
                            </div>
                        ) : filteredAssessments().length > 0 ? (
                            filteredAssessments().map((assessment) => (
                                <div
                                    key={assessment.assessment_id}
                                    className={`bg-dark-glassy rounded-xl p-4 py-4 border ${isOverdue(assessment) ? 'border-red-900/50' : 'border-[#55555555]'} hover:border-[#555555] transition-all duration-300`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${isOverdue(assessment) ? 'bg-red-500' : isGraded(assessment.assessment_id) ? 'bg-green-500' : isSubmitted(assessment.assessment_id) ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                                            <div>
                                                <h3 className="text-base font-medium text-gray-200">
                                                    {assessment.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 mt-1">{assessment.description || 'No description provided'}</p>
                                            </div>
                                        </div>
                                        {getTypeBadge(assessment.assessment_type)}
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                                        <div className="bg-[#1c1c1c] border-[0.75px] border-[#55555555] p-2 rounded-lg">
                                            <p className="text-gray-400">Due Date</p>
                                            <p className={`font-medium ${isOverdue(assessment) ? 'text-red-400' : 'text-gray-200'}`}>
                                                {new Date(assessment.assessment_date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="bg-[#1c1c1c] border-[0.75px] border-[#55555555] p-2 rounded-lg">
                                            <p className="text-gray-400">Total Marks</p>
                                            <p className="font-medium text-gray-200">{assessment.total_marks}</p>
                                        </div>
                                        <div className="bg-[#1c1c1c] border-[0.75px] border-[#55555555] p-2 rounded-lg">
                                            <p className="text-gray-400">Weightage</p>
                                            <p className="font-medium text-gray-200">{assessment.weightage || 'N/A'}%</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-between items-center">
                                        <div>
                                            {getStatusBadge(assessment)}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => !isOverdue(assessment) && handleSubmitAssignment(assessment)}
                                                disabled={isOverdue(assessment) || isSubmitted(assessment.assessment_id) || loadingAssessments}
                                                className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 ${(isOverdue(assessment) || isSubmitted(assessment.assessment_id) || isGraded(assessment.assessment_id))
                                                    ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                                                    : 'bg-dark-glassy hover:bg-[#333] text-gray-200 border border-[#555] hover:border-[#c0c0c0]'
                                                    } ${loadingAssessments ? 'cursor-not-allowed' : ''
                                                    } ${isOverdue(assessment)
                                                        ? 'bg-red-900/30 text-red-400'
                                                        : isGraded(assessment.assessment_id)
                                                            ? 'bg-green-900/30 text-green-400'
                                                            : isSubmitted(assessment.assessment_id)
                                                                ? 'bg-blue-900/30 text-blue-400'
                                                                : 'bg-yellow-900/30 text-yellow-400'
                                                    }`}
                                            >
                                                {isSubmitted(assessment.assessment_id) ? (
                                                    'Submitted'
                                                ) : isOverdue(assessment) ? (
                                                    'Overdue'
                                                ) : isGraded(assessment.assessment_id) ? (
                                                    'Graded'
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        Submit
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 bg-[#1c1c1c] rounded-xl border border-dashed border-[#333]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-300">No assessments found</h3>
                                <p className="mt-1 text-xs text-gray-500 max-w-md mx-auto">
                                    {filter === 'All'
                                        ? "There are currently no assessments for this course."
                                        : filter === 'Submitted'
                                            ? "You haven't submitted any assessments for this course yet."
                                            : "No assessments have been graded yet."
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default StudentAssessments;