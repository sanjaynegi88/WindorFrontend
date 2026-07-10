"use client";

import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  Globe,
  Phone,
  Mail,
  CheckCircle2,
  Star,
  ShieldCheck,
  Zap,
  User,
  Building,
  X,
} from "lucide-react";
import { getAppImageUrl, toPascalCase } from "@/lib/utils";
import Link from "next/link";

const GridBackground = dynamic(
  () =>
    import("@/components/ui/grid-background").then((mod) => ({
      default: mod.GridBackground,
    })),
  { ssr: false },
);

interface Contractor {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  websiteUrl: string;
  companyLogo: string | null;
  description: string;
  services_provided_details: string[] | null;
  membershipLevel: "GOLD" | "SILVER" | "STANDARD";
  cityDetails: { id: string; name: string }[];
}

interface ContractorDetailsDialogProps {
  contractor: Contractor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContractorDetailsDialog({
  contractor,
  isOpen,
  onClose,
}: ContractorDetailsDialogProps) {
  if (!contractor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl rounded-[32px] p-0 overflow-y-auto max-h-[95vh] border-none shadow-2xl scrollbar-none">
        <DialogHeader className="sr-only">
          <DialogTitle>{contractor.companyName} Profile Details</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col font-asap">
          {/* Header Decoration */}
          <div className="relative h-40 bg-[#1F2A44] shrink-0">
            <GridBackground
              gridSize="6:6"
              colors={{
                background: "bg-transparent",
                borderColor: "border-[#1CA7A6]/10",
              }}
              beams={{
                count: 6,
                colors: ["bg-[#1CA7A6]", "bg-[#1CA7A6]/50"],
                speed: 5,
              }}
              className="absolute inset-0"
            />

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-20 text-white/50 hover:text-white hover:bg-white/10 rounded-full md:hidden"
              onClick={onClose}
            >
              <X className="size-6" />
            </Button>

            {contractor.membershipLevel === "GOLD" && (
              <div className="absolute top-6 right-10 bg-[#1CA7A6] text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg hidden md:flex z-10">
                <Star className="size-4 fill-white" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Premium Partner
                </span>
              </div>
            )}
            {contractor.membershipLevel === "GOLD" && (
              <div className="absolute top-6 right-16 bg-[#1CA7A6] text-white p-1.5 rounded-full flex items-center justify-center shadow-lg md:hidden z-10">
                <Star className="size-4 fill-white" />
              </div>
            )}
          </div>

          {/* Avatar — outside GridBackground so overflow-hidden doesn't clip it */}
          <div className="relative px-6 md:px-10">
            <div className="absolute -top-12 left-8 md:left-10">
              <Avatar className="h-24 w-24 border-4 border-white shadow-2xl rounded-3xl bg-white p-2">
                <AvatarImage
                  src={getAppImageUrl(contractor.companyLogo)}
                  className="object-contain"
                />
                <AvatarFallback className="bg-[#1CA7A6]/5 text-[#1CA7A6] font-black text-3xl">
                  {contractor.companyName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="px-6 md:px-10 pt-16 pb-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-[#1F2A44] flex items-center gap-3">
                  {contractor.companyName}
                  <CheckCircle2 className="size-6 text-[#1CA7A6]" />
                </h2>
                <div className="flex items-center gap-2 text-[#708090] mt-1 font-medium">
                  <User className="size-4 text-[#1CA7A6]" />
                  <span>Contact: {contractor.contactName}</span>
                </div>
              </div>
              <Button
                asChild
                className="bg-[#1CA7A6] hover:bg-[#189695] text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-[#1CA7A6]/20"
              >
                <Link href={contractor.websiteUrl} target="_blank">
                  <Globe className="size-4 mr-2" />
                  Official Website
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShieldCheck className="size-4 text-[#1CA7A6]" />
                    Company Description
                  </h4>
                  <p className="text-[#708090] leading-relaxed text-sm font-medium">
                    {contractor.description}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap className="size-4 text-[#1CA7A6]" />
                    Services Provided
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(contractor.services_provided_details ?? []).map(
                      (service: any) => (
                        <Badge
                          key={service.id}
                          className="bg-gray-50 text-gray-500 hover:bg-[#1CA7A6]/10 hover:text-[#1CA7A6] transition-colors border-none py-1.5 px-4 rounded-lg font-bold text-[10px] uppercase"
                        >
                          {toPascalCase(service.service_name)}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MapPin className="size-4 text-[#1CA7A6]" />
                    Coverage Areas
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {contractor.cityDetails.map((city) => (
                      <span
                        key={city.name}
                        className="inline-block bg-[#1CA7A6]/5 text-[#1CA7A6] px-3 py-1 rounded-md text-xs font-bold"
                      >
                        {city.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1F2A44] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Phone className="size-4 text-[#1CA7A6]" />
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                      <Phone className="size-4 text-[#708090]" />
                      <span className="text-sm font-bold text-[#1F2A44]">
                        {contractor.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                      <Mail className="size-4 text-[#708090]" />
                      <span className="text-sm font-bold text-[#1F2A44]">
                        {contractor.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 md:px-10 py-6 flex items-center justify-end border-t border-gray-100">
            {/* <div className="flex items-center gap-2 text-[#708090] text-xs font-bold uppercase tracking-widest">
              <Building className="size-4" />
              ID: {contractor.id.split('-')[0]}...
            </div> */}
            <Button
              variant="ghost"
              className="text-gray-400 font-bold hover:text-[#1F2A44]"
              onClick={onClose}
            >
              Close Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
