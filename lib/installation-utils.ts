import { parseBrandValue } from "@/lib/brand-utils";

export interface InstallationPayloadOptions {
  projectId?: string | null;
}

export function parseSelectValue(value?: string | null): {
  id: string | null;
  other: string | null;
} {
  if (!value) {
    return { id: null, other: null };
  }
  if (value.startsWith("__custom__:")) {
    return {
      id: null,
      other: value.slice("__custom__:".length),
    };
  }
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );
  if (isUuid) {
    return {
      id: value,
      other: null,
    };
  }
  return {
    id: null,
    other: value,
  };
}

/**
 * Builds a type-safe and type-specific installation payload from InstallationForm values.
 * Used across:
 * - app/(protected)/(contractors)/properties/new/page.tsx
 * - app/(protected)/(contractors)/properties/edit/[id]/page.tsx
 * - components/common/installation-form-dialog.tsx
 */
export function buildInstallationPayload(
  type: string,
  values: any,
  options?: InstallationPayloadOptions,
): Record<string, any> {
  const normType = (type || "").toLowerCase().trim();
  const { brand_id, other_brand } = parseBrandValue(values?.brand);
  const { id: style_id, other: other_style } = parseSelectValue(values?.style);
  const { id: color_id, other: other_color } = parseSelectValue(values?.color);

  const payload: Record<string, any> = {
    description: values?.description,
    install_date: values?.installDate,
    supplier: values?.supplier,
    installer: values?.installer,
    ...(brand_id && { brand_id }),
    ...(other_brand && { other_brand }),
    ...(!brand_id && !other_brand && { brand_id: null, other_brand: null }),
    ...(options?.projectId ? { project_id: options.projectId } : {}),
  };

  // Fallback for endpoints that accept direct `brand` string
  if (values?.brand && !brand_id && !other_brand) {
    payload.brand = values.brand;
  }

  if (normType === "roofing" || normType === "siding") {
    payload.material = values?.material;

    payload.style_id = style_id ?? null;
    payload.other_style = other_style ?? "";
    payload.color_id = color_id ?? null;
    payload.other_color = other_color ?? "";

    if (normType === "roofing") {
      payload.impact_resistant = values?.impactResistant;
      payload.class_rating = values?.classRating;
    } else if (normType === "siding") {
      payload.elevation_data = values?.elevationdata;
    }
  } else if (
    normType === "windows" ||
    normType === "doors" ||
    normType === "garage_doors" ||
    normType === "garage-doors"
  ) {
    if (values?.color !== undefined) {
      payload.color_id = color_id ?? null;
      payload.other_color = other_color ?? "";
    }

    if (normType === "doors") {
      payload.model_number = values?.model_number ?? values?.productionLine;
      payload.order_number = values?.orderNumber;
      payload.glass_type = values?.glass_type;
      payload.track_radius = values?.track_radius;
      payload.u_factor = values?.u_factor;
    }
    if (normType === "garage_doors" || normType === "garage-doors") {
      payload.windcode = values?.windcode;
      if (values?.orderNumber) {
        payload.order_number = values.orderNumber;
      }
      payload.window_style = values?.window_style;
      payload.model_number = values?.model_number ?? values?.productionLine;
    }
    if (normType === "windows") {
      payload.model_number = values?.model_number ?? values?.productionLine;
      payload.order_number = values?.orderNumber;
      payload.u_factor = values?.u_factor;
    }
  }

  // Remove undefined properties
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  console.log("=== [Installation Request Payload] ===", {
    type: normType,
    payload,
  });

  return payload;
}
