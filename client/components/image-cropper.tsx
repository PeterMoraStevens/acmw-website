"use client";

import React, { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedBlob } from "@/lib/cropImage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type ImageCropperProps = {
  imageSrc: string;
  onCropComplete: (blob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  cropShape?: "round" | "rect";
};

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  cropShape = "round",
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [confirming, setConfirming] = useState(false);

  const onCropDone = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setConfirming(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onCropComplete(blob);
    } catch (err) {
      console.error("Crop failed:", err);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full h-64">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          cropShape={cropShape}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropDone}
        />
      </div>

      <div className="flex flex-col gap-1 px-2">
        <Label>Zoom</Label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="neutral" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={confirming}>
          {confirming ? "Cropping..." : "Confirm Crop"}
        </Button>
      </div>
    </div>
  );
}
