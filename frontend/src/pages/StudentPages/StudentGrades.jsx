import React, { useState, useEffect } from 'react';
import { getStudentCourses, fetchAssessmentsByStudent } from '../../../services/servicesApi';
import CourseButton from '../../Components/CourseButton';

const StudentGrades = () => {
    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [gradedAssessments, setGradedAssessments] = useState([]);
    const [expandedSection, setExpandedSection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            setError('Failed to load courses');
            console.error('Error fetching courses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCourseSelect = async (courseCode) => {
        const course = courses.find((c) => c.course_code === courseCode);
        setSelectedCourse(course);
        setLoading(true);
        try {
            const gradedRes = await fetchAssessmentsByStudent(user.user_id, course.course_code, 1); // Fetch graded assessments
            setGradedAssessments(gradedRes || []);
        } catch (err) {
            setError('Failed to load graded assessments');
            console.error('Error fetching graded assessments:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section) => {
        setExpandedSection((prev) => (prev === section ? null : section));
    };

    const renderTable = (section) => {
        const sectionAssessments = gradedAssessments.filter(
            (assessment) => assessment.assessment_type.toLowerCase() === section.toLowerCase()
        );

        if (sectionAssessments.length === 0) return null;

        const totalWeightage = sectionAssessments.reduce((sum, a) => sum + (a.weightage || 0), 0);
        const totalObtainedWeightage = sectionAssessments.reduce(
            (sum, a) => sum + ((a.marks_obtained / a.total_marks) * a.weightage || 0),
            0
        );

        return (
            <div className="mb-4">
                <button
                    onClick={() => toggleSection(section)}
                    className="w-full text-left bg-[#282828] p-4 rounded-lg border border-[#55555555] hover:bg-[#444444] transition-all duration-300"
                >
                    <h3 className="text-lg font-semibold text-gray-100">{section}</h3>
                </button>
                <div
                    className={`overflow-hidden transition-all duration-500 ${expandedSection === section ? 'max-h-screen' : 'max-h-0'
                        }`}
                >
                    {expandedSection === section && (
                        <div className="mt-2 bg-[#282828] rounded-lg p-4 border border-[#55555555]">
                            <table className="w-full text-sm text-left text-gray-400 rounded-lg overflow-hidden">
                                <thead className="text-xs uppercase bg-[#1c1c1c] text-gray-300">
                                    <tr>
                                        <th className="px-4 py-2 border-r border-[#55555555]">#</th>
                                        <th className="px-4 py-2 border-r border-[#55555555]">Title</th>
                                        <th className="px-4 py-2 border-r border-[#55555555]">Obtained Marks</th>
                                        <th className="px-4 py-2 border-r border-[#55555555]">Total Marks</th>
                                        <th className="px-4 py-2 border-r border-[#55555555]">Weightage</th>
                                        <th className="px-4 py-2">Percentage Obtained</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sectionAssessments.map((assessment, index) => (
                                        <tr
                                            key={assessment.assessment_id}
                                            className="border-b border-[#55555555] hover:bg-[#333]"
                                        >
                                            <td className="px-4 py-2 border-r border-[#55555555]">{index + 1}</td>
                                            <td className="px-4 py-2 border-r border-[#55555555]">{assessment.title}</td>
                                            <td className="px-4 py-2 border-r border-[#55555555]">{assessment.marks_obtained}</td>
                                            <td className="px-4 py-2 border-r border-[#55555555]">{assessment.total_marks}</td>
                                            <td className="px-4 py-2 border-r border-[#55555555]">{assessment.weightage}%</td>
                                            <td className="px-4 py-2">
                                                {((assessment.marks_obtained / assessment.total_marks) * 100).toFixed(2)}%
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="font-semibold bg-[#1c1c1c]">
                                        <td className="px-4 py-2 border-r border-[#55555555]" colSpan="4">
                                            Total
                                        </td>
                                        <td className="px-4 py-2 border-r border-[#55555555]">{totalWeightage}%</td>
                                        <td className="px-4 py-2">{totalObtainedWeightage.toFixed(2)}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderFinalTotal = () => {
        const totalWeightage = gradedAssessments.reduce((sum, a) => sum + (a.weightage || 0), 0);
        const totalObtainedWeightage = gradedAssessments.reduce(
            (sum, a) => sum + ((a.marks_obtained / a.total_marks) * a.weightage || 0),
            0
        );

        return (
            <div className="bg-[#282828] rounded-lg p-2 border border-[#55555555]">
                <h3 className="text-lg font-semibold text-gray-200 mb-4 pb-2 border-b-[0.75px] border-[#55555555]">Summary</h3>
                <div className="flex justify-between mt-2">
                    <span className="text-gray-400">Course Name:</span>
                    <span className="text-gray-200">{selectedCourse.course_name}</span>
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-gray-400">Credits:</span>
                    <span className="text-gray-200">{selectedCourse.credit_hours}</span>
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-gray-200">{selectedCourse.is_core ? 'Core' : 'Elective'}</span>
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-gray-400">Total Weightage:</span>
                    <span className="text-gray-200">{totalWeightage}%</span>
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-gray-400">Obtained Weightage:</span>
                    <span className="text-gray-200">{totalObtainedWeightage.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-gray-400">Tentative Grade:</span>
                    <span className="text-gray-200">
                        {totalObtainedWeightage >= 85
                            ? 'A'
                            : totalObtainedWeightage >= 70
                                ? 'B'
                                : totalObtainedWeightage >= 50
                                    ? 'C'
                                    : 'F'}
                    </span>
                </div>
            </div>
        );
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
            {/* Top Header */}
            <div className="bg-[#282828] border-[0.75px] border-[#55555555] rounded-xl p-4 mb-6">
                <h1 className="text-3xl font-bold text-dark-accent-light mb-4">My Grades</h1>
                <p className="text-gray-500">View your grades for each course and assessment type.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Block: Course Selection */}
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
                                    isSelected={selectedCourse?.course_code === course.course_code}
                                    onClick={handleCourseSelect}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Middle Block: Grades Section */}
                <div className="col-span-2">
                    {selectedCourse ? (
                        <div>
                            {gradedAssessments.length > 0 ? (
                                ['Quiz', 'Assignment', 'Project', 'Exam'].map((section) => renderTable(section))
                            ) : (
                                <div className="border-2 border-dotted border-gray-500 rounded-lg p-6 text-center text-gray-400">
                                    No assessments marked yet.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-gray-400 text-center">Select a course to view grades.</div>
                    )}
                </div>

                {/* Right Block: Summary */}
                <div className="col-span-1 space-y-6">
                    {selectedCourse && renderFinalTotal()}
                </div>
            </div>
        </div>
    );
};

export default StudentGrades;