import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next';
// import authOptions from "@/app/api/auth/[...nextauth]/route";

const corsOptions = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Origin': '*',
};

export async function middleware(request: NextRequest) {
    // console.log('Middleware triggered for:', request.nextUrl.pathname);

    // Handle OPTIONS request for CORS preflight
    if (request.method === 'OPTIONS') {
        // console.log('Handling OPTIONS request');
        const response = new NextResponse(null, { status: 204 });
        Object.entries(corsOptions).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    // Skip middleware for auth pages and static files
    if (
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/api') ||
        request.nextUrl.pathname.includes('.')
    ) {
        // console.log('Skipping middleware for:', request.nextUrl.pathname);
        return NextResponse.next();
    }

    // Check for authenticated session using NextAuth
    const session = request.cookies.get('next-auth.session-token')?.value ||
        request.cookies.get('__Secure-next-auth.session-token')?.value;
    // console.log('Session found:', !!session);
    // console.log('Request cookies:', request.cookies.getAll());

    if (!session) {
        // console.log('No session found, redirecting to login');
        // Redirect unauthenticated users to login page
        const response = NextResponse.redirect(new URL('/auth/login', request.nextUrl.origin));
        Object.entries(corsOptions).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    // For authenticated requests, apply CORS headers and proceed
    const response = NextResponse.next();
    Object.entries(corsOptions).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}

// Specify which paths should be protected
export const config = {
    matcher: [
        '/',
        '/player',
        '/settings',
        '/visualizer',
        '/equalizer',
        '/((?!auth|api|_next/static|favicon.ico).*)',
    ],
};