"use client";

import { useState, useEffect, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { InstallationForm } from "@/components/property-wizard/InstallationForm";
import {
  AddressForm,
  AddressData,
  PropertyOwnerOption,
} from "@/components/property-wizard/AddressForm";
import { CategorySelection } from "@/components/property-wizard/CategorySelection";
import { ConfirmSubmitDialog } from "@/components/property-wizard/ConfirmSubmitDialog";
import {
  getPropertyDetail,
  updateInstallation,
  updateInstallationImagesAdmin,
  updateInstallationImagesByCategory,
  updateProperties,
  getStates,
  getCities,
  getPropertyOwners,
  getPropertyTypes,
  confirmProject,
  getProjectByIdNew,
  updateImagesofPropertyOwnersAdmin,
  uploadOwnerProjectImagesAdmin,
  updatePropertyOwnerInstallation,
  deleteProject,
  uploadInstallationImages,
  uploadPropertOwnerImages,
} from "@/lib/actions";
import { Loader2, ChevronLeft, MapPin, FolderOpen, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/property-wizard/ConfirmDeleteDialog";
import { parseBrandValue } from "@/lib/brand-utils";
import { CategoryImageUpload } from "@/components/property-wizard/CategoryImageUpload";
import { PropertyAddressPhotos } from "@/components/property-wizard/PropertyAddressPhotos";
import { type StateOption, type CityOption } from "@/lib/location-utils";
import { useUser } from "@/components/providers/user-provider";
import { toPascalCase } from "@/lib/utils";

type InstallationType = "roofing" | "siding" | "window_door" | string;
type EditStep =
  | "EDIT_ADDRESS"
  | "EDIT_PROJECT"
  | "EDIT_INSTALLATION"
  | "SUCCESS"
  | "IMAGE_UPLOAD"
  | "EDIT_PHOTOS";

interface Component {
  id: string;
  component_type: string;
  description: string;
  install_date: string;
  supplier: string;
  installer: string;
  brand: string;
  brand_id?: string;
  type?: string;
  style?: string;
  color?: string;
  material?: string;
  impact_resistant?: boolean;
  class_rating?: number | string;
  production_line?: string;
  order_number?: string;
  elevation_data?: any[];
  images?: any[];
  windcode?: string;
  u_factor?: string;
  // manufacturer?: string;
}

function componentToFormValues(comp: Component): any {
  return {
    description: comp.description || "",
    installDate: comp.install_date ? comp.install_date.split("T")[0] : "",
    supplier: comp.supplier || "",
    installer: comp.installer || "",
    brand: comp.brand_id
      ? comp.brand_id
      : comp.brand
        ? `__custom__:${comp.brand}`
        : "",
    brandName: "",
    type: comp.type || "",
    style: comp.style || "",
    color: comp.color || "",
    material: comp.material || "",
    impactResistant: comp.impact_resistant ?? false,
    classRating: comp.class_rating ? String(comp.class_rating) : "",
    productionLine: comp.production_line || "",
    orderNumber: comp.order_number || "",
    elevationdata: comp.elevation_data || [],
    images: comp.images || [],
    windcode: comp.windcode || "",
    u_factor: comp.u_factor || "",
    //manufacturer: comp.manufacturer || '',
  };
}

function EditPropertyForm({ params }: { params: Promise<{ id: string }> }) {
  const { id: propertyId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const role = user?.role?.toLowerCase() || "";
  const noInstallation = searchParams.get("noInstallation") === "true";

  const [property, setProperty] = useState<any>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [step, setStep] = useState<EditStep>("EDIT_PROJECT");
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(
    null,
  );
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [newInstallationType, setNewInstallationType] =
    useState<InstallationType | null>(null);
  const [isOwnerProjectType, setIsOwnerProjectType] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [currentInstallationId, setCurrentInstallationId] = useState<
    string | null
  >(null);
  const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [deletingProject, setDeletingProject] = useState(false);

  const [addressData, setAddressData] = useState<AddressData>({
    address: "",
    address2: "",
    property_type_id: "",
    city_id: "",
    city: "",
    state: "",
    zip: "",
    property_name: "",
    property_owner_id: "",
  });
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [propertyOwners, setPropertyOwners] = useState<PropertyOwnerOption[]>(
    [],
  );
  const [propertyTypes, setPropertyTypes] = useState<
    { id: string; category?: string; name?: string }[]
  >([]);

  const refreshProperty = async () => {
    const res = await getPropertyDetail(propertyId);
    const prop = res?.data ?? res;
    setProperty(prop);
    return prop;
  };

  useEffect(() => {
    const load = async () => {
      setLoadingProperty(true);
      try {
        const propRes = await getPropertyDetail(propertyId);
        const prop = propRes?.data ?? propRes;
        setProperty(prop);

        const propStateId = prop?.state_id || prop?.state?.id;

        const [statesRes, citiesRes, ownersRes, typesRes] = await Promise.all([
          getStates(1, 1000),
          getCities(
            undefined,
            undefined,
            undefined,
            undefined,
            propStateId || undefined,
          ),
          role === "admin" ? getPropertyOwners() : Promise.resolve([]),
          getPropertyTypes(),
        ]);

        const rawStates: any[] = Array.isArray(statesRes)
          ? statesRes
          : (statesRes as any)?.data || [];
        const rawCities: any[] = Array.isArray(citiesRes)
          ? citiesRes
          : (citiesRes as any)?.data || [];
        const rawOwners: any[] = Array.isArray(ownersRes)
          ? ownersRes
          : (ownersRes as any)?.data || [];
        const rawPropertyTypes: any[] = Array.isArray(typesRes)
          ? typesRes
          : Array.isArray((typesRes as any)?.data)
            ? (typesRes as any).data
            : Array.isArray((typesRes as any)?.data?.data)
              ? (typesRes as any).data.data
              : [];

        setStates(
          rawStates.map((s) => ({
            id: String(s.id),
            name: s.state_name || s.name,
            abbreviation: s.abbreviation,
          })),
        );
        setCities(
          rawCities.map((c) => ({
            id: String(c.id),
            name: c.city_name || c.name,
            state_id: c.state_id ? String(c.state_id) : undefined,
          })),
        );
        setPropertyOwners(
          rawOwners.map((o: any) => ({
            id: String(o.id),
            first_name: o.first_name,
            last_name: o.last_name,
            email: o.email,
          })),
        );
        const mappedTypes = rawPropertyTypes.map((pt: any, idx: number) => ({
          id: pt.id ? String(pt.id) : pt.category || `pt-${idx}`,
          category: pt.category || pt.name,
          name: pt.category || pt.name,
        }));
        if (
          !mappedTypes.some(
            (t: any) => t.category === "OTHER" || t.id === "OTHER",
          )
        ) {
          mappedTypes.push({
            id: "OTHER",
            category: "OTHER",
            name: "OTHER",
          });
        }
        setPropertyTypes(mappedTypes);

        const propTypeId =
          prop?.property_type_id || prop?.property_type?.id || "";
        const propTypeCategory =
          prop?.property_type_category || prop?.property_type?.category || "";
        const otherPropType =
          prop?.other_property_type || prop?.other_property_type_name || "";
        const isOtherProp =
          propTypeCategory === "OTHER" ||
          propTypeId === "OTHER" ||
          !!otherPropType;

        setAddressData({
          address: prop?.address || "",
          address2: prop?.address2 || "",
          property_type_id: isOtherProp ? propTypeId || "OTHER" : propTypeId,
          property_type_category: isOtherProp ? "OTHER" : propTypeCategory,
          other_property_type: otherPropType,
          initial_other_property_type: otherPropType,
          initial_property_type_id:
            propTypeId && propTypeId !== "OTHER" ? propTypeId : undefined,
          property_name: prop?.property_name || "",
          city_id: prop?.city_id || "",
          city: prop?.city_name || "",
          other_city: prop?.other_city || "",
          state: prop?.state_id || "",
          zip: prop?.zip || "",
          property_owner_id: prop?.property_owner_id || "",
          latitude: prop?.latitude ? Number(prop.latitude) : undefined,
          longitude: prop?.longitude ? Number(prop.longitude) : undefined,
        });

        const searchProjectId = searchParams.get("projectId");
        const editAddressParam = searchParams.get("editAddress") === "true";
        if (editAddressParam) {
          setStep("EDIT_ADDRESS");
        } else {
          const matchedProj = searchProjectId
            ? prop?.projects?.find(
                (p: any) =>
                  String(p.id ?? p.project_id ?? p._id) === searchProjectId,
              )
            : prop?.projects?.[0];
          if (matchedProj) {
            setSelectedProject(matchedProj);
            const ownerId =
              prop?.property_owner_id ||
              prop?.property_owner?.id ||
              matchedProj.property?.property_owner_id ||
              matchedProj.property_owner_id ||
              matchedProj.property?.property_owner?.id;
            const ownerEmail =
              prop?.property_owner_email ||
              prop?.property_owner?.email ||
              matchedProj.property?.property_owner_email ||
              matchedProj.property_owner_email ||
              matchedProj.property?.property_owner?.email;
            const projTypeUpper = (matchedProj.project_type || "")
              .toUpperCase()
              .replace(/_/g, " ");
            const isOwner =
              projTypeUpper === "WINDOWS AND DOORS" ||
              projTypeUpper === "NEW APPLIANCES" ||
              matchedProj.added_by === "PROPERTY_OWNER" ||
              matchedProj.created_by_type === "PROPERTY_OWNER" ||
              role === "property_owner" ||
              (matchedProj.created_by &&
                ownerId &&
                String(matchedProj.created_by) === String(ownerId)) ||
              (matchedProj.created_by_email &&
                ownerEmail &&
                matchedProj.created_by_email.toLowerCase() ===
                  ownerEmail.toLowerCase());
            setIsOwnerProjectType(isOwner);
          } else if (searchProjectId) {
            setSelectedProject({ id: searchProjectId });
          }
          setSelectedComponent(null);
          setNewInstallationType(null);
          setStep("EDIT_PROJECT");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load property");
      } finally {
        setLoadingProperty(false);
      }
    };
    load();
  }, [propertyId, searchParams, role]);

  useEffect(() => {
    if (searchParams.get("editAddress") === "true") {
      setStep("EDIT_ADDRESS");
      return;
    }
    if (step === "EDIT_PROJECT" && property && !selectedProject) {
      const projects = property.projects ?? [];
      const searchProjectId = searchParams.get("projectId");
      let matchedProj = null;
      if (searchProjectId) {
        matchedProj = projects.find(
          (p: any) => String(p.id ?? p.project_id ?? p._id) === searchProjectId,
        );
        setSelectedProject(matchedProj || { id: searchProjectId });
      } else if (projects.length > 0) {
        setSelectedProject(projects[0]);
      }
      setSelectedComponent(null);
      setNewInstallationType(null);
    }
  }, [step, property, searchParams, selectedProject]);

  useEffect(() => {
    const projId =
      selectedProject?.id ??
      selectedProject?.project_id ??
      selectedProject?._id;
    if (!projId) return;

    // Only fetch details for existing projects (not new projects being created)
    const isExisting =
      property?.projects?.some(
        (p: any) => String(p.id ?? p.project_id ?? p._id) === String(projId),
      ) || searchParams.get("projectId") === String(projId);

    if (!isExisting) return;

    if (!selectedProject.isLoadedFromNewApi) {
      const fetchDetails = async () => {
        setLoadingProjectDetails(true);
        try {
          const res = await getProjectByIdNew(projId);
          const rawProj = res?.data ?? res;
          if (rawProj) {
            const mappedProj = {
              ...rawProj,
              components: rawProj.details
                ? {
                    ...rawProj.details,
                    component_type:
                      rawProj.details._component_type || rawProj.project_type,
                    images: rawProj.images || [],
                  }
                : null,
              isLoadedFromNewApi: true,
            };
            setSelectedProject(mappedProj);
            const ownerId =
              property?.property_owner_id ||
              property?.property_owner?.id ||
              rawProj.property?.property_owner_id ||
              rawProj.property_owner_id ||
              rawProj.property?.property_owner?.id;
            const ownerEmail =
              property?.property_owner_email ||
              property?.property_owner?.email ||
              rawProj.property?.property_owner_email ||
              rawProj.property_owner_email ||
              rawProj.property?.property_owner?.email;
            const projTypeUpper = (rawProj.project_type || "")
              .toUpperCase()
              .replace(/_/g, " ");
            const isOwner =
              projTypeUpper === "WINDOWS AND DOORS" ||
              projTypeUpper === "NEW APPLIANCES" ||
              rawProj.added_by === "PROPERTY_OWNER" ||
              rawProj.created_by_type === "PROPERTY_OWNER" ||
              role === "property_owner" ||
              (rawProj.created_by &&
                ownerId &&
                String(rawProj.created_by) === String(ownerId)) ||
              (rawProj.created_by_email &&
                ownerEmail &&
                rawProj.created_by_email.toLowerCase() ===
                  ownerEmail.toLowerCase());
            setIsOwnerProjectType(isOwner);
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to load project details");
        } finally {
          setLoadingProjectDetails(false);
        }
      };
      fetchDetails();
    }
  }, [
    selectedProject?.id,
    selectedProject?.project_id,
    selectedProject?._id,
    property,
    searchParams,
  ]);

  const handleConfirmProject = async () => {
    const pId =
      selectedProject?.id ??
      selectedProject?.project_id ??
      selectedProject?._id;
    if (!pId) {
      toast.error("Project ID not found");
      return;
    }
    setSaving(true);
    try {
      const hasReport = property?.has_report || false;
      const res = await confirmProject(pId, hasReport, propertyId);
      if (res.success) {
        toast.success("Project confirmed successfully!");
        router.replace("/my-projects");
      } else {
        toast.error(res.message || "Failed to confirm project");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm project");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    const pId =
      projectToDelete.id ?? projectToDelete.project_id ?? projectToDelete._id;
    if (!pId) {
      toast.error("Project ID not found");
      return;
    }
    setDeletingProject(true);
    try {
      const res = await deleteProject(pId);
      if (res.success) {
        toast.success("Project deleted successfully!");
        await refreshProperty();
      } else {
        toast.error(res.message || "Failed to delete project");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete project");
    } finally {
      setDeletingProject(false);
      setProjectToDelete(null);
    }
  };

  const handleAddressSave = async (e: React.FormEvent, nextStep?: string) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isOtherType =
        addressData.property_type_category === "OTHER" ||
        addressData.property_type_id === "OTHER" ||
        addressData.property_type === "OTHER" ||
        !!addressData.other_property_type;

      let finalPropertyTypeId: string | null = null;
      if (isOtherType) {
        const hasChangedOtherText =
          addressData.other_property_type !==
          addressData.initial_other_property_type;
        if (!hasChangedOtherText && addressData.initial_property_type_id) {
          finalPropertyTypeId = addressData.initial_property_type_id;
        } else {
          finalPropertyTypeId = null;
        }
      } else {
        finalPropertyTypeId =
          addressData.property_type_id || addressData.property_type || null;
      }

      const result = await updateProperties(propertyId, {
        address: addressData.address,
        address2: addressData.address2,
        property_type_id: finalPropertyTypeId,
        property_type_category: isOtherType
          ? "OTHER"
          : addressData.property_type_category || null,
        other_property_type: isOtherType
          ? addressData.other_property_type || null
          : null,
        property_name: addressData.property_name,
        city_id: addressData.city_id || null,
        other_city: addressData.other_city || null,
        state_id: addressData.state || addressData.state_id || null,
        zip: addressData.zip,
        property_owner_id: addressData.property_owner_id,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Address updated successfully");

      const [citiesRes, prop] = await Promise.all([
        getCities(),
        refreshProperty(),
      ]);

      const rawCities: any[] = Array.isArray(citiesRes)
        ? citiesRes
        : (citiesRes as any)?.data || [];
      setCities(
        rawCities.map((c) => ({
          id: String(c.id),
          name: c.city_name || c.name,
          state_id: c.state_id ? String(c.state_id) : undefined,
        })),
      );

      const actualProp = Array.isArray(prop) ? prop[0] : prop;
      if (actualProp) {
        const propTypeId =
          actualProp.property_type_id || actualProp.property_type?.id || "";
        const propTypeCategory =
          actualProp.property_type_category ||
          actualProp.property_type?.category ||
          "";
        const otherPropType =
          actualProp.other_property_type ||
          actualProp.other_property_type_name ||
          "";
        const isOtherProp =
          propTypeCategory === "OTHER" ||
          propTypeId === "OTHER" ||
          !!otherPropType;

        setAddressData({
          address: actualProp.address || "",
          address2: actualProp.address2 || "",
          property_type_id: isOtherProp ? propTypeId || "OTHER" : propTypeId,
          property_type_category: isOtherProp ? "OTHER" : propTypeCategory,
          other_property_type: otherPropType,
          initial_other_property_type: otherPropType,
          initial_property_type_id:
            propTypeId && propTypeId !== "OTHER" ? propTypeId : undefined,
          property_name: actualProp.property_name || "",
          city_id: actualProp.city_id || "",
          city: actualProp.city_name || "",
          other_city: actualProp.other_city || "",
          state: actualProp.state_id || "",
          zip: actualProp.zip || "",
          property_owner_id: actualProp.property_owner_id || "",
          latitude: actualProp.latitude
            ? Number(actualProp.latitude)
            : undefined,
          longitude: actualProp.longitude
            ? Number(actualProp.longitude)
            : undefined,
        });
      }

      if (nextStep === "IMAGES") {
        setStep("EDIT_PHOTOS");
      } else {
        setStep("EDIT_PROJECT");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update address");
    } finally {
      setSaving(false);
    }
  };

  const handleInstallationSave = async (
    values: any,
    files: {
      contractorFiles: File[];
      ownerFiles: File[];
      categoryFiles?: Record<string, File>;
    },
  ) => {
    if (!selectedComponent) return;
    const type = (selectedComponent.component_type || "").toLowerCase();
    setSaving(true);
    try {
      const { brand_id, other_brand } = parseBrandValue(values.brand);
      const payload: any = {
        description: values.description,
        install_date: values.installDate,
        supplier: values.supplier,
        installer: values.installer,
        // manufacturer: values.manufacturer || null,
        ...(brand_id && { brand_id }),
        ...(other_brand && { other_brand }),
        ...(!brand_id && !other_brand && { brand_id: null, other_brand: null }),
      };
      if (type === "roofing" || type === "siding") {
        payload.style = values.style;
        payload.color = values.color;
        payload.material = values.material;
        payload.type = values.type;
        if (type === "roofing") {
          payload.impact_resistant = values.impactResistant;
          payload.class_rating = values.classRating;
        } else if (type === "siding") {
          payload.elevation_data = values.elevationdata;
        }
      } else if (
        type === "windows" ||
        type === "doors" ||
        type === "garage_doors" ||
        type === "window_door"
      ) {
        if (type === "windows" || type === "doors" || type === "window_door") {
          payload.production_line = values.productionLine;
          payload.order_number = values.orderNumber;
        }
        if (type === "garage_doors") {
          payload.windcode = values.windcode;
          if (values.orderNumber) {
            payload.order_number = values.orderNumber;
          }
        }
        if (type === "windows") {
          payload.u_factor = values.u_factor;
        }
      }
      const response = isOwnerProjectType
        ? await updatePropertyOwnerInstallation(selectedComponent.id, payload)
        : await updateInstallation(type, selectedComponent.id, payload);
      if (!response.success) {
        toast.error(response.message);
        return;
      }

      const newInstallationId =
        response?.data?.data?.id || response?.data?.id || selectedComponent.id;

      if (isOwnerProjectType) {
        const allOwnerFiles: File[] = [];
        if (files.categoryFiles) {
          Object.values(files.categoryFiles).forEach((f) => {
            if (f) allOwnerFiles.push(f);
          });
        }
        if (files.contractorFiles && files.contractorFiles.length > 0) {
          allOwnerFiles.push(...files.contractorFiles);
        }
        if (files.ownerFiles && files.ownerFiles.length > 0) {
          allOwnerFiles.push(...files.ownerFiles);
        }

        if (allOwnerFiles.length > 0) {
          const response = await uploadOwnerProjectImagesAdmin(
            newInstallationId,
            allOwnerFiles,
          );
          if (!response.success) {
            toast.error(
              response.message || `Failed to update ${type} installation`,
            );
            return;
          }
        }
      } else {
        if (
          files.categoryFiles &&
          Object.keys(files.categoryFiles).length > 0
        ) {
          const response = await updateInstallationImagesByCategory(
            type,
            newInstallationId,
            files.categoryFiles,
          );
          if (!response.success) {
            toast.error(
              response.message || `Failed to update ${type} installation`,
            );
            return;
          }
        } else if (files.contractorFiles.length > 0) {
          const response = await updateInstallationImagesAdmin(
            type,
            newInstallationId,
            files.contractorFiles,
          );
          if (!response.success) {
            toast.error(
              response.message || `Failed to update ${type} installation`,
            );
            return;
          }
        }
        if (files.ownerFiles.length > 0) {
          const response = await updateImagesofPropertyOwnersAdmin(
            type,
            newInstallationId,
            files.ownerFiles,
          );
          if (!response.success) {
            toast.error(
              response.message || `Failed to update ${type} installation`,
            );
            return;
          }
        }
      }
      toast.success("Installation updated successfully");
      await refreshProperty();
      if (role !== "admin") {
        setSelectedComponent(null);
        setStep("SUCCESS");
      } else {
        setSelectedComponent(null);
        setSelectedProject(null);
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update installation");
    } finally {
      setSaving(false);
    }
  };

  const projects: any[] = property?.projects ?? [];

  const saveNewInstallationBase = async (
    values: any,
  ): Promise<string | null> => {
    if (!newInstallationType) return null;
    const projectId =
      selectedProject?.id ??
      selectedProject?.project_id ??
      selectedProject?._id ??
      localStorage.getItem("current_project_id");
    const { brand_id, other_brand } = parseBrandValue(values.brand);
    const payload: any = {
      description: values.description,
      install_date: values.installDate,
      supplier: values.supplier,
      installer: values.installer,
      ...(brand_id && { brand_id }),
      ...(other_brand && { other_brand }),
      ...(projectId && { project_id: projectId }),
    };
    const type = newInstallationType;
    if (type === "roofing" || type === "siding") {
      payload.style = values.style;
      payload.color = values.color;
      payload.material = values.material;
      payload.type = values.type;
      if (type === "roofing") {
        payload.impact_resistant = values.impactResistant;
        payload.class_rating = values.classRating;
      } else if (type === "siding") {
        payload.elevation_data = values.elevationdata;
      }
    } else if (
      type === "windows" ||
      type === "doors" ||
      type === "garage_doors" ||
      type === "window_door"
    ) {
      if (type === "windows" || type === "doors" || type === "window_door") {
        payload.production_line = values.productionLine;
        payload.order_number = values.orderNumber;
      }
      if (type === "garage_doors") {
        payload.windcode = values.windcode;
        if (values.orderNumber) {
          payload.order_number = values.orderNumber;
        }
      }
      if (type === "windows") {
        payload.u_factor = values.u_factor;
      }
    }
    const { postInstallation, postPropertyOwnerInstallations } =
      await import("@/lib/actions");
    const isOwnerProject =
      role === "property_owner" ||
      isOwnerProjectType ||
      newInstallationType === "windows and doors" ||
      newInstallationType === "WINDOWS AND DOORS";
    const installResult = isOwnerProject
      ? await postPropertyOwnerInstallations(propertyId, payload)
      : await postInstallation(propertyId, newInstallationType, payload);
    if (!installResult.success)
      throw new Error(installResult.message || "Failed to save installation");
    const installationId =
      installResult.data?.data?.id || installResult.data?.id;
    if (!installationId) throw new Error("No installation ID returned");
    return installationId;
  };

  const handleNewInstallationSave = async (
    values: any,
    files: {
      contractorFiles: File[];
      ownerFiles: File[];
      categoryFiles?: Record<string, File>;
    },
  ) => {
    setSaving(true);
    try {
      const installationId = await saveNewInstallationBase(values);
      if (!installationId) return;

      const isOwnerProject =
        role === "property_owner" ||
        isOwnerProjectType ||
        newInstallationType === "windows and doors" ||
        newInstallationType === "WINDOWS AND DOORS" ||
        newInstallationType === "new appliances" ||
        newInstallationType === "NEW APPLIANCES" ||
        newInstallationType === "NEW_APPLIANCES";

      if (isOwnerProject) {
        const allOwnerFiles: File[] = [];
        if (files.categoryFiles) {
          Object.values(files.categoryFiles).forEach((f) => {
            if (f) allOwnerFiles.push(f);
          });
        }
        if (files.contractorFiles && files.contractorFiles.length > 0) {
          allOwnerFiles.push(...files.contractorFiles);
        }
        if (files.ownerFiles && files.ownerFiles.length > 0) {
          allOwnerFiles.push(...files.ownerFiles);
        }
        if (allOwnerFiles.length > 0) {
          const r = await uploadPropertOwnerImages(
            newInstallationType!,
            installationId,
            allOwnerFiles,
          );
          if (!r.success) throw new Error(r.message || "Failed to upload owner project images");
        }
      } else {
        if (
          files.categoryFiles &&
          Object.keys(files.categoryFiles).length > 0
        ) {
          const r = await uploadInstallationImages(
            newInstallationType!,
            installationId,
            files.categoryFiles,
          );
          if (!r.success) throw new Error(r.message || "Failed to upload category images");
        } else if (files.contractorFiles && files.contractorFiles.length > 0) {
          const r = await uploadInstallationImages(
            newInstallationType!,
            installationId,
            files.contractorFiles,
          );
          if (!r.success) throw new Error(r.message || "Failed to upload contractor images");
        }
        if (files.ownerFiles && files.ownerFiles.length > 0) {
          const r = await uploadPropertOwnerImages(
            newInstallationType!,
            installationId,
            files.ownerFiles,
          );
          if (!r.success) throw new Error(r.message || "Failed to upload owner images");
        }
      }
      localStorage.removeItem("current_project_id");
      localStorage.removeItem("current_property_id");
      toast.success("Installation added successfully");
      await refreshProperty();
      if (role !== "admin") {
        setNewInstallationType(null);
        setStep("SUCCESS");
      } else {
        setNewInstallationType(null);
        setSelectedProject(null);
        setStep("EDIT_PROJECT");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add installation");
    } finally {
      setSaving(false);
    }
  };

  const handleNewInstallationAddImages = async (
    values: any,
    files: {
      contractorFiles: File[];
      ownerFiles: File[];
      categoryFiles?: Record<string, File>;
    },
  ) => {
    setSaving(true);
    try {
      const installationId = await saveNewInstallationBase(values);
      if (installationId) {
        setCurrentInstallationId(installationId);
        setStep("IMAGE_UPLOAD");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add installation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] md:bg-[#1F2A44] md:min-h-screen flex flex-col flex-1">
      <div
        className={`relative z-10 flex flex-col flex-1 items-center w-full mt-0`}
      >
        <div
          className={`w-full bg-white px-6 pt-10 md:p-20 flex-1 md:min-h-[781px] relative mt-0`}
        >
          <div className="max-w-[1170px] mx-auto relative w-full">
            {/* ── Loading ── */}
            {loadingProperty && (
              <div className="flex flex-col items-center justify-center py-32 gap-4 text-[#708090]">
                <Loader2 className="size-10 animate-spin text-[#1CA7A6]" />
                <span className="font-medium text-[16px] font-asap">
                  Loading…
                </span>
              </div>
            )}

            {/* ── EDIT ADDRESS ── */}
            {!loadingProperty && step === "EDIT_ADDRESS" && (
              <AddressForm
                data={addressData}
                onChange={setAddressData}
                onSubmit={handleAddressSave}
                loading={saving}
                states={states}
                cities={cities}
                propertyOwners={propertyOwners}
                propertyTypes={propertyTypes}
                isEdit
                onBack={() => setStep("EDIT_PROJECT")}
                hasSavedImages={
                  !!property?.front_image || !!property?.other_image
                }
              />
            )}

            {!loadingProperty && step === "EDIT_PHOTOS" && (
              <PropertyAddressPhotos
                address={property?.address || addressData.address}
                propertyId={propertyId}
                onSave={async () => {
                  await refreshProperty();
                  setStep("EDIT_PROJECT");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onBack={() => {
                  setStep("EDIT_ADDRESS");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}

            {!loadingProperty && loadingProjectDetails && (
              <div className="flex flex-col items-center justify-center py-32 gap-4 text-[#708090]">
                <Loader2 className="size-10 animate-spin text-[#1CA7A6]" />
                <span className="font-medium text-[16px] font-asap">
                  Loading project details…
                </span>
              </div>
            )}

            {!loadingProperty &&
              !loadingProjectDetails &&
              step === "EDIT_PROJECT" && (
                <CategorySelection
                  address={property?.address || ""}
                  propertyId={propertyId}
                  stateId={
                    property?.state_id ||
                    property?.state?.id ||
                    addressData.state ||
                    addressData.state_id
                  }
                  initialProjectType={
                    selectedProject
                      ? toPascalCase(selectedProject.project_type || "")
                      : undefined
                  }
                  disableProjectType={!!selectedProject}
                  isEditMode={!!selectedProject}
                  projectId={selectedProject?.id}
                  defaultGoverningCityId={addressData.city_id}
                  cities={cities}
                  initialProjectData={
                    selectedProject
                      ? {
                          project_name: selectedProject.project_name,
                          project_type: selectedProject.project_type,
                          other: selectedProject.other,
                          date_of_install: selectedProject.date_of_install,
                          governing_city_id: selectedProject.governing_city_id,
                          permit: selectedProject.permit,
                          need_permit: selectedProject.need_permit,
                          project_status: selectedProject.project_status,
                          notes: selectedProject.notes,
                          contractor_id: selectedProject.contractor_id,
                          visible_status: selectedProject.visible_status,
                        }
                      : undefined
                  }
                  onContinue={(data) => {
                    const projectId =
                      data.projectData?.data?.id ||
                      data.projectData?.id ||
                      null;
                    if (projectId) {
                      localStorage.setItem("current_project_id", projectId);
                      localStorage.setItem("current_property_id", propertyId);
                    }
                    if (data.isOwnerProjectType) {
                      setIsOwnerProjectType(true);
                    } else {
                      setIsOwnerProjectType(false);
                    }
                    if (data.type) {
                      if (selectedProject?.components && !noInstallation) {
                        setSelectedComponent(selectedProject.components);
                        setNewInstallationType(null);
                      } else {
                        setSelectedComponent(null);
                        setNewInstallationType(data.type);
                      }
                      setStep("EDIT_INSTALLATION");
                    }
                  }}
                  onBack={() => {
                    router.back();
                  }}
                  onSaveSuccess={() => {
                    if (role !== "admin") {
                      router.push("/my-projects");
                    }
                  }}
                />
              )}

            {/* ── EDIT INSTALLATION (existing component) ── */}
            {!loadingProperty &&
              step === "EDIT_INSTALLATION" &&
              selectedComponent && (
                <InstallationForm
                  type={selectedProject.project_type}
                  tempPropertyId={propertyId}
                  address={property?.address || ""}
                  propertyName={
                    property?.property_name || addressData.property_name
                  }
                  initialValues={componentToFormValues(selectedComponent)}
                  isSubmitting={saving}
                  isOwnerProjectType={isOwnerProjectType}
                  onSave={handleInstallationSave}
                  onBack={() => {
                    setSelectedComponent(null);
                    setStep("EDIT_PROJECT");
                  }}
                />
              )}

            {!loadingProperty &&
              step === "EDIT_INSTALLATION" &&
              !selectedComponent &&
              newInstallationType && (
                <InstallationForm
                  type={newInstallationType}
                  tempPropertyId={propertyId}
                  address={property?.address || ""}
                  propertyName={
                    property?.property_name || addressData.property_name
                  }
                  isSubmitting={saving}
                  onSave={handleNewInstallationSave}
                  onAddImages={handleNewInstallationAddImages}
                  onBack={() => {
                    setNewInstallationType(null);
                    setStep("EDIT_PROJECT");
                  }}
                />
              )}

            {!loadingProperty &&
              step === "IMAGE_UPLOAD" &&
              newInstallationType && (
                <CategoryImageUpload
                  address={property?.address || ""}
                  initialCategory={newInstallationType}
                  onSave={async (photos) => {
                    if (!currentInstallationId) return;
                    setSaving(true);
                    try {
                      const result = await uploadInstallationImages(
                        newInstallationType,
                        currentInstallationId,
                        photos as Record<string, File>,
                      );
                      if (!result.success) {
                        toast.error(
                          result.message ||
                            "Failed to upload images. Please try again.",
                        );
                        return;
                      }
                      localStorage.removeItem("current_project_id");
                      localStorage.removeItem("current_property_id");
                      toast.success(
                        "Installation added successfully with images",
                      );
                      await refreshProperty();
                      setNewInstallationType(null);
                      setStep("SUCCESS");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } catch (err: any) {
                      toast.error(err.message || "Failed to upload images");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  onBack={() => setStep("EDIT_INSTALLATION")}
                />
              )}

            {/* ── SUCCESS STEP ── */}
            {!loadingProperty && step === "SUCCESS" && (
              <div className="w-full max-w-[1170px] mx-auto space-y-[20px] md:space-y-[45px] animate-in fade-in slide-in-from-bottom-4 duration-500 font-asap px-[20px] md:px-0">
                <div className="text-center space-y-[10px] md:space-y-[15px]">
                  <div className="flex justify-center">
                    <div className="size-[64px] md:size-[90px] rounded-full bg-[rgba(28,167,166,0.12)] flex items-center justify-center">
                      <svg
                        className="size-[32px] md:size-[46px] text-[#1CA7A6]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-[24px] md:text-[36px] font-bold text-[#1F2A44] uppercase leading-tight md:leading-[41px]">
                    Installation Updated!
                  </h2>
                  <p className="text-[#708090] font-medium text-[14px] md:text-[18px] leading-relaxed max-w-[480px] mx-auto">
                    Your installation has been updated. Please confirm your
                    project details or return to Homepage.
                  </p>
                </div>

                <div className="flex flex-col gap-[12px] md:gap-[16px] pt-[10px] md:pt-[20px]">
                  <button
                    onClick={() => setConfirmDialogOpen(true)}
                    disabled={saving}
                    className="w-full h-[52px] md:h-[77px] bg-[#1CA7A6] hover:bg-[#1CA7A6]/90 disabled:opacity-60 text-white font-bold rounded-[10px] text-[18px] md:text-[24px] font-asap transition-colors flex items-center justify-center gap-3"
                  >
                    {saving ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : null}
                    Confirm Project
                  </button>

                  <button
                    onClick={() => {
                      router.replace("/dashboard");
                    }}
                    className="w-full h-[52px] md:h-[77px] border-2 border-[#1F2A44] text-[#1F2A44] font-bold rounded-[10px] text-[18px] md:text-[24px] font-asap hover:bg-[rgba(31,42,68,0.06)] transition-colors"
                  >
                    Save as Draft & Go to Home
                  </button>
                </div>

                <ConfirmSubmitDialog
                  open={confirmDialogOpen}
                  onConfirm={() => {
                    setConfirmDialogOpen(false);
                    handleConfirmProject();
                  }}
                  onCancel={() => setConfirmDialogOpen(false)}
                  title="Confirm Project"
                  description="Once confirmed, this project cannot be edited by you. Only an admin will be able to make changes after submission."
                />
              </div>
            )}
            <ConfirmDeleteDialog
              open={!!projectToDelete}
              onConfirm={handleConfirmDeleteProject}
              onCancel={() => setProjectToDelete(null)}
              loading={deletingProject}
              title="Delete Project"
              description={`Are you sure you want to delete the project "${projectToDelete?.project_name || ""}"? This action cannot be undone.`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-[#708090] bg-[#FFFFFF] md:bg-[#1F2A44]">
          <Loader2 className="size-10 animate-spin text-[#1CA7A6]" />
          <span className="font-medium text-[16px] font-asap md:text-white">
            Loading...
          </span>
        </div>
      }
    >
      <EditPropertyForm params={params} />
    </Suspense>
  );
}
