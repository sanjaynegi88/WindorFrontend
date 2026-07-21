import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, Send, Loader2, FileText, Download, Eye, AlertCircle, CheckCircle2, Clock, Ban } from "lucide-react";
import { cn, toPascalCase, getResourceFileUrl } from "@/lib/utils";
import { Comments } from "./comment";
import { postComments, getPermitsForProperty } from "@/lib/actions";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUser } from "@/components/providers/user-provider";
import { Installation } from "./types";

interface ProjectDefaultViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: string[];
  propertyId: string;
  projects: any[];
  installations: Installation[];
  isPurchased?: boolean;
  onShowImages: () => void;
  onShowProjects: () => void;
  onShowReports: () => void;
  totalCount: number;
  isLoadingTotalCount?: boolean;
  onBack: () => void;
  otherImage?: string | null;
}

export const ProjectDefaultView = ({
  activeTab,
  setActiveTab,
  tabs,
  propertyId,
  projects,
  installations,
  isPurchased,
  onShowImages,
  onShowProjects,
  onShowReports,
  onBack,
  otherImage,
  totalCount,
  isLoadingTotalCount,
}: ProjectDefaultViewProps) => {
  const { role } = useUser();
  const canComment = role === "property_owner";

  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [permits, setPermits] = useState<any[]>([]);
  const [loadingPermits, setLoadingPermits] = useState(false);
  const [permitsLoaded, setPermitsLoaded] = useState(false);

  useEffect(() => {
    if (activeTab === "DOCS" && !permitsLoaded) {
      const fetchPermits = async () => {
        setLoadingPermits(true);
        try {
          const res = await getPermitsForProperty(propertyId);
          setPermits(res?.data ?? res ?? []);
          setPermitsLoaded(true);
        } catch (err: any) {
          toast.error(err.message || "Failed to load permits");
        } finally {
          setLoadingPermits(false);
        }
      };
      fetchPermits();
    }
  }, [activeTab, propertyId, permitsLoaded]);

  const getStatusBadge = (item: any) => {
    if (item.project?.need_permit === false) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F3F5] text-[#495057] border border-[#E9ECEF]">
          <Ban className="size-3" />
          Permit Not Required
        </span>
      );
    }

    const status = item.status?.toUpperCase() || 'PENDING';

    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBFBEE] text-[#2B8A3E] border border-[#D3F9D8]">
          <CheckCircle2 className="size-3" />
          Verified
        </span>
      );
    }

    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF5F5] text-[#C92A2A] border border-[#FFE3E3]">
          <AlertCircle className="size-3" />
          Rejected
        </span>
      );
    }

    if (!item.file_path) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF9DB] text-[#E67700] border border-[#FFF3BF]">
          <Clock className="size-3" />
          Missing Permit File
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F4FD] text-[#1971C2] border border-[#D0EBFF]">
        <Clock className="size-3" />
        Pending Verification
      </span>
    );
  };

  const handlePostComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    setPosting(true);
    const result = await postComments({ comment: trimmed }, propertyId);
    setPosting(false);

    if (!result.success) {
      toast.error(result.message || 'Failed to post comment');
      return;
    }

    toast.success('Comment posted');
    setCommentText('');
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-[20px] md:space-y-[26px]">
      {/* Tabs */}
      <div className="relative flex items-center justify-center border-b border-[#D9D9D9] pt-2">
        <div className="flex gap-4 sm:gap-10 md:gap-[170px] px-4 pb-[15px]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "text-[13px] md:text-[18px] font-medium leading-[21px] uppercase transition-all relative whitespace-nowrap font-asap cursor-pointer",
                activeTab === tab
                  ? "text-[#1CA7A6]"
                  : "text-[#1F2A44] hover:text-[#1CA7A6]",
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-[60px] sm:w-[100px] md:w-[233.82px] h-px bg-[#1CA7A6]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "PROJECTS" && (
        <div className="space-y-[20px] md:space-y-[36px]">
          <div className="space-y-4 px-6 md:px-[76px] text-[#708090] font-normal leading-[18px] text-[12px] md:text-[13px] font-asap">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit.
            </p>
          </div>
          <div className="grid grid-cols-2 md:flex md:justify-center gap-4 md:gap-[39px] px-4">
            <div
              onClick={onShowProjects}
              className="w-full md:w-[239.16px] h-[95.82px] md:h-[136.72px] bg-[#1F2A44] hover:bg-[#1CA7A6] border-2 border-[rgba(255,255,255,0.93)] rounded-[10px] p-4 md:p-6 text-white flex flex-col items-center justify-center shadow-[0px_4px_14px_rgba(31,42,68,0.2)] hover:scale-[1.02] transition-transform cursor-pointer group relative"
            >
              {isLoadingTotalCount ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <>
                  <span className="text-[18px] md:text-[24px] font-bold uppercase leading-[24px] md:leading-[30px] font-inter">
                    {totalCount} PROJECTS
                  </span>
                  {totalCount > 5 && (
                    <span className="text-[14px] md:text-[20px] font-medium uppercase leading-[15px] opacity-80 pt-2 group-hover:opacity-100 font-asap">
                      + More
                    </span>
                  )}
                </>
              )}
            </div>
            <div
              onClick={onShowReports}
              className="w-full md:w-[239.16px] h-[95.82px] md:h-[136.72px] bg-[#1F2A44] hover:bg-[#1CA7A6] border-2 border-[rgba(255,255,255,0.93)] rounded-[10px] p-4 md:p-6 text-white flex flex-col items-center justify-center shadow-[0px_4px_14px_rgba(31,42,68,0.2)] hover:scale-[1.02] transition-transform cursor-pointer"
            >
              <span className="text-[18px] md:text-[24px] font-bold uppercase leading-[24px] md:leading-[30px] font-inter">
                REPORTS
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "DOCS" && (
        <div className="space-y-6 px-4 md:px-[76px]">
          <div className="flex flex-col gap-2">
            <h3 className="text-[18px] md:text-[22px] font-bold text-[#1F2A44] font-asap">
              Permits & Documents
            </h3>
            <p className="text-[13px] md:text-[14px] text-[#708090] leading-relaxed font-asap">
              View and download permit documents uploaded for this property's installations.
            </p>
          </div>

          {loadingPermits ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#708090] font-asap">
              <Loader2 className="size-8 animate-spin text-[#1CA7A6]" />
              <span className="text-sm font-medium">Loading documents…</span>
            </div>
          ) : permitsLoaded && permits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#708090]/60 border-2 border-dashed border-[#E8EDF2] rounded-2xl bg-white">
              <FileText className="size-10 text-[#B0BEC5]" strokeWidth={1.5} />
              <span className="text-xs font-bold uppercase tracking-widest text-[#B0BEC5] font-asap">
                No documents found
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {permits.map((item) => {
                const hasFile = !!item.file_path;
                const fileUrl = getResourceFileUrl(item.file_path);

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#E8EDF2] rounded-[15px] p-5 hover:shadow-[0px_4px_20px_rgba(31,42,68,0.06)] hover:border-[#1CA7A6]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-[15px] md:text-[16px] font-bold text-[#1F2A44] font-asap truncate max-w-full">
                          {item.project?.project_name || "Unnamed Project"}
                        </h4>
                        {item.project?.project_type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wide bg-[#F2FFFF] text-[#1CA7A6] border border-[#1CA7A6]/20">
                            {toPascalCase(item.project.project_type)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-[#708090] font-asap">
                        {item.uploader_role && (
                          <div>
                            <span className="font-semibold text-[#1F2A44]/75">Uploaded By: </span>
                            {toPascalCase(item.uploader_role)}
                          </div>
                        )}
                        {item.uploaded_at && (
                          <div>
                            <span className="font-semibold text-[#1F2A44]/75">Uploaded At: </span>
                            {new Date(item.uploaded_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        )}
                        {item.verified_at && (
                          <div>
                            <span className="font-semibold text-[#1F2A44]/75">Verified At: </span>
                            {new Date(item.verified_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-xs text-[#708090] bg-[#F8FAFC] border border-[#F1F5F9] rounded-lg p-2 mt-1 leading-relaxed font-asap">
                          <span className="font-semibold text-[#1F2A44]/75">Notes: </span>
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* Right: Status and Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0">
                      {getStatusBadge(item)}

                      {hasFile && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => window.open(fileUrl, "_blank")}
                            className="h-8 px-3 text-[10px] uppercase tracking-widest text-white border rounded-lg gap-1.5 font-asap"
                          >
                            <Eye className="size-3.5" />
                            View
                          </Button>
                          {/* <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 rounded-lg gap-1.5 font-asap"
                            >
                              <Download className="size-3.5" />
                              Download
                            </Button>
                          </a> */}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "PHOTOS" && (
        <div className="flex flex-col items-center justify-center py-10 px-6">
          {otherImage ? (
            <div className="w-full max-w-[600px] aspect-4/3 relative rounded-[20px] overflow-hidden border border-[#E8EDF2] bg-white shadow-[0px_4px_20px_rgba(31,42,68,0.08)]">
              <Image
                src={otherImage}
                alt="Property photos"
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="py-20 text-center text-[#708090] font-asap">
              <p className="text-[16px] md:text-[18px] font-medium uppercase tracking-[0.2em] text-[#B0BEC5]">
                No image
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "COMMENTS" && (
        <div className="space-y-4 px-4 md:px-[76px]">
          <Comments key={refreshKey} propertyId={propertyId} />

          {canComment && (
            <div className="border-t pt-4 space-y-3">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment…"
                rows={3}
                className="resize-none rounded-xl border-[#D9D9D9] focus-visible:ring-[#1CA7A6] text-sm font-asap"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handlePostComment();
                  }
                }}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handlePostComment}
                  disabled={posting || !commentText.trim()}
                  className="h-9 px-5 bg-[#1CA7A6] hover:bg-[#199695] text-white font-bold text-xs uppercase tracking-widest rounded-xl gap-2 shadow-none"
                >
                  {posting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  {posting ? "Posting…" : "Post Comment"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-center pt-12 md:pt-[100px] pb-[50px]">
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
