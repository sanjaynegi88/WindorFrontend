'use client';

import { useMemo } from 'react';
import { ArrowLeft, Calendar, User, Building, Palette, Wrench, Package, Shield, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDate } from '@/lib/helpers';
import { Comments } from './comment';

interface ComponentDetailProps {
  componentId: string;
  componentData?: any;
}

export default function ComponentDetail({ componentId, componentData }: ComponentDetailProps) {
  const router = useRouter();

  const component = useMemo(() => {
    if (componentData) return componentData;

    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(`component-${componentId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error('Failed to parse cached component data');
        }
      }
    }

    toast.error('Component data not available');
    router.push('/installations');
    return null;
  }, [componentId, componentData, router]);

  if (!component) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Component not found</p>
          <Button
            variant="outline"
            onClick={() => router.push('/installations')}
            className="mt-2 cursor-pointer"
          >
            Back to Installations
          </Button>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'roofing': return <Wrench className="size-5" />;
      case 'siding': return <Building className="size-5" />;
      case 'window': return <Package className="size-5" />;
      case 'door': return <Shield className="size-5" />;
      default: return <Package className="size-5" />;
    }
  };

  const formatComponentType = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  return (
    <div className="space-y-6 p-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="rounded-lg cursor-pointer"
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>
      <div className="flex items-center gap-4">

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {component.property?.address}, {component.property?.city?.name}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {component.images && component.images.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="size-5" />
                  Installation Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {component.images.map((image: any) => {
                    const inspectorImage = image.image_url;
                    const ownerImage = image.property_owner_files;
                    const images = [];

                    if (inspectorImage) {
                      images.push({
                        url: `${process.env.NEXT_PUBLIC_BASE_URL}${inspectorImage}`,
                        type: 'Contractor',
                        variant: 'secondary' as const
                      });
                    }

                    if (ownerImage) {
                      images.push({
                        url: `${process.env.NEXT_PUBLIC_BASE_URL}${ownerImage}`,
                        type: 'Owner',
                        variant: 'primary' as const
                      });
                    }

                    return images.map((img, index) => (
                      <div key={`${image.id}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={img.url}
                          alt={`Installation - ${img.type}`}
                          className="w-full h-full object-cover"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', maxWidth: '100%', maxHeight: '100%' }}
                        />
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={img.variant}
                            className="text-xs"
                          >
                            {img.type}
                          </Badge>
                        </div>
                      </div>
                    ));
                  }).flat()}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="size-5" />
                  Installation Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="size-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-medium">No Images Available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No installation images have been uploaded yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Component Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {getTypeIcon(component.component_type)}
                </div>
                <div>
                  <p className="font-semibold">{formatComponentType(component.component_type)}</p>
                  <p className="text-sm text-muted-foreground">{component.style}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{component.description}</p>
            </CardContent>
          </Card>

          {/* Additional Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {component.impact_resistant !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Impact Resistant</span>
                  <Badge variant={component.impact_resistant ? "success" : "destructive"}>
                    {component.impact_resistant ? "Yes" : "No"}
                  </Badge>
                </div>
              )}

              {component.class_rating && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Class Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="size-3 text-yellow-500" />
                    <span className="text-sm">{component.class_rating}</span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Component ID: {component.id.substring(0, 8)}...
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Installation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getTypeIcon(component.component_type)}
                Installation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Brand</p>
                      <p className="text-sm text-muted-foreground">{component.brand}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Installer</p>
                      <p className="text-sm text-muted-foreground">{component.installer}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Package className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Supplier</p>
                      <p className="text-sm text-muted-foreground">{component.supplier}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Install Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(component.install_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Palette className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Color</p>
                      <p className="text-sm text-muted-foreground">{component.color}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Wrench className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Material</p>
                      <p className="text-sm text-muted-foreground">{component.material}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Elevation Data (for siding) */}
          {component.elevation_data && component.elevation_data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Elevation Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {component.elevation_data.map((elevation: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">{elevation.name}</span>
                      <span className="text-muted-foreground">{elevation.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <Comments propertyId={component.propertyId || component.property_id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}