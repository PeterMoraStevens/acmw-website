/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ImageCropper from "@/components/image-cropper";
import {
  Edit,
  PlusSquare,
  Trash2Icon,
  Crop,
  Download,
  FileText,
  ExternalLink,
} from "lucide-react";

// --- Types ---

type ResumeEntry = {
  id: string;
  email: string;
  fileName: string;
  url: string;
  storagePath: string;
  uploadedAt: { seconds: number } | null;
};

type Sponsor = {
  id: string;
  name: string;
  logo: string;
  logoPath: string;
  website?: string;
  order?: number;
};

type SponsorFormFields = {
  name: string;
  website: string;
};

const emptyForm: SponsorFormFields = { name: "", website: "" };

// --- Helpers ---

const formatDate = (ts: { seconds: number } | null) => {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// --- Page ---

const Page = () => {
  // Resume book state
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Sponsor state
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Create sponsor form
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<SponsorFormFields>(emptyForm);
  const [createLogoFile, setCreateLogoFile] = useState<File | null>(null);
  const [createPreviewUrl, setCreatePreviewUrl] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Edit sponsor form
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [editForm, setEditForm] = useState<SponsorFormFields>(emptyForm);
  const [editLogoBlob, setEditLogoBlob] = useState<Blob | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFileInputKey, setEditFileInputKey] = useState(0);

  // Crop state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropContext, setCropContext] = useState<"create" | "edit">("create");

  // --- Validation ---

  const canSubmitCreate = useMemo(
    () => createForm.name.trim().length > 0 && createLogoFile !== null,
    [createForm, createLogoFile],
  );

  const canSubmitEdit = useMemo(
    () => editForm.name.trim().length > 0,
    [editForm],
  );

  // --- Fetch data ---

  const fetchResumes = useCallback(async () => {
    const snapshot = await getDocs(collection(db, "resumes"));
    const data: ResumeEntry[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ResumeEntry, "id">),
    }));
    data.sort((a, b) => {
      const aTime = a.uploadedAt?.seconds ?? 0;
      const bTime = b.uploadedAt?.seconds ?? 0;
      return bTime - aTime;
    });
    setResumes(data);
  }, []);

  const fetchSponsors = useCallback(async () => {
    const snapshot = await getDocs(collection(db, "sponsors"));
    const data: Sponsor[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Sponsor, "id">),
    }));
    data.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    setSponsors(data);
  }, []);

  useEffect(() => {
    fetchResumes()
      .catch((err) =>
        toast("Error fetching resumes", { description: String(err) }),
      )
      .finally(() => setLoadingResumes(false));

    fetchSponsors()
      .catch((err) =>
        toast("Error fetching sponsors", { description: String(err) }),
      )
      .finally(() => setLoadingSponsors(false));
  }, [fetchResumes, fetchSponsors]);

  // --- Resume book download ---

  const handleDownloadResumeBook = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/downloadResumeBook");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume-book.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast("Resume book downloaded");
    } catch (err) {
      toast("Error downloading resume book", { description: String(err) });
    } finally {
      setDownloading(false);
    }
  };

  // --- Create sponsor handlers ---

  const handleCreateTextChange =
    (field: keyof SponsorFormFields) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropImageSrc(url);
    setCropContext("create");
    setIsCropping(true);
  };

  const resetCreateForm = () => {
    setCreateForm(emptyForm);
    setCreateLogoFile(null);
    if (createPreviewUrl) URL.revokeObjectURL(createPreviewUrl);
    setCreatePreviewUrl(null);
    setFileInputKey((k) => k + 1);
  };

  const handleAddSponsor = async () => {
    const fd = new FormData();
    fd.append("name", createForm.name);
    fd.append("website", createForm.website);
    fd.append("order", String(sponsors.length));

    if (createLogoFile) fd.append("logo", createLogoFile);

    const res = await fetch("/api/addSponsor", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to add sponsor");
    }

    resetCreateForm();
  };

  const onSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmitCreate) {
      toast("Missing required fields", {
        description: "Name and logo are required.",
      });
      return;
    }

    try {
      setSubmitting(true);
      toast("Creating sponsor...");
      await handleAddSponsor();
      await fetchSponsors();
      toast("Sponsor has been created");
      setCreateDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast("Error creating sponsor", { description: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Edit sponsor handlers ---

  const openEditDialog = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setEditForm({
      name: sponsor.name,
      website: sponsor.website ?? "",
    });
    setEditLogoBlob(null);
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    setEditPreviewUrl(null);
    setEditFileInputKey((k) => k + 1);
    setEditDialogOpen(true);
  };

  const handleEditTextChange =
    (field: keyof SponsorFormFields) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropImageSrc(url);
    setCropContext("edit");
    setIsCropping(true);
  };

  const handleRecropExisting = () => {
    if (!editingSponsor) return;
    setCropImageSrc(editingSponsor.logo);
    setCropContext("edit");
    setIsCropping(true);
  };

  const handleUpdateSponsor = async () => {
    if (!editingSponsor) return;

    const fd = new FormData();
    fd.append("id", editingSponsor.id);
    fd.append("name", editForm.name);
    fd.append("website", editForm.website);

    if (editLogoBlob) {
      fd.append("logo", editLogoBlob, "cropped-logo.png");
    }

    const res = await fetch("/api/updateSponsor", {
      method: "PUT",
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to update sponsor");
    }
  };

  const onSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmitEdit) {
      toast("Missing required fields", {
        description: "Name is required.",
      });
      return;
    }

    try {
      setSubmitting(true);
      toast("Updating sponsor...");
      await handleUpdateSponsor();
      await fetchSponsors();
      toast("Sponsor has been updated");
      setEditDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast("Error updating sponsor", { description: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Delete sponsor ---

  const handleDeleteSponsor = (id: string) => {
    try {
      fetch("/api/deleteSponsor", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      toast("Sponsor deleted successfully");
      setSponsors((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      toast("Error deleting sponsor", { description: `${error}` });
    }
  };

  // --- Crop handlers ---

  const handleCropComplete = (blob: Blob) => {
    if (cropContext === "create") {
      const file = new File([blob], "cropped-logo.png", { type: blob.type });
      setCreateLogoFile(file);
      if (createPreviewUrl) URL.revokeObjectURL(createPreviewUrl);
      setCreatePreviewUrl(URL.createObjectURL(blob));
    } else {
      setEditLogoBlob(blob);
      if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
      setEditPreviewUrl(URL.createObjectURL(blob));
    }
    if (cropImageSrc && !cropImageSrc.startsWith("http")) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(null);
    setIsCropping(false);
  };

  const handleCropCancel = () => {
    if (cropImageSrc && !cropImageSrc.startsWith("http")) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(null);
    setIsCropping(false);
  };

  return (
    <div className="gap-6 p-6 mt-18">
      {/* Crop overlay dialog */}
      <Dialog
        open={isCropping}
        onOpenChange={(open) => !open && handleCropCancel()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crop Logo</DialogTitle>
            <DialogDescription>
              Drag to reposition and use the slider to zoom.
            </DialogDescription>
          </DialogHeader>
          {cropImageSrc && (
            <ImageCropper
              imageSrc={cropImageSrc}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
              aspectRatio={16 / 9}
              cropShape="rect"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ========== SECTION: Resume Book ========== */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Resume Book</h2>
          <Button
            onClick={handleDownloadResumeBook}
            disabled={downloading || resumes.length === 0}
          >
            <Download className="w-4 h-4 mr-1" />
            {downloading ? "Downloading..." : "Download All (ZIP)"}
          </Button>
        </div>

        {loadingResumes ? (
          <p className="text-muted-foreground">Loading resumes...</p>
        ) : resumes.length === 0 ? (
          <p className="text-muted-foreground">
            No resumes have been uploaded yet.
          </p>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background">
                <tr>
                  <th className="text-left p-3 font-semibold">Email</th>
                  <th className="text-left p-3 font-semibold">File Name</th>
                  <th className="text-left p-3 font-semibold">Uploaded</th>
                  <th className="text-right p-3 font-semibold">View</th>
                </tr>
              </thead>
              <tbody className="bg-secondary-background">
                {resumes.map((resume) => (
                  <tr key={resume.id} className="border-t">
                    <td className="p-3">{resume.email}</td>
                    <td className="p-3">
                      <span className="truncate max-w-48">
                        {resume.fileName}
                      </span>
                    </td>
                    <td className="p-3">{formatDate(resume.uploadedAt)}</td>
                    <td className="p-3 text-right">
                      <a
                        href={resume.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="neutral">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-sm text-muted-foreground mt-2">
          {resumes.length} resume{resumes.length !== 1 ? "s" : ""} uploaded
        </p>
      </div>

      {/* ========== SECTION: Manage Sponsors ========== */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Manage Sponsors</h2>

        {/* Create sponsor dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <form onSubmit={onSubmitCreate}>
            <DialogTrigger asChild>
              <Button className="bg-purple-500 justify-center mb-4">
                <PlusSquare /> Add Sponsor
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-106.25 max-h-[70%] overflow-scroll">
              <DialogHeader>
                <DialogTitle>Add Sponsor</DialogTitle>
                <DialogDescription>
                  Add a new sponsor company. (* is required)
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="sponsor-name">Company Name*</Label>
                  <Input
                    id="sponsor-name"
                    placeholder="Company name"
                    required
                    value={createForm.name}
                    onChange={handleCreateTextChange("name")}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="sponsor-logo">Logo*</Label>
                  <Input
                    key={fileInputKey}
                    id="sponsor-logo"
                    type="file"
                    accept=".png, .jpg, .jpeg, .svg, .webp"
                    required={!createLogoFile}
                    onChange={handleCreateFileChange}
                  />
                  {createPreviewUrl && (
                    <img
                      src={createPreviewUrl}
                      alt="Logo preview"
                      className="w-32 h-18 border shadow-md object-contain rounded"
                    />
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="sponsor-website">Website URL</Label>
                  <Input
                    id="sponsor-website"
                    placeholder="https://example.com"
                    value={createForm.website}
                    onChange={handleCreateTextChange("website")}
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="neutral"
                    onClick={resetCreateForm}
                  >
                    Cancel
                  </Button>
                </DialogClose>

                <Button type="submit" onClick={onSubmitCreate}>
                  {submitting ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </form>
        </Dialog>

        {/* Edit sponsor dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-106.25 max-h-[70%] overflow-scroll">
            <form onSubmit={onSubmitEdit}>
              <DialogHeader>
                <DialogTitle>Edit Sponsor</DialogTitle>
                <DialogDescription>
                  Update sponsor details below. (* is required)
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={editPreviewUrl ?? editingSponsor?.logo ?? ""}
                    alt="Sponsor logo"
                    className="w-32 h-18 border shadow-md object-contain rounded"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="neutral"
                      size="sm"
                      onClick={handleRecropExisting}
                    >
                      <Crop className="w-4 h-4 mr-1" /> Re-crop
                    </Button>
                  </div>
                  <div className="grid w-full max-w-64 items-center gap-1.5">
                    <Label htmlFor="edit-logo">Upload New Logo</Label>
                    <Input
                      key={editFileInputKey}
                      id="edit-logo"
                      type="file"
                      accept=".png, .jpg, .jpeg, .svg, .webp"
                      onChange={handleEditFileChange}
                    />
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="edit-sponsor-name">Company Name*</Label>
                  <Input
                    id="edit-sponsor-name"
                    placeholder="Company name"
                    required
                    value={editForm.name}
                    onChange={handleEditTextChange("name")}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="edit-sponsor-website">Website URL</Label>
                  <Input
                    id="edit-sponsor-website"
                    placeholder="https://example.com"
                    value={editForm.website}
                    onChange={handleEditTextChange("website")}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="neutral"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Sponsor cards */}
        {loadingSponsors ? (
          <p className="text-muted-foreground">Loading sponsors...</p>
        ) : sponsors.length === 0 ? (
          <p className="text-muted-foreground">No sponsors added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center">
            {sponsors.map((sponsor) => (
              <Card key={sponsor.id} className="w-full max-w-sm text-center">
                <CardHeader>
                  <CardTitle>{sponsor.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-2">
                  <img
                    src={sponsor.logo}
                    alt={`${sponsor.name} logo`}
                    className="w-40 h-24 object-contain"
                  />
                  {sponsor.website && (
                    <a
                      href={sponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </a>
                  )}
                  <div className="flex items-end mt-2">
                    <Button
                      className="mr-2 bg-green-500"
                      size="icon"
                      onClick={() => openEditDialog(sponsor)}
                    >
                      <Edit />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="bg-red-500" size="icon">
                          <Trash2Icon />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete{" "}
                            <span className="font-bold">
                              {sponsor.name}&apos;s
                            </span>{" "}
                            sponsor listing.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSponsor(sponsor.id)}
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
