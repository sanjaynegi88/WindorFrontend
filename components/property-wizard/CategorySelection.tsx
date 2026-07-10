"use client";

import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { format, parseISO } from "date-fns";
import {
  getComponentType,
  addProject,
  editProject,
  getUserList,
  getProjectTypesforPropertyOwner,
} from "@/lib/actions";
import { toast } from "sonner";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type CityOption } from "@/lib/location-utils";
import { useUser } from "@/components/providers/user-provider";

const projectSchema = z.object({
  project_name: z.string().min(1, "Project name is required"),
  project_type: z.string().min(1, "Project type is required"),
  other: z.string().optional(),
  date_of_install: z.string().optional(),
  governing_city_id: z.string().min(1, "City is required"),
  permit: z.string().optional(),
  need_permit: z.boolean().optional(),
  notes: z.string().optional(),
  contractor_id: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.project_type.toUpperCase() === "OTHER" && !data.other?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify the project type",
      path: ["other"],
    });
  }
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface CategorySelectionProps {
  address: string;
  propertyId: string;
  onContinue: (data: any) => void;
  onBack: () => void;
  onSaveSuccess?: () => void;
  initialProjectType?: string;
  disableProjectType?: boolean;
  isEditMode?: boolean;
  projectId?: string;
  defaultGoverningCityId?: string;
  cities?: CityOption[];
  initialProjectData?: {
    project_name?: string;
    project_type?: string;
    other?: string;
    date_of_install?: string;
    governing_city_id?: string;
    permit?: string;
    need_permit?: boolean;
    notes?: string;
    contractor_id?: string;
    visible_status?: string;
    project_status?: string;
  };
}

type ComponentType = {
  name: string;
  required_permit?: boolean;
  isOwnerProjectType?: boolean;
};

const inputClass =
  "w-full h-[46px] md:h-[65px] px-[20px] md:px-[29px] rounded-[6px] md:rounded-[10px] border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] bg-white text-[14px] md:text-[20px] font-medium text-[#1F2A44] focus:outline-none placeholder:text-[#708090]/50 font-asap";

const triggerClass =
  "w-full h-[46px] md:h-[65px] px-[20px] md:px-[29px] rounded-[6px] md:rounded-[10px] border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] bg-white text-[14px] md:text-[20px] font-medium text-[#1F2A44] data-placeholder:text-[#708090]/50 focus:ring-[#1CA7A6]/20 font-asap gap-2 justify-start text-left [&>span]:flex-1 [&>span]:truncate [&>span]:text-left";

export function CategorySelection({
  address,
  propertyId,
  onContinue,
  onBack,
  onSaveSuccess,
  initialProjectType,
  disableProjectType = false,
  isEditMode = false,
  projectId,
  initialProjectData,
  defaultGoverningCityId,
  cities = [],
}: CategorySelectionProps) {
  const [projectName, setProjectName] = useState(initialProjectData?.project_name || "");
  const [projectType, setProjectType] = useState<string>(initialProjectData?.project_type?.toLowerCase() || initialProjectType || "");
  const [dateOfInstall, setDateOfInstall] = useState<Date | undefined>(
    initialProjectData?.date_of_install ? parseISO(initialProjectData.date_of_install) : undefined
  );
  const [governingCity, setGoverningCity] = useState(initialProjectData?.governing_city_id || defaultGoverningCityId || "");
  const [permit, setPermit] = useState(initialProjectData?.permit || "");
  const [needPermit, setNeedPermit] = useState(initialProjectData?.need_permit ?? false);
  const [notes, setNotes] = useState(initialProjectData?.notes || "");
  const [other, setOther] = useState(initialProjectData?.other || "");
  const [contractorId, setContractorId] = useState(initialProjectData?.contractor_id || "");
  const [contractors, setContractors] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [visibility, setVisibility] = useState<"public" | "private">(
    initialProjectData?.visible_status === "private" ? "private" : "public"
  );

  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProjectFormValues, string>>
  >({});

  const { user } = useUser();
  const userRole = (user?.role || "").toLowerCase();

  const isAdmin = userRole === "admin";
  const isPropertyOwner = userRole === "property_owner";

  const selectedComponentType = componentTypes.find(
    (t) => t.name.toLowerCase() === projectType
  );
  const isPermitRequired = selectedComponentType ? (selectedComponentType.required_permit === true) : !isPropertyOwner;

  useEffect(() => {
    if (componentTypes.length > 0) {
      setNeedPermit(isPermitRequired);
    }
  }, [isPermitRequired, componentTypes]);

  useEffect(() => {
    setProjectName(initialProjectData?.project_name || "");
    setProjectType(initialProjectData?.project_type?.toLowerCase() || initialProjectType || "");
    setDateOfInstall(initialProjectData?.date_of_install ? parseISO(initialProjectData.date_of_install) : undefined);
    setGoverningCity(initialProjectData?.governing_city_id || defaultGoverningCityId || "");
    setPermit(initialProjectData?.permit || "");
    setNeedPermit(isPropertyOwner ? (initialProjectData?.need_permit ?? false) : (initialProjectData?.need_permit ?? true));
    setNotes(initialProjectData?.notes || "");
    setOther(initialProjectData?.other || "");
    setContractorId(initialProjectData?.contractor_id || "");
    setVisibility(initialProjectData?.visible_status === "private" ? "private" : "public");
    setHasChanges(false);
  }, [initialProjectData, initialProjectType, defaultGoverningCityId, isPropertyOwner]);

  useEffect(() => {
    if (!isAdmin) return;
    getUserList(1, 1000, "CONTRACTOR")
      .then((res) => {
        const list: any[] = Array.isArray(res) ? res : res?.data || [];
        setContractors(
          list.map((u: any) => ({
            id: String(u.id),
            name:
              `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email,
            email: u.email ?? "",
          })),
        );
      })
      .catch(() => toast.error("Failed to load contractors"));
  }, [isAdmin]);

  useEffect(() => {
    const fetchComponentTypes = async () => {
      try {
        setLoading(true);

        let types: ComponentType[] = [];
        if (isAdmin) {
          const [ownerRes, compRes] = await Promise.all([
            getProjectTypesforPropertyOwner().catch(() => null),
            getComponentType().catch(() => null),
          ]);
          const ownerTypes: ComponentType[] = (ownerRes?.data?.report_types || []).map((t: any) => ({
            ...t,
            required_permit: false,
            isOwnerProjectType: true
          }));
          const compTypes: ComponentType[] = (compRes?.data?.report_types || []).map((t: any) => ({
            ...t,
            required_permit: true,
            isOwnerProjectType: false
          }));

          const merged = [...ownerTypes, ...compTypes];
          const uniqueNames = new Set<string>();
          types = merged.filter(t => {
            if (!t?.name) return false;
            const key = t.name.toUpperCase();
            if (uniqueNames.has(key)) return false;
            uniqueNames.add(key);
            return true;
          });
        } else {
          const fetchProjectTypes = isPropertyOwner
            ? getProjectTypesforPropertyOwner
            : getComponentType;

          const response = await fetchProjectTypes();
          const rawTypes = response?.data?.report_types || [];
          types = rawTypes.map((t: any) => ({
            ...t,
            required_permit: !isPropertyOwner,
            isOwnerProjectType: isPropertyOwner
          }));
        }

        setComponentTypes(types);

        const firstAvailable = types[0];

        if (firstAvailable && !projectType && !initialProjectType) {
          setProjectType(firstAvailable.name.toLowerCase());
        }
      } catch (error) {
        console.error("Failed to fetch component types:", error);
        toast.error("Failed to load project types");
        const fallback = [
          { name: "ROOFING", required_permit: true },
          { name: "SIDING", required_permit: true },
          { name: "WINDOW_DOOR", required_permit: true },
        ];
        setComponentTypes(fallback);
        if (fallback[0]) setProjectType(fallback[0].name.toLowerCase());
      } finally {
        setLoading(false);
      }
    };
    fetchComponentTypes();
  }, [isPropertyOwner, isAdmin]);

  const getDisplayLabel = (name: string) => {
    if (name.toUpperCase() === "WINDOW_DOOR") return "Window & Door";
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const displayTypes = componentTypes.map((type) => ({
    id: type.name.toLowerCase(),
    label: getDisplayLabel(type.name),
  }));

  const getCurrentFormPayload = () => ({
    project_name: projectName,
    project_type: projectType.toUpperCase(),
    other,
    date_of_install: dateOfInstall ? format(dateOfInstall, "yyyy-MM-dd") : "",
    governing_city_id: governingCity,
    permit,
    need_permit: needPermit,
    notes,
    contractor_id: contractorId,
    visible_status: visibility,
  });

  const compareWithInitial = (next: any) => {
    if (!initialProjectData) return true;
    return JSON.stringify(next) !== JSON.stringify({
      project_name: initialProjectData.project_name || "",
      project_type: initialProjectData.project_type || "",
      other: initialProjectData.other || "",
      date_of_install: initialProjectData.date_of_install || "",
      governing_city_id: initialProjectData.governing_city_id || "",
      permit: initialProjectData.permit || "",
      need_permit: initialProjectData.need_permit ?? false,
      notes: initialProjectData.notes || "",
      contractor_id: initialProjectData.contractor_id || "",
      visible_status: initialProjectData.visible_status || "",
    });
  };

  useEffect(() => {
    if (!isEditMode) {
      setHasChanges(false);
      return;
    }
    setHasChanges(compareWithInitial(getCurrentFormPayload()));
  }, [
    projectName,
    projectType,
    other,
    dateOfInstall,
    governingCity,
    permit,
    needPermit,
    status,
    notes,
    contractorId,
    visibility,
    initialProjectData,
    isEditMode,
  ]);

  const handleFieldChange = (updater: () => void) => {
    updater();
  };

  const handleSubmit = (action: "save" | "save-next" | "next") => {
    if (isEditMode && action === "next") {
      onContinue({ type: projectType, projectData: { id: projectId } });
      return;
    }

    const raw = {
      project_name: projectName,
      project_type: projectType.toUpperCase(),
      other,
      // date_of_install: dateOfInstall ? format(dateOfInstall, "yyyy-MM-dd") : "",
      governing_city_id: governingCity,
      permit,
      need_permit: needPermit,
      notes,
      contractor_id: contractorId,
    };

    const result = projectSchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ProjectFormValues, string>> = {};
      result.error.issues.forEach((e: z.ZodIssue) => {
        const key = e.path[0] as keyof ProjectFormValues;
        if (!fieldErrors[key]) fieldErrors[key] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    const isOther = result.data.project_type.toUpperCase() === "OTHER";

    const body = {
      project_name: result.data.project_name,
      project_type: result.data.project_type,
      ...(isOther && result.data.other ? { other: result.data.other } : {}),
      //date_of_install: result.data.date_of_install,
      governing_city_id: result.data.governing_city_id,
      permit: result.data.permit,
      ...(!isPropertyOwner ? { need_permit: needPermit } : {}),
      notes: result.data.notes || "",
      ...(isAdmin && result.data.contractor_id
        ? { contractor_id: result.data.contractor_id }
        : {}),
      ...(isPropertyOwner ? { visible_status: visibility } : {}),
    };

    const changed = compareWithInitial(body);
    setHasChanges(changed);

    const selectedComp = componentTypes.find(t => t.name.toLowerCase() === projectType.toLowerCase());
    const isOwnerProjectType = selectedComp?.isOwnerProjectType || false;

    if (!isEditMode) {
      const executeAdd = async () => {
        try {
          setSubmitting(true);
          const result = await addProject(propertyId, body);
          if (!result.success) {
            toast.error(result.message || "Failed to create project");
            return;
          }
          toast.success("Project created successfully!");
          setHasChanges(false);
          onContinue({ type: projectType, projectData: result.data, isOwnerProjectType });
        } catch (error: any) {
          toast.error(error?.message || "Failed to create project");
        } finally {
          setSubmitting(false);
        }
      };
      executeAdd();
      return;
    }

    if (!changed) {
      onContinue({ type: projectType, projectData: { id: projectId }, isOwnerProjectType });
      return;
    }

    const executeEdit = async () => {
      try {
        setSubmitting(true);
        const result = await editProject(propertyId, projectId!, body);
        if (!result.success) {
          toast.error(result.message || "Failed to update project");
          return;
        }
        toast.success("Project updated successfully!");
        setHasChanges(false);
        if (action === "save-next") {
          onContinue({ type: projectType, projectData: result.data, isOwnerProjectType });
        } else if (action === "save") {
          onSaveSuccess?.();
        }
      } catch (error: any) {
        toast.error(error?.message || "Failed to update project");
      } finally {
        setSubmitting(false);
      }
    };
    executeEdit();
  };


  const chevronSvg = (
    <svg
      className="w-[10px] md:w-[15.61px] h-[20px] md:h-[31.22px]"
      viewBox="0 0 16 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 11L8 15L12 11"
        stroke="rgba(112, 128, 144, 0.93)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const fieldError = (key: keyof ProjectFormValues) =>
    errors[key] ? (
      <p className="text-red-500 text-[12px] md:text-[14px] mt-1 font-asap">
        {errors[key]}
      </p>
    ) : null;

  return (
    <div className="w-full max-w-[1170px] md:max-w-[1170px] max-md:max-w-[430px] mx-auto space-y-[20px] max-md:space-y-[28px] animate-in fade-in slide-in-from-bottom-4 duration-500 font-asap max-md:px-[19px]">
      <div className="text-center space-y-[15px] max-md:space-y-[12px]">
        <h2 className="text-[36px] max-md:text-[24px] font-bold text-[#1F2A44] uppercase leading-[41px] max-md:leading-[28px]">
          {address || ""}
        </h2>
        <p className="text-[#1CA7A6] font-medium text-[30px] max-md:text-[20px] leading-[34px] max-md:leading-[23px]">
          {isEditMode ? "Edit Project" : "Create a Project"}
        </p>
      </div>

      <div className="space-y-[15px] md:space-y-[28px]">
        <div>
          <input
            placeholder="Project Name"
            value={projectName}
            onChange={(e) => handleFieldChange(() => setProjectName(e.target.value))}
            className={inputClass}
          />
          {fieldError("project_name")}
        </div>

        <div className="space-y-[15px] md:space-y-[20px]">
          <p className="text-[14px] md:text-[20px] font-bold md:font-medium text-[#708090] font-asap">
            Project Type
          </p>
          <div className="flex flex-wrap gap-[15px] md:gap-[40px] justify-between md:justify-start">
            {loading ? (
              <div className="flex gap-[15px] md:gap-[60px]">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-[8px] md:gap-[15px]"
                  >
                    <div className="size-[10px] md:size-[26px] rounded-full bg-gray-200 animate-pulse" />
                    <div className="h-4 w-16 md:w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              displayTypes.map((type) => (
                <label
                  key={type.id}
                  className={cn("flex flex-col md:flex-row items-center gap-[8px] md:gap-[10px] group", disableProjectType ? "cursor-not-allowed opacity-70" : "cursor-pointer")}
                >
                  <div
                    className={cn(
                      "size-[10px] md:size-[26px] rounded-full border border-[rgba(112,128,144,0.4333)] md:border-[rgba(112,128,144,0.3)] flex items-center justify-center transition-all bg-white",
                      projectType === type.id &&
                      "border-[rgba(112,128,144,0.5)]",
                    )}
                  >
                    {projectType === type.id && (
                      <div className="size-[6px] md:size-[14px] rounded-full bg-[#1CA7A6]" />
                    )}
                  </div>
                  <input
                    type="radio"
                    className="hidden"
                    name="projectType"
                    checked={projectType === type.id}
                    onChange={() => !disableProjectType && handleFieldChange(() => setProjectType(type.id))}
                    disabled={disableProjectType}
                  />
                  <span
                    className={cn(
                      "text-[13px] md:text-[20px] font-medium transition-colors font-asap text-center md:text-left",
                      projectType === type.id
                        ? "text-[#1F2A44]"
                        : "text-[#708090]",
                    )}
                  >
                    {type.label}
                  </span>
                </label>
              ))
            )}
          </div>
          {fieldError("project_type")}
        </div>

        {projectType === "other" && (
          <div>
            <input
              placeholder="Specify project type"
              value={other}
              onChange={(e) => handleFieldChange(() => setOther(e.target.value))}
              className={inputClass}
            />
            {errors.other && (
              <p className="text-red-500 text-[12px] md:text-[14px] mt-1 font-asap">
                {errors.other}
              </p>
            )}
          </div>
        )}
        {/* <div>
          <Popover>
            <PopoverTrigger asChild>
              <div
                className={cn(
                  inputClass,
                  "flex items-center justify-between cursor-pointer hover:border-[#1CA7A6]/50",
                )}
              >
                <span
                  className={
                    dateOfInstall ? "text-[#1F2A44]" : "text-[#708090]/50"
                  }
                >
                  {dateOfInstall ? format(dateOfInstall, "PPP") : "Date of Install"}
                </span>
                {chevronSvg}
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-[#1CA7A6] rounded-[10px]"
              align="start"
            >
              <Calendar
                mode="single"
                selected={dateOfInstall}
                onSelect={(value) => handleFieldChange(() => setDateOfInstall(value))}
              />
            </PopoverContent>
          </Popover>
          {fieldError("date_of_install")}
        </div> */}

        <div>
          <input
            placeholder="Permit Number"
            type="input"
            value={permit}
            onChange={(e) => handleFieldChange(() => setPermit(e.target.value))}
            className={inputClass}
          />
          {fieldError("permit")}
        </div>

        <div className="flex items-center gap-[10px] md:gap-[15px]">
          <input
            id="need_permit"
            type="checkbox"
            checked={needPermit}
            disabled={isPermitRequired}
            onChange={(e) => handleFieldChange(() => setNeedPermit(e.target.checked))}
            className={cn("size-[16px] md:size-[20px] accent-[#1CA7A6]", isPermitRequired ? "cursor-not-allowed opacity-70" : "cursor-pointer")}
          />
          <label
            htmlFor="need_permit"
            className={cn("text-[14px] md:text-[20px] font-medium text-[#708090] font-asap", isPermitRequired ? "cursor-not-allowed opacity-70" : "cursor-pointer")}
          >
            Need Permit
          </label>
        </div>



        <div>
          <Select
            value={governingCity || ""}
            onValueChange={(val) => handleFieldChange(() => setGoverningCity(val))}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Governing City" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {cities.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError("governing_city_id")}
        </div>

        {isAdmin && (
          <div>
            <Select value={contractorId} onValueChange={(value) => handleFieldChange(() => setContractorId(value))}>
              <SelectTrigger className="w-full border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] rounded-[6px] md:rounded-[10px]">
                <SelectValue placeholder="Contractor" />
              </SelectTrigger>
              <SelectContent>
                {contractors.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No contractors found
                  </SelectItem>
                ) : (
                  contractors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => handleFieldChange(() => setNotes(e.target.value))}
            rows={4}
            className="w-full min-h-[100px] md:min-h-[140px] px-[20px] md:px-[29px] py-[14px] md:py-[18px] rounded-[6px] md:rounded-[10px] border border-[rgba(112,128,144,0.2333)] md:border-[rgba(28,167,166,0.25)] bg-white text-[14px] md:text-[20px] font-medium text-[#1F2A44] focus:outline-none placeholder:text-[#708090]/50 font-asap resize-none"
          />
        </div>

        {isPropertyOwner && (
          <div className="space-y-[15px] md:space-y-[20px]">
            <p className="text-[14px] md:text-[20px] font-bold md:font-medium text-[#708090] font-asap">
              Visibility
            </p>
            <div className="flex flex-wrap gap-[15px] md:gap-[60px] justify-between md:justify-start">
              {(["public", "private"] as const).map((option) => (
                <label
                  key={option}
                  className="flex flex-col md:flex-row items-center gap-[8px] md:gap-[15px] cursor-pointer"
                >
                  <div
                    className={cn(
                      "size-[10px] md:size-[26px] rounded-full border border-[rgba(112,128,144,0.4333)] md:border-[rgba(112,128,144,0.3)] flex items-center justify-center transition-all bg-white",
                      visibility === option && "border-[rgba(112,128,144,0.5)]",
                    )}
                  >
                    {visibility === option && (
                      <div className="size-[6px] md:size-[14px] rounded-full bg-[#1CA7A6]" />
                    )}
                  </div>
                  <input
                    type="radio"
                    className="hidden"
                    name="visibility"
                    checked={visibility === option}
                    onChange={() => handleFieldChange(() => setVisibility(option))}
                  />
                  <span
                    className={cn(
                      "text-[13px] md:text-[20px] font-medium transition-colors font-asap text-center md:text-left capitalize",
                      visibility === option
                        ? "text-[#1F2A44]"
                        : "text-[#708090]",
                    )}
                  >
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-[12px]">
        {isEditMode && (
          <div className="flex flex-col md:flex-row gap-[12px]">
            {hasChanges ? (
              <>
                <Button
                  onClick={() => handleSubmit("save")}
                  disabled={submitting}
                  className="flex-1 h-[52px] md:h-[77px] bg-[#1CA7A6] hover:bg-[#199695] text-white font-bold rounded-[10px] text-[18px] md:text-[24px] shadow-none font-asap disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={() => handleSubmit("save-next")}
                  disabled={submitting}
                  className="flex-1 h-[52px] md:h-[77px] border border-[#1CA7A6] bg-white text-[#1CA7A6] hover:bg-[#1CA7A6]/5 font-bold rounded-[10px] text-[18px] md:text-[24px] shadow-none font-asap disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save & Next"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleSubmit("next")}
                disabled={submitting}
                className="w-full h-[52px] md:h-[77px] bg-[#1CA7A6] hover:bg-[#199695] text-white font-bold rounded-[10px] text-[18px] md:text-[24px] shadow-none font-asap disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Next"}
              </Button>
            )}
          </div>
        )}
        {!isEditMode && (
          <Button
            onClick={() => handleSubmit("save")}
            disabled={submitting}
            className="w-full h-[52px] md:h-[77px] bg-[#1CA7A6] hover:bg-[#199695] text-white font-bold rounded-[10px] text-[20px] md:text-[30px] shadow-none font-asap disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create A Project"}
          </Button>
        )}
      </div>

      <div className="hidden md:flex justify-center">
        <button
          onClick={onBack}
          className="flex items-center cursor-pointer gap-[21px] text-[14px] md:text-[18px] font-medium text-[#1CA7A6] uppercase tracking-normal hover:opacity-80 transition-opacity font-asap"
        >
          <div className="size-[26px] md:size-[32px] rounded-full bg-[rgba(28,167,166,0.25)] flex items-center justify-center">
            <ChevronLeft className="size-4 md:size-5" />
          </div>
          Back
        </button>
      </div>

    </div>
  );
}
