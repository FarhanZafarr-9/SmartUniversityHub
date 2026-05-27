import React, { useState } from 'react';
import InputField from './InputFeild'; // Make sure InputField is imported correctly

const StudentForm = ({ userData, handleInputChange}) => {

    return (
        <>
            <InputField
                type="text"
                id="department"
                name="department"
                value={userData.department}
                onChange={handleInputChange}
                required
                placeholder="Major"
                width="35%" // Customize width as needed
            />

            <InputField
                type="date"
                id="enrollmentYear"
                name="enrollmentYear"
                value={userData.enrollmentYear}
                onChange={handleInputChange}
                required
                placeholder="Enrollment Year"
                width="55%"
            />

            <InputField
                type="number"
                id="currentSemester"
                name="currentSemester"
                value={userData.currentSemester}
                onChange={handleInputChange}
                required
                placeholder="Current Semester"
                width="55%"
                margin="40px 0 10px 0"
                min={1}
                max={9}
            />

            <InputField
                type="text"
                id="section"
                name="section"
                value={userData.section}
                onChange={handleInputChange}
                required
                placeholder="Section"
                margin={"40px 0 10px 0"}
                width="35%" // Customize width as needed
            />
        </>

    );
};

export default StudentForm;
