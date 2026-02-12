import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    const form = await request.formData();

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

    // Collect image files (up to 6)
    const imageFiles: File[] = [];
    for (const entry of form.getAll("images")) {
      if (entry instanceof File && entry.size > 0) {
        imageFiles.push(entry);
      }
    }

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { message: "At least one image is required" },
        { status: 400 },
      );
    }
    if (imageFiles.length > 6) {
      return NextResponse.json(
        { message: "Maximum 6 images allowed" },
        { status: 400 },
      );
    }

    // Validate sizes
    for (const file of imageFiles) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: `Image "${file.name}" exceeds 5 MB limit` },
          { status: 400 },
        );
      }
    }

    const safeTitle = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const timestamp = Date.now();
    const bucket = adminStorage.bucket();

    const images: { url: string; path: string }[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
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
      images.push({ url, path });
    }

    const doc = {
      title,
      description,
      date,
      location,
      images,
      archived: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("events").add(doc);

    return NextResponse.json(
      { message: "Event added successfully", id: docRef.id },
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
