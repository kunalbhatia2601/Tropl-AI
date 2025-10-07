'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Brain,
    User,
    LogOut,
    Loader2,
    FileText,
    Upload,
    Eye,
    Trash2,
    CheckCircle,
    Calendar,
    Download,
    Edit,
    Star,
    TrendingUp,
    AlertCircle,
    RefreshCw,
    ArrowLeft,
} from 'lucide-react';

export default function ResumesPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [selectedResume, setSelectedResume] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

    useEffect(() => {
        checkAuth();
        fetchResumes();
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
        }
    };

    const fetchResumes = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/resume?action=history&limit=50');
            const data = await response.json();

            if (data.success) {
                setResumes(data.resumes);
            }
        } catch (error) {
            console.error('Fetch resumes error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchResumeDetails = async (id) => {
        try {
            setActionLoading(true);
            const response = await fetch(`/api/resume/${id}`);
            const data = await response.json();

            if (data.success) {
                setSelectedResume(data.resume);
                setViewMode('detail');
            }
        } catch (error) {
            console.error('Fetch resume details error:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleActivate = async (resumeId) => {
        if (!confirm('Are you sure you want to activate this resume version?')) return;

        try {
            setActionLoading(true);
            const response = await fetch('/api/resume/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeId }),
            });

            const data = await response.json();

            if (data.success) {
                alert('Resume activated successfully!');
                fetchResumes();
                if (viewMode === 'detail') {
                    fetchResumeDetails(resumeId);
                }
            } else {
                alert(data.message || 'Failed to activate resume');
            }
        } catch (error) {
            console.error('Activate resume error:', error);
            alert('Failed to activate resume');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (resumeId) => {
        if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) return;

        try {
            setActionLoading(true);
            const response = await fetch(`/api/resume/${resumeId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                alert('Resume deleted successfully!');
                fetchResumes();
                if (viewMode === 'detail' && selectedResume?._id === resumeId) {
                    setViewMode('list');
                    setSelectedResume(null);
                }
            } else {
                alert(data.message || 'Failed to delete resume');
            }
        } catch (error) {
            console.error('Delete resume error:', error);
            alert('Failed to delete resume');
        } finally {
            setActionLoading(false);
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

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return mb.toFixed(2) + ' MB';
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
                {viewMode === 'list' ? (
                    <>
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                            <div>
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Dashboard
                                </Link>
                                <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                                    My Resumes
                                </h1>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Manage all your resume versions in one place
                                </p>
                            </div>
                            <Link
                                href="/auth/upload-resume"
                                className="mt-4 md:mt-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                            >
                                <Upload className="w-5 h-5" />
                                Upload New Resume
                            </Link>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                            Total Resumes
                                        </p>
                                        <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                            {resumes.length}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                            Active Resume
                                        </p>
                                        <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                            {resumes.filter((r) => r.isActive).length}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                            Latest Version
                                        </p>
                                        <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                            v{resumes.length > 0 ? Math.max(...resumes.map((r) => r.version)) : 0}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Resumes List */}
                        {resumes.length === 0 ? (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 border border-slate-200 dark:border-slate-700 text-center">
                                <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    No Resumes Yet
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Upload your first resume to get started with AI-powered analysis
                                </p>
                                <Link
                                    href="/auth/upload-resume"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                                >
                                    <Upload className="w-5 h-5" />
                                    Upload Resume
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {resumes.map((resume) => (
                                    <div
                                        key={resume._id}
                                        className={`bg-white dark:bg-slate-800 rounded-xl p-6 border-2 transition-all hover:shadow-lg ${
                                            resume.isActive
                                                ? 'border-blue-500 dark:border-blue-400'
                                                : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                                                            {resume.fileName}
                                                        </h3>
                                                        {resume.isActive && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Active
                                                            </span>
                                                        )}
                                                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                                                            v{resume.version}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {formatDate(resume.uploadedAt || resume.createdAt)}
                                                        </div>
                                                        {resume.fileSize && (
                                                            <div className="flex items-center gap-1">
                                                                <Download className="w-4 h-4" />
                                                                {formatFileSize(resume.fileSize)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 lg:flex-shrink-0">
                                                <button
                                                    onClick={() => fetchResumeDetails(resume._id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                    disabled={actionLoading}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Details
                                                </button>
                                                {!resume.isActive && (
                                                    <button
                                                        onClick={() => handleActivate(resume._id)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                        disabled={actionLoading}
                                                    >
                                                        <Star className="w-4 h-4" />
                                                        Activate
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(resume._id)}
                                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    disabled={actionLoading}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    /* Detail View */
                    <div>
                        <button
                            onClick={() => {
                                setViewMode('list');
                                setSelectedResume(null);
                            }}
                            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to List
                        </button>

                        {actionLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : selectedResume ? (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                                    <FileText className="w-8 h-8 text-white" />
                                                </div>
                                                <div>
                                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                                        {selectedResume.fileName}
                                                    </h1>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {selectedResume.isActive && (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-full">
                                                                <CheckCircle className="w-4 h-4" />
                                                                Active
                                                            </span>
                                                        )}
                                                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
                                                            Version {selectedResume.version}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-slate-600 dark:text-slate-400">Uploaded:</span>
                                                    <span className="ml-2 text-slate-900 dark:text-white font-medium">
                                                        {formatDate(selectedResume.uploadedAt || selectedResume.createdAt)}
                                                    </span>
                                                </div>
                                                {selectedResume.fileSize && (
                                                    <div>
                                                        <span className="text-slate-600 dark:text-slate-400">File Size:</span>
                                                        <span className="ml-2 text-slate-900 dark:text-white font-medium">
                                                            {formatFileSize(selectedResume.fileSize)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {selectedResume.fileUrl && (
                                                <a
                                                    href={selectedResume.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                    title="View PDF"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </a>
                                            )}
                                            {!selectedResume.isActive && (
                                                <button
                                                    onClick={() => handleActivate(selectedResume._id)}
                                                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    disabled={actionLoading}
                                                >
                                                    <Star className="w-5 h-5" />
                                                    Activate
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* AI Analysis */}
                                {selectedResume.aiAnalysis?.overallScore && (
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                            <Brain className="w-6 h-6 text-blue-600" />
                                            AI Analysis
                                        </h2>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <div className="mb-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                            Overall Score
                                                        </span>
                                                        <span className="text-2xl font-bold text-blue-600">
                                                            {selectedResume.aiAnalysis.overallScore}/100
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                                        <div
                                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all"
                                                            style={{ width: `${selectedResume.aiAnalysis.overallScore}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {selectedResume.aiAnalysis.strengths?.length > 0 && (
                                                    <div className="mb-4">
                                                        <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Strengths
                                                        </h3>
                                                        <ul className="space-y-1">
                                                            {selectedResume.aiAnalysis.strengths.map((strength, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="text-sm text-slate-700 dark:text-slate-300 pl-4 border-l-2 border-green-500"
                                                                >
                                                                    {strength}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                {selectedResume.aiAnalysis.weaknesses?.length > 0 && (
                                                    <div className="mb-4">
                                                        <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
                                                            <AlertCircle className="w-4 h-4" />
                                                            Areas to Improve
                                                        </h3>
                                                        <ul className="space-y-1">
                                                            {selectedResume.aiAnalysis.weaknesses.map((weakness, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="text-sm text-slate-700 dark:text-slate-300 pl-4 border-l-2 border-orange-500"
                                                                >
                                                                    {weakness}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {selectedResume.aiAnalysis.suggestions?.length > 0 && (
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                                                            <TrendingUp className="w-4 h-4" />
                                                            Suggestions
                                                        </h3>
                                                        <ul className="space-y-1">
                                                            {selectedResume.aiAnalysis.suggestions.map((suggestion, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="text-sm text-slate-700 dark:text-slate-300 pl-4 border-l-2 border-blue-500"
                                                                >
                                                                    {suggestion}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Parsed Data Summary */}
                                {selectedResume.parsedData && (
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Personal Info */}
                                        {selectedResume.parsedData.personalInfo && (
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                                    Personal Information
                                                </h3>
                                                <div className="space-y-2 text-sm">
                                                    {selectedResume.parsedData.personalInfo.name && (
                                                        <div>
                                                            <span className="text-slate-600 dark:text-slate-400">Name:</span>
                                                            <span className="ml-2 text-slate-900 dark:text-white font-medium">
                                                                {selectedResume.parsedData.personalInfo.name}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {selectedResume.parsedData.personalInfo.email && (
                                                        <div>
                                                            <span className="text-slate-600 dark:text-slate-400">Email:</span>
                                                            <span className="ml-2 text-slate-900 dark:text-white font-medium">
                                                                {selectedResume.parsedData.personalInfo.email}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {selectedResume.parsedData.personalInfo.phone && (
                                                        <div>
                                                            <span className="text-slate-600 dark:text-slate-400">Phone:</span>
                                                            <span className="ml-2 text-slate-900 dark:text-white font-medium">
                                                                {selectedResume.parsedData.personalInfo.phone}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {selectedResume.parsedData.personalInfo.location && (
                                                        <div>
                                                            <span className="text-slate-600 dark:text-slate-400">Location:</span>
                                                            <span className="ml-2 text-slate-900 dark:text-white font-medium">
                                                                {selectedResume.parsedData.personalInfo.location}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Skills Summary */}
                                        {selectedResume.parsedData.skills && (
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                                    Skills Summary
                                                </h3>
                                                <div className="space-y-3">
                                                    {selectedResume.parsedData.skills.technical?.length > 0 && (
                                                        <div>
                                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                                                                Technical
                                                            </span>
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {selectedResume.parsedData.skills.technical.slice(0, 10).map((skill, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded"
                                                                    >
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                                {selectedResume.parsedData.skills.technical.length > 10 && (
                                                                    <span className="px-2 py-1 text-xs text-slate-500">
                                                                        +{selectedResume.parsedData.skills.technical.length - 10} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Experience Count */}
                                        {selectedResume.parsedData.experience?.length > 0 && (
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                                    Experience
                                                </h3>
                                                <div className="text-3xl font-bold text-blue-600 mb-2">
                                                    {selectedResume.parsedData.experience.length}
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    Work experiences listed
                                                </p>
                                            </div>
                                        )}

                                        {/* Education Count */}
                                        {selectedResume.parsedData.education?.length > 0 && (
                                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                                    Education
                                                </h3>
                                                <div className="text-3xl font-bold text-indigo-600 mb-2">
                                                    {selectedResume.parsedData.education.length}
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    Educational qualifications
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={() => handleDelete(selectedResume._id)}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                        disabled={actionLoading}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Delete Resume
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </main>
        </div>
    );
}
