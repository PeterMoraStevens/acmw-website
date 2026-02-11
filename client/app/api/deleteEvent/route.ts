import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    const docRef = adminDb.collection("events").doc(id);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      const images: { path: string }[] = data?.images ?? [];
      const bucket = adminStorage.bucket();

      // Delete all associated images
      for (const img of images) {
        await bucket.file(img.path).delete().catch(() => {});
      }
    }

    await docRef.delete();

    return NextResponse.json(
      { message: "Event deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
