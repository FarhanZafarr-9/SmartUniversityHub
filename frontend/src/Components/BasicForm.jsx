// BasicInfoForm.js
import React from 'react';
import InputField from './InputFeild';
import Divider from './Divider';

const BasicInfoForm = ({ userData, handleInputChange }) => {
    return (
        <>
            {/* First Name and Last Name fields */}
            <div className='flex items-center justify-between w-[70%]'>
                <InputField
                    type="text"
                    placeholder="First Name"
                    width="50%"
                    height="45px"
                    bgColor="bg-dark-hover"
                    name="firstName"
                    value={userData.firstName}
                    onChange={handleInputChange}
                />

                <Divider height='60%' width='2px' />

                <InputField
                    type="text"
                    placeholder="Last Name"
                    width="40%"
                    height="45px"
                    bgColor="bg-dark-hover"
                    name="lastName"
                    value={userData.lastName}
                    onChange={handleInputChange}
                />
            </div>

            {/* Email field */}
            <InputField
                type="text"
                placeholder="Email"
                width="70%"
                height="45px"
                bgColor="bg-dark-hover"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
            />

            {/* Password and Confirm Password fields */}
            <div className='flex items-center justify-between w-[70%]'>
                <InputField
                    type="password"
                    placeholder="Password"
                    width="35%"
                    height="45px"
                    bgColor="bg-dark-hover"
                    name="password"
                    value={userData.password}
                    onChange={handleInputChange}
                />

                <Divider height='60%' width='2px' />

                <InputField
                    type="password"
                    placeholder="Confirm Password"
                    width="55%"
                    height="45px"
                    bgColor="bg-dark-hover"
                    name="confirmPassword"
                    value={userData.confirmPassword}
                    onChange={handleInputChange}
                />
            </div>
        </>
    );
};

export default BasicInfoForm;
