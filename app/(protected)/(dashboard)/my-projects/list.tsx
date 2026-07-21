"use client";

import { useEffect, useState } from 'react';
import { Content } from '@/components/layouts/crm/components/content';
import { ExpandableProjectCard } from '@/components/common/expandable-project-card';
import { getMyProjects, generateContractorProjectPdfReport, confirmProject, deleteProject } from '@/lib/actions';
import { ChevronLeft, ChevronRight, Loader2, X, Download, Edit2, CheckCircle2, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadPdfFromUrl, getErrorMessage, toPascalCase } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { AwsImage } from '@/components/common/aws-image';
import { useUser } from '@/components/providers/user-provider';

export default function MyProjectList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [generatingReports, setGeneratingReports] = useState<Record<string, boolean>>({});
  const isAnyDownloading = Object.values(generatingReports).some(Boolean);
  const router = useRouter();
  const user = useUser();
  const role = user?.role?.toLowerCase() || "";
  const isAdmin = role === "admin";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [projectToConfirm, setProjectToConfirm] = useState<{ id: string; name: string; hasReport?: boolean; propertyId?: string } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleGenerateReport = async (projectId: string, projectName: string) => {
    setGeneratingReports((prev) => ({ ...prev, [projectId]: true }));
    try {
      const url = await generateContractorProjectPdfReport(projectId);
      const filename = `contractor-projects-report-${projectName}.pdf`;
      await downloadPdfFromUrl(url, filename);
      toast.success(`Report downloaded successfully`);
    } catch (error: any) {
      console.error('Download report error:', error);
      toast.error(getErrorMessage(error, 'Failed to download report'));
    } finally {
      setGeneratingReports((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  const fetchProjects = async (pageNum: number, append: boolean = false) => {
    if (pageNum === 1 && !append) {
      setLoading(true);
    } else if (append) {
      setLoadingMore(true);
    }

    try {
      const response = await getMyProjects(pageNum, 9, debouncedSearchQuery, isAdmin);
      console.log(response);
      const normalizedProjects = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.projects)
            ? response.projects
            : [];

      if (append) {
        setProjects((prev) => [...prev, ...normalizedProjects]);
      } else {
        setProjects(normalizedProjects);
      }

      setHasMore(normalizedProjects.length >= 9);
    } catch (error) {
      console.error('Failed to load projects:', error);
      if (!append) {
        setProjects([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  useEffect(() => {
    setPage(1);
    fetchProjects(1, false);
  }, [debouncedSearchQuery]);

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const handleConfirmProject = async () => {
    if (!projectToConfirm) return;
    setIsConfirming(true);
    try {
      const response = await confirmProject(projectToConfirm.id, projectToConfirm.hasReport, projectToConfirm.propertyId);
      if (!response?.success) {
        toast.error(response?.message || 'Failed to confirm project');
      } else {
        toast.success('Project confirmed successfully');

        setProjects((prevProjects) =>
          prevProjects.map((p) => {
            const pid = p.id ?? p.project_id ?? p._id;
            if (pid === projectToConfirm.id) {
              return {
                ...p,
                is_confirmed: true,
              };
            }
            return p;
          })
        );

        const freshProjectsRes = await getMyProjects(1, page * 9, debouncedSearchQuery);
        const normalized = Array.isArray(freshProjectsRes)
          ? freshProjectsRes
          : Array.isArray(freshProjectsRes?.data)
            ? freshProjectsRes.data
            : Array.isArray(freshProjectsRes?.projects)
              ? freshProjectsRes.projects
              : [];
        setProjects(normalized);
      }
    } catch (error) {
      console.error('Error confirming project:', error);
      toast.error('Failed to confirm project');
    } finally {
      setIsConfirming(false);
      setConfirmDialogOpen(false);
      setProjectToConfirm(null);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      const response = await deleteProject(projectToDelete.id);
      if (!response?.success) {
        toast.error(response?.message || 'Failed to delete project');
      } else {
        toast.success('Project deleted successfully');
        setProjects((prevProjects) =>
          prevProjects.filter((p) => {
            const pid = p.id ?? p.project_id ?? p._id;
            return String(pid) !== String(projectToDelete.id);
          })
        );
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  return (
    <Content className="p-0 bg-linear-to-b from-[#F5FFFF] to-[#FFFFFF] min-h-[calc(100vh-80px)] flex flex-col items-center">
      <div className="w-full max-w-292.5 px-4 py-8 md:py-16 space-y-5 md:space-y-7.5">
        <h1 className="text-[24px] md:text-[36px] font-bold text-[#1F2A44] tracking-normal uppercase leading-tight md:leading-10.25 font-asap">
          My Projects
        </h1>

        <div className="relative w-full max-w-[480px]">
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startIcon={<Search className="size-5" />}
            endIcon={
              searchQuery.length > 0 ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#B0BEC5] hover:text-[#1F2A44] transition-colors cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              ) : null
            }
            className="h-[52px] w-full rounded-xl border border-[#E8EDF2] focus:border-[#1CA7A6] focus:ring-1 focus:ring-[#1CA7A6] font-asap text-[15px] font-medium placeholder:text-[#B0BEC5] text-[#1F2A44]"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[#708090] font-asap">
            <Loader2 className="size-4 animate-spin" />
            Loading projects...
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project) => {
              const projectId = String(project.id ?? project.project_id ?? project._id ?? project.project_name ?? 'project');
              const isExpanded = Boolean(expandedProjects[projectId]);
              const projectName = project.project_name || project.name || project.title || 'Untitled project';
              const projectType = project.project_type || project.type || 'Project';
              const projectStatus = project.is_confirmed ? 'COMPLETE' : 'DRAFT';
              const projectDateLabel = project.date_of_install || project.install_date
                ? new Date(project.date_of_install || project.install_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
                : null;
              const hasReport = project.property?.has_report || false;
              const isLocked = project?.is_locked_by_cancellation || false;
              const hasInstallation = project.details !== null;
              const normalizeImageUrl = (value: any) => {
                if (!value) return null;
                if (typeof value === 'string') return value;
                if (typeof value === 'object') {
                  return value.image_url || value.thumbnail_url || value.url || value.src || null;
                }
                return null;
              };

              const apiImages = [
                project.property?.front_image,
                project.property?.other_image,
                ...(Array.isArray(project.property?.images) ? project.property.images : []),
                ...(Array.isArray(project.images) ? project.images : [])
              ]
                .map((image) => normalizeImageUrl(image))
                .filter((image): image is string => Boolean(image));

              const allImages = [...apiImages];
              const projectImage = apiImages.length > 0
                ? apiImages[0]
                : '/assets/prop_placeholder.png';
              const detail = (project.details && typeof project.details === 'object' ? project.details : {}) as Record<string, any>;
              const property = project.property ?? {};
              const propertyAddress = property.address || property.street_address || property.address_line_1 || project.address || 'N/A';
              const stateName = property.state?.name || property.state_name || property.state?.state_name || project.state_name || 'N/A';
              const ownerEmail = property.property_owner?.email || property.owner_email || project.owner_email || property.owner?.user?.email || 'N/A';
              const ownerObj = property.property_owner || project.property?.property_owner;
              const ownerUserObj = ownerObj;
              const clientName = ownerUserObj
                ? `${ownerUserObj.first_name || ''} ${ownerUserObj.last_name || ''}`.trim() || ownerUserObj.name || ownerUserObj.email || 'N/A'
                : (property.owner_email || project.owner_email || 'N/A');

              const actualProjectId = project.id ?? project.project_id ?? project._id;
              const handleAddInstallation = (project: any) => {
                router.push(`/properties/edit/${property.id}?projectId=${actualProjectId}&noInstallation=true`);
              };

              return (
                <ExpandableProjectCard
                  key={projectId}
                  title={projectName}
                  subtitle={`${propertyAddress} • Client: ${clientName}${projectDateLabel ? ` • ${projectDateLabel}` : ''}`}
                  badges={[
                    {
                      label: toPascalCase(projectType),
                      className: 'bg-[rgba(28,167,166,0.08)] text-[#1CA7A6] border-[#1CA7A6]',
                    },
                    {
                      label: projectStatus,
                      className: projectStatus === 'COMPLETE'
                        ? 'bg-[rgba(67,160,71,0.1)] text-[#43A047] border-[#43A047]'
                        : 'bg-[rgba(112,128,144,0.1)] text-[#708090] border-[#708090]',
                    },
                  ]}
                  action={
                    isLocked ? null : (
                      <>
                        {property.id && actualProjectId && (projectStatus === 'DRAFT' || isAdmin) && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const noInstallation = !hasInstallation;
                                router.push(`/properties/edit/${property.id}?projectId=${actualProjectId}${noInstallation ? '&noInstallation=true' : ''}`);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1CA7A6]/10 hover:bg-[#1CA7A6]/20 text-[#1CA7A6] font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer border border-[#1CA7A6]/20 font-asap"
                            >
                              <Edit2 className="size-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                              <span className="sm:hidden">Edit</span>
                            </button>
                          </>
                        )}
                        {property.id && actualProjectId && hasInstallation && projectStatus === 'DRAFT' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectToConfirm({ id: actualProjectId, name: projectName, hasReport, propertyId: property.id });
                                setConfirmDialogOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1CA7A6]/10 hover:bg-[#1CA7A6]/20 text-[#1CA7A6] font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer border border-[#1CA7A6]/20 font-asap">
                              <CheckCircle2 className="size-3.5" />
                              <span className="hidden sm:inline">Confirm</span>
                              <span className="sm:hidden">Confirm</span>
                            </button>
                          </>
                        )}
                        {
                          actualProjectId && hasInstallation && hasReport && projectStatus === 'COMPLETE' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateReport(actualProjectId, projectName);
                              }}
                              disabled={isAnyDownloading}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1CA7A6]/10 hover:bg-[#1CA7A6]/20 text-[#1CA7A6] font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer border border-[#1CA7A6]/20 font-asap"
                            >
                              {generatingReports[actualProjectId] ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Download className="size-3.5" />
                              )}
                              <span className="hidden sm:inline">Download Report</span>
                              <span className="sm:hidden">Download</span>
                            </button>
                          )
                        }
                        {actualProjectId && projectStatus === 'DRAFT' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete({ id: actualProjectId, name: projectName });
                              setDeleteDialogOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer border border-red-200/60 font-asap"
                          >
                            <Trash2 className="size-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                            <span className="sm:hidden">Delete</span>
                          </button>
                        )}
                      </>)
                  }
                  isExpanded={isExpanded}
                  onToggle={() => toggleProjectExpanded(projectId)}
                  className="shadow-[0px_2px_10px_rgba(31,42,68,0.06)]"
                >
                  <div className="">
                    <div className="overflow-hidden rounded-t-[12px] border border-[#E8EDF2]">
                      <div
                        className={`relative min-h-45 overflow-hidden ${allImages.length > 0 ? 'cursor-pointer' : ''}`}
                        onClick={() => { router.push(`/property-details/${property.id}`) }}
                      >
                        <AwsImage
                          src={projectImage}
                          alt="Project cover"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50" />
                        <div className="relative flex h-full flex-col justify-end gap-2 p-4 sm:p-5">
                          <p className="text-[16px] font-bold uppercase tracking-wide text-white font-inter">
                            {property?.property_name || ""}
                          </p>
                          <p className="text-[13px] text-white/90 font-asap">
                            {property?.address || property?.address2 || ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-b-[12px] border border-[#E8EDF2] bg-white p-4 sm:p-5">
                      <div className="gap-4">
                        <div className="space-y-3">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                              { label: 'Project Name', value: projectName },
                              { label: 'Client Name (Full Name)', value: clientName },
                              { label: 'Property Address', value: propertyAddress },
                              { label: 'State Name', value: stateName },
                              { label: 'Owner Email', value: ownerEmail },
                            ].map((item) => (
                              <div key={item.label}>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B0BEC5] font-inter">
                                  {item.label}
                                </p>
                                <p className="mt-1 text-[12px] font-medium text-[#1F2A44] font-asap break-all">
                                  {item.value}
                                </p>
                              </div>
                            ))}
                          </div>

                          {!hasInstallation ? (
                            <div className="flex flex-col items-center justify-center h-full border border-[#E8EDF2] py-5">
                              <h1>No Installation Found</h1>
                              <Button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleAddInstallation(project);
                                }}
                              >
                                Add Installation
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B0BEC5] font-inter">
                                  Description
                                </p>
                                <p className="mt-1 text-[13px] font-medium text-[#1F2A44] font-asap leading-6">
                                  {detail.description || 'No description available'}
                                </p>
                              </div>
                              <div className="space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2  md:grid-cols-3 lg:grid-cols-4">
                                  {[
                                    { label: 'Install Date', value: projectDateLabel || 'N/A' },
                                    { label: 'Brand', value: detail.brand || 'N/A' },
                                    { label: 'Material', value: detail.material || 'N/A' },
                                    { label: 'Contractor', value: detail.installer || 'N/A' },
                                    { label: 'Supplier', value: detail.supplier || 'N/A' },
                                    { label: 'Style', value: detail.style || 'N/A' },
                                    { label: 'Color', value: detail.color || 'N/A' },
                                    { label: 'Class', value: detail.class_rating || 'N/A' },
                                  ].map((item) => (
                                    <div key={item.label}>
                                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B0BEC5] font-inter">
                                        {item.label}
                                      </p>
                                      <p className="mt-1 text-[12px] font-medium text-[#1F2A44] font-asap">
                                        {item.value}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {allImages.length > 0 && (
                                <div className="pt-4 mt-4 border-t border-[#E8EDF2]">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B0BEC5] font-inter mb-3">
                                    Images
                                  </p>
                                  <div
                                    className="relative h-24 w-32 sm:h-32 sm:w-48 rounded-lg overflow-hidden border border-[#E8EDF2] cursor-pointer group"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedImages(allImages);
                                      setCurrentImageIndex(0);
                                      setIsImageModalOpen(true);
                                    }}
                                  >
                                    <AwsImage
                                      src={allImages[0]}
                                      alt="Project cover"
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    {allImages.length > 1 && (
                                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded">
                                        +{allImages.length - 1} Photos
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          )}

                        </div>
                      </div>
                    </div>
                  </div>
                </ExpandableProjectCard>
              );
            })}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchProjects(nextPage, true);
                  }}
                  disabled={loadingMore}
                  className="h-11 px-6 rounded-xl border-2 border-[#1CA7A6] text-[#1CA7A6] hover:bg-[#e6f7f5] font-black uppercase tracking-widest text-sm gap-2"
                >
                  {loadingMore && <Loader2 className="size-4 animate-spin" />}
                  Load More
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#E8EDF2] bg-white py-16 text-center text-[13px] font-medium uppercase tracking-[0.2em] text-[#B0BEC5] font-asap">
            No projects found
          </div>
        )}

        <div className="flex justify-center pt-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-3 group font-asap"
          >
            <div className="size-8 rounded-full bg-[#F2FFFF] flex items-center justify-center text-[#1CA7A6] transition-transform group-hover:-translate-x-1 border border-[#1CA7A6]/20">
              <ChevronLeft className="size-5" />
            </div>
            <span className="text-sm font-bold text-[#1CA7A6] uppercase tracking-widest">
              Back
            </span>
          </button>
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
                  setCurrentImageIndex((prev) => (prev === 0 ? selectedImages.length - 1 : prev - 1));
                }}
                className="absolute left-2 md:left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10 cursor-pointer"
              >
                <ChevronLeft className="size-6 md:size-8" />
              </button>
            )}

            <AwsImage
              src={selectedImages[currentImageIndex]}
              alt={`Project image ${currentImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />

            {selectedImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => (prev === selectedImages.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-2 md:right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10 cursor-pointer"
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
                  className={`size-2.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Project"
        description={`Are you sure you want to delete the project "${projectToDelete?.name || 'this project'}"? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDeleteProject}
        variant="destructive"
      />

      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Confirm Project"
        description={`Are you sure you want to confirm the project "${projectToConfirm?.name || 'this project'}"? Once confirmed, its details cannot be edited or deleted.`}
        confirmText={isConfirming ? 'Confirming...' : 'Confirm'}
        cancelText="Cancel"
        onConfirm={handleConfirmProject}
        variant="primary"
      />
    </Content>
  );
}
