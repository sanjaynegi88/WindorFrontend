import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ImageTab, PropertyImage } from "./types";

interface ProjectImagesViewProps {
  activeTab: ImageTab;
  setActiveTab: (tab: ImageTab) => void;
  images: PropertyImage[];
  onBack: () => void;
}

export const ProjectImagesView = ({
  activeTab,
  setActiveTab,
  images,
  onBack,
}: ProjectImagesViewProps) => {
  const tabs: ImageTab[] = ["ROOFING", "WINDOWS AND DOORS", "SIDING"];

  return (
    <div className="space-y-[20px] md:space-y-[41px] font-asap">
      <div className="relative flex items-center justify-center border-b border-[#D9D9D9] pt-2">
        <div className="flex gap-4 sm:gap-10 md:gap-[170px] px-4 pb-[15px]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "text-[13px] md:text-[18px] font-medium leading-[21px] uppercase transition-all relative whitespace-nowrap font-asap",
                activeTab === tab
                  ? "text-[#1CA7A6]"
                  : "text-[#1F2A44] hover:text-[#1CA7A6]",
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-[60px] sm:w-[100px] md:w-[233px] h-px bg-[#1CA7A6]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-8 md:gap-x-[72px] md:gap-y-[62px] px-4 sm:px-10 md:px-[139px]">
        {images.length > 0 ? (
          images.map((img, i) => (
            <div
              key={i}
              className="space-y-[8px] md:space-y-[12px] group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-[8px] shadow-[0px_4px_14px_rgba(31,42,68,0.2)] border-2 border-[rgba(255,255,255,0.93)] transition-transform duration-300 group-hover:scale-[1.01] w-full h-[100px] sm:h-[136px] md:h-[156px]">
                <Image
                  src={img.src}
                  alt={img.caption}
                  fill
                  sizes="(max-width: 768px) 50vw, 410px"
                  unoptimized
                  className="object-cover"
                />
              </div>
              <p className="text-center text-[12px] md:text-[16px] font-semibold text-[#708090] leading-[18px] uppercase font-asap">
                {img.caption}
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <p className="text-[18px] font-medium text-gray-300 uppercase tracking-[0.2em] font-asap">
              No images available
            </p>
          </div>
        )}
      </div>

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
