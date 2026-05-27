const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');
const sql = require('mssql');
const config = require('../dbconfig');

// Helper function for executing stored procedures
async function executeSP(procName, params = []) {
    try {
        const pool = await poolPromise;
        const request = pool.request();
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });
        return await request.execute(procName);
    } catch (error) {
        console.error(`Error executing ${procName}:`, error);
        throw error;
    }
}

router.get('/faculty/assignments', async (req, res) => {
    try {
        // Fetch all faculty members
        const facultyQuery = `
            SELECT user_id AS faculty_id, name AS faculty_name
            FROM Users
            WHERE user_type = 'faculty';
        `;
        const facultyResult = await poolPromise;
        const faculty = await facultyResult.request().query(facultyQuery);

        // Fetch faculty-course assignments
        const assignmentsQuery = `
            SELECT 
                fca.faculty_id,
                fca.course_code,
                fca.section,
                c.course_name
            FROM Faculty_Course_Assignment fca
            INNER JOIN Courses c ON fca.course_code = c.course_code;
        `;
        const assignmentsResult = await poolPromise;
        const assignments = await assignmentsResult.request().query(assignmentsQuery);

        // Combine faculty and their assignments
        const result = faculty.recordset.map((facultyMember) => {
            const assignedCourses = assignments.recordset.filter(
                (assignment) => assignment.faculty_id === facultyMember.faculty_id
            );
            return {
                ...facultyMember,
                assignedCourses,
            };
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching faculty assignments:', error);
        res.status(500).json({ error: 'Failed to fetch faculty assignments' });
    }
});

//tested
router.post('/login', async (req, res) => {
    const { user_id, password_hash } = req.body; // Receive pre-hashed password

    try {
        const result = await executeSP('sp_Login', [
            { name: 'user_id', type: sql.VarChar, value: user_id },
            { name: 'password_hash', type: sql.VarChar, value: password_hash }
        ]);

        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.json({
            success: true,
            user: result.recordset[0]
        });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Login error' });
    }
});

//tested
router.post('/profile', async (req, res) => {
    const { requestor_id, target_id } = req.body;

    try {
        const result = await executeSP('sp_GetUserDetails', [
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id },
            { name: 'target_id', type: sql.VarChar, value: target_id }
        ]);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: result.recordset[0]
        });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Error retrieving user details' });
    }
});

//tested
router.post('/signup', async (req, res) => {
    const { user_id, name, email, password, user_type, department, semester, section } = req.body;
    console.log('Signup payload:', req.body);

    try {
        // Basic validation
        if (!user_id || !name || !email || !password || !user_type || !department) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Student-specific validation
        if (user_type === 'student' && (!semester || !section)) {
            return res.status(400).json({
                success: false,
                message: 'Students require semester and section'
            });
        }

        // Prepare parameters for stored procedure
        const params = [
            { name: 'user_id', type: sql.VarChar, value: user_id },
            { name: 'name', type: sql.VarChar, value: name },
            { name: 'email', type: sql.VarChar, value: email },
            { name: 'password_hash', type: sql.VarChar, value: password }, // Frontend should pre-hash
            { name: 'user_type', type: sql.VarChar, value: user_type },
            { name: 'department', type: sql.VarChar, value: department },
            ...(user_type === 'student' ? [
                { name: 'semester', type: sql.Int, value: semester },
                { name: 'section', type: sql.VarChar, value: section }
            ] : [])
        ];

        // Execute stored procedure
        const result = await executeSP('sp_CreateUser', params);

        // Handle procedure return codes
        switch (result.returnValue) {
            case -1:
                return res.status(409).json({
                    success: false,
                    message: 'User already exists'
                });
            case -2:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user type'
                });
            case -3:
                return res.status(400).json({
                    success: false,
                    message: 'Missing student information'
                });
        }

        // Success response
        return res.status(201).json({
            success: true,
            user_id,
            user_type,
            message: 'Registration successful'
        });

    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({
            success: false,
            message: 'Registration failed',
            ...(process.env.NODE_ENV === 'development' && {
                error: err.message,
                stack: err.stack
            })
        });
    }
});

//tested
router.get('/test', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT DB_NAME() AS CurrentDB');
        res.json({ msg: '✅ Connected to DB!', dbName: result.recordset[0].CurrentDB });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '❌ Failed to connect to DB', error: err.message });
    }
});

//tested
router.post('/updateProfile', async (req, res) => {
    const { requestor_id, user_id, new_email, new_password } = req.body;

    try {
        await executeSP('sp_UpdateUserSelf', [
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id },
            { name: 'user_id', type: sql.VarChar, value: user_id },
            { name: 'new_email', type: sql.VarChar, value: new_email },
            { name: 'new_password', type: sql.VarChar, value: new_password }
        ]);
        res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post('/admin/updateProfile', async (req, res) => {
    const { requestor_id, user_id, new_email, new_password, new_semester, new_gpa, new_section } = req.body;

    try {
        await executeSP('sp_UpdateUserSelf', [
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id },
            { name: 'user_id', type: sql.VarChar, value: user_id },
            { name: 'new_email', type: sql.VarChar, value: new_email },
            { name: 'new_password', type: sql.VarChar, value: new_password },
            { name: 'new_semester', type: sql.Int, value: new_semester },
            { name: 'new_gpa', type: sql.Decimal(3, 2), value: new_gpa },
            { name: 'new_section', type: sql.VarChar, value: new_section }
        ]);
        res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/courses/enroll', async (req, res) => {

    const { student_id, course_code, section } = req.body;

    try {
        const result = await executeSP('sp_EnrollStudent', [
            { name: 'student_id', type: sql.VarChar, value: student_id },
            { name: 'course_code', type: sql.VarChar, value: course_code },
            { name: 'section', type: sql.VarChar, value: section }
        ]);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/courses/all', async (req, res) => {
    const { requestor_id } = req.body;

    try {
        const result = await executeSP('sp_ViewAllCourses', [
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id }
        ]);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/courses/student', async (req, res) => {
    const { student_id, filter } = req.body;

    if (!student_id || !['all', 'enrolled', 'available'].includes(filter)) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
        const result = await executeSP('sp_GetStudentCourses', [
            { name: 'student_id', type: sql.VarChar, value: student_id },
            { name: 'filter', type: sql.VarChar, value: filter }
        ]);

        // Always return an array, even if it's empty
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Error executing stored procedure:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


//tested
router.post('/courses/student/drop-course', async (req, res) => {
    const { student_id, course_code } = req.body;

    if (!student_id || !course_code) {
        return res.status(400).json({ error: 'Missing student_id or course_code' });
    }

    try {
        await executeSP('sp_DropStudentCourse', [
            { name: 'student_id', type: sql.VarChar(20), value: student_id },
            { name: 'course_code', type: sql.VarChar(20), value: course_code }
        ]);

        res.json({ message: 'Course dropped successfully' });
    } catch (err) {
        console.error('Failed to drop course:', err);
        res.status(500).json({ error: err.message || 'Failed to drop course' });
    }
});

//tested
router.post('/courses/faculty', async (req, res) => {
    const { faculty_id } = req.body;

    try {
        const result = await executeSP('sp_ViewFacultyCourses', [
            { name: 'faculty_id', type: sql.VarChar, value: faculty_id }
        ]);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/admin/enroll', async (req, res) => {
    const { admin_id, student_id, course_code, section } = req.body;

    try {
        const result = await executeSP('sp_AdminEnrollStudent', [
            { name: 'admin_id', type: sql.VarChar, value: admin_id },
            { name: 'student_id', type: sql.VarChar, value: student_id },
            { name: 'course_code', type: sql.VarChar, value: course_code },
            { name: 'section', type: sql.VarChar, value: section }
        ]);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/admin/course/update', async (req, res) => {
    const { admin_id, course_code, new_course_name, new_department, new_max_enrolled, new_credit_hours, new_core_or_elective, new_semester } = req.body;

    try {
        const result = await executeSP('sp_UpdateCourse', [
            { name: 'admin_id', type: sql.VarChar, value: admin_id },
            { name: 'course_code', type: sql.VarChar, value: course_code },
            { name: 'new_course_name', type: sql.VarChar, value: new_course_name },
            { name: 'new_department', type: sql.VarChar, value: new_department },
            { name: 'new_max_enrolled', type: sql.Int, value: new_max_enrolled },
            { name: 'new_credit_hours', type: sql.Int, value: new_credit_hours },
            { name: 'new_core_or_elective', type: sql.VarChar, value: new_core_or_elective },
            { name: 'new_semester', type: sql.Int, value: new_semester }
        ]);

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({ message: 'No data returned from stored procedure' });
        }

        res.json(result.recordset[0]); // Return the updated course details
    } catch (err) {
        console.error('Error executing sp_UpdateCourse:', err);
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/admin/course/create', async (req, res) => {
    const { admin_id, course_code, course_name, department, max_enrolled, current_enrolled, credit_hours, core_or_elective, semester } = req.body;

    try {
        const result = await executeSP('sp_CreateCourse', [
            { name: 'admin_id', type: sql.VarChar, value: admin_id },
            { name: 'course_code', type: sql.VarChar, value: course_code },
            { name: 'course_name', type: sql.VarChar, value: course_name },
            { name: 'department', type: sql.VarChar, value: department },
            { name: 'max_enrolled', type: sql.Int, value: max_enrolled },
            { name: 'current_enrolled', type: sql.Int, value: current_enrolled },
            { name: 'credit_hours', type: sql.Int, value: credit_hours },
            { name: 'core_or_elective', type: sql.VarChar, value: core_or_elective },
            { name: 'semester', type: sql.Int, value: semester }
        ]);

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(400).json({ message: 'Failed to create course' });
        }

        res.status(201).json({ message: 'Course created successfully', course: result.recordset[0] });
    } catch (err) {
        console.error('Error creating course:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/timetable/by_course', async (req, res) => {
    const { course_code } = req.body;

    try {
        const result = await executeSP('GetTimeTableByCourseCode', [
            { name: 'course_code', type: sql.VarChar, value: course_code }
        ]);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/timetable/upsert', async (req, res) => {
    const { session_id, course_code, faculty_id, section, day_of_week, start_time, end_time, room_number, department, admin_id } = req.body;

    try {
        await executeSP('UpsertTimeTableSession', [
            { name: 'session_id', type: sql.Int, value: session_id },
            { name: 'course_code', type: sql.VarChar, value: course_code },
            { name: 'faculty_id', type: sql.VarChar, value: faculty_id },
            { name: 'section', type: sql.VarChar, value: section },
            { name: 'day_of_week', type: sql.VarChar, value: day_of_week },
            { name: 'start_time', type: sql.Time, value: start_time },
            { name: 'end_time', type: sql.Time, value: end_time },
            { name: 'room_number', type: sql.VarChar, value: room_number },
            { name: 'department', type: sql.VarChar, value: department },
            { name: 'admin_id', type: sql.VarChar, value: admin_id }
        ]);
        res.json({ message: '✅ Session inserted/updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/timetable/delete_session', async (req, res) => {

    const { admin_id, session_id } = req.body;

    try {
        await executeSP('DeleteTimeTableSession', [
            { name: 'session_id', type: sql.Int, value: session_id },
            { name: 'admin_id', type: sql.VarChar, value: admin_id }
        ]);
        res.json({ message: '✅ Session deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/assessments/course', async (req, res) => {
    const { course_code } = req.body;

    try {
        const result = await executeSP('GetAssessmentsByCourse', [
            { name: 'course_code', type: sql.VarChar(20), value: course_code }
        ]);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/assessments/submissions/student', async (req, res) => {
    try {
        const { student_id: student_id, course_code: course_code, graded: graded } = req.body;
        const params = [
            { name: 'student_id', type: sql.VarChar(20), value: String(student_id) },
            { name: 'course_code', type: sql.VarChar(20), value: String(course_code) },
            { name: 'graded', type: sql.Bit, value: graded === true || graded === 1 ? 1 : 0 }
        ];
        const result = await executeSP('GetAssessmentsByCourseStudent', params);
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        console.error('Error fetching graded assignments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch graded assignments'
        });
    }
});

//tested
router.post('/assessments/submissions', async (req, res) => {
    const { course_code, graded } = req.body;

    try {
        const result = await executeSP('GetAssessmentSubmissionsByCourse', [
            { name: 'course_code', type: sql.VarChar(20), value: course_code },
            { name: 'graded', type: sql.Bit, value: graded }
        ]);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching assessment submissions:', err);
        res.status(500).json({ error: err.message });
    }
});

//tested
router.delete('/assessments/delete', async (req, res) => {
    const { assessment_id, course_code } = req.body;

    try {
        await executeSP('DeleteAssessments', [
            { name: 'assessment_id', type: sql.Int, value: assessment_id },
            { name: 'course_code', type: sql.VarChar(20), value: course_code }
        ]);
        res.json({ message: 'Assignment deleted successfully.' });
    } catch (err) {
        console.error('Error deleting assessment:', err);
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/assessments/update', async (req, res) => {
    const { assessment_id, course_code, assessment_type, title, total_marks, weightage, assessment_date } = req.body;

    try {
        await executeSP('Set_Update_Assessment', [
            { name: 'assessment_id', type: sql.Int, value: assessment_id || null },
            { name: 'course_code', type: sql.VarChar(20), value: course_code },
            { name: 'assessment_type', type: sql.VarChar(20), value: assessment_type },
            { name: 'title', type: sql.VarChar(255), value: title },
            { name: 'total_marks', type: sql.Int, value: total_marks },
            { name: 'weightage', type: sql.Decimal(5, 2), value: weightage },
            { name: 'assessment_date', type: sql.DateTime, value: assessment_date }
        ]);
        res.json({ message: 'Assignment set/updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/assessments/submit', async (req, res) => {
    const { assessment_id, student_id, file_upload } = req.body;

    try {
        console.log('Received data:', req.body);
        await executeSP('Submit_Assessments', [
            { name: 'assessment_id', type: sql.Int, value: assessment_id },
            { name: 'student_id', type: sql.VarChar(20), value: student_id },
            { name: 'file_upload', type: sql.VarChar(255), value: file_upload }
        ]);
        res.status(200).json({ message: 'Assignment submitted successfully and faculty notified.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit assignment.' });
    }
});

//tested
router.post('/assessments/grade', async (req, res) => {
    const { submission_id, marks_obtained, grader_id } = req.body;

    try {
        console.log('Received data:', req.body);

        await executeSP('Grade_Assignment', [
            { name: 'submission_id', type: sql.Int, value: submission_id },
            { name: 'marks_obtained', type: sql.Decimal(5, 2), value: marks_obtained },
            { name: 'grader_id', type: sql.VarChar(20), value: grader_id }
        ]);
        res.status(200).json({ message: 'Assignment graded and student notified.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to grade assignment.' });
    }
});

//tested
router.post('/materials/add', async (req, res) => {
    const { course_code, uploaded_by, file_name, file_path, file_size, category, section } = req.body;

    try {
        await executeSP('InsertCourseMaterial', [
            { name: 'course_code', type: sql.VarChar, value: course_code },
            { name: 'uploaded_by', type: sql.VarChar, value: uploaded_by },
            { name: 'file_name', type: sql.VarChar, value: file_name },
            { name: 'file_path', type: sql.VarChar, value: file_path },
            { name: 'file_size', type: sql.Int, value: file_size },
            { name: 'category', type: sql.VarChar, value: category },
            { name: 'section', type: sql.VarChar, value: section }
        ]);
        res.status(200).json({ message: 'Course material inserted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.put('/materials/update', async (req, res) => {

    const { material_id, file_name, file_path, file_size, category, section } = req.body;

    try {
        await executeSP('UpdateCourseMaterial', [
            { name: 'material_id', type: sql.Int, value: material_id },
            { name: 'file_name', type: sql.VarChar, value: file_name },
            { name: 'file_path', type: sql.VarChar, value: file_path },
            { name: 'file_size', type: sql.Int, value: file_size },
            { name: 'category', type: sql.VarChar, value: category },
            { name: 'section', type: sql.VarChar, value: section }
        ]);
        res.status(200).json({ message: 'Course material updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.delete('/materials/delete', async (req, res) => {
    const { material_id } = req.body;

    try {
        await executeSP('DeleteCourseMaterial', [
            { name: 'material_id', type: sql.Int, value: material_id }
        ]);
        res.status(200).json({ message: 'Course material deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/materials/course', async (req, res) => {
    const { course_code } = req.body;

    if (!course_code) {
        return res.status(400).json({ error: 'Course code is required' });  // Ensure course_code is in the body
    }

    try {
        const result = await executeSP('GetCourseMaterialByCourseId', [
            { name: 'course_code', type: sql.VarChar(20), value: course_code }
        ]);

        if (result.recordset.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(result.recordset);  // Respond with all materials found for the course
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/materials/upload-requests', async (req, res) => {
    const { student_id, course_code, file_name, file_path, file_size, status } = req.body;
    if (!student_id || !course_code || !file_name || !file_path || file_size <= 0 || !status) {
        return res.status(400).json({ error: 'All fields are required and file_size must be greater than 0' });
    }
    try {
        await executeSP('InsertStudentUploadRequest', [
            { name: 'student_id', type: sql.VarChar(20), value: student_id },
            { name: 'course_code', type: sql.VarChar(20), value: course_code },
            { name: 'file_name', type: sql.VarChar(255), value: file_name },
            { name: 'file_path', type: sql.VarChar(255), value: file_path },
            { name: 'file_size', type: sql.Int, value: file_size },
            { name: 'status', type: sql.VarChar(10), value: status }
        ]);
        res.status(200).json({ message: 'Student upload request inserted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/materials/upload-requests/update', async (req, res) => {
    const { status, request_id, faculty_id } = req.body;

    try {
        await executeSP('UpdateStudentUploadRequestStatus', [
            { name: 'request_id', type: sql.Int, value: request_id },
            { name: 'status', type: sql.VarChar(20), value: status },
            { name: 'faculty_id', type: sql.VarChar(20), value: faculty_id }
        ]);
        res.status(200).json({ message: 'Student upload request status updated.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.delete('/materials/upload-requests/delete', async (req, res) => {
    const { request_id } = req.body;

    try {
        await executeSP('DeleteStudentUploadRequest', [
            { name: 'request_id', type: sql.Int, value: request_id }
        ]);
        res.status(200).json({ message: 'Student upload request deleted.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/materials/upload-requests/courses', async (req, res) => {
    const { course_code, student_id } = req.body;
    try {
        const result = await executeSP('GetStudentUploadRequestByCourseId', [
            { name: 'course_code', type: sql.VarChar, value: course_code },
            { name: 'student_id', type: sql.VarChar, value: student_id }
        ]);
        if (!result.recordset || result.recordset.length === 0) {
            return res.status(200).json([]); // send an empty array instead of error
        }
        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//tested
router.post('/course/students', async (req, res) => {
    const { course_code, filter } = req.body;

    if (!course_code || !['all', 'active', 'dropped'].includes(filter)) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
        const result = await executeSP('getCourseStudents', [
            { name: 'course_code', type: sql.VarChar, value: course_code },
            { name: 'filter', type: sql.VarChar, value: filter }
        ]);

        if (result.recordset.length === 0 && filter !== 'all') {
            return res.status(404).json({ error: 'No courses found' });
        }

        res.json(result.recordset);
    } catch (err) {
        console.error('Error executing stored procedure:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//tested
router.post('/attendance/update', async (req, res) => {
    const { course_code, student_id, faculty_id, status, date, section } = req.body;

    try {
        const result = await executeSP('UpdateAttendance', [
            { name: 'course_code', type: sql.VarChar, value: course_code },
            { name: 'student_id', type: sql.VarChar, value: student_id },
            { name: 'faculty_id', type: sql.VarChar, value: faculty_id },
            { name: 'status', type: sql.VarChar, value: status },
            { name: 'date', type: sql.Date, value: date },
            { name: 'section', type: sql.VarChar, value: section }
        ]);
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'No attendance record found to update' });
        }
        res.status(200).json({ message: 'Attendance updated successfully' });
    } catch (error) {
        console.error("Error updating attendance:", error);
        res.status(500).json({ error: "Failed to update attendance" });
    }
});

//tested
router.post('/attendance/by-date', async (req, res) => {
    const { course_code, faculty_id, date } = req.body;

    try {
        const result = await executeSP('GetAttendanceByDate', [
            { name: 'course_code', type: sql.VarChar, value: course_code },
            { name: 'faculty_id', type: sql.VarChar, value: faculty_id },
            { name: 'date', type: sql.Date, value: date }
        ]);

        res.status(200).json(result.recordset || []);
    } catch (error) {
        console.error("Error fetching attendance by date:", error);
        res.status(500).json({ error: "Failed to fetch attendance records" });
    }
});

//tested
router.post('/attendance/by-course', async (req, res) => {
    const { course_code, student_id, section } = req.body;

    try {
        const result = await executeSP('GetStudentAttendanceByCourseAndSection', [
            { name: 'course_code', type: sql.VarChar, value: course_code },
            { name: 'student_id', type: sql.VarChar, value: student_id },
            { name: 'section', type: sql.VarChar, value: section }
        ]);

        res.status(200).json(result.recordset || []);
    } catch (error) {
        console.error("Error fetching attendance by course:", error);
        res.status(500).json({ error: "Failed to fetch attendance records" });
    }
});

//tested
router.post('/fees', async (req, res) => {
    const { requestor_id } = req.body;

    try {
        const result = await executeSP('GetFeeChallans', [
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id }
        ]);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//tested
router.post('/fees/upsert', async (req, res) => {
    const { fee_id, student_id, credit_hours, total_fee, due_date, payment_status, payment_date, transaction_id } = req.body;

    try {
        const result = await executeSP('UpdateFeeChallan', [
            { name: 'fee_id', type: sql.Int, value: fee_id },
            { name: 'student_id', type: sql.VarChar, value: student_id },
            { name: 'credit_hours', type: sql.Int, value: credit_hours },
            { name: 'total_fee', type: sql.Decimal(10, 2), value: total_fee },
            { name: 'due_date', type: sql.DateTime, value: due_date },
            { name: 'payment_status', type: sql.VarChar, value: payment_status },
            { name: 'payment_date', type: sql.DateTime, value: payment_date },
            { name: 'transaction_id', type: sql.Int, value: transaction_id }
        ]);

        if (result.recordset && result.recordset.length > 0) {
            res.status(200).json(result.recordset[0]); // Return the updated or inserted fee challan
        } else {
            res.status(404).json({ error: 'No fee challan found or updated' });
        }
    } catch (error) {
        console.error('Error updating fee challan:', error);
        res.status(500).json({ error: error.message });
    }
});

//--------------------------------------------------------------------------------------------------------------------------------
//tested
router.post('/system/configurations/insert', async (req, res) => {
    const { config_key, config_value, description, requestor_id } = req.body;

    try {
        const result = await executeSP('InsertSystemConfiguration', [
            { name: 'config_key', type: sql.VarChar, value: config_key },
            { name: 'config_value', type: sql.VarChar, value: config_value },
            { name: 'description', type: sql.VarChar, value: description },
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id }
        ]);

        res.status(200).json(result.recordset[0]); // Return the inserted configuration
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//tested
router.post('/system/configurations/update', async (req, res) => {
    const { config_key, config_value, description, requestor_id } = req.body;

    try {
        const result = await executeSP('UpdateSystemConfiguration', [
            { name: 'config_key', type: sql.VarChar, value: config_key },
            { name: 'config_value', type: sql.VarChar, value: config_value },
            { name: 'description', type: sql.VarChar, value: description },
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id }
        ]);

        res.status(200).json(result.recordset[0]); // Return the updated configuration
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//tested
router.delete('/system/configurations/delete', async (req, res) => {
    const { config_key, requestor_id } = req.body;

    try {
        const result = await executeSP('DeleteSystemConfiguration', [
            { name: 'config_key', type: sql.VarChar, value: config_key },
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id }
        ]);

        res.status(200).json(result.recordset[0]); // Return the deleted configuration
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//tested
router.post('/system/configurations', async (req, res) => {
    const { requestor_id, config_key } = req.body;

    try {
        const result = await executeSP('GetSystemConfigurations', [
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id },
            { name: 'config_key', type: sql.VarChar, value: config_key }
        ]);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//tested
router.post('/rooms/insert', async (req, res) => {
    const { room_number, capacity, room_type, requestor_id } = req.body;

    try {
        const result = await executeSP('InsertRoom', [
            { name: 'room_number', type: sql.VarChar, value: room_number },
            { name: 'capacity', type: sql.Int, value: capacity },
            { name: 'is_lab', type: sql.Bit, value: room_type },
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id }
        ]);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//tested
router.post('/rooms/update', async (req, res) => {
    const { room_id, room_number, capacity, room_type, requestor_id } = req.body;

    try {
        const result = await executeSP('UpdateRoom', [
            { name: 'room_id', type: sql.Int, value: room_id },
            { name: 'room_number', type: sql.VarChar, value: room_number },
            { name: 'capacity', type: sql.Int, value: capacity },
            { name: 'is_lab', type: sql.Bit, value: room_type },
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id }
        ]);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//tested
router.delete('/rooms/delete', async (req, res) => {
    const { room_id, requestor_id } = req.body;

    try {
        const result = await executeSP('DeleteRoom', [
            { name: 'room_id', type: sql.Int, value: room_id },
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id }
        ]);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//tested
router.post('/rooms', async (req, res) => {
    const { requestor_id } = req.query;

    try {
        const result = await executeSP('GetAllRooms', [
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id }
        ]);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//tested
router.post('/slots/insert', async (req, res) => {
    const { day_of_week, start_time, end_time, requestor_id } = req.body;

    try {
        const result = await executeSP('InsertTimeSlot', [
            { name: 'day_of_week', type: sql.VarChar, value: day_of_week },
            { name: 'start_time', type: sql.Time, value: start_time },
            { name: 'end_time', type: sql.Time, value: end_time },
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id }
        ]);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//tested
router.post('/slots/update', async (req, res) => {
    const { slot_id, day_of_week, start_time, end_time, requestor_id } = req.body;

    try {
        const result = await executeSP('UpdateTimeSlot', [
            { name: 'slot_id', type: sql.Int, value: slot_id },
            { name: 'day_of_week', type: sql.VarChar, value: day_of_week },
            { name: 'start_time', type: sql.Time, value: start_time },
            { name: 'end_time', type: sql.Time, value: end_time },
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id }
        ]);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//tested
router.delete('/slots/delete', async (req, res) => {
    const { slot_id, requestor_id } = req.body;

    try {
        const result = await executeSP('DeleteTimeSlot', [
            { name: 'slot_id', type: sql.Int, value: slot_id },
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id }
        ]);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//tested
router.post('/slots', async (req, res) => {
    const { requestor_id } = req.body;

    try {
        const result = await executeSP('GetAllTimeSlots', [
            { name: 'requestor_id', type: sql.VarChar, value: requestor_id }
        ]);
        res.status(200).json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Logout 
router.post('/logout', (req, res) => {
    // Clear session or token
    res.clearCookie('token'); // Example if using cookies
    res.status(200).json({ message: 'Logged out successfully' });
});

// 1. Create Leave Request
router.post('/leave-requests/create', async (req, res) => {
    const { student_id, course_id, request_date, leave_reason, faculty_id, section } = req.body;

    // Add input validation
    if (!student_id || typeof student_id !== 'string' || student_id.trim() === '') {
        return res.status(400).json({ error: 'Valid student_id is required' });
    }

    try {
        const result = await executeSP('sp_CreateLeaveRequest', [
            { name: 'student_id', type: sql.VarChar(20), value: student_id },
            { name: 'course_id', type: sql.VarChar(20), value: course_id },
            { name: 'request_date', type: sql.Date, value: request_date },  // Changed to Date type
            { name: 'leave_reason', type: sql.NVarChar(500), value: leave_reason },
            { name: 'faculty_id', type: sql.VarChar(20), value: faculty_id || '' },  // Ensure empty string
            { name: 'section', type: sql.VarChar(10), value: section || null }       // Ensure null
        ]);

        res.status(200).json(result.recordset[0] || {});
    } catch (error) {
        console.error("Error creating leave request:", error);
        res.status(500).json({
            error: error.message || "Failed to create leave request",
            details: error.details || null  // Add any additional error details if available
        });
    }
});

// 2. Process Leave Request (Approve/Reject)
router.patch('/leave-requests/process/:request_id', async (req, res) => {
    const { request_id } = req.params;
    const { faculty_id, new_status, response_message } = req.body;

    try {
        const result = await executeSP('sp_ProcessLeaveRequest', [
            { name: 'request_id', type: sql.Int, value: request_id },
            { name: 'faculty_id', type: sql.VarChar, value: faculty_id },
            { name: 'new_status', type: sql.NVarChar, value: new_status },
            { name: 'response_message', type: sql.NVarChar, value: response_message || null }
        ]);

        res.status(200).json(result.recordset[0] || {});
    } catch (error) {
        console.error("Error processing leave request:", error);
        res.status(500).json({ error: error.message || "Failed to process leave request" });
    }
});

// 3. Get Faculty Leave Requests
router.get('/leave-requests/faculty/:faculty_id', async (req, res) => {
    const { faculty_id } = req.params;
    const { status } = req.query;

    try {
        const result = await executeSP('sp_GetFacultyLeaveRequests', [
            { name: 'faculty_id', type: sql.VarChar, value: faculty_id },
            { name: 'status', type: sql.NVarChar, value: status || null }
        ]);

        res.status(200).json(result.recordset || []);
    } catch (error) {
        console.error("Error fetching faculty leave requests:", error);
        res.status(500).json({ error: "Failed to fetch faculty leave requests" });
    }
});

// 4. Get Student Leave Requests
router.get('/leave-requests/student/:student_id', async (req, res) => {
    const { student_id } = req.params;
    const { status } = req.query;

    try {
        const result = await executeSP('sp_GetStudentLeaveRequests', [
            { name: 'student_id', type: sql.VarChar, value: student_id },
            { name: 'status', type: sql.NVarChar, value: status || null }
        ]);

        res.status(200).json(result.recordset || []);
    } catch (error) {
        console.error("Error fetching student leave requests:", error);
        res.status(500).json({ error: "Failed to fetch student leave requests" });
    }
});

router.post('/faculty-course-assignments', async (req, res) => {
    const { faculty_id, course_code, section } = req.body;

    try {
        // Input validation
        if (!faculty_id || !course_code || !section) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await executeSP('sp_CreateFacultyCourseAssignment', [
            { name: 'faculty_id', type: sql.VarChar(20), value: faculty_id },
            { name: 'course_code', type: sql.VarChar(20), value: course_code },
            { name: 'section', type: sql.VarChar(10), value: section }
        ]);

        res.status(201).json(result.recordset[0] || {});
    } catch (error) {
        console.error("Error creating faculty course assignment:", error);
        res.status(500).json({
            error: error.message || "Failed to create faculty course assignment",
            details: error.details
        });
    }
});

module.exports = router;