'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  User,
  RefreshCw,
  AlertCircle,
  Clock,
  ChevronDown,
  Eye,
  Calendar,
  Layers,
  FileText,
  Home,
  Trash2,
  MapPin,
  Briefcase,
  AlertTriangle,
  FileCheck2,
  Info
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuditReports } from '@/lib/actions';
import { motion, AnimatePresence } from 'framer-motion';

// Types from the API response
export interface AuditReportUser {
  id: string;
  email: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  roleEntity?: {
    id: string;
    role_name: string;
    is_public?: boolean;
    created_at?: string;
    updated_at?: string;
  };
}

export interface AuditReportProject {
  id: string;
  project_type: string;
  is_confirmed: boolean;
  permit_status?: string;
  project_name?: string;
}

export interface AuditReportPropertyProject {
  id: string;
  project_type: string;
  is_confirmed: boolean;
}

export interface AuditReportComponents {
  roofing?: Array<{ id: string; brand: string }>;
  siding?: Array<{ id: string; brand: string }>;
  windows?: Array<{ id: string; brand: string }>;
  doors?: Array<{ id: string; brand: string }>;
  garageDoors?: Array<{ id: string; brand: string }>;
}

export interface AuditReportPropertyDetails {
  id: string;
  address: string;
  zip_code?: string;
  city?: { id?: string; name: string };
  state?: { id?: string; name: string };
  projects?: AuditReportPropertyProject[];
  components?: AuditReportComponents;
  property_name?: string;
}

export interface AuditReportEntry {
  id: string;
  property_id: string;
  project_id: string | null;
  report_types: string[];
  date_generated: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user: AuditReportUser;
  project: AuditReportProject | null;
  property_details: AuditReportPropertyDetails | null;
  payment_amount?: string;
  payment_status?: string;
  user_type?: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  page: number;
  totalPages: number;
}

export default function AuditReportsList() {
  const [reports, setReports] = useState<AuditReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'FULL' | 'SINGLE' | 'ORPHANED'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const response = await getAuditReports(page, 15, debouncedSearch);
        if (page === 1) {
          setReports(response.data || []);
        } else {
          setReports(prev => [...prev, ...(response.data || [])]);
        }
        setPagination(response.pagination);
      } catch (error) {
        console.error('Error fetching audit reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [page, debouncedSearch]);

  const getReportMeta = (report: AuditReportEntry) => {
    if (!report.property_details) {
      return {
        label: 'Deleted Report',
        description: 'Property was deleted',
        color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        icon: Trash2
      };
    }
    if (report.project_id) {
      return {
        label: 'Single Project Report',
        description: `Downloaded ${report.project?.project_type || 'Project'} Report`,
        color: 'text-secondary-new bg-secondary-new/10 border-secondary-new/20',
        icon: Briefcase
      };
    }
    return {
      label: 'Full Property Report',
      description: 'Downloaded entire property details',
      color: 'text-primary bg-primary/10 border-primary/20',
      icon: Home
    };
  };

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      if (selectedType === 'ALL') return true;
      if (selectedType === 'ORPHANED') return !report.property_details;
      if (selectedType === 'SINGLE') return report.property_details && report.project_id;
      if (selectedType === 'FULL') return report.property_details && !report.project_id;
      return true;
    });
  }, [reports, selectedType]);

  // Group reports by date
  const groupedReports = useMemo(() => {
    const groups: { [key: string]: AuditReportEntry[] } = {};
    filteredReports.forEach(report => {
      const date = format(new Date(report.date_generated || report.created_at), 'MMMM yyyy');
      if (!groups[date]) groups[date] = [];
      groups[date].push(report);
    });
    return groups;
  }, [filteredReports]);

  const getDisplayName = (user?: AuditReportUser) => {
    if (!user) return 'System User';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email || 'System User';
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto">
        {[1, 2].map(i => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-32" />
            {[1, 2, 3].map(j => (
              <Skeleton key={j} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search reports, users, addresses..."
            className="rounded-xl"
            startIcon={<Search className="size-4 md:size-6" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
          <Button
            variant={selectedType === 'ALL' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('ALL')}
            className="rounded-full"
          >
            All Reports
          </Button>
          <Button
            variant={selectedType === 'FULL' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('FULL')}
            className="rounded-full whitespace-nowrap"
          >
            Full Property
          </Button>
          <Button
            variant={selectedType === 'SINGLE' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('SINGLE')}
            className="rounded-full whitespace-nowrap"
          >
            Single Project
          </Button>
          <Button
            variant={selectedType === 'ORPHANED' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedType('ORPHANED')}
            className="rounded-full whitespace-nowrap"
          >
            Orphaned
          </Button>
        </div>
      </div>

      {/* Reports Timeline */}
      <div className="space-y-12">
        {Object.entries(groupedReports).map(([date, dateReports]) => (
          <div key={date} className="relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary/5 text-primary border border-primary/10">
                <Calendar className="size-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {date}
                <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  {dateReports.length} reports
                </span>
              </h2>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="space-y-4 pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-4">
              {dateReports.map((report) => {
                const meta = getReportMeta(report);
                const isExpanded = expandedId === report.id;
                const IconComponent = meta.icon;

                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className={cn(
                      "group border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden",
                      isExpanded ? "ring-1 ring-primary/20 bg-primary/5" : "bg-white dark:bg-slate-900"
                    )}>
                      <CardContent className="p-0">
                        <div
                          className="p-4 sm:p-5 flex gap-4 cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : report.id)}
                        >
                          <Avatar className="size-10 sm:size-12 rounded-xl ring-2 ring-white dark:ring-slate-800 shadow-sm">
                            <AvatarFallback className={cn("rounded-xl font-bold", meta.color)}>
                              <IconComponent className="size-5" />
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4 mb-1">
                              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {meta.label}
                                </span>
                                <span className="text-sm text-slate-500">
                                  by {getDisplayName(report.user)}
                                </span>
                                {report.user && (report.user.role || report.user.roleEntity?.role_name) && (
                                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0 px-2 h-5 rounded-md text-primary border-primary/30 bg-primary/5 dark:text-primary dark:border-primary/30 dark:bg-primary/5">
                                    {(report.user.role || report.user.roleEntity?.role_name || '').replace(/_/g, ' ')}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                                {formatDistanceToNow(new Date(report.date_generated || report.created_at), { addSuffix: true })}
                              </span>
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                              {report.property_details ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3.5 inline text-primary" />
                                  {report.property_details.address}
                                  {report.property_details.city?.name && `, ${report.property_details.city.name}`}
                                  {report.property_details.state?.name && `, ${report.property_details.state.name}`}
                                </span>
                              ) : (
                                <span className="text-rose-500 flex items-center gap-1 font-semibold">
                                  <AlertTriangle className="size-3.5 inline" />
                                  Property Deleted (ID: {report.property_id.substring(0, 8)}...)
                                </span>
                              )}
                            </p>

                            <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {format(new Date(report.date_generated || report.created_at), 'MMM d, yyyy h:mm a')}
                              </div>
                              {(report.report_types && report.report_types.length > 0) && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-slate-500">Types:</span>
                                  {report.report_types.map(t => (
                                    <Badge key={t} variant="secondary" className="text-[9px] font-bold px-1.5 py-0 rounded h-4 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                      {t}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <div className="flex-1" />
                              <div className="flex items-center gap-1 text-primary hover:underline font-semibold pointer-events-auto">
                                <Eye className="size-3" />
                                {isExpanded ? 'Show less' : 'View details'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                            >
                              <div className="p-5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* User Details */}
                                  <div className="space-y-2">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-secondary-new/70 dark:text-slate-400 flex items-center gap-1">
                                      <User className="size-3 text-primary" /> User Context
                                    </h4>
                                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-xs text-muted-foreground">User ID:</span>
                                        <span className="text-xs font-mono font-medium">{report.user?.id || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-muted-foreground">Full Name:</span>
                                        <span className="text-xs font-medium">{getDisplayName(report.user)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-muted-foreground">Email:</span>
                                        <span className="text-xs">{report.user?.email || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Role:</span>
                                        {(report.user?.role || report.user?.roleEntity?.role_name) ? (
                                          <Badge variant="outline" className="text-[10px] py-0.5 px-2 uppercase text-primary border-primary/30 bg-primary/5">
                                            {(report.user.role || report.user.roleEntity?.role_name || '').replace(/_/g, ' ')}
                                          </Badge>
                                        ) : (
                                          <span className="text-xs font-medium text-slate-500">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Property Details or Warning */}
                                  <div className="space-y-2">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-secondary-new/70 dark:text-slate-400 flex items-center gap-1">
                                      <Info className="size-3 text-primary" /> Report Metadata
                                    </h4>
                                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-xs text-muted-foreground">Report ID:</span>
                                        <span className="text-xs font-mono font-medium">{report.id}</span>
                                      </div>
                                      <div className="flex justify-between items-start gap-4">
                                        <span className="text-xs text-muted-foreground">Property:</span>
                                        <span className="text-xs font-medium text-right">
                                          {report.property_details ? (
                                            `${report.property_details.property_name ? report.property_details.property_name + ' - ' : ''}${report.property_details.address}`
                                          ) : (
                                            <span className="text-rose-500 font-semibold">Deleted</span>
                                          )}
                                        </span>
                                      </div>
                                      {report.project_id && (
                                        <div className="flex justify-between items-start gap-4">
                                          <span className="text-xs text-muted-foreground">Project:</span>
                                          <span className="text-xs font-medium text-right">
                                            {report.project?.project_name ? `${report.project.project_name} (${report.project.project_type})` : report.project?.project_type || 'N/A'}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span className="text-xs text-muted-foreground">Date Generated:</span>
                                        <span className="text-xs">{format(new Date(report.date_generated), 'PPP pp')}</span>
                                      </div>
                                      {report.payment_status && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-muted-foreground">Payment Status:</span>
                                          <Badge
                                            variant={report.payment_status === "SUCCESS" ? "success" : "secondary"}
                                            className="text-[10px] py-0.5 px-2 uppercase font-semibold"
                                          >
                                            {report.payment_status}
                                          </Badge>
                                        </div>
                                      )}
                                      {report.payment_amount && (
                                        <div className="flex justify-between">
                                          <span className="text-xs text-muted-foreground">Payment Amount:</span>
                                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">${report.payment_amount}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {/* {report.project && (
                                  <div className="space-y-2">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-secondary-new/70 dark:text-slate-400 flex items-center gap-1">
                                      <Briefcase className="size-3 text-primary" /> Project Details
                                    </h4>
                                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div>
                                          <span className="text-[9px] font-bold text-slate-400 uppercase">Project Type</span>
                                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{report.project.project_type}</p>
                                        </div>
                                        <div>
                                          <span className="text-[9px] font-bold text-slate-400 uppercase">Confirmed Status</span>
                                          <p className="text-xs">
                                            <Badge variant={report.project.is_confirmed ? "success" : "secondary"} className="text-[9px] py-0 h-4 mt-0.5">
                                              {report.project.is_confirmed ? 'Confirmed' : 'Pending'}
                                            </Badge>
                                          </p>
                                        </div>
                                        {report.project.permit_status && (
                                          <div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Permit Status</span>
                                            <p className="text-xs mt-0.5">
                                              <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4.5 uppercase text-secondary-new border-secondary-new/30 bg-secondary-new/5 dark:text-slate-300 dark:border-slate-700 dark:bg-slate-800">
                                                {report.project.permit_status}
                                              </Badge>
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )} */}

                                {/* {report.property_details?.components && Object.values(report.property_details.components).some(list => (list as Array<any>)?.length > 0) && (
                                  <div className="space-y-2">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-secondary-new/70 dark:text-slate-400 flex items-center gap-1">
                                      <Layers className="size-3 text-primary" /> Property Components
                                    </h4>
                                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                        {Object.entries(report.property_details.components)
                                          .filter(([_, list]) => (list as Array<any>)?.length > 0)
                                          .map(([type, list]) => {
                                            const typedList = list as Array<{ id: string; brand: string }>;
                                            return (
                                              <div key={type} className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{type.replace(/([A-Z])/g, ' $1')}</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                  {typedList.map(comp => (
                                                    <Badge key={comp.id} variant="outline" className="text-[10px] py-0.5 px-2 h-5.5 text-secondary-new border-secondary-new/30 bg-slate-50 dark:text-slate-300 dark:border-slate-700 dark:bg-slate-800">
                                                      {comp.brand}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>
                                    </div>
                                  </div>
                                )} */}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredReports.length === 0 && !loading && (
          <div className="py-20 text-center space-y-4">
            <div className="inline-flex items-center justify-center size-16 rounded-3xl bg-slate-50 text-slate-300">
              <FileText className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">No reports found</h3>
              <p className="text-muted-foreground text-sm">We couldn't find any audit reports matching your search or filters.</p>
            </div>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedType('ALL'); }}>
              Clear All Filters
            </Button>
          </div>
        )}

        {pagination && pagination.hasMore && (
          <div className="flex justify-center pt-8">
            <Button
              variant="outline"
              className="rounded-xl h-11 px-8 min-w-[200px]"
              onClick={() => setPage(p => p + 1)}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="size-4 mr-2 animate-spin" />
              ) : (
                <ChevronDown className="size-4 mr-2" />
              )}
              Load Older Reports
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
