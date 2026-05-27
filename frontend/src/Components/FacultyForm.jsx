import React, { useState } from 'react';
import InputField from './InputFeild'; // Make sure InputField is imported correctly

const FacultyForm = ({userData, handleInputChange}) => {


    return (
        <>
            <InputField
                type="text"
                id="department"
                name="department"
                value={userData.department}
                onChange={handleInputChange}
                required
                placeholder="Department"
                width="95%" // Customize width as needed
                height="h-12"  // Customize height as needed
                bgColor="bg-dark-hover"  // Customize background color if needed
            />
        </>
 
    );
};

export default FacultyForm;