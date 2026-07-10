"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar, Footer } from "@/components/layouts/global";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  MapPin,
  Phone,
  CheckCircle2,
  Star,
  Filter,
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { getAppImageUrl, cn, toPascalCase } from "@/lib/utils";
import { ContractorDetailsDialog } from "@/components/contractor/ContractorDetailsDialog";
import { motion } from "motion/react";
import {
  getContractorDirectory,
  getServiceProvided,
  getCities,
  deleteContractorProfile,
} from "@/lib/actions";
import { toast } from "sonner";
import { useUser } from "@/components/providers/user-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

const GridBackground = dynamic(
  () =>
    import("@/components/ui/grid-background").then((mod) => ({
      default: mod.GridBackground,
    })),
  { ssr: false },
);


export default function ContractorDirectoryPage() {
  const { user, role } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [selectedContractor, setSelectedContractor] =
    useState<any | null>(null);
  const [contractors, setContractors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<{ id: string; name: string }[]>([{ id: "ALL", name: "ALL" }]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = role === "admin";
  const canManage = (contractor: any) => {
    if (isAdmin) return true;
    if (!user) return false;

    return user.email === contractor.contractor?.email;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await deleteContractorProfile(deleteTarget.id, role || undefined);
      if (!response.success) {
        toast.error(response.message);
        return;
      }
      toast.success("Contractor profile deleted successfully");
      setContractors((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete contractor profile");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await getServiceProvided(1, 100);
        const serviceItems = response.data.map(
          (type: { id: string; service_name: string }) => ({ id: type.id, name: type.service_name }),
        );
        setServices([{ id: "ALL", name: "ALL" }, ...serviceItems]);
      } catch (error) {
        console.error("Failed to fetch services:", error);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await getCities();
        setCities(response.data || []);
      } catch (error) {
        console.error("Failed to fetch cities:", error);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        setIsLoading(true);
        const params: { city_id?: string; service?: string; keyword?: string } = {};

        if (searchQuery) params.keyword = searchQuery;
        if (activeFilter !== "ALL") params.service = activeFilter;
        if (selectedCity !== "ALL") params.city_id = selectedCity;

        const response = await getContractorDirectory(params);
        const mapped = (response.data || []).map((item: any) => ({
          ...item,
          companyName: item.contractor?.company_name || item.contractor?.profile?.company_name || "N/A",
          contactName: item.contractor?.profile?.display_name || `${item.contractor?.first_name || ""} ${item.contractor?.last_name || ""}`.trim() || "N/A",
          phone: item.contractor?.companyPhone || item.contractor?.mobilePhone || "N/A",
          email: item.contractor?.email || "N/A",
          websiteUrl: item.contractor?.websiteUrl || "#",
        }));
        setContractors(mapped);
      } catch (error: any) {
        console.error("Failed to fetch contractors:", error);
        toast.error(error.message || "Failed to load contractors");
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchContractors();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, selectedCity]);

  const filteredContractors = contractors;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-asap">
      <Navbar />

      <section className="relative pt-[118px] overflow-hidden bg-[#1F2A44]">
        <GridBackground
          gridSize="12:12"
          colors={{
            background: "bg-transparent",
            borderColor: "border-[#1CA7A6]/10",
          }}
          beams={{
            count: 6,
            colors: ["bg-[#1CA7A6]", "bg-[#1CA7A6]/50"],
            speed: 5,
          }}
          className="absolute inset-0 z-0"
        />

        <div className="max-w-[1240px] mx-auto px-6 py-20 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-[#1CA7A6]/10 border border-[#1CA7A6]/20 px-4 py-2 rounded-full">
              <ShieldCheck className="size-4 text-[#1CA7A6]" />
              <span className="text-[#1CA7A6] text-xs font-bold uppercase tracking-widest">
                Verified Professionals Only
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight">
              The Network for <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#1CA7A6] to-[#4FD1C5]">
                Premium Contractors
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Connect with top-tier professionals specializing in roofing,
              siding, and verifications. Every contractor in our directory is
              vetted for quality and reliability.
            </p>

            <div className="max-w-2xl mx-auto w-full pt-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-linear-to-r from-[#1CA7A6] to-[#1F2A44] rounded-[24px] blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
                <div className="relative flex items-center bg-white rounded-[20px] p-1 shadow-2xl overflow-hidden">
                  <Input
                    placeholder="Search by company, service, or location..."
                    className="border-none focus-visible:ring-0 text-lg h-14 bg-transparent placeholder:text-gray-400"
                    startIcon={<Search className="size-6" />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button className="h-14 px-10 bg-[#1CA7A6] hover:bg-[#189695] text-white font-bold rounded-[14px] transition-all shadow-lg hidden sm:flex shrink-0">
                    Find Experts
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="grow max-w-[1240px] w-full mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row items-start gap-12">
          <aside className="w-full lg:w-72 space-y-10 shrink-0 lg:sticky lg:top-[140px]">
            <div>
              <h3 className="text-sm font-bold text-[#1F2A44] uppercase tracking-widest mb-6 flex items-center gap-2">
                <Filter className="size-4 text-[#1CA7A6]" />
                Filter by Service
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {services.map((service) => (
                  <button
                    key={service.id || service.name}
                    onClick={() => setActiveFilter(service.id)}
                    className={cn(
                      "flex items-center justify-between px-5 py-3 rounded-xl text-sm font-bold transition-all border",
                      activeFilter === service.id
                        ? "bg-[#1CA7A6] text-white border-[#1CA7A6] shadow-xl shadow-[#1CA7A6]/20"
                        : "bg-white text-gray-500 border-gray-100 hover:border-[#1CA7A6]/30 hover:text-[#1CA7A6] shadow-sm",
                    )}
                  >
                    <span>{toPascalCase(service.name)}</span>
                    {activeFilter === service.id && (
                      <Zap className="size-3 fill-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#1F2A44] uppercase tracking-widest mb-6 flex items-center gap-2">
                <MapPin className="size-4 text-[#1CA7A6]" />
                Filter by City
              </h3>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-5 py-3 rounded-xl text-sm font-bold border border-gray-100 bg-white text-gray-500 hover:border-[#1CA7A6]/30 hover:text-[#1CA7A6] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1CA7A6]/20"
              >
                <option value="ALL">All Cities</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </aside>

          <div className="grow">
            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-12 h-12 text-[#1CA7A6] animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredContractors.map((contractor, index) => (
                    <motion.div
                      key={contractor.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="group relative bg-white border-none rounded-[32px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 h-full flex flex-col">
                        <CardContent className="p-0 grow flex flex-col">
                          <div className="p-8 pb-4 flex items-start justify-between gap-4">
                            <div className="relative">
                              <div className="absolute -inset-2 bg-linear-to-br from-[#1CA7A6] to-transparent rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity" />
                              <Avatar className="h-20 w-20 border border-gray-100 shadow-md rounded-2xl bg-white p-2 shrink-0 relative">
                                <AvatarImage
                                  src={getAppImageUrl(contractor.companyLogo)}
                                  className="object-contain"
                                />
                                <AvatarFallback className="bg-[#1CA7A6]/5 text-[#1CA7A6] font-black text-2xl uppercase">
                                  {contractor.companyName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </div>

                            {contractor.membershipLevel === "GOLD" && (
                              <Badge className="bg-[#1CA7A6]/10 text-[#1CA7A6] border-none px-3 py-1 rounded-full flex items-center gap-1.5">
                                <Star className="size-3 fill-[#1CA7A6]" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                  Premium Partner
                                </span>
                              </Badge>
                            )}
                          </div>

                          <div className="px-8 grow">
                            <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                              <h3 className="text-2xl font-black text-[#1F2A44]">
                                {contractor.companyName}
                              </h3>
                              <CheckCircle2 className="size-5 text-[#1CA7A6]" />
                            </div>

                            <p className="text-gray-500 mt-3 text-sm leading-relaxed font-medium line-clamp-3">
                              {contractor.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-6">
                              {(contractor.services_provided_details ?? []).map(
                                (service: any) => (
                                  <Badge
                                    key={service.id}
                                    className="bg-gray-50 text-gray-500 hover:bg-[#1CA7A6]/10 hover:text-[#1CA7A6] transition-colors border-none py-1.5 px-4 rounded-lg font-bold text-[10px]"
                                  >
                                    {toPascalCase(service.service_name)}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>

                          <div className="p-8 pt-6 mt-6 border-t border-gray-50 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-[#1CA7A6]/5 flex items-center justify-center text-[#1CA7A6]">
                                  <MapPin className="size-4" />
                                </div>
                                <span className="text-xs font-bold text-gray-600 truncate">
                                  {contractor.cityDetails?.[0]?.name || "N/A"}
                                  {contractor.cityDetails && contractor.cityDetails.length > 1 &&
                                    ` +${contractor.cityDetails.length - 1} more`}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-[#1CA7A6]/5 flex items-center justify-center text-[#1CA7A6]">
                                  <Phone className="size-4" />
                                </div>
                                <span className="text-xs font-bold text-gray-600 truncate">
                                  {contractor.phone}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <Button
                                onClick={() =>
                                  setSelectedContractor(contractor)
                                }
                                className="flex-1 h-14 bg-[#1F2A44] group-hover:bg-[#1CA7A6] text-white font-bold rounded-2xl transition-all shadow-lg group-hover:shadow-[#1CA7A6]/20 border-none"
                              >
                                <span className="flex items-center justify-center gap-2">
                                  <span>View Profile Details</span>
                                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                              </Button>

                              {canManage(contractor) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-14 w-14 rounded-2xl border-gray-200 hover:border-[#1CA7A6] hover:text-[#1CA7A6] shrink-0"
                                    onClick={() =>
                                      router.push(
                                        `/profile-setup?edit=${contractor.id}`,
                                      )
                                    }
                                    title="Edit"
                                  >
                                    <Pencil className="size-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-14 w-14 rounded-2xl border-gray-200 hover:border-red-400 hover:text-red-500 shrink-0"
                                    onClick={() => setDeleteTarget(contractor)}
                                    title="Delete"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <ContractorDetailsDialog
                  contractor={selectedContractor}
                  isOpen={!!selectedContractor}
                  onClose={() => setSelectedContractor(null)}
                />

                <AlertDialog
                  open={!!deleteTarget}
                  onOpenChange={(open) => !open && setDeleteTarget(null)}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete Contractor Profile
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete{" "}
                        <strong>{deleteTarget?.companyName}</strong>? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        {isDeleting ? (
                          <Loader2 className="size-4 animate-spin mr-2" />
                        ) : null}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {filteredContractors.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-32 bg-white rounded-[48px] border border-dashed border-gray-200"
                  >
                    <div className="inline-flex items-center justify-center size-24 bg-gray-50 rounded-full mb-8 text-gray-300">
                      <Search className="size-12" />
                    </div>
                    <h3 className="text-3xl font-black text-[#1F2A44] mb-3">
                      No specialists found
                    </h3>
                    <p className="text-gray-400 max-w-sm mx-auto font-medium text-lg leading-relaxed">
                      We couldn't find any contractors
                    </p>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
