import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    if (!email.endsWith("@oregonstate.edu")) {
      return NextResponse.json(
        { message: "Only @oregonstate.edu emails can upload resumes" },
        { status: 403 },
      );
    }

    const form = await request.formData();
    const file = form.get("resume");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Resume file is required" },
        { status: 400 },
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { message: "Only PDF files are accepted" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File exceeds 4 MB limit" },
        { status: 400 },
      );
    }

    // Delete existing resume from storage if one exists
    const existingDoc = await adminDb.collection("resumes").doc(email).get();
    if (existingDoc.exists) {
      const existingData = existingDoc.data();
      if (existingData?.storagePath) {
        const bucket = adminStorage.bucket();
        await bucket.file(existingData.storagePath).delete().catch(() => {});
      }
    }

    // Upload to Firebase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeEmail = email.replace(/[^a-z0-9@.]+/gi, "-");
    const storagePath = `resumes/${safeEmail}.pdf`;

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(storagePath);
    const downloadToken = crypto.randomUUID();

    await fileRef.save(buffer, {
      metadata: {
        contentType: "application/pdf",
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      },
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;

    // Store metadata in Firestore
    await adminDb.collection("resumes").doc(email).set({
      email,
      fileName: file.name,
      url,
      storagePath,
      uploadedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      { message: "Resume uploaded successfully", url, fileName: file.name },
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
