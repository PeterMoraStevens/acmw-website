import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import JSZip from "jszip";

export const runtime = "nodejs";

export async function GET() {
  try {
    const snapshot = await adminDb.collection("resumes").get();

    if (snapshot.empty) {
      return NextResponse.json(
        { message: "No resumes found" },
        { status: 404 },
      );
    }

    const zip = new JSZip();
    const bucket = adminStorage.bucket();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.storagePath) continue;

      try {
        const file = bucket.file(data.storagePath);
        const [contents] = await file.download();
        const fileName = data.fileName || `${doc.id}.pdf`;
        zip.file(fileName, contents);
      } catch {
        // Skip files that can't be downloaded
        console.error(`Failed to download resume: ${data.storagePath}`);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "blob" });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="resume-book.zip"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 },
    );
  }
}
