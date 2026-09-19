import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, ImagePlus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, toPascalCase, toTitleCase } from "@/lib/utils";
import { uploadImagesPropertyOwnersForMainProjects } from "@/lib/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Installation, normalizeImageUrl, toApiType } from "./types";

interface InstallationFieldConfig {
  name: string;
  label: string;
  placeholder?: string;
  visibleFor: string[];
}

const INSTALLATION_FIELDS_CONFIG: InstallationFieldConfig[] = [
  {
    name: "model_number",
    label: "Model Number",
    placeholder: "Model Number",
    visibleFor: ["windows", "doors", "garage_doors"],
  },
  {
    name: "style",
    label: "Style",
    placeholder: "Installation style",
    visibleFor: ["roofing", "siding"],
  },
  {
    name: "color",
    label: "Color",
    placeholder: "Installation color",
    visibleFor: ["roofing", "siding", "doors", "garage_doors", "windows"],
  },
  {
    name: "material",
    label: "Material",
    placeholder: "Installation material",
    visibleFor: ["roofing", "siding"],
  },
  {
    name: "classRating",
    label: "Class Rating",
    placeholder: "Rating",
    visibleFor: ["roofing"],
  },
  {
    name: "windcode",
    label: "Wind Code",
    placeholder: "Wind Code",
    visibleFor: ["garage_doors"],
  },
  {
    name: "u_factor",
    label: "U-Factor",
    placeholder: "U-Factor",
    visibleFor: ["windows", "doors"],
  },
  {
    name: "glass_type",
    label: "Glass Type",
    placeholder: "Glass Type",
    visibleFor: ["doors"],
  },
  {
    name: "track_radius",
    label: "Track Radius",
    placeholder: "Track Radius",
    visibleFor: ["doors"],
  },
  {
    name: "orderNumber",
    label: "Order Number",
    placeholder: "Order number",
    visibleFor: ["windows", "doors", "garage_doors"],
  },
  {
    name: "window_style",
    label: "Window Style",
    placeholder: "Window style",
    visibleFor: ["garage_doors"],
  },
];

const normalizeComponentType = (type?: string): string => {
  if (!type) return "";
  const t = type.toLowerCase().trim().replace(/[-\s]/g, "_");
  if (t === "garage_door" || t === "garage_doors") return "garage_doors";
  if (t === "window" || t === "windows") return "windows";
  if (t === "door" || t === "doors") return "doors";
  if (t === "roof" || t === "roofing") return "roofing";
  if (t === "side" || t === "siding") return "siding";
  return t;
};

const isFieldVisible = (
  visibleFor: string[],
  componentType?: string,
  hasValue?: boolean,
): boolean => {
  if (!componentType) return !!hasValue;
  const norm = normalizeComponentType(componentType);
  if (visibleFor.includes(norm)) return true;
  if (
    norm === "windows_and_doors" ||
    norm === "window_door" ||
    norm === "windows_doors"
  ) {
    return visibleFor.includes("windows") || visibleFor.includes("doors");
  }
  return false;
};

const getFieldValue = (
  item: Installation,
  fieldName: string,
): string | undefined => {
  const itemAny = item as any;
  switch (fieldName) {
    case "model_number":
      return (
        item.model_number || itemAny.production_line || itemAny.productionLine
      );
    case "classRating":
      return item.class_rating || itemAny.classRating;
    case "orderNumber":
      return item.order_number || itemAny.orderNumber;
    case "style":
      return item.style;
    case "color":
      return item.color;
    case "material":
      return item.material;
    case "windcode":
      return item.windcode;
    case "u_factor":
      return item.u_factor;
    case "glass_type":
      return item.glass_type;
    case "track_radius":
      return item.track_radius;
    case "window_style":
      return item.window_style;
    default:
      return itemAny[fieldName];
  }
};

interface InstallationCardProps {
  item: Installation;
  canUpload: boolean;
  embedded?: boolean;
  addedBy?: string;
  addedByEmail?: string;
}

export const InstallationCard = ({
  item,
  canUpload,
  embedded = false,
  addedBy,
  addedByEmail,
}: InstallationCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localImages, setLocalImages] = useState(item.images ?? []);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const validImages = localImages
    .map((img) => ({ img, src: normalizeImageUrl(img) }))
    .filter(
      (entry): entry is { img: (typeof localImages)[number]; src: string } =>
        Boolean(entry.src),
    );
  const validImageUrls = validImages.map((entry) => entry.src);

  const alreadyUploaded = localImages.some((img) => img.owner_uploaded);

  const formattedDate = item.install_date
    ? new Date(item.install_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

  const normType = normalizeComponentType(item.component_type);
  const typeColor: Record<string, string> = {
    roofing: "bg-[rgba(28,167,166,0.12)] text-[#1CA7A6] border-[#1CA7A6]",
    siding: "bg-[rgba(31,42,68,0.1)] text-[#1F2A44] border-[#1F2A44]",
    windows: "bg-[rgba(67,160,71,0.12)] text-[#43A047] border-[#43A047]",
    doors: "bg-[rgba(67,160,71,0.12)] text-[#43A047] border-[#43A047]",
    windows_and_doors:
      "bg-[rgba(67,160,71,0.12)] text-[#43A047] border-[#43A047]",
    window_door: "bg-[rgba(67,160,71,0.12)] text-[#43A047] border-[#43A047]",
    garage_doors: "bg-[rgba(156,39,176,0.12)] text-[#9C27B0] border-[#9C27B0]",
  };
  const badgeClass =
    typeColor[normType] ??
    typeColor[item.component_type] ??
    "bg-[rgba(112,128,144,0.12)] text-[#708090] border-[#708090]";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    const result = await uploadImagesPropertyOwnersForMainProjects(
      toApiType(item.component_type),
      item.id,
      files,
    );
    setUploading(false);

    if (!result.success) {
      toast.error(result.message || "Failed to upload images");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const previews = files.map((f) => ({
      id: "",
      image_url: null,
      thumbnail_url: null,
      property_owner_files: URL.createObjectURL(f),
      component_type: item.component_type,
      owner_uploaded: true,
      created_at: new Date().toISOString(),
    }));
    setLocalImages((prev) => [...prev, ...previews]);
    toast.success("Images uploaded successfully");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const dynamicFields = INSTALLATION_FIELDS_CONFIG.filter((cfg) => {
    const val = getFieldValue(item, cfg.name);
    return isFieldVisible(cfg.visibleFor, item.component_type, Boolean(val));
  }).map((cfg) => ({
    label: cfg.label,
    value: getFieldValue(item, cfg.name),
  }));

  const detailFields = [
    { label: "Brand", value: item.brand },
    ...dynamicFields,
    { label: "Install Date", value: formattedDate },
    { label: "Contractor", value: item.installer },
    { label: "Supplier", value: item.supplier },
    ...(item.other ? [{ label: "Other", value: item.other }] : []),
  ];

  return (
    <div
      className={cn(
        "space-y-4",
        embedded
          ? "rounded-none border-0 bg-transparent p-0 shadow-none"
          : "rounded-[14px] border border-[#E8EDF2] bg-white shadow-[0px_2px_12px_rgba(31,42,68,0.08)] p-5 md:p-6 hover:shadow-[0px_4px_20px_rgba(31,42,68,0.14)] transition-shadow",
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-[10px] md:text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full border font-inter",
              badgeClass,
            )}
          >
            {toTitleCase(
              item.component_type ? item.component_type.replace(/_/g, " ") : "",
            )}
          </span>
          {item.impact_resistant && (
            <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full border bg-[rgba(255,193,7,0.12)] text-[#F59E0B] border-[#F59E0B] font-inter">
              Impact Resistant
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-[10px] md:text-[11px] font-medium px-3 py-1 rounded-full border font-inter",
              !item.permit_status
                ? "bg-[rgba(244,67,54,0.1)] text-[#F44336] border-[#F44336]"
                : item.permit_status === "VERIFIED"
                  ? "bg-[rgba(67,160,71,0.12)] text-[#43A047] border-[#43A047]"
                  : "bg-[rgba(255,193,7,0.12)] text-[#F59E0B] border-[#F59E0B]",
            )}
          >
            {item.permit_status
              ? toPascalCase(item.permit_status)
              : "Permit Not Uploaded"}
          </span>

          {canUpload &&
            (alreadyUploaded ? (
              <span className="text-[10px] md:text-[11px] font-medium px-3 py-1 rounded-full border bg-[rgba(112,128,144,0.08)] text-[#B0BEC5] border-[#B0BEC5] font-inter cursor-not-allowed select-none">
                Images Uploaded
              </span>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 px-3 text-[10px] md:text-[11px] font-semibold uppercase tracking-widest border-[#1CA7A6] text-[#1CA7A6] hover:bg-[rgba(28,167,166,0.08)] gap-1.5 rounded-full font-inter"
                >
                  {uploading ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <ImagePlus className="size-3" />
                  )}
                  {uploading ? "Uploading…" : "Upload Images"}
                </Button>
              </>
            ))}
        </div>
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-[13px] md:text-[14px] text-[#708090] leading-relaxed font-asap">
          {item.description}
        </p>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
        {detailFields.map(({ label, value }) => (
          <div key={label} className="space-y-0.5">
            <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-widest text-[#B0BEC5] font-inter">
              {label}
            </p>
            <p className="text-[12px] md:text-[13px] font-medium text-[#1F2A44] font-asap truncate">
              {value || "N/A"}
            </p>
          </div>
        ))}
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-widest text-[#B0BEC5] font-inter">
          Added By
        </p>
        <p className="text-[12px] md:text-[13px] font-medium text-[#1F2A44] font-asap truncate">
          {addedBy || "N/A"}
          <span className="block text-xs text-[#708090] font-normal font-inter">
            {addedByEmail}
          </span>
        </p>
      </div>

      {/* Images */}
      {validImageUrls.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-2 pt-1 max-w-[260px]">
            <div
              className="relative overflow-hidden rounded-[8px] border border-[#E8EDF2] cursor-pointer h-[120px] md:h-[150px]"
              onClick={() => {
                setSelectedImages(validImageUrls);
                setCurrentImageIndex(0);
                setIsImageModalOpen(true);
              }}
            >
              <Image
                src={validImageUrls[0]}
                alt={`${item.component_type} image 1`}
                fill
                sizes="(max-width: 768px) 100vw, 260px"
                unoptimized
                className="object-cover"
              />
              {validImageUrls.length > 1 && (
                <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[11px] md:text-[12px] font-semibold text-white z-10">
                  +{validImageUrls.length - 1}
                </div>
              )}
            </div>
          </div>

          {isImageModalOpen && selectedImages.length > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2 cursor-pointer"
              >
                <X className="size-8" />
              </button>

              <div className="relative w-full max-w-4xl max-h-[80vh] flex items-center justify-center">
                {selectedImages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? selectedImages.length - 1 : prev - 1,
                      );
                    }}
                    className="absolute left-2 md:left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10 cursor-pointer"
                  >
                    <ChevronLeft className="size-6 md:size-8" />
                  </button>
                )}

                <div className="relative w-full h-[60vh] md:h-[80vh]">
                  <Image
                    src={selectedImages[currentImageIndex]}
                    alt={`Project image ${currentImageIndex + 1}`}
                    fill
                    sizes="100vw"
                    unoptimized
                    className="object-contain rounded-lg"
                  />
                </div>

                {selectedImages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev === selectedImages.length - 1 ? 0 : prev + 1,
                      );
                    }}
                    className="absolute right-2 md:left-auto md:right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10 cursor-pointer"
                  >
                    <ChevronRight className="size-6 md:size-8" />
                  </button>
                )}
              </div>

              {selectedImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {selectedImages.map((_, idx) => (
                    <div
                      key={idx}
                      className={`size-2.5 rounded-full transition-colors ${idx === currentImageIndex ? "bg-white" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
