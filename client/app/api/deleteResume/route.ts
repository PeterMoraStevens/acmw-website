import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    if (!email.endsWith("@oregonstate.edu")) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const docRef = adminDb.collection("resumes").doc(email);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { message: "No resume found" },
        { status: 404 },
      );
    }

    const data = docSnap.data();
    if (data?.storagePath) {
      const bucket = adminStorage.bucket();
      await bucket.file(data.storagePath).delete().catch(() => {});
    }

    await docRef.delete();

    return NextResponse.json(
      { message: "Resume deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 },
    );
  }
}
