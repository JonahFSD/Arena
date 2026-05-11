"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { getCroppedImg } from "@/lib/crop-image";

export function ProfilePhotoCropModal({
  isOpen,
  imageSrc,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [imageSrc]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setSaving(true);
    try {
      const dataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(dataUrl);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="max-w-lg"
      title="Adjust your photo"
      description="Drag to reposition. Use zoom to frame your face, then save."
    >
      <div className="space-y-4">
        <div className="relative h-[min(55vh,320px)] w-full overflow-hidden rounded-xl bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-text-muted" htmlFor="avatar-zoom">
            Zoom
          </label>
          <input
            id="avatar-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-overlay accent-brand-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="brand"
            onClick={handleSave}
            isLoading={saving}
            disabled={!croppedAreaPixels}
          >
            Save photo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
