import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, archived } = body;

    if (!id || typeof archived !== "boolean") {
      return NextResponse.json(
        { message: "id and archived (boolean) are required" },
        { status: 400 },
      );
    }

    const docRef = adminDb.collection("events").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 },
      );
    }

    await docRef.update({
      archived,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      { message: `Event ${archived ? "archived" : "unarchived"} successfully` },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
