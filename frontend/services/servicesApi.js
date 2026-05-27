import { API_BASE_URL } from './config.js';
import { sha256 } from 'js-sha256';

//tested
export const testConnection = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/test`);
        return await response.json();
    } catch (error) {
        console.error('Error testing connection:', error);
        throw error;
    }
};

export const getFacultyAssignments = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/faculty/assignments`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching faculty assignments:', error);
        throw error;
    }
};

//tested
export const login = async (user_id, password_hash) => {
    try {
        // Hash the password using SHA-256
        const hashedPassword = sha256(password_hash);
        console.log('Hashed Password:', hashedPassword);
        // Send the hashed password to the server
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id, password_hash: password_hash })
        });
        console.log('Response:', response);
        if (!response.ok) {
            // Handle HTTP errors first
            const text = await response.text();
            throw new Error(text || 'Login failed');
        }

        return await response.json();
    } catch (err) {
        console.error('API Error:', err);
        throw err; // Re-throw for handling in component
    }
};

//tested
export const getUserDetails = async (requestor_id, target_id) => {
    try {
        // Send the request to the server
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestor_id, target_id })
        });

        if (!response.ok) {
            // Handle HTTP errors first
            const text = await response.text();
            throw new Error(text || 'Failed to retrieve user details');
        }

        return await response.json();
    } catch (err) {
        console.error('API Error:', err);
        throw err; // Re-throw for handling in component
    }
};

//tested
export const signup = async (userData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        return data;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
};

// Profile Services
export const updateProfile = async (userData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/updateProfile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating student profile:', error);
        throw error;
    }
};


export const updateAdminProfile = async (userData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/updateProfile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating admin profile:', error);
        throw error;
    }
};

//tested
export const getStudentCourses = async (studentId, filter) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/courses/student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId, filter: filter }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Error fetching student courses:', data.error);
            return []; // Return empty array on error too
        }

        // If the data is empty, return empty array
        if (!data || (Array.isArray(data) && data.length === 0)) {
            return [];
        }

        return data;
    } catch (error) {
        console.error("Error fetching student courses:", error);
        return []; // Even on network error, return empty array
    }
};

//tested
export const studentEnroll = async (enrollmentData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/courses/enroll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enrollmentData),
        });

        if (!response.ok) {
            // Log the response if it's not OK
            console.error('Failed to enroll, status:', response.status);
            const text = await response.text(); // Get the raw response
            console.error('Response text:', text);
            throw new Error(`Error enrolling: ${response.statusText}`);
        }

        const result = await response.text(); // Get raw response first
        if (result) {
            return JSON.parse(result); // Only parse if there is content
        } else {
            return {}; // Or return a default object if no content
        }
    } catch (error) {
        console.error('Error enrolling student:', error);
        throw error;
    }
};

//tested
export const studentDrop = async ({ student_id, course_code }) => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/courses/student/drop-course`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id, course_code }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            const errorMessage = errorText.includes('JSON')
                ? (JSON.parse(errorText).error || 'Failed to drop course')
                : 'Failed to drop course';
            throw new Error(errorMessage);
        }

        return await res.json();
    } catch (err) {
        console.error('Drop course error:', err.message);
        throw err;
    }
};


export const adminEnrollStudent = async (enrollmentData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/enroll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enrollmentData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error enrolling student (admin):', error);
        throw error;
    }
};

//tested
export const getAllCourses = async (adminId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/courses/all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestor_id: adminId }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error getting all courses:', error);
        throw error;
    }
};

//tested
export const getFacultyCourses = async (facultyId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/courses/faculty`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ faculty_id: facultyId }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error getting faculty courses:', error);
        throw error;
    }
};

//tested
export const updateCourseInfo = async (courseData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/course/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating course info:', error);
        throw error;
    }
};

//tested
export const createCourse = async (newCourse) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/course/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse)
    });

    if (!response.ok) {
        throw new Error('Failed to create course');
    }

    return response.json(); // Return the created course details
};

// Timetable Services
export const getTimetableByCourse = async (courseCode) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/timetable/by_course`
            , {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course_code: courseCode }),
            }
        );
        return await response.json();
    } catch (error) {
        console.error('Error getting timetable:', error);
        throw error;
    }
};

export const upsertTimetableSession = async (sessionData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/timetable/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error upserting timetable session:', error);
        throw error;
    }
};

export const deleteTimetableSession = async (sessionId, adminId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/timetable/delete_session`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, admin_id: adminId }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting timetable session:', error);
        throw error;
    }
};

//tested
export const getAssessmentsByCourse = async (courseCode) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/assessments/course`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_code: courseCode }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error getting assignments:', error);
        throw error;
    }
};

//tested
export const fetchAssessmentsByStudent = async (studentID, courseCode, gradedBit = 0) => {
    try {
        console.log('Fetching assessments with:', { studentID, courseCode, gradedBit });
        const response = await fetch(`${API_BASE_URL}/api/assessments/submissions/student`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                student_id: studentID,
                course_code: courseCode,
                graded: gradedBit
            }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const res = await response.json();
        console.log('Fetched assessments:', res.data);
        return res.data;
    } catch (error) {
        console.error('Error fetching assessments:', error);
        throw error;
    }
};

//tested
export const getAssessmentSubmissions = async (courseCode, graded = false) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/assessments/submissions`, {

            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_code: courseCode, graded: graded === false || graded === 0 ? 0 : 1 }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch submissions');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching assessment submissions:', error);
        throw error;
    }
};

//tested
export const deleteAssessment = async (assignmentData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/assessments/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignmentData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting assignment:', error);
        throw error;
    }
};

//tested
export const setUpdateAssessment = async (assignmentData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/assessments/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignmentData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error setting/updating assignment:', error);
        throw error;
    }
};

//tested
export const submitAssessment = async (submissionData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/assessments/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
        });

        const result = await response.json();
        console.log('Submit Response:', result);

        if (response.status === 200) {
            console.log('Submission successful');
        } else {
            console.log('Submission failed');
        }

        return result;
    } catch (error) {
        console.error('Error submitting assignment:', error);
        throw error;
    }
};

//tested
export const gradeAssessment = async (gradingData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/assessments/grade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gradingData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error grading assignment:', error);
        throw error;
    }
};

//tested
export const insertCourseMaterial = async (materialData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/materials/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(materialData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error inserting course material:', error);
        throw error;
    }
};

//tested
export const updateCourseMaterial = async (materialId, materialData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/materials/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ material_id: materialId, ...materialData }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating course material:', error);
        throw error;
    }
};

//tested
export const deleteCourseMaterial = async (materialId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/materials/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ material_id: materialId }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting course material:', error);
        throw error;
    }
};

//tested
export const getCourseMaterialByCourseId = async (course_code) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/materials/course`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_code }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch materials');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error getting course material for ${course_code}:`, error);
        throw error;
    }
};

//tested
export const insertUploadRequest = async (requestData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/materials/upload-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error inserting upload request:', error);
        throw error;
    }
};

//tested
export const updateUploadRequestStatus = async (requestId, status, faculty_id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/materials/upload-requests/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_id: requestId, status: status, faculty_id: faculty_id }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating upload request status:', error);
        throw error;
    }
};

//tested
export const deleteUploadRequest = async (requestId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/materials/upload-requests/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_id: requestId })
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting upload request:', error);
        throw error;
    }
};

//tested
export const getUploadRequestsByCourseId = async (course_code, student_id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/materials/upload-requests/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_code, student_id }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : []; // fallback to []
    } catch (error) {
        console.error('Error getting upload requests:', error);
        return []; // gracefully return empty list
    }
};

//tested
export const getCourseStudents = async (courseCode, filter) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/course/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_code: courseCode, filter: filter }),
        });
        return await response.json();
    } catch (error) {
        console.error("Error fetching student courses:", error);
        throw error;
    }
};

//tested
export const updateAttendance = async (attendanceData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/attendance/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceData),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error('Failed to update attendance');
        }
        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err);
    }
}

//tested
export const getAttendanceByDate = async (courseCode, facultyId, date) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/attendance/by-date`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_code: courseCode, faculty_id: facultyId, date: date }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error('Failed to fetch attendance records');
        }
        return await response.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}

//tested
export const getAttendanceByCourse = async (courseCode, studentId, section) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/attendance/by-course`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_code: courseCode, student_id: studentId, section: section }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error('Failed to fetch attendance records');
        }
        return await response.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
}

//---------------------------------------------------------------------------------------------------------------------------------------------------
//tested
export const insertSystemConfig = async (configData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/system/configurations/insert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error inserting system configuration:', error);
        throw error;
    }
};

//tested
export const updateSystemConfig = async (configData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/system/configurations/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating system configuration:', error);
        throw error;
    }
};

//tested
export const deleteSystemConfig = async (configKey, requestorId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/system/configurations/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config_key: configKey , requestor_id: requestorId }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting system configuration:', error);
        throw error;
    }
};

//tested
export const getSystemConfigs = async (requestorId, config_key) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/system/configurations`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestor_id: requestorId, config_key: config_key }),
            }
        );
        return await response.json();
    } catch (error) {
        console.error('Error getting system configurations:', error);
        throw error;
    }
};

//tested
export const getFees= async (requestorId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/fees`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestor_id: requestorId }),
            }
        );
        return await response.json();
    } catch (error) {
        console.error('Error getting system configurations:', error);
        throw error;
    }
};

//tested
export const UpsertFees = async (feeData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/fees/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feeData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to upsert fee challan');
        }

        return await response.json(); // Return the updated or inserted fee challan
    } catch (error) {
        console.error('Error upserting fee challan:', error);
        throw error;
    }
};

// Rooms Services
export const insertRoom = async (roomData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/insert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error inserting room:', error);
        throw error;
    }
};

export const updateRoom = async (roomData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating room:', error);
        throw error;
    }
};

export const deleteRoom = async (roomid, requestorId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: roomid, requestor_id: requestorId }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting room:', error);
        throw error;
    }
};

export const getAllRooms = async (requestorId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/rooms`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestor_id: requestorId }),
            }
        );
        return await response.json();
    } catch (error) {
        console.error('Error getting rooms:', error);
        throw error;
    }
};

// Slots Services
export const insertSlot = async (slotData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/slots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slotData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error inserting slot:', error);
        throw error;
    }
};

export const updateSlot = async (slotData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/slots/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slotData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating slot:', error);
        throw error;
    }
};

export const deleteSlot = async (slotId, requestorId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/slots/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slot_id: slotId, requestor_id: requestorId }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting slot:', error);
        throw error;
    }
};

export const getAllSlots = async (requestorId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/slots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestor_id: requestorId }),
        }
        );
        return await response.json();
    } catch (error) {
        console.error('Error getting slots:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/logout`, {
            method: 'POST',
            credentials: 'include', // Include cookies if used
        });

        if (response.ok) {
            localStorage.removeItem('currentUser'); // Clear user data from local storage
            window.location.href = '/login'; // Redirect to login page
        } else {
            console.error('Failed to log out');
        }
    } catch (err) {
        console.error('Error during logout:', err);
    }
};


export const createLeaveRequest = async (requestData) => {
    try {
        // Ensure required fields are present and valid
        if (!requestData.student_id || typeof requestData.student_id !== 'string') {
            throw new Error('Invalid student ID');
        }

        const response = await fetch(`${API_BASE_URL}/api/leave-requests/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: requestData.student_id,
                course_id: requestData.course_code,  // Note the parameter name change
                request_date: requestData.request_date,
                leave_reason: requestData.leave_reason,
                faculty_id: requestData.faculty_id || '',  // Ensure empty string if null/undefined
                section: requestData.section || null      // Ensure null if undefined
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to create leave request');
        }
        return await response.json();
    } catch (err) {
        console.error('Error in createLeaveRequest:', err);
        throw err;
    }
}
export const processLeaveRequest = async (requestId, facultyId, newStatus, responseMessage = '') => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/leave-requests/process/${requestId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                faculty_id: facultyId,
                new_status: newStatus,
                response_message: responseMessage
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to process leave request');
        }
        return await response.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const getFacultyLeaveRequests = async (facultyId, status = null) => {
    try {
        const url = new URL(`${API_BASE_URL}/api/leave-requests/faculty/${facultyId}`);
        if (status) url.searchParams.append('status', status);

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch faculty leave requests');
        }
        return await response.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const getStudentLeaveRequests = async (studentId, status = null) => {
    try {
        const url = new URL(`${API_BASE_URL}/api/leave-requests/student/${studentId}`);
        if (status) url.searchParams.append('status', status);

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch student leave requests');
        }
        return await response.json();
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const createFacultyCourseAssignment = async (assignmentData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/faculty-course-assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                faculty_id: assignmentData.facultyId,
                course_code: assignmentData.courseCode,
                section: assignmentData.section
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to create faculty course assignment');
        }
        return await response.json();
    } catch (err) {
        console.error('Error in createFacultyCourseAssignment:', err);
        throw err;
    }
};