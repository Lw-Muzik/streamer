import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { AuthOptions } from 'next-auth';

export const authOptions: AuthOptions = {
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Please provide both email and password');
                }

                const client = await clientPromise;
                const db = client.db();
                const user = await db.collection('users').findOne({ email: credentials.email });

                if (!user) {
                    throw new Error('No user found with this email');
                }

                const isValidPassword = await bcrypt.compare(credentials.password, user.password);
                if (!isValidPassword) {
                    throw new Error('Invalid password');
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/auth/login', // your custom login page
    },
    callbacks: {
        async jwt({ token, user, account, profile }: any) {
            // If the user is signing in for the first time
            if (user) {
                token.id = user.id ?? user.sub ?? token.id; // `user.sub` comes from Google
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.id;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Required for app router: 
export { handler as GET, handler as POST };
