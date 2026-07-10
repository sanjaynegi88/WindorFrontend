export type ImageTab = "ROOFING" | "WINDOWS AND DOORS" | "SIDING";

export interface PropertyImage {
  src: string;
  caption: string;
}

export interface Installation {
  id: string;
  property_id: string;
  report_id: string;
  description: string;
  install_date: string;
  supplier: string;
  installer: string;
  brand: string;
  style: string;
  color: string;
  material: string;
  impact_resistant: boolean;
  class_rating: string;
  installer_verified: boolean;
  verified_by_inspector_id: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  component_type: string;
  permit_status: string | null;
  images: {
    id: string;
    image_url: string | null;
    thumbnail_url: string | null;
    property_owner_files: string | null;
    component_type: string;
    owner_uploaded: boolean;
    created_at: string;
  }[];
}

export const normalizeImageUrl = (value: any) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return (
      value.property_owner_files ||
      value.image_url ||
      value.thumbnail_url ||
      value.url ||
      value.src ||
      null
    );
  }
  return null;
};

export function toApiType(componentType: string): string {
  const map: Record<string, string> = {
    ROOFING: "roofing",
    SIDING: "siding",
    "WINDOWS AND DOORS": "window_door",
  };
  // Use explicit map first, then normalise: lowercase + underscores → hyphens
  return map[componentType] ?? componentType.toLowerCase().replace(/_/g, '-');
}

/** Map project_type → InstallationForm type */
export function projectTypeToFormType(projectType: string): string {
  const t = projectType.toUpperCase();
  if (t === 'ROOFING') return 'roofing';
  if (t === 'SIDING') return 'siding';
  if (t === 'WINDOWS AND DOORS' || t === 'WINDOW_DOOR' || t === 'WINDOW' || t === 'DOOR') return 'window_door';
  return t.toLowerCase();
}

export function mapProjectToInstallation(project: any, fallbackPropertyId?: string): Installation | null {
  const detail = project?.details;
  const images = Array.isArray(project?.images)
    ? project.images
    : Array.isArray(project?.components?.images)
      ? project.components.images
      : [];

  const installation = {
    id: detail?.id ?? project?.components?.id ?? project?.id ?? '',
    property_id: detail?.property_id ?? project?.property_id ?? fallbackPropertyId ?? '',
    report_id: detail?.report_id ?? project?.report_id ?? '',
    description: detail?.description ?? project?.description ?? '',
    install_date: detail?.install_date ?? project?.date_of_install ?? '',
    supplier: detail?.supplier ?? '',
    installer: detail?.installer ?? '',
    brand: detail?.brand ?? '',
    style: detail?.style ?? '',
    color: detail?.color ?? '',
    material: detail?.material ?? '',
    impact_resistant: Boolean(detail?.impact_resistant ?? false),
    class_rating: detail?.class_rating ?? '',
    installer_verified: Boolean(detail?.installer_verified ?? false),
    verified_by_inspector_id: null,
    verified_at: null,
    created_at: detail?.created_at ?? project?.created_at ?? '',
    updated_at: detail?.updated_at ?? project?.updated_at ?? '',
    component_type: project?.project_type ?? detail?.type ?? '',
    permit_status: detail?.permit_status ?? null,
    images: (images ?? []).map((img: any, index: number) => ({
      id: img?.id ?? `${project?.id ?? 'project'}-${index}`,
      image_url: img?.image_url ?? null,
      thumbnail_url: img?.thumbnail_url ?? null,
      property_owner_files: img?.property_owner_files ?? null,
      component_type: project?.project_type ?? detail?.type ?? '',
      owner_uploaded: Boolean(img?.owner_uploaded ?? false),
      created_at: img?.created_at ?? project?.created_at ?? new Date().toISOString(),
    })),
  };

  return detail || project?.components ? installation : null;
}
