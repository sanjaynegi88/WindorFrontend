"use client";

import { useEffect, useState } from "react";
import { getPropertyListAll } from "@/lib/actions";
import { PropertyCard } from "./property-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { PropertyDetailDialog } from "./property-detail-dialog";

interface PropertyGridProps {
  searchParams?: any;
  redirectUrl?: any;
  showActionButtons?: boolean;
  showDetail?: boolean;
  isPropertyOwner?: boolean;
}

export function PropertyGrid({ searchParams, redirectUrl, showActionButtons, showDetail, isPropertyOwner }: PropertyGridProps) {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getSafeString = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'name' in value) return String(value.name);
    if (value && typeof value === 'object' && 'type_name' in value) return String(value.type_name);
    if (value && typeof value === 'object' && 'state_name' in value) return String(value.state_name);
    return '';
  };

  const fetchProperties = async (pageNum: number, append: boolean = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const response = await getPropertyListAll({
        ...searchParams,
        page: pageNum,
        limit: 9,
        isPropertyOwner,
      });

      const newData = response?.data || [];
      if (append) {
        setProperties((prev) => [...prev, ...newData]);
      } else {
        setProperties(newData);
      }

      setHasMore(newData.length === 9);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchProperties(1, false);
  }, [searchParams]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProperties(nextPage, true);
  };

  if (loading && page === 1) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton
            key={i}
            className="h-[160px] md:h-[280px] rounded-[10px] md:rounded-4xl"
          />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 md:rounded-4xl">
        <p className="text-gray-400 font-black uppercase tracking-widest text-lg">
          No properties found.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 md:space-y-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {properties.map((prop) => {
            const cityName = getSafeString(prop.city_name) || getSafeString(prop.city);;
            const stateName = prop.state_name !== "False"
              ? (getSafeString(prop.state_name) || getSafeString(prop.state))
              : "";

            return (
              <PropertyCard
                key={prop.id}
                id={`RE${prop.id.slice(-4).toUpperCase()}`}
                propertyName={prop.property_name || ""}
                address={prop.address || ""}
                address2={prop.address2 || ""}
                city={cityName}
                state={stateName}
                zip={prop.zip || ""}
                propertyId={prop.id}
                isPurchased={prop.is_purchased || false}
                propertyOwnerEmail={prop.property_owner?.email}
                redirectUrl={redirectUrl || "/property-details/"}
                showActionButtons={showActionButtons}
                showDetail={showDetail}
              />
            );
          })}
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="gap-2 font-black uppercase tracking-widest text-[#22a699] hover:bg-[#e6f7f5]"
            >
              {loadingMore && <Loader2 className="size-4 animate-spin" />}
              Load More
            </Button>
          </div>
        )}
      </div>
      <PropertyDetailDialog
        property={selectedProperty}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
