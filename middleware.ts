import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './app/api/auth/[..nextauth]';


const corsOptions = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Origin': '*',
};

export async function middleware(request: NextRequest) {
    // Handle OPTIONS request for CORS preflight
    if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 204 });
        Object.entries(corsOptions).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    // Check if this is the login page to avoid redirect loops
    if (request.nextUrl.pathname.startsWith('/auth/login')) {
        const response = NextResponse.next();
        Object.entries(corsOptions).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    // Check for authenticated session using NextAuth
    const session = await getServerSession(authOptions);

    if (!session) {
        // Redirect unauthenticated users to login page
        return NextResponse.redirect(new URL('/auth/login', request.nextUrl.origin));
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
        '/equalizer/:path*',
        '/player/:path*',
        '/settings/:path*',
        '/visualizer/:path*',
        '/((?!auth|api|_next/static|favicon.ico).*)',
    ],
};