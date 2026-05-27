import React, { useState, useEffect } from 'react';
import { getFees, UpsertFees } from '../../../services/servicesApi';

const AdminFeeManagement = () => {
    const [feeChallans, setFeeChallans] = useState([]);
    const [filteredChallans, setFilteredChallans] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all' or 'pending'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const adminId = JSON.parse(localStorage.getItem('currentUser'))?.user?.user_id;

    // Fetch all fee challans
    const fetchFeeChallans = async () => {
        try {
            setLoading(true);
            const fees = await getFees(adminId);
            setFeeChallans(fees);
            setFilteredChallans(fees); // Default to showing all challans
        } catch (err) {
            console.error('Failed to fetch fee challans:', err);
            setError('Failed to fetch fee challans');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeeChallans();
    }, []);

    // Handle filter change
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        if (newFilter === 'pending') {
            setFilteredChallans(feeChallans.filter((fee) => fee.payment_status.toLowerCase() === 'pending'));
        } else {
            setFilteredChallans(feeChallans);
        }
    };

    // Approve a fee challan
    const handleApproveFee = async (feeId) => {
        try {
            const feeToApprove = feeChallans.find((fee) => fee.fee_id === feeId);
            feeToApprove.transaction_id = Math.floor(Math.random() * 1000000);

            await UpsertFees({
                fee_id: feeToApprove.fee_id,
                student_id: feeToApprove.student_id,
                credit_hours: feeToApprove.credit_hours,
                total_fee: feeToApprove.total_fee,
                due_date: feeToApprove.due_date,
                payment_status: 'paid',
                payment_date: new Date().toISOString(),
                transaction_id: feeToApprove.transaction_id,
            });

            const updatedChallans = feeChallans.map((fee) =>
                fee.fee_id === feeId
                    ? { ...fee, payment_status: 'paid', payment_date: new Date().toISOString() }
                    : fee
            );
            setFeeChallans(updatedChallans);

            const updatedFilteredChallans = updatedChallans.filter((fee) =>
                filter === 'pending' ? fee.payment_status.toLowerCase() === 'pending' : true
            );
            setFilteredChallans(updatedFilteredChallans);
        } catch (err) {
            console.error('Failed to approve fee:', err);
            setError('Failed to approve fee');
        }
    };

    return (
        <div className="h-full w-full p-6 overflow-y-auto bg-dark-semi-dark rounded-xl border border-[#55555555]">
            {/* Header */}
            <div className="mb-6 bg-dark-glassy rounded-xl p-4 border border-[#55555555]">
                <h1 className="text-xl font-semibold text-gray-200">Fee Challans Management</h1>
                <p className="text-sm text-gray-400">View, filter, and approve fee challans</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Filter Options */}
            <div className="flex justify-end mb-4">
                <select
                    value={filter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="px-4 py-2 bg-[#1c1c1c] text-gray-200 rounded border border-[#55555555]"
                >
                    <option value="all">All Challans</option>
                    <option value="pending">Pending Challans</option>
                </select>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-200"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredChallans.map((fee) => (
                        <div
                            key={fee.fee_id}
                            className="bg-dark-glassy rounded-xl p-3 hover:shadow-md border border-[#55555555] hover:border-[#c0c0c0] transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4 border-b-[0.75px] border-[#555555] pb-4">
                                <h3 className="font-medium text-gray-200 text-base">Fee ID: {fee.fee_id}</h3>
                                <span className="bg-[#333] text-[#ccc] text-xs px-2 py-1 rounded-lg">
                                    Student ID: {fee.student_id}
                                </span>
                            </div>
                            <div className="space-y-2 mt-2">
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Credit Hours:</p>
                                    <p className="text-gray-300">{fee.credit_hours}</p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Total Fee:</p>
                                    <p className="text-gray-300">{fee.total_fee}</p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Due Date:</p>
                                    <p className="text-gray-300">{new Date(fee.due_date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <p className="text-gray-400">Status:</p>
                                    <p className="text-gray-300 capitalize">{fee.payment_status}</p>
                                </div>
                            </div>
                            {fee.payment_status.toLowerCase() === 'pending' && (
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        onClick={() => handleApproveFee(fee.fee_id)}
                                        className="px-3 py-1 text-sm bg-green-900/30 hover:bg-green-900/40 text-green-400 rounded border border-green-900/50 hover:border-green-400"
                                    >
                                        Approve
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminFeeManagement;