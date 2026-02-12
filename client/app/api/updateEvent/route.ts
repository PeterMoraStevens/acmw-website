import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function PUT(request: Request) {
  try {
    const form = await request.formData();

    const id = String(form.get("id") ?? "");
    if (!id) {
      return NextResponse.json(
        { message: "Event ID is required" },
        { status: 400 },
      );
    }

    const docRef = adminDb.collection("events").doc(id);
    const existingDoc = await docRef.get();
    if (!existingDoc.exists) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 },
      );
    }

    const title = String(form.get("title") ?? "");
    const description = String(form.get("description") ?? "");
    const date = String(form.get("date") ?? "");
    const location = String(form.get("location") ?? "");

    if (!title || !description || !date) {
      return NextResponse.json(
        { message: "Missing required fields (title, description, date)" },
        { status: 400 },
      );
    }

    // Parse existing images the client wants to keep
    const existingImagesRaw = String(form.get("existingImages") ?? "[]");
    let keptImages: { url: string; path: string }[] = [];
    try {
      keptImages = JSON.parse(existingImagesRaw);
    } catch {
      keptImages = [];
    }

    // Collect new image files
    const newFiles: File[] = [];
    for (const entry of form.getAll("images")) {
      if (entry instanceof File && entry.size > 0) {
        newFiles.push(entry);
      }
    }

    // Validate sizes
    for (const file of newFiles) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: `Image "${file.name}" exceeds 5 MB limit` },
          { status: 400 },
        );
      }
    }

    const totalImages = keptImages.length + newFiles.length;
    if (totalImages === 0) {
      return NextResponse.json(
        { message: "At least one image is required" },
        { status: 400 },
      );
    }
    if (totalImages > 6) {
      return NextResponse.json(
        { message: "Maximum 6 images allowed" },
        { status: 400 },
      );
    }

    // Delete removed images from storage
    const oldData = existingDoc.data();
    const oldImages: { url: string; path: string }[] = oldData?.images ?? [];
    const keptPaths = new Set(keptImages.map((img) => img.path));
    const bucket = adminStorage.bucket();

    for (const oldImg of oldImages) {
      if (!keptPaths.has(oldImg.path)) {
        await bucket.file(oldImg.path).delete().catch(() => {});
      }
    }

    // Upload new images
    const safeTitle = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const timestamp = Date.now();
    const uploadedImages: { url: string; path: string }[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const ext = file.name.split(".").pop() || "jpg";
      const path = `events/${safeTitle}-${timestamp}-${i}.${ext}`;
      const fileRef = bucket.file(path);
      const downloadToken = crypto.randomUUID();

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type || "image/jpeg",
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
      });

      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;
      uploadedImages.push({ url, path });
    }

    const allImages = [...keptImages, ...uploadedImages];

    await docRef.update({
      title,
      description,
      date,
      location,
      images: allImages,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      { message: "Event updated successfully", id },
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
