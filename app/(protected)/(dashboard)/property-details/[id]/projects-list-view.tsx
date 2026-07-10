import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, toPascalCase } from "@/lib/utils";
import { getprojectTypesInProperty, getprojectListingOfProperty } from "@/lib/actions";
import { toast } from "sonner";
import { ExpandableProjectCard } from "@/components/common/expandable-project-card";
import { useUser } from "@/components/providers/user-provider";
import { InstallationCard } from "./installation-card";
import { Installation, mapProjectToInstallation, projectTypeToFormType } from "./types";

interface ProjectsListViewProps {
  propertyId: string;
  currentUserId?: string;
  propertyName?: string;
  propertyOwnerEmail?: string;
  hasComponents?: boolean;
  onBack: () => void;
}

export const ProjectsListView = ({
  propertyId,
  currentUserId,
  propertyName,
  propertyOwnerEmail,
  hasComponents,
  onBack,
}: ProjectsListViewProps) => {
  const { role, user } = useUser();
  const router = useRouter();
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [activeProjectType, setActiveProjectType] = useState<string | null>(null);
  const [projectsByType, setProjectsByType] = useState<Record<string, any[]>>({});
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const isOwnerOfProperty = role === "property_owner" && !!propertyOwnerEmail && user?.email === propertyOwnerEmail;
  const canUpload = isOwnerOfProperty && !!hasComponents;

  useEffect(() => {
    if (!propertyId) return;

    let isMounted = true;

    const fetchProjectTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await getprojectTypesInProperty(propertyId);
        const types = Array.isArray(response?.data) ? response.data : [];
        const count = response.totalcount;
        if (!isMounted) return;

        setTotalCount(count);
        setProjectTypes(types);
        setActiveProjectType((current) =>
          current && types.some((t: any) => t.name === current)
            ? current
            : types[0]?.name ?? null
        );
      } catch (error) {
        console.error("Failed to fetch project types:", error);
        toast.error("Failed to load project types");
        if (!isMounted) return;
        setProjectTypes([]);
        setActiveProjectType(null);
      } finally {
        if (isMounted) setLoadingTypes(false);
      }
    };

    fetchProjectTypes();

    return () => {
      isMounted = false;
    };
  }, [propertyId]);

  useEffect(() => {
    if (!propertyId || !activeProjectType) return;

    let isMounted = true;

    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await getprojectListingOfProperty(propertyId, activeProjectType);
        const projects = Array.isArray(response?.data) ? response.data : [];

        if (!isMounted) return;

        setProjectsByType((prev) => ({
          ...prev,
          [activeProjectType]: projects,
        }));
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast.error("Failed to load projects");
        if (!isMounted) return;
        setProjectsByType((prev) => ({
          ...prev,
          [activeProjectType]: [],
        }));
      } finally {
        if (isMounted) setLoadingProjects(false);
      }
    };

    fetchProjects();

    return () => {
      isMounted = false;
    };
  }, [propertyId, activeProjectType]);

  const handleAddInstallation = (project: any) => {
    localStorage.setItem('current_project_id', project.id);
    localStorage.setItem('current_property_id', propertyId);
    localStorage.setItem('current_property_name', propertyName || '');
    localStorage.setItem('current_project_type', projectTypeToFormType(project.project_type));
    const isOwnerProject = 
      project.project_type === 'WINDOWS AND DOORS' || 
      project.added_by === 'PROPERTY_OWNER' || 
      (!project.contractor_id && !project.contractor);
    localStorage.setItem('is_owner_project_type', isOwnerProject ? 'true' : 'false');
    router.push('/properties/new?flow=add-installation');
  };

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const selectedProjects = activeProjectType ? projectsByType[activeProjectType] ?? [] : [];

  return (
    <div className="space-y-[20px] md:space-y-[32px] font-asap">
      <div className="px-4 md:px-[76px]">
        <h2 className="text-[16px] md:text-[20px] font-bold text-[#1F2A44] uppercase tracking-wide font-asap">
          Projects
          <span className="ml-2 text-primary bg-primary/10 px-2 py-0.5 rounded-full">{totalCount}</span>
        </h2>
      </div>

      <div className="px-4 md:px-[76px]">
        {loadingTypes ? (
          <div className="flex items-center gap-2 text-[12px] md:text-[13px] text-[#708090] font-asap">
            <Loader2 className="size-4 animate-spin" />
            Loading project types...
          </div>
        ) : projectTypes.length > 0 ? (
          <div className="border-b border-[#D9D9D9] pt-2">
            <div className="flex flex-wrap justify-start gap-x-8 gap-y-6 pb-4">
              {projectTypes.map((type: any, id: number) => {
                const isActive = activeProjectType === type.name;
                const badgeColors = [
                  "bg-primary/10 text-primary",
                ];

                return (
                  <button
                    key={id}
                    onClick={() => setActiveProjectType(type.name)}
                    className={cn(
                      "relative inline-flex items-center whitespace-nowrap text-[14px] md:text-[18px] font-medium cursor-pointer pb-2",
                      isActive
                        ? "text-primary "
                        : "text-[#1F2A44] hover:text-primary "
                    )}
                  >
                    <p className={cn(
                      isActive ? "pb-1 border-b border-primary" : ""
                    )}
                    >{toPascalCase(type.name)}</p>
                    <span className={cn(
                      "inline-flex items-center justify-center ml-1.5 px-2.5 py-0.5 rounded-full text-[11px] md:text-[13px] font-bold font-inter",
                      badgeColors[id % badgeColors.length]
                    )}>
                      {type.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="px-4 md:px-[76px] space-y-6">
        {loadingProjects && selectedProjects.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[#708090] font-asap">
            <Loader2 className="size-4 animate-spin" />
            Loading projects...
          </div>
        ) : selectedProjects.length > 0 ? (
          selectedProjects.map((project) => {
            const comp = mapProjectToInstallation(project, propertyId);
            const projectStatus = project.is_confirmed ? 'COMPLETE' : 'DRAFT';
            const isCreator =
              project.created_by === (currentUserId ?? user?.id) ||
              (user?.email && project.createdBy?.email && user.email.toLowerCase() === project.createdBy.email.toLowerCase());
            const canAddInstallation = role === "admin" || role === "contractor" || isCreator;
            const projectDateLabel = project.start_date
              ? `${new Date(project.start_date).toLocaleDateString()} – ${project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}`
              : project.date_of_install
                ? new Date(project.date_of_install).toLocaleDateString()
                : null;

            const creatorObj = project.createdBy || project.contractor;
            const addedBy = creatorObj
              ? `${creatorObj.first_name || ''} ${creatorObj.last_name || ''}`.trim()
              : project.created_by_email || project.contractor_email || 'N/A';
            const addedByEmail = creatorObj?.email || project.created_by_email || project.contractor_email;

            const ownerObj = project.property?.property_owner || project.property_owner;
            const ownerName = ownerObj
              ? `${ownerObj.first_name || ''} ${ownerObj.last_name || ''}`.trim()
              : project.property?.property_owner_email || project.property_owner_email || 'N/A';
            const ownerEmail = ownerObj?.email || project.property?.property_owner_email || project.property_owner_email;

            const isExpanded = Boolean(expandedProjects[project.id]);
            return (
              <ExpandableProjectCard
                key={project.id}
                title={project.project_name}
                subtitle={projectDateLabel || "Tap to view installation details"}
                badges={[
                  {
                    label: project.project_type,
                    className: "bg-[rgba(28,167,166,0.08)] text-[#1CA7A6] border-[#1CA7A6]",
                  },
                  {
                    label: projectStatus,
                    className: projectStatus === 'COMPLETE'
                      ? 'bg-[rgba(67,160,71,0.1)] text-[#43A047] border-[#43A047]'
                      : 'bg-[rgba(112,128,144,0.1)] text-[#708090] border-[#708090]',
                  },
                ]}
                action={!project?.details && canAddInstallation ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAddInstallation(project);
                    }}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-[#1CA7A6] bg-white text-[#1CA7A6] font-bold text-[10px] uppercase tracking-widest transition-colors hover:bg-[rgba(28,167,166,0.08)] shrink-0"
                  >
                    <Plus className="size-3" />
                    Add Installation
                  </button>
                ) : null}
                isExpanded={isExpanded}
                onToggle={() => toggleProjectExpanded(project.id)}
                className="shadow-[0px_2px_10px_rgba(31,42,68,0.06)]"
              >
                <div className="space-y-6">
                  <div className="pb-4 border-b border-[#E8EDF2]">
                    <div className="space-y-1">
                      <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#B0BEC5] font-inter">
                        Owner Name
                      </p>
                      <p className="text-sm font-semibold text-[#1F2A44] font-asap">
                        {ownerName || "N/A"}
                      </p>
                      {ownerEmail && (
                        <p className="text-xs text-[#708090] font-normal font-inter">
                          {ownerEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {project?.details && comp ? (
                    <InstallationCard key={comp.id} item={comp} canUpload={canUpload} embedded addedBy={addedBy} addedByEmail={addedByEmail} />
                  ) : (
                    <div className="py-4 text-center text-[#708090] font-asap">
                      <p className="text-[13px] font-medium uppercase tracking-widest text-[#B0BEC5]">
                        No installation added yet
                      </p>
                    </div>
                  )}
                </div>
              </ExpandableProjectCard>
            );
          })
        ) : (
          <div className="py-20 text-center">
            <p className="text-[18px] font-medium text-gray-300 uppercase tracking-[0.2em] font-asap">
              No projects found
            </p>
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="flex justify-center pt-12 md:pt-[60px] pb-[50px]">
        <button
          onClick={onBack}
          className="flex items-center gap-[21px] group cursor-pointer"
        >
          <div className="w-[32px] h-[32px] rounded-full bg-[rgba(28,167,166,0.25)] flex items-center justify-center text-[#1CA7A6] transition-transform group-hover:-translate-x-1">
            <ChevronLeft className="size-5" />
          </div>
          <span className="text-[14px] md:text-[18px] font-medium text-[#1CA7A6] uppercase tracking-normal font-asap">
            Back
          </span>
        </button>
      </div>
    </div>
  );
};
