import { parseBrandValue } from "@/lib/brand-utils";

export interface InstallationPayloadOptions {
  projectId?: string | null;
  isEditMode?: boolean;
  initialValues?: any;
}

const isUuid = (val?: string | null): boolean =>
  Boolean(
    val &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        val,
      ),
  );

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
  if (isUuid(value)) {
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
  const isEditMode = Boolean(options?.isEditMode ?? values?._isEditMode);
  const initialValues = options?.initialValues ?? values?._initialValues;

  // 1. Brand resolution
  let brand_id: string | null = null;
  let other_brand: string | null = null;
  let shouldIncludeBrand = true;

  const currentBrand = values?.brand ?? "";
  const initialBrand = initialValues?.brand ?? initialValues?.brand_id ?? "";
  const initialHadValidBrandId = Boolean(
    (initialValues?.brand_id && isUuid(initialValues.brand_id)) ||
      (isUuid(initialBrand) &&
        !initialBrand.startsWith("__custom__:") &&
        !initialBrand.startsWith("__subbrand__:")),
  );
  const initialHadOtherBrand = Boolean(
    initialValues?.other_brand ||
      initialValues?.initial_other_brand ||
      (typeof initialBrand === "string" &&
        initialBrand.startsWith("__custom__:")),
  );
  const isOrphanedBrand = !initialHadValidBrandId && !initialHadOtherBrand;
  const isBrandChanged = currentBrand !== initialBrand;

  if (isEditMode) {
    if (!isBrandChanged) {
      if (!initialHadValidBrandId) {
        // ID was null/deleted and untouched: do not pass brand_id or other_brand
        shouldIncludeBrand = false;
      } else {
        // ID exists and untouched: pass brand_id only, NEVER send other_brand (prevents backend duplicate creation error)
        brand_id = initialValues?.brand_id || initialBrand;
        other_brand = null;
      }
    } else {
      // Actively changed in edit mode
      if (isUuid(currentBrand)) {
        brand_id = currentBrand;
        other_brand = null;
      } else if (currentBrand.startsWith("__subbrand__:")) {
        const parts = currentBrand.split(":");
        brand_id = parts[1] || null;
        other_brand = null;
      } else if (currentBrand.startsWith("__custom__:")) {
        brand_id = null;
        other_brand = currentBrand.slice("__custom__:".length);
      } else if (currentBrand) {
        brand_id = null;
        other_brand = currentBrand;
      } else {
        brand_id = null;
        other_brand = null;
      }
    }
  } else {
    // Add mode
    const parsed = parseBrandValue(values?.brand);
    brand_id = parsed.brand_id;
    other_brand = parsed.other_brand;
  }

  // 2. Style resolution
  let style_id: string | null = null;
  let other_style: string | null = null;
  let shouldIncludeStyle = true;

  const currentStyle = values?.style ?? "";
  const initialStyle = initialValues?.style ?? initialValues?.style_id ?? "";
  const initialHadValidStyleId = Boolean(
    (initialValues?.style_id && isUuid(initialValues.style_id)) ||
      (isUuid(initialStyle) && !initialStyle.startsWith("__custom__:")),
  );
  const isStyleChanged = currentStyle !== initialStyle;

  if (isEditMode) {
    if (!isStyleChanged) {
      if (!initialHadValidStyleId) {
        // ID was null/deleted and untouched: do not pass style_id or other_style
        shouldIncludeStyle = false;
      } else {
        // ID exists and untouched: pass style_id only, NEVER send other_style (prevents backend duplicate creation error)
        style_id = initialValues?.style_id || initialStyle;
        other_style = null;
      }
    } else {
      // Actively changed in edit mode
      if (isUuid(currentStyle)) {
        style_id = currentStyle;
        other_style = null;
      } else if (currentStyle.startsWith("__custom__:")) {
        style_id = null;
        other_style = currentStyle.slice("__custom__:".length);
      } else if (currentStyle) {
        style_id = null;
        other_style = currentStyle;
      } else {
        style_id = null;
        other_style = null;
      }
    }
  } else {
    // Add mode
    const parsed = parseSelectValue(values?.style);
    style_id = parsed.id;
    other_style = parsed.other;
  }

  // 3. Color resolution
  let color_id: string | null = null;
  let other_color: string | null = null;
  let shouldIncludeColor = true;

  const currentColor = values?.color ?? "";
  const initialColor = initialValues?.color ?? initialValues?.color_id ?? "";
  const initialHadValidColorId = Boolean(
    (initialValues?.color_id && isUuid(initialValues.color_id)) ||
      (isUuid(initialColor) && !initialColor.startsWith("__custom__:")),
  );
  const isColorChanged = currentColor !== initialColor;

  if (isEditMode) {
    if (!isColorChanged) {
      if (!initialHadValidColorId) {
        // ID was null/deleted and untouched: do not pass color_id or other_color
        shouldIncludeColor = false;
      } else {
        // ID exists and untouched: pass color_id only, NEVER send other_color (prevents backend duplicate creation error)
        color_id = initialValues?.color_id || initialColor;
        other_color = null;
      }
    } else {
      // Actively changed in edit mode
      if (isUuid(currentColor)) {
        color_id = currentColor;
        other_color = null;
      } else if (currentColor.startsWith("__custom__:")) {
        color_id = null;
        other_color = currentColor.slice("__custom__:".length);
      } else if (currentColor) {
        color_id = null;
        other_color = currentColor;
      } else {
        color_id = null;
        other_color = null;
      }
    }
  } else {
    // Add mode
    const parsed = parseSelectValue(values?.color);
    color_id = parsed.id;
    other_color = parsed.other;
  }

  const payload: Record<string, any> = {
    description: values?.description,
    install_date: values?.installDate,
    supplier: values?.supplier,
    installer: values?.installer,
    ...(options?.projectId ? { project_id: options.projectId } : {}),
  };

  if (shouldIncludeBrand) {
    if (brand_id) payload.brand_id = brand_id;
    if (other_brand) payload.other_brand = other_brand;
    if (!brand_id && !other_brand) {
      payload.brand_id = null;
    }
    // Fallback for endpoints that accept direct `brand` string (only when not edit mode or when brand is specified)
    if (!isEditMode && values?.brand && !brand_id && !other_brand) {
      payload.brand = values.brand;
    }
  }

  if (normType === "roofing" || normType === "siding") {
    payload.material = values?.material;

    if (shouldIncludeStyle) {
      if (style_id) payload.style_id = style_id;
      if (other_style) payload.other_style = other_style;
      if (!style_id && !other_style) {
        payload.style_id = null;
      }
    }
    if (shouldIncludeColor) {
      if (color_id) payload.color_id = color_id;
      if (other_color) payload.other_color = other_color;
      if (!color_id && !other_color) {
        payload.color_id = null;
      }
    }

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
    if (values?.color !== undefined && shouldIncludeColor) {
      if (color_id) payload.color_id = color_id;
      if (other_color) payload.other_color = other_color;
      if (!color_id && !other_color) {
        payload.color_id = null;
      }
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

  return payload;
}
