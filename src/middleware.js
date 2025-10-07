import { NextResponse } from 'next/server';

export function middleware(request) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/verify-email', '/auth/upload-resume', '/'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // Protected routes
    const protectedRoutes = ['/dashboard', '/profile', '/interviews', '/resumes'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // If user is not authenticated and trying to access protected route
    if (!token && isProtectedRoute) {
        const url = new URL('/auth/login', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }

    // If user is authenticated and trying to access auth pages
    if (token && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register'))) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)',
    ],
};
