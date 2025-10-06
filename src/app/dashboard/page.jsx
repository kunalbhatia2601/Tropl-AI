'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, User, FileText, Calendar, Settings, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me');
            const data = await response.json();

            if (data.success) {
                setUser(data.user);
            } else {
                router.push('/auth/login');
            }
        } catch (error) {
            router.push('/auth/login');
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                AI Interviewer
                            </span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div className="hidden md:block">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                        {user?.name}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                        {user?.role}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Welcome Section */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                        Welcome back, {user?.name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Here's what's happening with your account today
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                {user?.resumeUploaded ? '1' : '0'}
                            </span>
                        </div>
                        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Resume Uploaded
                        </h3>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="text-3xl font-bold text-slate-900 dark:text-white">0</span>
                        </div>
                        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Interviews Completed
                        </h3>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                {user?.profileCompleted ? '100' : '50'}%
                            </span>
                        </div>
                        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Profile Completion
                        </h3>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                        Quick Actions
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <button className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl">
                            <FileText className="w-8 h-8" />
                            <div className="text-left">
                                <div className="font-semibold text-lg">Upload Resume</div>
                                <div className="text-sm text-blue-100">
                                    Start by uploading your resume
                                </div>
                            </div>
                        </button>

                        <button className="flex items-center gap-4 p-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl">
                            <Calendar className="w-8 h-8" />
                            <div className="text-left">
                                <div className="font-semibold text-lg">Schedule Interview</div>
                                <div className="text-sm text-indigo-100">
                                    Book your AI interview session
                                </div>
                            </div>
                        </button>

                        <button className="flex items-center gap-4 p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl">
                            <User className="w-8 h-8" />
                            <div className="text-left">
                                <div className="font-semibold text-lg">Complete Profile</div>
                                <div className="text-sm text-purple-100">
                                    Add more details to your profile
                                </div>
                            </div>
                        </button>

                        <button className="flex items-center gap-4 p-6 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl">
                            <Settings className="w-8 h-8" />
                            <div className="text-left">
                                <div className="font-semibold text-lg">Account Settings</div>
                                <div className="text-sm text-pink-100">
                                    Manage your account preferences
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* User Info */}
                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                        Account Information
                    </h3>
                    <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                        <p><strong>Email:</strong> {user?.email}</p>
                        <p><strong>Role:</strong> <span className="capitalize">{user?.role}</span></p>
                        <p><strong>Member Since:</strong> {new Date(user?.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
