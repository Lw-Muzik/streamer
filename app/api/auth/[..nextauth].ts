// import NextAuth, { NextAuthOptions } from 'next-auth';
// import CredentialsProvider from 'next-auth/providers/credentials';
// import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
// import bcrypt from 'bcryptjs';
// import clientPromise from '@/lib/mongodb';
// // import { MongoClient } from 'mongodb';

// export const authOptions: NextAuthOptions = {
//     adapter: MongoDBAdapter(clientPromise),
//     providers: [
//         CredentialsProvider({
//             name: 'Credentials',
//             credentials: {
//                 email: { label: 'Email', type: 'email' },
//                 password: { label: 'Password', type: 'password' },
//             },
//             async authorize(credentials) {
//                 if (!credentials?.email || !credentials?.password) {
//                     throw new Error('Please provide both email and password');
//                 }

//                 const client = await clientPromise;
//                 const db = client.db();
//                 const user = await db.collection('users').findOne({ email: credentials.email });

//                 if (!user) {
//                     throw new Error('No user found with this email');
//                 }

//                 const isValidPassword = await bcrypt.compare(credentials.password, user.password);
//                 if (!isValidPassword) {
//                     throw new Error('Invalid password');
//                 }

//                 return {
//                     id: user._id.toString(),
//                     name: user.name,
//                     email: user.email,
//                 };
//             },
//         }),
//     ],
//     session: {
//         strategy: 'jwt',
//     },
//     pages: {
//         signIn: '/auth/login',
//         // signUp: '/auth/signup',
//     },
//     callbacks: {
//         async jwt({ token, user }) {
//             if (user) {
//                 token.id = user.id;
//             }
//             return token;
//         },
//         async session({ session, token }) {
//             if (session.user) {
//                 session.user.id = token.id as string;
//             }
//             return session;
//         },
//     },
//     secret: process.env.NEXTAUTH_SECRET,
// };

// export default NextAuth(authOptions);