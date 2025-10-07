'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import {
    Users,
    Building2,
    FileText,
    CheckCircle,
    TrendingUp,
    Calendar,
    Loader2,
    UserCheck,
    Activity,
} from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
        fetchStats();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me');
            const data = await response.json();

            if (data.success) {
                if (data.user.role !== 'admin') {
                    router.push('/dashboard');
                    return;
                }
                setUser(data.user);
            } else {
                router.push('/auth/login');
            }
        } catch (error) {
            router.push('/auth/login');
        }
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/stats');
            const data = await response.json();

            if (data.success) {
                setStats(data.stats);
                setRecentUsers(data.recentUsers);
            } else {
                if (response.status === 403) {
                    router.push('/dashboard');
                }
            }
        } catch (error) {
            console.error('Fetch stats error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <AdminLayout user={user} onLogout={handleLogout}>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Dashboard Overview
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Monitor your platform's performance and user activity
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Users */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                            Active
                        </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {stats?.totalUsers || 0}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Users</p>
                    <div className="mt-4 flex items-center gap-1 text-xs">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        <span className="text-green-600 font-medium">
                            {stats?.verificationRate || 0}% verified
                        </span>
                    </div>
                </div>

                {/* Total Companies */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {stats?.totalCompanies || 0}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Companies</p>
                    <div className="mt-4 flex items-center gap-1 text-xs">
                        <Activity className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-600 dark:text-slate-400">
                            Registered companies
                        </span>
                    </div>
                </div>

                {/* Total Resumes */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {stats?.totalResumes || 0}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Resumes</p>
                    <div className="mt-4 flex items-center gap-1 text-xs">
                        <CheckCircle className="w-3 h-3 text-purple-600" />
                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                            {stats?.activeResumes || 0} active
                        </span>
                    </div>
                </div>

                {/* Verified Users */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {stats?.verifiedUsers || 0}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Verified Users</p>
                    <div className="mt-4 flex items-center gap-1 text-xs">
                        <span className="text-slate-600 dark:text-slate-400">
                            {stats?.verificationRate || 0}% of total
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Growth Chart (Placeholder) */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        User Growth
                    </h3>
                    <div className="h-64 flex items-center justify-center">
                        <div className="text-center">
                            <Activity className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Chart visualization coming soon
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                Integration with charting library required
                            </p>
                        </div>
                    </div>
                </div>

                {/* Users by Role */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Users by Role
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Regular Users</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Job seekers</p>
                                </div>
                            </div>
                            <span className="text-lg font-bold text-slate-900 dark:text-white">
                                {stats?.totalUsers - stats?.totalCompanies || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Companies</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Recruiters</p>
                                </div>
                            </div>
                            <span className="text-lg font-bold text-slate-900 dark:text-white">
                                {stats?.totalCompanies || 0}
                            </span>
                        </div>
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Total</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {stats?.totalUsers || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Recent Users
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Joined
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {recentUsers.length > 0 ? (
                                recentUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white text-xs font-semibold">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${user.role === 'company'
                                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.emailVerified ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                                            {formatDate(user.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                        No recent users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
