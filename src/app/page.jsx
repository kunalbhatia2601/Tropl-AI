'use client';

import Link from 'next/link';
import { 
  Brain, 
  Briefcase, 
  Users, 
  Shield, 
  Zap, 
  Target, 
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Interviews',
      description: 'Experience intelligent interviews tailored to your skills and experience',
    },
    {
      icon: Target,
      title: 'Smart Resume Analysis',
      description: 'Automatic parsing and analysis of your resume with AI insights',
    },
    {
      icon: Briefcase,
      title: 'Industry-Ready',
      description: 'Built with best practices for scalability and performance',
    },
    {
      icon: Users,
      title: 'Multi-Role Platform',
      description: 'Separate interfaces for users, companies, and administrators',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and protected with industry standards',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance with modern technologies',
    },
  ];

  const benefits = [
    'Automated resume parsing and skill extraction',
    'Real-time interview feedback and scoring',
    'Personalized interview questions',
    'Comprehensive candidate profiles',
    'Advanced analytics and reporting',
    'Seamless company integration',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI Interviewer
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Next-Generation Interview Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white leading-tight">
              Transform Your
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Interview Experience
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              AI-powered platform that intelligently analyzes resumes, conducts smart interviews, 
              and connects talent with opportunities.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link
                href="/auth/register"
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-2xl hover:shadow-blue-500/50 flex items-center gap-2"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-semibold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-lg border border-slate-200 dark:border-slate-700"
              >
                Learn More
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-16 max-w-3xl mx-auto">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-blue-600">98%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Accuracy Rate</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-indigo-600">10k+</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Interviews</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-purple-600">500+</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Companies</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need to revolutionize your interview process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                Why Choose Our Platform?
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Built with cutting-edge technology and best practices to deliver 
                an unparalleled interview experience.
              </p>
              <div className="space-y-4 pt-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 text-lg">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">User Role</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Upload resume & take interviews</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Company Role</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Review candidates & conduct interviews</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Admin Role</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Manage users & companies</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-2xl opacity-20"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-center space-y-6 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Join thousands of users and companies already using our platform
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link
                  href="/auth/register"
                  className="group px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">
                AI Interviewer
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              © 2025 AI Interviewer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
