import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = String(body.id ?? "");

    if (!id) {
      return NextResponse.json(
        { message: "Category ID is required" },
        { status: 400 },
      );
    }

    const docRef = adminDb.collection("resourceCategories").doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 },
      );
    }

    const updateDoc: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json(
          { message: "Name cannot be empty" },
          { status: 400 },
        );
      }
      updateDoc.name = name;
    }

    if (body.resources !== undefined) {
      if (!Array.isArray(body.resources)) {
        return NextResponse.json(
          { message: "resources must be an array" },
          { status: 400 },
        );
      }
      updateDoc.resources = body.resources;
    }

    await docRef.update(updateDoc);

    return NextResponse.json(
      { message: "Category updated", id },
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
