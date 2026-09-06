"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslations } from "next-intl";
import type { Locale, Unit } from "@agrivision/shared-types";
import { useAppLocale } from "@/lib/LocaleContext";
import { cropLabel } from "@/lib/cropName";

export interface MandiCropItem {
  mandiCropId: string;
  cropId: string;
  cropSlug: string;
  localNames: Record<string, string>;
  unit: Unit;
  displayOrder: number;
  isActive: boolean;
  currentPrice: number | null;
  lastUpdatedAt: string | null;
}

function PriceCard({
  item,
  onUpdate,
}: {
  item: MandiCropItem;
  onUpdate: (cropId: string, price: number, unit: Unit) => Promise<void>;
}) {
  const t = useTranslations("mandi");
  const tu = useTranslations("units");
  const { locale } = useAppLocale();
  const [value, setValue] = useState(item.currentPrice?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.mandiCropId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  async function handleSave() {
    const price = Number(value);
    if (!price || price <= 0) return;
    setSaving(true);
    try {
      await onUpdate(item.cropId, price, item.unit);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none px-1 text-stone-400"
        aria-label="drag"
      >
        ⠿
      </button>

      <div className="flex-1">
        <p className="font-medium text-stone-900">
          {cropLabel(item.localNames, locale as Locale, item.cropSlug)}
        </p>
        <p className="text-xs text-stone-400">
          {item.lastUpdatedAt
            ? t("lastUpdated", { time: new Date(item.lastUpdatedAt).toLocaleString() })
            : t("noPriceYet")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-24 rounded-lg border border-stone-300 px-2 py-1 text-right"
        />
        <span className="text-sm text-stone-500">{tu(item.unit)}</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-green-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
        >
          {t("updatePrice")}
        </button>
      </div>
    </div>
  );
}

export function DraggablePriceList({
  items,
  onReorder,
  onUpdatePrice,
}: {
  items: MandiCropItem[];
  onReorder: (orderedMandiCropIds: string[]) => Promise<void>;
  onUpdatePrice: (cropId: string, price: number, unit: Unit) => Promise<void>;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.mandiCropId === active.id);
    const newIndex = items.findIndex((i) => i.mandiCropId === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    await onReorder(reordered.map((i) => i.mandiCropId));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((i) => i.mandiCropId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((item) => (
            <PriceCard key={item.mandiCropId} item={item} onUpdate={onUpdatePrice} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
