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
  horizontalListSortingStrategy,
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
import {
  Edit,
  PlusSquare,
  Trash2Icon,
  Archive,
  ArchiveRestore,
  X,
  GripVertical,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGES = 6;

type EventImage = {
  url: string;
  path: string;
};

type EventPost = {
  id: string;
  title: string;
  description: string;
  date: string;
  images: EventImage[];
  archived: boolean;
};

type EventFormFields = {
  title: string;
  description: string;
  date: string;
};

const emptyFormFields: EventFormFields = {
  title: "",
  description: "",
  date: "",
};

// --- Sortable Image Thumbnail ---

type SortableImageItem = {
  id: string; // unique key for dnd-kit
  url: string;
  source: "kept" | "new";
  originalIndex: number;
};

function SortableImageThumb({
  item,
  onRemove,
}: {
  item: SortableImageItem;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative shrink-0">
      <button
        type="button"
        className="absolute top-0 left-0 bg-black/50 text-white rounded-br p-0.5 cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3 h-3" />
      </button>
      <img
        src={item.url}
        alt="thumbnail"
        className="w-24 h-16 rounded-md border shadow-md object-contain bg-black/5"
      />
      <button
        type="button"
        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
        onClick={onRemove}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// --- Event Card ---

function EventCard({
  event,
  onEdit,
  onDelete,
  onToggleArchive,
}: {
  event: EventPost;
  onEdit: (e: EventPost) => void;
  onDelete: (id: string) => void;
  onToggleArchive: (id: string, archived: boolean) => void;
}) {
  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader>
        <div className="flex items-center justify-center gap-2">
          <CardTitle>{event.title}</CardTitle>
          {event.archived && (
            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
              Archived
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{event.date}</p>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-2">
        {event.images.length > 0 && (
          <img
            src={event.images[0].url}
            alt={event.title}
            className="w-full h-40 rounded-md border shadow-md object-contain bg-black/5"
          />
        )}
        <p className="text-sm line-clamp-2">{event.description}</p>

        <div className="flex items-center gap-2">
          <Button
            className="bg-green-500"
            size="icon"
            onClick={() => onEdit(event)}
          >
            <Edit />
          </Button>

          <Button
            className={event.archived ? "bg-blue-500" : "bg-yellow-500"}
            size="icon"
            onClick={() => onToggleArchive(event.id, !event.archived)}
          >
            {event.archived ? <ArchiveRestore /> : <Archive />}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-red-500" size="icon">
                <Trash2Icon />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete{" "}
                  <span className="font-bold">{event.title}</span> and all its
                  images.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(event.id)}>
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

// --- Main Page ---

const Page = () => {
  const [events, setEvents] = useState<EventPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Create form state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] =
    useState<EventFormFields>(emptyFormFields);
  const [createImageBlobs, setCreateImageBlobs] = useState<Blob[]>([]);
  const [createPreviewUrls, setCreatePreviewUrls] = useState<string[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Edit form state
  const [editingEvent, setEditingEvent] = useState<EventPost | null>(null);
  const [editForm, setEditForm] = useState<EventFormFields>(emptyFormFields);
  const [editKeptImages, setEditKeptImages] = useState<EventImage[]>([]);
  const [editNewBlobs, setEditNewBlobs] = useState<Blob[]>([]);
  const [editNewPreviewUrls, setEditNewPreviewUrls] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFileInputKey, setEditFileInputKey] = useState(0);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const canSubmitCreate = useMemo(() => {
    return (
      createForm.title.trim().length > 0 &&
      createForm.description.trim().length > 0 &&
      createForm.date.trim().length > 0 &&
      createImageBlobs.length > 0
    );
  }, [createForm, createImageBlobs]);

  const canSubmitEdit = useMemo(() => {
    return (
      editForm.title.trim().length > 0 &&
      editForm.description.trim().length > 0 &&
      editForm.date.trim().length > 0 &&
      (editKeptImages.length + editNewBlobs.length) > 0
    );
  }, [editForm, editKeptImages, editNewBlobs]);

  // --- Build sortable items for create form ---
  const createSortableItems: SortableImageItem[] = useMemo(
    () =>
      createPreviewUrls.map((url, i) => ({
        id: `create-${i}`,
        url,
        source: "new" as const,
        originalIndex: i,
      })),
    [createPreviewUrls],
  );

  // --- Build sortable items for edit form (kept + new merged) ---
  const editSortableItems: SortableImageItem[] = useMemo(
    () => [
      ...editKeptImages.map((img, i) => ({
        id: `kept-${img.path}`,
        url: img.url,
        source: "kept" as const,
        originalIndex: i,
      })),
      ...editNewPreviewUrls.map((url, i) => ({
        id: `new-${i}`,
        url,
        source: "new" as const,
        originalIndex: i,
      })),
    ],
    [editKeptImages, editNewPreviewUrls],
  );

  // --- Fetch ---

  const fetchEvents = useCallback(async () => {
    const snapshot = await getDocs(collection(db, "events"));
    const data: EventPost[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<EventPost, "id">),
    }));
    data.sort((a, b) => b.date.localeCompare(a.date));
    setEvents(data);
  }, []);

  // --- Create form handlers ---

  const handleCreateTextChange =
    (field: keyof EventFormFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast("Image too large", {
        description: "Each image must be under 5 MB.",
      });
      setFileInputKey((k) => k + 1);
      return;
    }

    if (createImageBlobs.length >= MAX_IMAGES) {
      toast("Maximum images reached", {
        description: `You can upload up to ${MAX_IMAGES} images.`,
      });
      setFileInputKey((k) => k + 1);
      return;
    }

    setCreateImageBlobs((prev) => [...prev, file]);
    setCreatePreviewUrls((prev) => [...prev, URL.createObjectURL(file)]);
    setFileInputKey((k) => k + 1);
  };

  const removeCreateImage = (index: number) => {
    URL.revokeObjectURL(createPreviewUrls[index]);
    setCreateImageBlobs((prev) => prev.filter((_, i) => i !== index));
    setCreatePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = createSortableItems.findIndex((i) => i.id === active.id);
    const newIndex = createSortableItems.findIndex((i) => i.id === over.id);

    setCreateImageBlobs((prev) => arrayMove(prev, oldIndex, newIndex));
    setCreatePreviewUrls((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const resetCreateForm = () => {
    setCreateForm(emptyFormFields);
    setCreateImageBlobs([]);
    createPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setCreatePreviewUrls([]);
    setFileInputKey((k) => k + 1);
  };

  const handleAddEvent = async () => {
    const fd = new FormData();
    fd.append("title", createForm.title);
    fd.append("description", createForm.description);
    fd.append("date", createForm.date);

    createImageBlobs.forEach((blob, i) => {
      fd.append("images", blob, `event-image-${i}.jpg`);
    });

    const res = await fetch("/api/addEvent", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to add event");
    }

    resetCreateForm();
  };

  const onSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmitCreate) {
      toast("Missing required fields", {
        description:
          "Title, description, date, and at least one image are required.",
      });
      return;
    }

    try {
      setSubmitting(true);
      toast("Creating event...");
      await handleAddEvent();
      await fetchEvents();
      toast("Event has been created");
      setCreateDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast("Error creating event", { description: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Edit form handlers ---

  const openEditDialog = (event: EventPost) => {
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      description: event.description,
      date: event.date,
    });
    setEditKeptImages([...event.images]);
    setEditNewBlobs([]);
    editNewPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setEditNewPreviewUrls([]);
    setEditFileInputKey((k) => k + 1);
    setEditDialogOpen(true);
  };

  const handleEditTextChange =
    (field: keyof EventFormFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast("Image too large", {
        description: "Each image must be under 5 MB.",
      });
      setEditFileInputKey((k) => k + 1);
      return;
    }

    const totalImages = editKeptImages.length + editNewBlobs.length;
    if (totalImages >= MAX_IMAGES) {
      toast("Maximum images reached", {
        description: `You can upload up to ${MAX_IMAGES} images.`,
      });
      setEditFileInputKey((k) => k + 1);
      return;
    }

    setEditNewBlobs((prev) => [...prev, file]);
    setEditNewPreviewUrls((prev) => [...prev, URL.createObjectURL(file)]);
    setEditFileInputKey((k) => k + 1);
  };

  const removeEditItem = (item: SortableImageItem) => {
    if (item.source === "kept") {
      setEditKeptImages((prev) =>
        prev.filter((_, i) => i !== item.originalIndex),
      );
    } else {
      URL.revokeObjectURL(editNewPreviewUrls[item.originalIndex]);
      setEditNewBlobs((prev) =>
        prev.filter((_, i) => i !== item.originalIndex),
      );
      setEditNewPreviewUrls((prev) =>
        prev.filter((_, i) => i !== item.originalIndex),
      );
    }
  };

  const handleEditDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = editSortableItems.findIndex((i) => i.id === active.id);
    const newIndex = editSortableItems.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(editSortableItems, oldIndex, newIndex);

    // Rebuild kept and new arrays from the reordered list
    const newKept: EventImage[] = [];
    const newBlobs: Blob[] = [];
    const newPreviews: string[] = [];

    for (const item of reordered) {
      if (item.source === "kept") {
        newKept.push(editKeptImages[item.originalIndex]);
      } else {
        newBlobs.push(editNewBlobs[item.originalIndex]);
        newPreviews.push(editNewPreviewUrls[item.originalIndex]);
      }
    }

    setEditKeptImages(newKept);
    setEditNewBlobs(newBlobs);
    setEditNewPreviewUrls(newPreviews);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    const fd = new FormData();
    fd.append("id", editingEvent.id);
    fd.append("title", editForm.title);
    fd.append("description", editForm.description);
    fd.append("date", editForm.date);
    fd.append("existingImages", JSON.stringify(editKeptImages));

    editNewBlobs.forEach((blob, i) => {
      fd.append("images", blob, `event-image-${i}.jpg`);
    });

    const res = await fetch("/api/updateEvent", {
      method: "PUT",
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to update event");
    }
  };

  const onSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmitEdit) {
      toast("Missing required fields", {
        description:
          "Title, description, date, and at least one image are required.",
      });
      return;
    }

    try {
      setSubmitting(true);
      toast("Updating event...");
      await handleUpdateEvent();
      await fetchEvents();
      toast("Event has been updated");
      setEditDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast("Error updating event", { description: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Delete handler ---

  const handleDeleteEvent = (id: string) => {
    try {
      fetch("/api/deleteEvent", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      toast("Event deleted successfully");
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      toast("Error deleting event", { description: `${error}` });
    }
  };

  // --- Archive handler ---

  const handleToggleArchive = async (id: string, archived: boolean) => {
    try {
      const res = await fetch("/api/archiveEvent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, archived }),
      });
      if (!res.ok) throw new Error("Failed to update archive status");

      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, archived } : e)),
      );
      toast(archived ? "Event archived" : "Event unarchived");
    } catch (error) {
      toast("Error updating archive status", { description: `${error}` });
    }
  };

  // --- Initial fetch ---

  useEffect(() => {
    fetchEvents()
      .catch((error) =>
        toast("Error fetching events:", { description: `${error}` }),
      )
      .finally(() => setLoading(false));
  }, [fetchEvents]);

  if (loading) {
    return (
      <div className="flex justify-center p-10 text-lg">
        Loading events...
      </div>
    );
  }

  return (
    <div className="gap-6 p-6 mt-18">
      {/* Create event dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <form onSubmit={onSubmitCreate}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 justify-center mb-4">
              <PlusSquare /> Add Event
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-106.25 max-h-[70%] overflow-scroll">
            <DialogHeader>
              <DialogTitle>Add Event</DialogTitle>
              <DialogDescription>
                Add details for a new event here. Click create when you&apos;re
                done. (* is required)
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="title">Title*</Label>
                <Input
                  id="title"
                  placeholder="Event title"
                  required
                  value={createForm.title}
                  onChange={handleCreateTextChange("title")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="description">Description*</Label>
                <Textarea
                  id="description"
                  placeholder="Event description"
                  required
                  value={createForm.description}
                  onChange={handleCreateTextChange("description")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="date">Date*</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={createForm.date}
                  onChange={handleCreateTextChange("date")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="images">
                  Images* ({createImageBlobs.length}/{MAX_IMAGES}, max 5 MB
                  each) — drag to reorder
                </Label>
                <Input
                  key={fileInputKey}
                  id="images"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleCreateFileChange}
                  disabled={createImageBlobs.length >= MAX_IMAGES}
                />
                {createSortableItems.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleCreateDragEnd}
                  >
                    <SortableContext
                      items={createSortableItems.map((i) => i.id)}
                      strategy={horizontalListSortingStrategy}
                    >
                      <div className="flex flex-wrap gap-2 mt-2">
                        {createSortableItems.map((item) => (
                          <SortableImageThumb
                            key={item.id}
                            item={item}
                            onRemove={() =>
                              removeCreateImage(item.originalIndex)
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
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

      {/* Edit event dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-106.25 max-h-[70%] overflow-scroll">
          <form onSubmit={onSubmitEdit}>
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update event details below. (* is required)
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-3">
                <Label htmlFor="edit-title">Title*</Label>
                <Input
                  id="edit-title"
                  placeholder="Event title"
                  required
                  value={editForm.title}
                  onChange={handleEditTextChange("title")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-description">Description*</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Event description"
                  required
                  value={editForm.description}
                  onChange={handleEditTextChange("description")}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-date">Date*</Label>
                <Input
                  id="edit-date"
                  type="date"
                  required
                  value={editForm.date}
                  onChange={handleEditTextChange("date")}
                />
              </div>

              {/* Images with drag-to-reorder */}
              <div className="grid gap-3">
                <Label>
                  Images ({editKeptImages.length + editNewBlobs.length}/
                  {MAX_IMAGES}, max 5 MB each) — drag to reorder
                </Label>

                {editSortableItems.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleEditDragEnd}
                  >
                    <SortableContext
                      items={editSortableItems.map((i) => i.id)}
                      strategy={horizontalListSortingStrategy}
                    >
                      <div className="flex flex-wrap gap-2">
                        {editSortableItems.map((item) => (
                          <SortableImageThumb
                            key={item.id}
                            item={item}
                            onRemove={() => removeEditItem(item)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                <Input
                  key={editFileInputKey}
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleEditFileChange}
                  disabled={
                    editKeptImages.length + editNewBlobs.length >= MAX_IMAGES
                  }
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

      {/* Event cards */}
      <div className="flex flex-wrap gap-4 justify-center">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onEdit={openEditDialog}
            onDelete={handleDeleteEvent}
            onToggleArchive={handleToggleArchive}
          />
        ))}
        {events.length === 0 && (
          <p className="text-muted-foreground">No events yet. Add one above!</p>
        )}
      </div>
    </div>
  );
};

export default Page;
