import React, { useState, useEffect } from 'react';
import { getUserDetails, updateProfile } from '../../../services/servicesApi';

const DefaultProfile = () => {
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        oldPassword: '',
        newPassword: '',
    });
    const [passwordError, setPasswordError] = useState(null);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const requestorId = localStorage.getItem('currentUser')
                    ? JSON.parse(localStorage.getItem('currentUser')).user.user_id
                    : null;

                if (!requestorId) {
                    setError('Please log in to view your profile.');
                    setLoading(false);
                    return;
                }

                const response = await getUserDetails(requestorId, requestorId);
                setUserDetails(response.user);
                setFormData({
                    email: response.user.email,
                    oldPassword: '',
                    newPassword: '',
                });
            } catch (err) {
                setError(err.message || 'Failed to fetch user details.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        try {
            // Verify the old password
            const isPasswordValid = userDetails.password_hash === formData.oldPassword;
            if (!isPasswordValid) {
                setPasswordError('Incorrect old password.');
                return;
            }

            const updatedData = {
                requestor_id: userDetails.user_id,
                user_id: userDetails.user_id,
                new_email: formData.email,
                new_password: formData.newPassword,
            };

            await updateProfile(updatedData);
            setUserDetails((prev) => ({
                ...prev,
                email: formData.email,
            }));

            setShowModal(false);
            setFormData({
                email: formData.email,
                oldPassword: '',
                newPassword: '',
            });
            setPasswordError(null);
        } catch (err) {
            setError('Failed to update profile. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full p-6 bg-dark-semi-dark">
            {/* Header */}
            <div className="my-8 bg-[#282828] rounded-xl shadow-lg p-6 border border-[#55555555]">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-dark-accent-light mb-1">
                            {userDetails.user_type === 'student' ? 'Student Profile' : 'Faculty Profile'}
                        </h1>
                        <p className="text-gray-400">Manage your account details and preferences</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 rounded-lg border border-blue-900/50 hover:border-blue-400 transition-all duration-300 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Summary */}
                <div className="bg-[#282828] rounded-xl shadow-lg p-6 border border-[#55555555] lg:col-span-1">
                    <div className="flex flex-col items-center">
                        <div className="bg-gray-200 rounded-xl border border-[#55555555] w-24 h-24 flex items-center justify-center text-3xl font-bold text-gray-800 mb-4">
                            {userDetails.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                        </div>
                        <h2 className="text-xl font-semibold text-gray-200 text-center">{userDetails.name}</h2>
                        <p className="text-gray-400 text-sm">{userDetails.user_id}</p>
                        <div className="mt-4 px-3 py-1 bg-[#333333] rounded-full text-xs text-gray-300">
                            {userDetails.user_type === 'student' ? 'Student' : 'Faculty'}
                        </div>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="bg-[#282828] rounded-xl shadow-lg p-6 border border-[#55555555] lg:col-span-2">
                    <h3 className="text-xl font-semibold text-gray-200 mb-6 pb-2 border-b border-[#55555555]">
                        Account Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Email Address</p>
                                <p className="text-gray-200">{userDetails.email}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Department</p>
                                <p className="text-gray-200">{userDetails.department}</p>
                            </div>
                        </div>

                        {userDetails.user_type === 'student' && (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Semester</p>
                                    <p className="text-gray-200">{userDetails.semester}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">GPA</p>
                                    <p className="text-gray-200">{userDetails.gpa}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Section</p>
                                    <p className="text-gray-200">{userDetails.section}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-[#282828] rounded-xl shadow-lg p-6 border border-[#55555555] w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-200">Edit Profile</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveChanges} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#1c1c1c] text-gray-200 px-3 py-2 rounded-lg border border-[#555555] focus:outline-none focus:ring-1 focus:ring-[#c0c0c0]"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Old Password</label>
                                <div className="relative">
                                    <input
                                        type={showOldPassword ? 'text' : 'password'}
                                        name="oldPassword"
                                        value={formData.oldPassword}
                                        onChange={handleInputChange}
                                        className="w-full bg-[#1c1c1c] text-gray-200 px-3 py-2 rounded-lg border border-[#555555] focus:outline-none focus:ring-1 focus:ring-[#c0c0c0]"
                                        placeholder="Enter your current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOldPassword((prev) => !prev)}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
                                    >
                                        {showOldPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleInputChange}
                                        className="w-full bg-[#1c1c1c] text-gray-200 px-3 py-2 rounded-lg border border-[#555555] focus:outline-none focus:ring-1 focus:ring-[#c0c0c0]"
                                        placeholder="Enter your new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword((prev) => !prev)}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
                                    >
                                        {showNewPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {passwordError && (
                                <div className="text-red-400 text-sm">{passwordError}</div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-900/40 hover:bg-gray-900/60 text-gray-400 rounded-lg border border-gray-900/50 hover:border-gray-400 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-900/40 hover:bg-green-900/60 text-green-400 rounded-lg border border-green-900/50 hover:border-green-400 transition-all duration-300 flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DefaultProfile;