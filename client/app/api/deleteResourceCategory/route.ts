import { adminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "");

    if (!id) {
      return NextResponse.json(
        { message: "Category ID is required" },
        { status: 400 },
      );
    }

    await adminDb.collection("resourceCategories").doc(id).delete();

    return NextResponse.json(
      { message: "Category deleted" },
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
