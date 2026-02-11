import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    // Fetch the officer doc to get the image path before deleting
    const docRef = adminDb.collection("officers").doc(id);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      // Delete the storage image if imgPath was saved
      if (data?.imgPath) {
        const bucket = adminStorage.bucket();
        await bucket.file(data.imgPath).delete().catch(() => {
          // Ignore if file already deleted from storage
        });
      }
    }

    await docRef.delete();

    return NextResponse.json(
      { message: "Officer deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
