import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const items: { id: string; order: number }[] = body.order;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "order array is required" },
        { status: 400 },
      );
    }

    const batch = adminDb.batch();

    for (const item of items) {
      const docRef = adminDb.collection("officers").doc(item.id);
      batch.update(docRef, { order: item.order });
    }

    await batch.commit();

    return NextResponse.json(
      { message: "Order updated successfully" },
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
