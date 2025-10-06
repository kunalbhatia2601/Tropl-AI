'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Upload, FileText, Loader2, CheckCircle, X, Plus, Trash2,
    User, Mail, Phone, MapPin, Briefcase, GraduationCap,
    Code, Award, Folder, Link as LinkIcon, ArrowRight, Brain,
    TrendingUp, AlertCircle, Lightbulb
} from 'lucide-react';

export default function UploadResumePage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Upload, 2: Edit, 3: Success
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState('');
    const [parsedData, setParsedData] = useState(null);

    // Handle file selection
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];

        if (!selectedFile) return;

        // Validate file type
        if (selectedFile.type !== 'application/pdf') {
            setError('Please upload a PDF file');
            return;
        }

        // Validate file size (5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        setFile(selectedFile);
        setError('');
    };

    // Upload and parse resume
    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setIsUploading(true);
        setError('');
        setUploadProgress('Uploading to cloud storage...');

        try {
            const formData = new FormData();
            formData.append('resume', file);

            const response = await fetch('/api/resume/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setUploadProgress('');
                setParsedData(data.data);
                setStep(2); // Move to edit step
            } else {
                setError(data.message || 'Failed to parse resume');
                setUploadProgress('');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setError('Failed to upload resume. Please try again.');
            setUploadProgress('');
        } finally {
            setIsUploading(false);
        }
    };

    // Save edited resume data
    const handleSave = async () => {
        setIsSaving(true);
        setError('');

        try {
            const response = await fetch('/api/resume/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: parsedData.fileName,
                    fileSize: parsedData.fileSize,
                    fileUrl: parsedData.fileUrl,
                    cloudinaryPublicId: parsedData.cloudinaryPublicId,
                    parsedData: parsedData.parsedData,
                    aiAnalysis: parsedData.aiAnalysis,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setStep(3); // Move to success step
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);
            } else {
                setError(data.message || 'Failed to save resume');
            }
        } catch (error) {
            console.error('Save error:', error);
            setError('Failed to save resume. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Update field handlers
    const updatePersonalInfo = (field, value) => {
        setParsedData(prev => ({
            ...prev,
            parsedData: {
                ...prev.parsedData,
                personalInfo: {
                    ...prev.parsedData.personalInfo,
                    [field]: value
                }
            }
        }));
    };

    const updateEducation = (index, field, value) => {
        setParsedData(prev => {
            const newEducation = [...prev.parsedData.education];
            newEducation[index] = { ...newEducation[index], [field]: value };
            return {
                ...prev,
                parsedData: {
                    ...prev.parsedData,
                    education: newEducation
                }
            };
        });
    };

    const addEducation = () => {
        setParsedData(prev => ({
            ...prev,
            parsedData: {
                ...prev.parsedData,
                education: [...prev.parsedData.education, { degree: '', field: '', institution: '', location: '', year: '', grade: '' }]
            }
        }));
    };

    const removeEducation = (index) => {
        if (parsedData.parsedData.education.length <= 1) return;
        setParsedData(prev => ({
            ...prev,
            parsedData: {
                ...prev.parsedData,
                education: prev.parsedData.education.filter((_, i) => i !== index)
            }
        }));
    };

    const updateExperience = (index, field, value) => {
        setParsedData(prev => {
            const newExperience = [...prev.parsedData.experience];
            newExperience[index] = { ...newExperience[index], [field]: value };
            return {
                ...prev,
                parsedData: {
                    ...prev.parsedData,
                    experience: newExperience
                }
            };
        });
    };

    const updateExperienceDescription = (expIndex, descIndex, value) => {
        setParsedData(prev => {
            const newExperience = [...prev.parsedData.experience];
            const newDescription = [...newExperience[expIndex].description];
            newDescription[descIndex] = value;
            newExperience[expIndex] = { ...newExperience[expIndex], description: newDescription };
            return {
                ...prev,
                parsedData: {
                    ...prev.parsedData,
                    experience: newExperience
                }
            };
        });
    };

    const addExperienceDescription = (expIndex) => {
        setParsedData(prev => {
            const newExperience = [...prev.parsedData.experience];
            newExperience[expIndex] = {
                ...newExperience[expIndex],
                description: [...newExperience[expIndex].description, '']
            };
            return {
                ...prev,
                parsedData: {
                    ...prev.parsedData,
                    experience: newExperience
                }
            };
        });
    };

    const addExperience = () => {
        setParsedData(prev => ({
            ...prev,
            parsedData: {
                ...prev.parsedData,
                experience: [...prev.parsedData.experience, {
                    title: '',
                    company: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    description: ['']
                }]
            }
        }));
    };

    const removeExperience = (index) => {
        if (parsedData.parsedData.experience.length <= 1) return;
        setParsedData(prev => ({
            ...prev,
            parsedData: {
                ...prev.parsedData,
                experience: prev.parsedData.experience.filter((_, i) => i !== index)
            }
        }));
    };

    const updateSkill = (category, index, value) => {
        setParsedData(prev => {
            const newSkills = [...prev.parsedData.skills[category]];
            newSkills[index] = value;
            return {
                ...prev,
                parsedData: {
                    ...prev.parsedData,
                    skills: {
                        ...prev.parsedData.skills,
                        [category]: newSkills
                    }
                }
            };
        });
    };

    const addSkill = (category) => {
        setParsedData(prev => ({
            ...prev,
            parsedData: {
                ...prev.parsedData,
                skills: {
                    ...prev.parsedData.skills,
                    [category]: [...prev.parsedData.skills[category], '']
                }
            }
        }));
    };

    const removeSkill = (category, index) => {
        setParsedData(prev => ({
            ...prev,
            parsedData: {
                ...prev.parsedData,
                skills: {
                    ...prev.parsedData.skills,
                    [category]: prev.parsedData.skills[category].filter((_, i) => i !== index)
                }
            }
        }));
    };

    const updateProject = (index, field, value) => {
        setParsedData(prev => {
            const newProjects = [...prev.parsedData.projects];
            newProjects[index] = { ...newProjects[index], [field]: value };
            return {
                ...prev,
                parsedData: {
                    ...prev.parsedData,
                    projects: newProjects
                }
            };
        });
    };

    const addProject = () => {
        setParsedData(prev => ({
            ...prev,
            parsedData: {
                ...prev.parsedData,
                projects: [...prev.parsedData.projects, {
                    name: '',
                    description: '',
                    technologies: [],
                    link: '',
                    duration: ''
                }]
            }
        }));
    };

    const removeProject = (index) => {
        if (parsedData.parsedData.projects.length <= 1) return;
        setParsedData(prev => ({
            ...prev,
            parsedData: {
                ...prev.parsedData,
                projects: prev.parsedData.projects.filter((_, i) => i !== index)
            }
        }));
    };

    // Step 1: Upload
    if (step === 1) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                            <Upload className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Upload Your Resume
                        </h1>
                        <p className="text-gray-600">
                            Our AI will automatically extract and analyze your information
                        </p>
                    </div>

                    {/* File Upload Area */}
                    <div className="mb-6">
                        <label
                            htmlFor="resume-upload"
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {file ? (
                                    <>
                                        <FileText className="w-16 h-16 text-blue-600 mb-3" />
                                        <p className="text-sm font-semibold text-gray-900 mb-1">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setFile(null);
                                            }}
                                            className="mt-3 text-sm text-red-600 hover:text-red-700"
                                        >
                                            Remove file
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                                        <p className="mb-2 text-sm text-gray-700">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">PDF only (MAX. 5MB)</p>
                                    </>
                                )}
                            </div>
                            <input
                                id="resume-upload"
                                type="file"
                                className="hidden"
                                accept=".pdf"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    {uploadProgress && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {uploadProgress}
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processing with AI...
                            </>
                        ) : (
                            <>
                                <Brain className="w-5 h-5 mr-2" />
                                Upload & Parse with AI
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </button>

                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                            <Brain className="w-4 h-4 mr-2" />
                            AI-Powered Resume Analysis
                        </p>
                        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                            <li>Automatic information extraction from your PDF</li>
                            <li>Smart categorization of skills and experience</li>
                            <li>AI-generated analysis and suggestions</li>
                            <li>Secure cloud storage with Cloudinary</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Edit parsed data
    if (step === 2 && parsedData) {
        const aiAnalysis = parsedData.aiAnalysis;

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 py-8">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Review Your Resume
                                </h1>
                                <p className="text-gray-600">
                                    AI has extracted and analyzed your information. Review and edit as needed.
                                </p>
                            </div>
                            <CheckCircle className="w-12 h-12 text-green-500 flex-shrink-0" />
                        </div>
                    </div>

                    {/* AI Analysis Card */}
                    {aiAnalysis && (
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
                            <div className="flex items-center mb-4">
                                <Brain className="w-6 h-6 mr-2" />
                                <h2 className="text-2xl font-bold">AI Analysis Results</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm opacity-90">Overall Score</span>
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <div className="text-4xl font-bold">{aiAnalysis.overallScore}/100</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm opacity-90">ATS Compatibility</span>
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                    <div className="text-4xl font-bold">{aiAnalysis.atsCompatibilityScore}/100</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 && (
                                    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                        <h3 className="font-semibold mb-2 flex items-center">
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Strengths
                                        </h3>
                                        <ul className="text-sm space-y-1 opacity-90">
                                            {aiAnalysis.strengths.slice(0, 3).map((strength, i) => (
                                                <li key={i}>• {strength}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                                    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                        <h3 className="font-semibold mb-2 flex items-center">
                                            <Lightbulb className="w-4 h-4 mr-2" />
                                            Suggestions
                                        </h3>
                                        <ul className="text-sm space-y-1 opacity-90">
                                            {aiAnalysis.suggestions.slice(0, 3).map((suggestion, i) => (
                                                <li key={i}>• {suggestion}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Personal Information */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center mb-4">
                                <User className="w-6 h-6 text-blue-600 mr-2" />
                                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        value={parsedData.parsedData.personalInfo.name}
                                        onChange={(e) => updatePersonalInfo('name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        value={parsedData.parsedData.personalInfo.email}
                                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={parsedData.parsedData.personalInfo.phone}
                                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={parsedData.parsedData.personalInfo.location}
                                        onChange={(e) => updatePersonalInfo('location', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="San Francisco, CA"
                                    />
                                </div>
                            </div>

                            {/* Summary */}
                            {parsedData.parsedData.summary && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
                                    <textarea
                                        value={parsedData.parsedData.summary}
                                        onChange={(e) => setParsedData(prev => ({
                                            ...prev,
                                            parsedData: {
                                                ...prev.parsedData,
                                                summary: e.target.value
                                            }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="3"
                                        placeholder="Brief professional summary..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* Education */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <GraduationCap className="w-6 h-6 text-blue-600 mr-2" />
                                    <h2 className="text-xl font-bold text-gray-900">Education</h2>
                                </div>
                                <button
                                    onClick={addEducation}
                                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Education
                                </button>
                            </div>
                            <div className="space-y-4">
                                {parsedData.parsedData.education.map((edu, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                                        {parsedData.parsedData.education.length > 1 && (
                                            <button
                                                onClick={() => removeEducation(index)}
                                                className="absolute top-2 right-2 text-red-600 hover:text-red-700 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                                                <input
                                                    type="text"
                                                    value={edu.degree}
                                                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="e.g., Bachelor of Science"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                                                <input
                                                    type="text"
                                                    value={edu.field || ''}
                                                    onChange={(e) => updateEducation(index, 'field', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="e.g., Computer Science"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                                                <input
                                                    type="text"
                                                    value={edu.institution}
                                                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="University Name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                                <input
                                                    type="text"
                                                    value={edu.location || ''}
                                                    onChange={(e) => updateEducation(index, 'location', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="City, State"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                                <input
                                                    type="text"
                                                    value={edu.year}
                                                    onChange={(e) => updateEducation(index, 'year', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="2020"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Experience */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <Briefcase className="w-6 h-6 text-blue-600 mr-2" />
                                    <h2 className="text-xl font-bold text-gray-900">Experience</h2>
                                </div>
                                <button
                                    onClick={addExperience}
                                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Experience
                                </button>
                            </div>
                            <div className="space-y-4">
                                {parsedData.parsedData.experience.map((exp, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                                        {parsedData.parsedData.experience.length > 1 && (
                                            <button
                                                onClick={() => removeExperience(index)}
                                                className="absolute top-2 right-2 text-red-600 hover:text-red-700 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                                                <input
                                                    type="text"
                                                    value={exp.title}
                                                    onChange={(e) => updateExperience(index, 'title', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Senior Software Engineer"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                                <input
                                                    type="text"
                                                    value={exp.company}
                                                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Tech Company Inc."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                                <input
                                                    type="text"
                                                    value={exp.startDate}
                                                    onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Jan 2020"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                                <input
                                                    type="text"
                                                    value={exp.endDate}
                                                    onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Present"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                                <input
                                                    type="text"
                                                    value={exp.location}
                                                    onChange={(e) => updateExperience(index, 'location', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="San Francisco, CA"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                                    <button
                                                        onClick={() => addExperienceDescription(index)}
                                                        className="text-blue-600 hover:text-blue-700 text-xs"
                                                    >
                                                        <Plus className="w-3 h-3 inline mr-1" />
                                                        Add bullet
                                                    </button>
                                                </div>
                                                {exp.description.map((desc, descIndex) => (
                                                    <input
                                                        key={descIndex}
                                                        type="text"
                                                        value={desc}
                                                        onChange={(e) => updateExperienceDescription(index, descIndex, e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                                                        placeholder="• Achievement or responsibility..."
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center mb-4">
                                <Code className="w-6 h-6 text-blue-600 mr-2" />
                                <h2 className="text-xl font-bold text-gray-900">Skills</h2>
                            </div>
                            <div className="space-y-4">
                                {['technical', 'frameworks', 'tools', 'languages', 'soft'].map((category) => (
                                    <div key={category}>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-gray-700 capitalize">
                                                {category === 'soft' ? 'Soft Skills' : category}
                                            </label>
                                            <button
                                                onClick={() => addSkill(category)}
                                                className="text-blue-600 hover:text-blue-700 text-xs flex items-center"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {parsedData.parsedData.skills[category].filter(s => s).map((skill, index) => (
                                                <div key={index} className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                                                    <input
                                                        type="text"
                                                        value={skill}
                                                        onChange={(e) => updateSkill(category, index, e.target.value)}
                                                        className="bg-transparent border-none outline-none text-sm w-24 text-blue-900"
                                                        placeholder="Skill"
                                                    />
                                                    <button
                                                        onClick={() => removeSkill(category, index)}
                                                        className="ml-2 text-red-600 hover:text-red-700"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Projects */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <Folder className="w-6 h-6 text-blue-600 mr-2" />
                                    <h2 className="text-xl font-bold text-gray-900">Projects</h2>
                                </div>
                                <button
                                    onClick={addProject}
                                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Project
                                </button>
                            </div>
                            <div className="space-y-4">
                                {parsedData.parsedData.projects.map((project, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                                        {parsedData.parsedData.projects.length > 1 && (
                                            <button
                                                onClick={() => removeProject(index)}
                                                className="absolute top-2 right-2 text-red-600 hover:text-red-700 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                                <input
                                                    type="text"
                                                    value={project.name}
                                                    onChange={(e) => updateProject(index, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="E-commerce Platform"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <textarea
                                                    value={project.description}
                                                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    rows="3"
                                                    placeholder="Brief description of the project..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                                    <input
                                                        type="text"
                                                        value={project.duration || ''}
                                                        onChange={(e) => updateProject(index, 'duration', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="3 months"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Link (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={project.link}
                                                        onChange={(e) => updateProject(index, 'link', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="https://github.com/..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex items-center mb-4">
                                <LinkIcon className="w-6 h-6 text-blue-600 mr-2" />
                                <h2 className="text-xl font-bold text-gray-900">Social Links</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['linkedin', 'github', 'portfolio', 'twitter'].map((platform) => (
                                    <div key={platform}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                            {platform}
                                        </label>
                                        <input
                                            type="text"
                                            value={parsedData.parsedData.socialLinks?.[platform] || ''}
                                            onChange={(e) => setParsedData(prev => ({
                                                ...prev,
                                                parsedData: {
                                                    ...prev.parsedData,
                                                    socialLinks: {
                                                        ...prev.parsedData.socialLinks,
                                                        [platform]: e.target.value
                                                    }
                                                }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={`https://${platform}.com/...`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                        Saving Resume...
                                    </>
                                ) : (
                                    <>
                                        Save Resume & Continue to Dashboard
                                        <ArrowRight className="w-6 h-6 ml-2" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 3: Success
    if (step === 3) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-white">
                        Resume Saved Successfully!
                    </h2>
                    <p className="text-xl text-gray-300">
                        Your resume has been analyzed and stored securely
                    </p>
                    <p className="text-gray-400">
                        Redirecting you to dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return null;
}
