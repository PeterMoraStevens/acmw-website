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
  verticalListSortingStrategy,
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
import { Edit, PlusSquare, Trash2Icon, GripVertical, ArrowRightLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// --- Types ---

type Resource = {
  id: string;
  title: string;
  description: string;
  url: string;
};

type ResourceCategory = {
  id: string;
  name: string;
  order: number;
  resources: Resource[];
};

// --- Sortable Resource Row ---

function SortableResourceRow({
  resource,
  onEdit,
  onDelete,
  onMove,
}: {
  resource: Resource;
  onEdit: () => void;
  onDelete: () => void;
  onMove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: resource.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded-md mb-2"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{resource.title}</p>
        <p className="text-xs text-muted-foreground truncate">{resource.url}</p>
      </div>
      <Button
        size="icon"
        className="bg-blue-500 shrink-0"
        onClick={onMove}
        title="Move to another category"
      >
        <ArrowRightLeft className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        className="bg-green-500 shrink-0"
        onClick={onEdit}
      >
        <Edit />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="icon" className="bg-red-500 shrink-0">
            <Trash2Icon />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resource?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-bold">{resource.title}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Sortable Category Card ---

function SortableCategoryCard({
  category,
  sensors,
  onEditCategory,
  onDeleteCategory,
  onAddResource,
  onEditResource,
  onDeleteResource,
  onMoveResource,
  onResourceDragEnd,
}: {
  category: ResourceCategory;
  sensors: ReturnType<typeof useSensors>;
  onEditCategory: (cat: ResourceCategory) => void;
  onDeleteCategory: (id: string) => void;
  onAddResource: (categoryId: string) => void;
  onEditResource: (categoryId: string, resource: Resource) => void;
  onDeleteResource: (categoryId: string, resourceId: string) => void;
  onMoveResource: (categoryId: string, resource: Resource) => void;
  onResourceDragEnd: (event: DragEndEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5" />
          </button>
          <CardTitle className="flex-1">{category.name}</CardTitle>
          <Button
            size="icon"
            className="bg-green-500"
            onClick={() => onEditCategory(category)}
          >
            <Edit />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" className="bg-red-500">
                <Trash2Icon />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete category?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete{" "}
                  <span className="font-bold">{category.name}</span> and all its
                  resources.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDeleteCategory(category.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onResourceDragEnd}
        >
          <SortableContext
            items={category.resources.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            {category.resources.map((resource) => (
              <SortableResourceRow
                key={resource.id}
                resource={resource}
                onEdit={() => onEditResource(category.id, resource)}
                onDelete={() => onDeleteResource(category.id, resource.id)}
                onMove={() => onMoveResource(category.id, resource)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {category.resources.length === 0 && (
          <p className="text-sm text-muted-foreground mb-2">
            No resources yet.
          </p>
        )}

        <Button
          variant="neutral"
          className="mt-2"
          onClick={() => onAddResource(category.id)}
        >
          <PlusSquare className="mr-1" /> Add Resource
        </Button>
      </CardContent>
    </Card>
  );
}

// --- Main Page ---

const Page = () => {
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryDialogMode, setCategoryDialogMode] = useState<
    "create" | "edit"
  >("create");
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");

  // Resource dialog state
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [resourceDialogMode, setResourceDialogMode] = useState<
    "create" | "edit"
  >("create");
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [editingResourceId, setEditingResourceId] = useState("");
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    url: "",
  });

  // Move dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveSourceCategoryId, setMoveSourceCategoryId] = useState("");
  const [movingResource, setMovingResource] = useState<Resource | null>(null);
  const [moveTargetCategoryId, setMoveTargetCategoryId] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // --- Fetch ---

  const fetchCategories = useCallback(async () => {
    const snapshot = await getDocs(collection(db, "resourceCategories"));
    const data: ResourceCategory[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ResourceCategory, "id">),
    }));
    data.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    setCategories(data);
  }, []);

  useEffect(() => {
    fetchCategories()
      .catch((error) =>
        toast("Error fetching categories", { description: `${error}` }),
      )
      .finally(() => setLoading(false));
  }, [fetchCategories]);

  // --- Category CRUD ---

  const openCreateCategory = () => {
    setCategoryDialogMode("create");
    setCategoryName("");
    setEditingCategoryId("");
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: ResourceCategory) => {
    setCategoryDialogMode("edit");
    setCategoryName(cat.name);
    setEditingCategoryId(cat.id);
    setCategoryDialogOpen(true);
  };

  const onSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = categoryName.trim();
    if (!name) {
      toast("Category name is required");
      return;
    }

    try {
      setSubmitting(true);

      if (categoryDialogMode === "create") {
        await fetch("/api/addResourceCategory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, order: categories.length }),
        });
        toast("Category created");
      } else {
        await fetch("/api/updateResourceCategory", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingCategoryId, name }),
        });
        toast("Category updated");
      }

      await fetchCategories();
      setCategoryDialogOpen(false);
    } catch (err) {
      toast("Error saving category", { description: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await fetch("/api/deleteResourceCategory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      toast("Category deleted");
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast("Error deleting category", { description: String(err) });
    }
  };

  // --- Category reorder ---

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);

    const order = reordered.map((c, i) => ({ id: c.id, order: i }));
    fetch("/api/reorderResourceCategories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    }).catch(() => toast("Failed to save category order"));
  };

  // --- Resource CRUD ---

  const openAddResource = (categoryId: string) => {
    setResourceDialogMode("create");
    setTargetCategoryId(categoryId);
    setEditingResourceId("");
    setResourceForm({ title: "", description: "", url: "" });
    setResourceDialogOpen(true);
  };

  const openEditResource = (categoryId: string, resource: Resource) => {
    setResourceDialogMode("edit");
    setTargetCategoryId(categoryId);
    setEditingResourceId(resource.id);
    setResourceForm({
      title: resource.title,
      description: resource.description,
      url: resource.url,
    });
    setResourceDialogOpen(true);
  };

  const onSubmitResource = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = resourceForm.title.trim();
    const description = resourceForm.description.trim();
    const url = resourceForm.url.trim();

    if (!title || !url) {
      toast("Title and URL are required");
      return;
    }

    try {
      setSubmitting(true);

      const category = categories.find((c) => c.id === targetCategoryId);
      if (!category) throw new Error("Category not found");

      let updatedResources: Resource[];

      if (resourceDialogMode === "create") {
        const newResource: Resource = {
          id: crypto.randomUUID(),
          title,
          description,
          url,
        };
        updatedResources = [...category.resources, newResource];
      } else {
        updatedResources = category.resources.map((r) =>
          r.id === editingResourceId ? { ...r, title, description, url } : r,
        );
      }

      await fetch("/api/updateResourceCategory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: targetCategoryId,
          resources: updatedResources,
        }),
      });

      toast(
        resourceDialogMode === "create"
          ? "Resource added"
          : "Resource updated",
      );
      await fetchCategories();
      setResourceDialogOpen(false);
    } catch (err) {
      toast("Error saving resource", { description: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResource = async (
    categoryId: string,
    resourceId: string,
  ) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const updatedResources = category.resources.filter(
      (r) => r.id !== resourceId,
    );

    try {
      await fetch("/api/updateResourceCategory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: categoryId, resources: updatedResources }),
      });
      toast("Resource deleted");
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, resources: updatedResources } : c,
        ),
      );
    } catch (err) {
      toast("Error deleting resource", { description: String(err) });
    }
  };

  // --- Move resource between categories ---

  const openMoveResource = (categoryId: string, resource: Resource) => {
    setMoveSourceCategoryId(categoryId);
    setMovingResource(resource);
    setMoveTargetCategoryId("");
    setMoveDialogOpen(true);
  };

  const handleMoveResource = async () => {
    if (!movingResource || !moveTargetCategoryId || !moveSourceCategoryId) return;
    if (moveTargetCategoryId === moveSourceCategoryId) {
      toast("Resource is already in that category");
      return;
    }

    const sourceCategory = categories.find((c) => c.id === moveSourceCategoryId);
    const targetCategory = categories.find((c) => c.id === moveTargetCategoryId);
    if (!sourceCategory || !targetCategory) return;

    const updatedSourceResources = sourceCategory.resources.filter(
      (r) => r.id !== movingResource.id,
    );
    const updatedTargetResources = [...targetCategory.resources, movingResource];

    try {
      setSubmitting(true);
      await Promise.all([
        fetch("/api/updateResourceCategory", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: moveSourceCategoryId, resources: updatedSourceResources }),
        }),
        fetch("/api/updateResourceCategory", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: moveTargetCategoryId, resources: updatedTargetResources }),
        }),
      ]);
      toast("Resource moved");
      await fetchCategories();
      setMoveDialogOpen(false);
    } catch (err) {
      toast("Error moving resource", { description: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Resource reorder (per category) ---

  const makeResourceDragEnd =
    (categoryId: string) => (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setCategories((prev) =>
        prev.map((cat) => {
          if (cat.id !== categoryId) return cat;
          const oldIndex = cat.resources.findIndex(
            (r) => r.id === active.id,
          );
          const newIndex = cat.resources.findIndex(
            (r) => r.id === over.id,
          );
          const reordered = arrayMove(cat.resources, oldIndex, newIndex);

          fetch("/api/updateResourceCategory", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: categoryId, resources: reordered }),
          }).catch(() => toast("Failed to save resource order"));

          return { ...cat, resources: reordered };
        }),
      );
    };

  // --- Memoize drag end handlers ---

  const resourceDragHandlers = useMemo(() => {
    const handlers: Record<string, (event: DragEndEvent) => void> = {};
    for (const cat of categories) {
      handlers[cat.id] = makeResourceDragEnd(cat.id);
    }
    return handlers;
  }, [categories]);

  if (loading) {
    return (
      <div className="flex justify-center p-10 text-lg">
        Loading resources...
      </div>
    );
  }

  return (
    <div className="gap-6 p-6 mt-18">
      {/* Category create/edit dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={onSubmitCategory}>
            <DialogHeader>
              <DialogTitle>
                {categoryDialogMode === "create"
                  ? "Add Category"
                  : "Edit Category"}
              </DialogTitle>
              <DialogDescription>
                {categoryDialogMode === "create"
                  ? "Create a new resource category."
                  : "Rename this category."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-3">
                <Label htmlFor="category-name">Name*</Label>
                <Input
                  id="category-name"
                  placeholder="e.g. Study Materials"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="neutral">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : categoryDialogMode === "create"
                    ? "Create"
                    : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Resource create/edit dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={onSubmitResource}>
            <DialogHeader>
              <DialogTitle>
                {resourceDialogMode === "create"
                  ? "Add Resource"
                  : "Edit Resource"}
              </DialogTitle>
              <DialogDescription>
                {resourceDialogMode === "create"
                  ? "Add a new resource to this category."
                  : "Update this resource."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-3">
                <Label htmlFor="resource-title">Title*</Label>
                <Input
                  id="resource-title"
                  placeholder="Resource title"
                  required
                  value={resourceForm.title}
                  onChange={(e) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="resource-description">Description</Label>
                <Textarea
                  id="resource-description"
                  placeholder="Brief description of the resource"
                  value={resourceForm.description}
                  onChange={(e) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="resource-url">URL*</Label>
                <Input
                  id="resource-url"
                  placeholder="https://..."
                  required
                  value={resourceForm.url}
                  onChange={(e) =>
                    setResourceForm((prev) => ({
                      ...prev,
                      url: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="neutral">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : resourceDialogMode === "create"
                    ? "Add"
                    : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move resource dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move Resource</DialogTitle>
            <DialogDescription>
              Move <span className="font-bold">{movingResource?.title}</span> to
              another category.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="move-target-category">Destination Category</Label>
              <select
                id="move-target-category"
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm"
                value={moveTargetCategoryId}
                onChange={(e) => setMoveTargetCategoryId(e.target.value)}
              >
                <option value="">Select a category...</option>
                {categories
                  .filter((c) => c.id !== moveSourceCategoryId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="neutral">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleMoveResource}
              disabled={submitting || !moveTargetCategoryId}
            >
              {submitting ? "Moving..." : "Move"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category button */}
      <Button
        className="bg-purple-500 justify-center mb-4"
        onClick={openCreateCategory}
      >
        <PlusSquare /> Add Category
      </Button>

      {/* Category list with drag-and-drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleCategoryDragEnd}
      >
        <SortableContext
          items={categories.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4">
            {categories.map((category) => (
              <SortableCategoryCard
                key={category.id}
                category={category}
                sensors={sensors}
                onEditCategory={openEditCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddResource={openAddResource}
                onEditResource={openEditResource}
                onDeleteResource={handleDeleteResource}
                onMoveResource={openMoveResource}
                onResourceDragEnd={resourceDragHandlers[category.id]}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {categories.length === 0 && (
        <p className="text-muted-foreground mt-4">
          No categories yet. Add one above!
        </p>
      )}
    </div>
  );
};

export default Page;
