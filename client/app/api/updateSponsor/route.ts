import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const form = await request.formData();

    const id = String(form.get("id") ?? "");
    const name = String(form.get("name") ?? "");
    const website = String(form.get("website") ?? "");

    if (!id || !name) {
      return NextResponse.json(
        { message: "Missing required fields (id, name)" },
        { status: 400 },
      );
    }

    const docRef = adminDb.collection("sponsors").doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return NextResponse.json(
        { message: "Sponsor not found" },
        { status: 404 },
      );
    }

    const updates: Record<string, unknown> = { name, website };

    const file = form.get("logo");
    if (file instanceof File && file.size > 0) {
      // Delete old logo from storage
      const oldData = existing.data();
      if (oldData?.logoPath) {
        const bucket = adminStorage.bucket();
        await bucket.file(oldData.logoPath).delete().catch(() => {});
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

      updates.logo = logoUrl;
      updates.logoPath = path;
    }

    await docRef.update(updates);

    return NextResponse.json(
      { message: "Sponsor updated successfully" },
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
