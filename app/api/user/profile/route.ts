import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, email } = await request.json();
        if (!name || !email) {
            return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Update user profile
        await db.collection("users").updateOne(
            { email: session.user.email },
            { $set: { name, email } }
        );

        return NextResponse.json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
} 