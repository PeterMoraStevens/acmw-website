import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const form = await request.formData();

    const id = String(form.get("id") ?? "");
    if (!id) {
      return NextResponse.json(
        { message: "Officer ID is required" },
        { status: 400 },
      );
    }

    const docRef = adminDb.collection("officers").doc(id);
    const existingDoc = await docRef.get();
    if (!existingDoc.exists) {
      return NextResponse.json(
        { message: "Officer not found" },
        { status: 404 },
      );
    }

    const name = String(form.get("name") ?? "");
    const role = String(form.get("role") ?? "");
    const bio = String(form.get("bio") ?? "");
    const major = String(form.get("major") ?? "");

    const minor = String(form.get("minor") ?? "");
    const hobbies = String(form.get("hobbies") ?? "");
    const responsibilities = String(form.get("responsibilities") ?? "");
    const linkedin = String(form.get("linkedin") ?? "");
    const email = String(form.get("email") ?? "");
    const websiteUrl = String(form.get("websiteUrl") ?? "");
    const socialUrl = String(form.get("socialUrl") ?? "");

    if (!name || !role || !bio || !major) {
      return NextResponse.json(
        { message: "Missing required fields (name, role, bio, major)" },
        { status: 400 },
      );
    }

    const updateDoc: Record<string, unknown> = {
      name,
      role,
      bio,
      major,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (minor) updateDoc.minor = minor;
    else updateDoc.minor = FieldValue.delete();
    if (hobbies) updateDoc.hobbies = hobbies;
    else updateDoc.hobbies = FieldValue.delete();
    if (responsibilities) updateDoc.responsibilities = responsibilities;
    else updateDoc.responsibilities = FieldValue.delete();
    if (linkedin) updateDoc.linkedin = linkedin;
    else updateDoc.linkedin = FieldValue.delete();
    if (email) updateDoc.email = email;
    else updateDoc.email = FieldValue.delete();
    if (websiteUrl) updateDoc.websiteUrl = websiteUrl;
    else updateDoc.websiteUrl = FieldValue.delete();
    if (socialUrl) updateDoc.socialUrl = socialUrl;
    else updateDoc.socialUrl = FieldValue.delete();

    // Handle optional new image
    const file = form.get("picture");
    if (file instanceof File && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const safeName = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      const safeRole = role
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `officers/${safeName}-${safeRole}-${Date.now()}.${ext}`;

      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(path);
      const downloadToken = crypto.randomUUID();

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type || "image/jpeg",
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
      });

      const imgUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;

      updateDoc.img = imgUrl;
      updateDoc.imgPath = path;

      // Delete old image from storage
      const oldData = existingDoc.data();
      if (oldData?.imgPath) {
        const oldBucket = adminStorage.bucket();
        await oldBucket
          .file(oldData.imgPath)
          .delete()
          .catch(() => {});
      }
    }

    await docRef.update(updateDoc);

    return NextResponse.json(
      { message: "Officer updated successfully", id },
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
