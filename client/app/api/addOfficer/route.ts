import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();

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
    const order = Number(form.get("order") ?? 0);

    // basic required validation
    if (!name || !role || !bio || !major) {
      return NextResponse.json(
        { message: "Missing required fields (name, role, bio, major)" },
        { status: 400 },
      );
    }

    const file = form.get("picture");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Picture file is required (field name: picture)" },
        { status: 400 },
      );
    }

    // Convert File -> Buffer for Admin SDK upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Make a safe-ish filename
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

    // Upload via Admin SDK
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(path);

    // Create a download token so the URL doesn't expire
    const downloadToken = crypto.randomUUID();

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type || "image/jpeg",
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      },
    });

    // Build a permanent Firebase Storage download URL
    const imgUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;

    // Store officer doc — Admin SDK doesn't accept undefined values, so omit empty fields
    const doc: Record<string, unknown> = {
      name,
      role,
      bio,
      img: imgUrl,
      imgPath: path,
      major,
      order,
      createdAt: FieldValue.serverTimestamp(),
    };
    if (minor) doc.minor = minor;
    if (hobbies) doc.hobbies = hobbies;
    if (responsibilities) doc.responsibilities = responsibilities;
    if (linkedin) doc.linkedin = linkedin;
    if (email) doc.email = email;
    if (websiteUrl) doc.websiteUrl = websiteUrl;
    if (socialUrl) doc.socialUrl = socialUrl;

    const docRef = await adminDb.collection("officers").add(doc);

    return NextResponse.json(
      {
        message: "Officer added successfully",
        id: docRef.id,
        img: imgUrl,
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
