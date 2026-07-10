"use client";

import { useState } from "react";

interface RoleSelectionProps {
  roles: { id: string; role_name: string }[];
  loadingRoles: boolean;
  onSelect: (id: string, name: string) => void;
}

interface RoleDetail {
  required: string[];
  membership: string[];
  permissions: string[];
}

const ROLE_DETAILS: Record<string, RoleDetail> = {
  contractor: {
    required: ["First Name, Last Name, Email", "Company URL (Verified)", "Company Address, Website URL", "License # (If Applicable)", "Phone # (Mobile), Phone # (Company)", "Type Selection: General, Roofs, Windows, Doors, Garage Doors, Other"],
    membership: ["Standard - (Free) Limited to 1 property entry", "Silver - Up to 3 properties/month and Max 6 projects or $35/month or $375/year", "Gold - Unlimited annual access $1,395/year", "Additional Users - $25/month per user"],
    permissions: ["Enter & manage projects for properties (according to plan limits)", "Purchase reports for any property"],
  },
  city_official: {
    required: ["First Name, Last Name, Email", "City Official Address", "Website URL", "Title", "Phone # (Direct)", "City Email (Official)"],
    membership: ["Free - 1 City", "Can access any address in the city and upload documents"],
    permissions: ["Can upload city permits only for any property in the city", "Can view reports only for homes with uploaded city permits", "All city uploads require approval by Windor Admin"],
  },
  homeowner: {
    required: ["First Name, Last Name, Email", "Property Address", "Phone # (Direct)", "Owner Date Range"],
    membership: ["Free - 1 Property", "Can purchase additional property reports"],
    permissions: ["View reports for owned property", "Upload property documents", "Track project history"],
  },
  property_owner: {
    required: ["First Name, Last Name, Email", "Property Address", "Phone # (Direct)", "Owner Date Range"],
    membership: ["Free - 1 Property", "Can purchase additional property reports"],
    permissions: ["View reports for owned property", "Upload property documents", "Track project history"],
  },
  insurance: {
    required: ["First Name, Last Name, Email", "Company Name, Company Address", "Website URL", "Phone # (Direct)", "License # (If Applicable)"],
    membership: ["Standard - (Free) Limited access", "Professional - $75/month unlimited access"],
    permissions: ["View property reports for underwriting", "Access verified upgrade history", "Cannot upload or modify property data"],
  },
  manufacturer: {
    required: ["First Name, Last Name, Email", "Company Address, Website URL", "License # (If Applicable)", "Phone # (Mobile), Phone # (Company)", "Products / Distribution Areas"],
    membership: ["Standard - (Free) Limited to 1 entry", "Silver - Up to 3 entries/month or $35/month", "Gold - Unlimited annual access $1,395/year"],
    permissions: ["Enter & manage product installations", "Purchase property reports", "Track distribution activity"],
  },
  realtor: {
    required: ["First Name, Last Name, Email", "Agency Name, Agency Address", "License # (Required)", "Phone # (Direct)", "Website URL"],
    membership: ["Standard - (Free) Limited to 1 property", "Silver - Up to 5 properties/month or $35/month", "Gold - Unlimited annual access $1,395/year"],
    permissions: ["View & purchase property reports", "Access full upgrade history for listings", "Share reports with clients"],
  },
};

function getRoleImage(roleName: string): string {
  const n = roleName.toLowerCase();
  if (n.includes("contractor")) return "/assets/register/contractor.png";
  if (n.includes("city") || n.includes("inspector")) return "/assets/register/cityInspector.png";
  if (n.includes("homeowner") || n.includes("property_owner")) return "/assets/register/homeowner.png";
  if (n.includes("insurance")) return "/assets/register/company.png";
  if (n.includes("manufacturer") || n.includes("distributor")) return "/assets/register/manufacure.png";
  if (n.includes("realtor")) return "/assets/register/realtors.png";
  return "/assets/register/homeowner.png";
}

function getRoleDetails(roleName: string): RoleDetail {
  const n = roleName.toLowerCase();
  const key = Object.keys(ROLE_DETAILS).find((k) => n.includes(k));
  return key ? ROLE_DETAILS[key] : ROLE_DETAILS.homeowner;
}

export function RoleSelectionPage({ roles, loadingRoles, onSelect }: RoleSelectionProps) {
  const [detailRole, setDetailRole] = useState<{ id: string; role_name: string } | null>(null);

  return (
    <div className="w-full flex flex-col bg-white font-inter">
      <div className="relative w-full overflow-hidden flex items-center justify-center text-center" style={{ minHeight: 200 }}>
        <img src="/assets/register/top_bg.png" alt="" className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none" />
        <div className="relative z-10 px-6 sm:px-[14%] py-10">
          <h1 className="font-asap font-bold uppercase text-[#212B45] text-[28px] sm:text-[38px] lg:text-[50px] leading-tight mb-3">
            SIGNUP OVERVIEW - ALL ROLES
          </h1>
          <p className="font-inter text-[#718191] text-sm sm:text-base lg:text-[18px] leading-relaxed max-w-[600px] mx-auto">
            Choose the role that best describes you and create your account. Each role has different permissions, memberships, and access levels.
          </p>
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12 py-10 lg:py-14">
        {loadingRoles ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[200px] rounded-[20px] bg-[rgba(51,159,208,0.15)] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 px-40 lg:gap-7 items-start">
            {roles.map((role) => {
              const n = role.role_name.toLowerCase();
              const isManufDist = n.includes("manufacturer") && n.includes("distributor");
              const mainName = isManufDist
                ? "MANUFACTURER"
                : role.role_name.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ").toUpperCase();
              const subName = isManufDist ? "Distribution" : null;
              const isOpen = detailRole?.id === role.id;
              const details = getRoleDetails(role.role_name);

              if (isOpen) {
                return (
                  <div key={role.id} className="relative h-[200px]">
                    <div className="absolute top-0 left-0 w-full z-20 rounded-[20px] overflow-hidden flex flex-col bg-[#212B45] h-[400px] shadow-[0px_4px_44px_0px_rgba(51,159,208,0.7)]">
                      <div className="relative flex items-center gap-3 px-4 h-[58px] shrink-0 bg-white/5">
                        <div className="w-[46px] h-[46px] flex items-center justify-center shrink-0 overflow-hidden rounded-[4px] bg-white/10">
                          <img src={getRoleImage(role.role_name)} alt="" className="w-full h-full object-contain p-[4px]" style={{ filter: "brightness(0) invert(1)" }} />
                        </div>
                        <span className="font-asap font-semibold text-white text-[16px] uppercase leading-tight pr-6">{mainName}</span>
                        <button type="button" onClick={() => setDetailRole(null)} className="absolute cursor-pointer right-3 top-3 text-white/50 hover:text-white transition-colors" aria-label="Close">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="overflow-y-auto flex-1 min-h-0 px-4 py-3 space-y-3">
                        <div className="pb-2 border-b border-white/10">
                          <p className="font-inter font-semibold text-[#339FD0] text-[10px] uppercase tracking-widest mb-1.5">Required Information</p>
                          {details.required.map((item, i) => (
                            <div key={i} className="flex items-start gap-1.5 mb-1">
                              <span className="shrink-0 w-[5px] h-[5px] rounded-[1px] bg-white mt-[4px]" />
                              <span className="font-inter text-white text-[11px] leading-snug">{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pb-2 border-b border-white/10">
                          <p className="font-inter font-semibold text-[#339FD0] text-[10px] uppercase tracking-widest mb-1.5">Membership Plans</p>
                          {details.membership.map((item, i) => (
                            <div key={i} className="flex items-start gap-1.5 mb-1">
                              <span className="shrink-0 w-[5px] h-[5px] rounded-[1px] bg-white mt-[4px]" />
                              <span className="font-inter text-white text-[11px] leading-snug">{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pb-1">
                          <p className="font-inter font-semibold text-[#339FD0] text-[10px] uppercase tracking-widest mb-1.5">Permissions / Limits</p>
                          {details.permissions.map((item, i) => (
                            <div key={i} className="flex items-start gap-1.5 mb-1">
                              <span className="shrink-0 w-[5px] h-[5px] rounded-[1px] bg-white mt-[4px]" />
                              <span className="font-inter text-white text-[11px] leading-snug">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={role.id} className="group flex flex-col rounded-[20px] p-6 transition-all duration-200 bg-[rgba(51,159,208,0.18)] hover:bg-[#212B45]" style={{ minHeight: 250 }}>
                  <div className="flex items-center gap-4 mb-auto">
                    <div className="shrink-0 w-[60px] h-[60px] rounded-[6px] overflow-hidden flex items-center justify-center bg-[#212B45] group-hover:bg-white/10 transition-colors duration-200">
                      <img src={getRoleImage(role.role_name)} alt={mainName} className="w-full h-full object-contain p-[6px]" style={{ filter: "brightness(0) invert(1)" }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-asap font-semibold text-[18px] lg:text-[20px] uppercase leading-tight text-[#212B45] group-hover:text-white transition-colors duration-200">{mainName}</span>
                      {subName && <span className="font-asap text-[13px] text-[#212B45]/70 group-hover:text-white/75 transition-colors duration-200">{subName}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-6 w-full">
                    <button type="button" className="font-asap font-bold text-[13px] uppercase cursor-pointer text-white rounded-[10px] py-2.5 hover:opacity-90 active:scale-95 whitespace-nowrap flex-1 min-w-0 bg-[#339FD0]" onClick={() => setDetailRole(role)}>
                      View Details
                    </button>
                    <button type="button" onClick={() => onSelect(role.id, role.role_name)} className="font-asap font-bold text-[13px] uppercase cursor-pointer text-white bg-primary rounded-[10px] py-2.5 hover:opacity-90 active:scale-95 whitespace-nowrap flex-1 min-w-0">
                      Create An Account
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
