import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const name = String(form.get("name") ?? "");
    const website = String(form.get("website") ?? "");
    const order = Number(form.get("order") ?? 0);

    if (!name) {
      return NextResponse.json(
        { message: "Missing required field: name" },
        { status: 400 },
      );
    }

    const file = form.get("logo");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Logo file is required (field name: logo)" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeName = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const ext = file.name.split(".").pop() || "png";
    const path = `sponsors/${safeName}-${Date.now()}.${ext}`;

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(path);
    const downloadToken = crypto.randomUUID();

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type || "image/png",
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      },
    });

    const logoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;

    const doc: Record<string, unknown> = {
      name,
      logo: logoUrl,
      logoPath: path,
      order,
      createdAt: FieldValue.serverTimestamp(),
    };
    if (website) doc.website = website;

    const docRef = await adminDb.collection("sponsors").add(doc);

    return NextResponse.json(
      {
        message: "Sponsor added successfully",
        id: docRef.id,
        logo: logoUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 },
    );
  }
}
