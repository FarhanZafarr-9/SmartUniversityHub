import React, { useState, useEffect } from 'react';
import { getFees, getSystemConfigs, UpsertFees, getStudentCourses } from '../../../services/servicesApi';

const StudentFeeManagement = () => {
    const [feeChallans, setFeeChallans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [systemConfig, setSystemConfig] = useState({
        enrolment_end: '',
        fee_per_credit: 0,
        extra_charges: 0,
        miscellaneous_fee: 0
    });

    const studentId = localStorage.getItem('currentUser')
        ? JSON.parse(localStorage.getItem('currentUser')).user.user_id
        : null;

    // Function to parse the custom date format "21-1-25" (YY-M-DD)
    const parseCustomDate = (dateString) => {
        if (!dateString) return null;

        const parts = dateString.split('-');
        if (parts.length !== 3) return null;

        // Convert 2-digit year to full year (assuming 2000s)
        const year = parseInt(parts[0]) + 2000;
        const month = parseInt(parts[1]) - 1; // Months are 0-indexed in JS
        const day = parseInt(parts[2]);

        return new Date(year, month, day);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';

        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const formatCurrency = (amount) => {
        return `PKR ${parseFloat(amount).toLocaleString('en-PK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const fetchSystemConfig = async () => {
        try {
            const configs = await Promise.all([
                getSystemConfigs(studentId, 'enrolment_end'),
                getSystemConfigs(studentId, 'fee_per_credit'),
                getSystemConfigs(studentId, 'extra_charges'),
                getSystemConfigs(studentId, 'miscellaneous_fee')
            ]);

            setSystemConfig({
                enrolment_end: configs[0][0]?.config_value || '',
                fee_per_credit: parseFloat(configs[1][0]?.config_value) || 0,
                extra_charges: parseFloat(configs[2][0]?.config_value) || 0,
                miscellaneous_fee: parseFloat(configs[3][0]?.config_value) || 0
            });
        } catch (err) {
            console.error('Failed to fetch system config:', err);
        }
    };

    const checkAndGenerateChallan = async (existingChallans) => {
        try {
            const currentDate = new Date();
            const enrolmentEndDate = parseCustomDate(systemConfig.enrolment_end);

            // Only proceed if we have a valid enrolment end date
            if (!enrolmentEndDate || isNaN(enrolmentEndDate.getTime())) {
                console.error('Invalid enrolment end date:', systemConfig.enrolment_end);
                return existingChallans;
            }


            // Check if enrollment period has ended
            if (currentDate > enrolmentEndDate) {
                

                // Find if there's any pending challan for this semester
                const hasPendingChallan = existingChallans.some(
                    challan => challan.payment_status.toLowerCase() === 'pending'
                );

                if (!hasPendingChallan) {

                    const enrolledRes = await getStudentCourses(studentId, 'enrolled');
                    const creditHours = enrolledRes.reduce((sum, course) => sum + course.credit_hours, 0);
                    
                    // Calculate total fee
                    const baseFee = creditHours * systemConfig.fee_per_credit;
                    const totalFee = baseFee + systemConfig.extra_charges + systemConfig.miscellaneous_fee;

                    // Set due date to 30 days from now
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 30);

                    // Generate new challan
                    const newChallan = {
                        student_id: studentId,
                        credit_hours: creditHours,
                        total_fee: totalFee,
                        due_date: dueDate.toISOString(),
                        payment_status: 'pending'
                    };

                    console.log('Creating new challan:', newChallan);
                    const result = await UpsertFees(newChallan);
                    return [...existingChallans, result];
                } else {
                    console.log('Pending challan already exists');
                }
            } else {
                console.log('Enrollment period has not ended yet');
            }

            return existingChallans;
        } catch (err) {
            console.error('Error generating challan:', err);
            return existingChallans;
        }
    };

    const fetchFeeDetails = async () => {
        try {
            setLoading(true);
            await fetchSystemConfig();

            // Fetch all fee challans
            const feeRes = await getFees(studentId);
            console.log('Fetched challans:', feeRes);

            let processedChallans = Array.isArray(feeRes) ? feeRes : [];

            // Check if we need to generate a new challan
            if (systemConfig.enrolment_end) {
                processedChallans = await checkAndGenerateChallan(processedChallans);
            }

            // Sort challans: Pending first, then by due date
            const sortedChallans = processedChallans.sort((a, b) => {
                if (a.payment_status.toLowerCase() === b.payment_status.toLowerCase()) {
                    return new Date(b.due_date) - new Date(a.due_date);
                }
                return a.payment_status.toLowerCase() === 'pending' ? -1 : 1;
            });

            setFeeChallans(sortedChallans);
        } catch (err) {
            setError('Failed to fetch fee details. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentId) {
            fetchFeeDetails();
        }
    }, [studentId]);

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
        <div className="h-full w-full m-4 overflow-y-auto bg-dark-semi-dark p-6">
            {/* Header */}
            <div className="mb-8 bg-[#282828] rounded-xl shadow-md p-6 border-[0.75px] border-[#55555555]">
                <h1 className="text-3xl font-bold text-dark-accent-light mb-2">Student Fee Management</h1>
                <p className="text-gray-400">View your fee details.</p>
            </div>

            {/* Fee Challans */}
            {feeChallans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {feeChallans.map((challan, index) => (
                        <div
                            key={index}
                            className={`bg-dark-glassy rounded-xl p-4 hover:shadow-md border border-[#55555555] hover:border-[#c0c0c0] transition-all duration-300 ${challan.payment_status.toLowerCase() === 'pending' ? 'border-red-500' : 'border-green-500'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4 border-b-[0.75px] border-[#555555] pb-4">
                                <h3 className="font-medium text-gray-200 text-base">
                                    Fee ID: {challan.fee_id}
                                </h3>
                                <span
                                    className={`px-2 py-1 rounded-lg text-xs ${challan.payment_status.toLowerCase() === 'pending'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-green-500/20 text-green-400'
                                        }`}
                                >
                                    {challan.payment_status.toUpperCase()}
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Due Date:</p>
                                    <p className="text-gray-300">{formatDate(challan.due_date)}</p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Total Fee:</p>
                                    <p className="text-gray-300">{formatCurrency(challan.total_fee)}</p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Credit Hours:</p>
                                    <p className="text-gray-300">{challan.credit_hours}</p>
                                </div>
                                {challan.payment_status.toLowerCase() === 'paid' && (
                                    <div className="flex justify-between items-center text-sm">
                                        <p className="text-gray-400">Payment Date:</p>
                                        <p className="text-gray-300">{formatDate(challan.payment_date)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-[#282828] rounded-xl shadow-md p-6 border-[0.75px] border-[#55555555] mb-6">
                    <p className="text-gray-400">No fee challans available.</p>
                </div>
            )}
        </div>
    );
};

export default StudentFeeManagement;