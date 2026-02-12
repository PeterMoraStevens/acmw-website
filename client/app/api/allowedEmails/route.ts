import { adminDb } from "@/lib/firebaseAdmin";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

const docRef = adminDb.collection("config").doc("allowedEmails");

async function isAdmin(email: string): Promise<boolean> {
  const doc = await docRef.get();
  const emails: string[] = doc.data()?.emails ?? [];
  return emails.includes(email);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const doc = await docRef.get();
    const emails: string[] = doc.data()?.emails ?? [];
    return NextResponse.json({ emails });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    await docRef.set(
      { emails: FieldValue.arrayUnion(email.trim().toLowerCase()) },
      { merge: true },
    );

    return NextResponse.json({ message: "Email added" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    // Prevent removing yourself
    if (email.trim().toLowerCase() === session.user.email.toLowerCase()) {
      return NextResponse.json(
        { message: "You cannot remove yourself" },
        { status: 400 },
      );
    }

    await docRef.update({
      emails: FieldValue.arrayRemove(email.trim().toLowerCase()),
    });

    return NextResponse.json({ message: "Email removed" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 },
    );
  }
}
