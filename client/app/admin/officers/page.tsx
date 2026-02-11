/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";

import { collection, getDocs } from "firebase/firestore";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
import { Edit, PlusSquare, Trash2Icon, Crop, GripVertical } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ImageCropper from "@/components/image-cropper";

type Officer = {
  id: string;
  name: string;
  role: string;
  bio: string;
  img: string;
  major: string;
  order?: number;
  minor?: string;
  hobbies?: string;
  responsibilities?: string;
  linkedin?: string;
  email?: string;
  websiteUrl?: string;
  socialUrl?: string;
};

type OfficerFormFields = {
  name: string;
  role: string;
  bio: string;
  major: string;
  minor: string;
  hobbies: string;
  responsibilities: string;
  linkedin: string;
  email: string;
  websiteUrl: string;
  socialUrl: string;
};

const emptyFormFields: OfficerFormFields = {
  name: "",
  role: "",
  bio: "",
  major: "",
  minor: "",
  hobbies: "",
  responsibilities: "",
  linkedin: "",
  email: "",
  websiteUrl: "",
  socialUrl: "",
};

function SortableOfficerCard({
  officer,
  onEdit,
  onDelete,
}: {
  officer: Officer;
  onEdit: (o: Officer) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: officer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="w-full max-w-sm text-center"
    >
      <CardHeader>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5" />
          </button>
          <CardTitle>{officer.name}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-2">
        <img
          src={officer.img}
          alt={`Image of ${officer.name}`}
          className="w-32 h-32 rounded-full border shadow-md object-cover"
        />
        <p className="font-semibold">{officer.role}</p>

        <div className="flex items-end">
          <Button
            className="mr-2 bg-green-500"
            size={"icon"}
            onClick={() => onEdit(officer)}
          >
            <Edit />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-red-500" size={"icon"}>
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
                    {officer.name}&apos;s
                  </span>{" "}
                  officer listing and their data from the server.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(officer.id)}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

const Page = () => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Create form state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] =
    useState<OfficerFormFields>(emptyFormFields);
  const [createPictureFile, setCreatePictureFile] = useState<File | null>(null);
  const [createPreviewUrl, setCreatePreviewUrl] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Edit form state
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [editForm, setEditForm] = useState<OfficerFormFields>(emptyFormFields);
  const [editPictureBlob, setEditPictureBlob] = useState<Blob | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFileInputKey, setEditFileInputKey] = useState(0);

  // Crop state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropContext, setCropContext] = useState<"create" | "edit">("create");

  const canSubmitCreate = useMemo(() => {
    return (
      createForm.name.trim().length > 0 &&
      createForm.role.trim().length > 0 &&
      createForm.bio.trim().length > 0 &&
      createForm.major.trim().length > 0 &&
      createPictureFile !== null
    );
  }, [createForm, createPictureFile]);

  const canSubmitEdit = useMemo(() => {
    return (
      editForm.name.trim().length > 0 &&
      editForm.role.trim().length > 0 &&
      editForm.bio.trim().length > 0 &&
      editForm.major.trim().length > 0
    );
  }, [editForm]);

  // --- Shared helpers ---

  const fetchOfficers = useCallback(async () => {
    const snapshot = await getDocs(collection(db, "officers"));
    const officerData: Officer[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Officer, "id">),
    }));
    officerData.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    setOfficers(officerData);
  }, []);

  // --- Create form handlers ---

  const handleCreateTextChange =
    (field: keyof OfficerFormFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    setCreateForm(emptyFormFields);
    setCreatePictureFile(null);
    if (createPreviewUrl) URL.revokeObjectURL(createPreviewUrl);
    setCreatePreviewUrl(null);
    setFileInputKey((k) => k + 1);
  };

  const handleAddOfficer = async () => {
    const fd = new FormData();
    fd.append("name", createForm.name);
    fd.append("role", createForm.role);
    fd.append("bio", createForm.bio);
    fd.append("major", createForm.major);
    fd.append("order", String(officers.length));

    if (createForm.minor) fd.append("minor", createForm.minor);
    if (createForm.hobbies) fd.append("hobbies", createForm.hobbies);
    if (createForm.responsibilities)
      fd.append("responsibilities", createForm.responsibilities);
    if (createForm.linkedin) fd.append("linkedin", createForm.linkedin);
    if (createForm.email) fd.append("email", createForm.email);
    if (createForm.websiteUrl)
      fd.append("websiteUrl", createForm.websiteUrl);
    if (createForm.socialUrl) fd.append("socialUrl", createForm.socialUrl);

    if (createPictureFile) fd.append("picture", createPictureFile);

    const res = await fetch("/api/addOfficer", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to add officer");
    }

    resetCreateForm();
  };

  const onSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmitCreate) {
      toast("Missing required fields", {
        description: "Name, role, bio, major, and picture are required.",
      });
      return;
    }

    try {
      setSubmitting(true);
      toast("Creating officer...");
      await handleAddOfficer();
      await fetchOfficers();
      toast("Officer has been created");
      setCreateDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast("Error creating officer", { description: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Edit form handlers ---

  const openEditDialog = (officer: Officer) => {
    setEditingOfficer(officer);
    setEditForm({
      name: officer.name,
      role: officer.role,
      bio: officer.bio,
      major: officer.major,
      minor: officer.minor ?? "",
      hobbies: officer.hobbies ?? "",
      responsibilities: officer.responsibilities ?? "",
      linkedin: officer.linkedin ?? "",
      email: officer.email ?? "",
      websiteUrl: officer.websiteUrl ?? "",
      socialUrl: officer.socialUrl ?? "",
    });
    setEditPictureBlob(null);
    if (editPreviewUrl) URL.revokeObjectURL(editPreviewUrl);
    setEditPreviewUrl(null);
    setEditFileInputKey((k) => k + 1);
    setEditDialogOpen(true);
  };

  const handleEditTextChange =
    (field: keyof OfficerFormFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    if (!editingOfficer) return;
    setCropImageSrc(editingOfficer.img);
    setCropContext("edit");
    setIsCropping(true);
  };

  const handleUpdateOfficer = async () => {
    if (!editingOfficer) return;

    const fd = new FormData();
    fd.append("id", editingOfficer.id);
    fd.append("name", editForm.name);
    fd.append("role", editForm.role);
    fd.append("bio", editForm.bio);
    fd.append("major", editForm.major);
    fd.append("minor", editForm.minor);
    fd.append("hobbies", editForm.hobbies);
    fd.append("responsibilities", editForm.responsibilities);
    fd.append("linkedin", editForm.linkedin);
    fd.append("email", editForm.email);
    fd.append("websiteUrl", editForm.websiteUrl);
    fd.append("socialUrl", editForm.socialUrl);

    if (editPictureBlob) {
      fd.append("picture", editPictureBlob, "cropped-officer.jpg");
    }

    const res = await fetch("/api/updateOfficer", {
      method: "PUT",
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to update officer");
    }
  };

  const onSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmitEdit) {
      toast("Missing required fields", {
        description: "Name, role, bio, and major are required.",
      });
      return;
    }

    try {
      setSubmitting(true);
      toast("Updating officer...");
      await handleUpdateOfficer();
      await fetchOfficers();
      toast("Officer has been updated");
      setEditDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast("Error updating officer", { description: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Delete handler ---

  const handleDeleteOfficer = (id: string) => {
    try {
      fetch("/api/deleteOfficer", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      toast("Officer deleted successfully");
      setOfficers((prev) => prev.filter((officer) => officer.id !== id));
    } catch (error) {
      toast("Error deleting officer", {
        description: `${error}`,
      });
    }
  };

  // --- Crop handlers ---

  const handleCropComplete = (blob: Blob) => {
    if (cropContext === "create") {
      const file = new File([blob], "cropped.jpg", { type: blob.type });
      setCreatePictureFile(file);
      if (createPreviewUrl) URL.revokeObjectURL(createPreviewUrl);
      setCreatePreviewUrl(URL.createObjectURL(blob));
    } else {
      setEditPictureBlob(blob);
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

  // --- Drag-and-drop reorder ---

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const saveOrder = async (reordered: Officer[]) => {
    const order = reordered.map((o, i) => ({ id: o.id, order: i }));
    try {
      await fetch("/api/reorderOfficers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
    } catch {
      toast("Failed to save order");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = officers.findIndex((o) => o.id === active.id);
    const newIndex = officers.findIndex((o) => o.id === over.id);
    const reordered = arrayMove(officers, oldIndex, newIndex);
    setOfficers(reordered);
    saveOrder(reordered);
  };

  // --- Initial fetch ---

  useEffect(() => {
    fetchOfficers()
      .catch((error) =>
        toast("Error fetching officers:", { description: `${error}` }),
      )
      .finally(() => setLoading(false));
  }, [fetchOfficers]);

  if (loading) {
    return (
      <div className="flex justify-center p-10 text-lg">
        Loading officers...
      </div>
    );
  }

  return (
    <div className="gap-6 p-6 mt-18">
      {/* Crop overlay dialog */}
      <Dialog
        open={isCropping}
        onOpenChange={(open) => !open && handleCropCancel()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription>
              Drag to reposition and use the slider to zoom.
            </DialogDescription>
          </DialogHeader>
          {cropImageSrc && (
            <ImageCropper
              imageSrc={cropImageSrc}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create officer dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <form onSubmit={onSubmitCreate}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 justify-center mb-4">
              <PlusSquare /> Add Officer
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-106.25 max-h-[70%] overflow-scroll">
            <DialogHeader>
              <DialogTitle>Add Officer</DialogTitle>
              <DialogDescription>
                Add details for a new officer here. Click create when
                you&apos;re done. (* is required)
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="name">Name*</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="name"
                  required
                  value={createForm.name}
                  onChange={handleCreateTextChange("name")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="role">Role*</Label>
                <Input
                  id="role"
                  name="role"
                  placeholder="role"
                  required
                  value={createForm.role}
                  onChange={handleCreateTextChange("role")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="bio">Bio*</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="bio"
                  required
                  value={createForm.bio}
                  onChange={handleCreateTextChange("bio")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="picture">Picture*</Label>
                <Input
                  key={fileInputKey}
                  id="picture"
                  name="picture"
                  type="file"
                  required={!createPictureFile}
                  accept=".png, .jpg, .jpeg"
                  onChange={handleCreateFileChange}
                />
                {createPreviewUrl && (
                  <img
                    src={createPreviewUrl}
                    alt="Crop preview"
                    className="w-24 h-24 rounded-full border shadow-md object-cover"
                  />
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="major">Major*</Label>
                <Input
                  id="major"
                  name="major"
                  placeholder="major"
                  required
                  value={createForm.major}
                  onChange={handleCreateTextChange("major")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="minor">Minor</Label>
                <Input
                  id="minor"
                  name="minor"
                  placeholder="minor"
                  value={createForm.minor}
                  onChange={handleCreateTextChange("minor")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="hobbies">Hobbies</Label>
                <Textarea
                  id="hobbies"
                  name="hobbies"
                  placeholder="hobbies"
                  value={createForm.hobbies}
                  onChange={handleCreateTextChange("hobbies")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="responsibilities">Responsibilities</Label>
                <Textarea
                  id="responsibilities"
                  name="responsibilities"
                  placeholder="responsibilities"
                  value={createForm.responsibilities}
                  onChange={handleCreateTextChange("responsibilities")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="linkedin">Linkedin</Label>
                <Input
                  id="linkedin"
                  name="linkedin"
                  placeholder="linkedin"
                  value={createForm.linkedin}
                  onChange={handleCreateTextChange("linkedin")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email"
                  value={createForm.email}
                  onChange={handleCreateTextChange("email")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="websiteUrl">Website Url</Label>
                <Input
                  id="websiteUrl"
                  name="websiteUrl"
                  placeholder="website url"
                  value={createForm.websiteUrl}
                  onChange={handleCreateTextChange("websiteUrl")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="socialUrl">Socials</Label>
                <Input
                  id="socialUrl"
                  name="socialUrl"
                  placeholder="socials"
                  value={createForm.socialUrl}
                  onChange={handleCreateTextChange("socialUrl")}
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

      {/* Edit officer dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-106.25 max-h-[70%] overflow-scroll">
          <form onSubmit={onSubmitEdit}>
            <DialogHeader>
              <DialogTitle>Edit Officer</DialogTitle>
              <DialogDescription>
                Update officer details below. (* is required)
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Current / new image preview */}
              <div className="flex flex-col items-center gap-2">
                <img
                  src={editPreviewUrl ?? editingOfficer?.img ?? ""}
                  alt="Officer"
                  className="w-28 h-28 rounded-full border shadow-md object-cover"
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
                  <Label htmlFor="edit-picture">Upload New Image</Label>
                  <Input
                    key={editFileInputKey}
                    id="edit-picture"
                    type="file"
                    accept=".png, .jpg, .jpeg"
                    onChange={handleEditFileChange}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-name">Name*</Label>
                <Input
                  id="edit-name"
                  placeholder="name"
                  required
                  value={editForm.name}
                  onChange={handleEditTextChange("name")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-role">Role*</Label>
                <Input
                  id="edit-role"
                  placeholder="role"
                  required
                  value={editForm.role}
                  onChange={handleEditTextChange("role")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-bio">Bio*</Label>
                <Textarea
                  id="edit-bio"
                  placeholder="bio"
                  required
                  value={editForm.bio}
                  onChange={handleEditTextChange("bio")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-major">Major*</Label>
                <Input
                  id="edit-major"
                  placeholder="major"
                  required
                  value={editForm.major}
                  onChange={handleEditTextChange("major")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-minor">Minor</Label>
                <Input
                  id="edit-minor"
                  placeholder="minor"
                  value={editForm.minor}
                  onChange={handleEditTextChange("minor")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-hobbies">Hobbies</Label>
                <Textarea
                  id="edit-hobbies"
                  placeholder="hobbies"
                  value={editForm.hobbies}
                  onChange={handleEditTextChange("hobbies")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-responsibilities">Responsibilities</Label>
                <Textarea
                  id="edit-responsibilities"
                  placeholder="responsibilities"
                  value={editForm.responsibilities}
                  onChange={handleEditTextChange("responsibilities")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-linkedin">Linkedin</Label>
                <Input
                  id="edit-linkedin"
                  placeholder="linkedin"
                  value={editForm.linkedin}
                  onChange={handleEditTextChange("linkedin")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="email"
                  value={editForm.email}
                  onChange={handleEditTextChange("email")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-websiteUrl">Website Url</Label>
                <Input
                  id="edit-websiteUrl"
                  placeholder="website url"
                  value={editForm.websiteUrl}
                  onChange={handleEditTextChange("websiteUrl")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-socialUrl">Socials</Label>
                <Input
                  id="edit-socialUrl"
                  placeholder="socials"
                  value={editForm.socialUrl}
                  onChange={handleEditTextChange("socialUrl")}
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

      {/* Officer cards — drag to reorder */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={officers.map((o) => o.id)}
          strategy={rectSortingStrategy}
        >
          <div className="flex flex-wrap gap-4 justify-center">
            {officers.map((officer) => (
              <SortableOfficerCard
                key={officer.id}
                officer={officer}
                onEdit={openEditDialog}
                onDelete={handleDeleteOfficer}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default Page;
