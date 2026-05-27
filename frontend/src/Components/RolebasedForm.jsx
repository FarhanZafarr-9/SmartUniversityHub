// RoleBasedForm.js
import React from 'react';
import DropDown from './DropDown';
import StudentForm from './StudentForm';
import AdminForm from './AdminForm';
import FacultyForm from './FacultyForm';
import Divider from './Divider';

const RoleBasedForm = ({ role, setRole, userData, handleInputChange }) => {
    const roleOptions = [
        { value: 'null', label: 'None' },
        { value: 'student', label: 'Student' },
        { value: 'admin', label: 'Admin' },
        { value: 'faculty', label: 'Faculty' },
    ];

    return (

        <>
            <div className='flex justify-between items-center w-[70%]'>
                <p className='tracking-widest'>Role:</p>
                <DropDown
                    options={roleOptions}
                    width="w-[70%]"
                    height="h-12"
                    bgColor="bg-dark-hover"
                    onChange={(e) => setRole(e.target.value)}
                    id='role'
                />
            </div>

            {/* Divider between form sections */}
            <Divider width='70%' />

            <div className='flex justify-between flex-wrap items-center w-[70%] '>

                {/* Conditionally render role-specific forms */}
                {role === 'student' && <StudentForm userData={userData}
                    handleInputChange={handleInputChange} />}
                {role === 'admin' && <AdminForm userData={userData}
                    handleInputChange={handleInputChange} />}
                {role === 'faculty' && <FacultyForm userData={userData}
                    handleInputChange={handleInputChange} />}
            </div>
        </>
    );
};

export default RoleBasedForm;
