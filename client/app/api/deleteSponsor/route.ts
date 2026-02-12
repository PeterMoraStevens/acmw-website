import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    const docRef = adminDb.collection("sponsors").doc(id);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      if (data?.logoPath) {
        const bucket = adminStorage.bucket();
        await bucket.file(data.logoPath).delete().catch(() => {});
      }
    }

    await docRef.delete();

    return NextResponse.json(
      { message: "Sponsor deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
