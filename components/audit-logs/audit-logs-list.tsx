'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Shield,
  User,
  LogIn,
  LogOut,
  RefreshCw,
  UserPlus,
  Key,
  AlertCircle,
  Clock,
  ChevronDown,
  Eye,
  Calendar,
  Layers,
  Monitor,
  Globe,
  Edit
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn, toPascalCase } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuditLogs } from '@/lib/actions';
import { motion, AnimatePresence } from 'framer-motion';

// Types from the API response
interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_values: any;
  new_values: any;
  changed_by_user_id: string;
  changed_by_user_email?: string;
  change_reason: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Action configurations for UI mapping
const actionConfig: Record<string, { icon: any; color: string; label: string }> = {
  LOGIN: { icon: LogIn, color: 'text-emerald-500 bg-emerald-500/10', label: 'Logged In' },
  LOGOUT: { icon: LogOut, color: 'text-amber-500 bg-amber-500/10', label: 'Logged Out' },
  PASSWORD_CHANGE: { icon: Key, color: 'text-blue-500 bg-blue-500/10', label: 'Password Changed' },
  PASSWORD_RESET: { icon: RefreshCw, color: 'text-purple-500 bg-purple-500/10', label: 'Password Reset' },
  PASSWORD_FORGOT: { icon: AlertCircle, color: 'text-orange-500 bg-orange-500/10', label: 'Forgot Password' },
  USER_CREATE: { icon: UserPlus, color: 'text-indigo-500 bg-indigo-500/10', label: 'User Created' },
  CREATE: { icon: UserPlus, color: 'text-indigo-500 bg-indigo-500/10', label: 'Self Registered' },
  DEFAULT: { icon: History, color: 'text-slate-500 bg-slate-500/10', label: 'System Action' },
};

export default function AuditLogsList() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
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
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await getAuditLogs(page, 15, debouncedSearch);
        if (page === 1) {
          setLogs(response.data);
        } else {
          setLogs(prev => [...prev, ...response.data]);
        }
        setPagination(response.pagination);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, debouncedSearch]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesAction = !selectedAction || log.action === selectedAction;
      return matchesAction;
    });
  }, [logs, selectedAction]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: AuditLogEntry[] } = {};
    filteredLogs.forEach(log => {
      const date = format(new Date(log.created_at), 'MMMM yyyy');
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  }, [filteredLogs]);

  const getActionInfo = (log: AuditLogEntry) => {
    if (log.action === 'UPDATE') {
      if (log.new_values && typeof log.new_values === 'object' && 'verified_status' in log.new_values) {
        return { icon: Shield, color: 'text-indigo-500 bg-indigo-500/10', label: 'Verification' };
      }
      return { icon: Edit, color: 'text-blue-500 bg-blue-500/10', label: 'Edit Log' };
    }
    return actionConfig[log.action] || actionConfig.DEFAULT;
  };

  const getDisplayName = (log: AuditLogEntry) => {
    const email = log.new_values?.email || log.changed_by_user_email || 'System User';
    const firstName = log.new_values?.first_name;
    const lastName = log.new_values?.last_name;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return email;
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
            placeholder="Search activities, emails, actions..."
            className="rounded-xl"
            startIcon={<Search className="size-4 md:size-6" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
          <Button
            variant={selectedAction === null ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedAction(null)}
            className="rounded-full"
          >
            All Activities
          </Button>
          {['LOGIN', 'USER_CREATE', 'PASSWORD_CHANGE'].map(action => (
            <Button
              key={action}
              variant={selectedAction === action ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedAction(action)}
              className="rounded-full whitespace-nowrap"
            >
              {actionConfig[action]?.label || action}
            </Button>
          ))}
        </div> */}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-12">
        {Object.entries(groupedLogs).map(([date, dateLogs]) => (
          <div key={date} className="relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary/5 text-primary border border-primary/10">
                <Calendar className="size-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {date}
                <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  {dateLogs.length} events
                </span>
              </h2>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="space-y-4 pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-4">
              {dateLogs.map((log) => {
                const config = getActionInfo(log);
                const isExpanded = expandedId === log.id;

                return (
                  <motion.div
                    key={log.id}
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
                          className={cn("p-4 sm:p-5 flex gap-4", (!['LOGIN', 'LOGOUT', 'PASSWORD_FORGOT'].includes(log.action) && config.label !== 'Verification') ? "cursor-pointer" : "")}
                          onClick={() => {
                            if (!['LOGIN', 'LOGOUT', 'PASSWORD_FORGOT'].includes(log.action) && config.label !== 'Verification') {
                              setExpandedId(isExpanded ? null : log.id);
                            }
                          }}
                        >
                          <Avatar className="size-10 sm:size-12 rounded-xl ring-2 ring-white dark:ring-slate-800 shadow-sm">
                            <AvatarFallback className={cn("rounded-xl font-bold", config.color)}>
                              {getDisplayName(log).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4 mb-1">
                              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {getDisplayName(log)}
                                </span>
                                <span className="text-sm text-slate-500">
                                  {config.label}
                                </span>
                                {log.table_name !== 'auth_events' && (
                                  <Badge variant="primary" className="text-[10px] uppercase tracking-wider py-0 h-4 rounded-md">
                                    {toPascalCase(log.table_name as string)}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                              </span>
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                              "{toPascalCase(log.change_reason)}"
                            </p>

                            <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Monitor className="size-3" />
                                {log.ip_address}
                              </div>
                              <div className="flex items-center gap-1 max-w-[200px] truncate">
                                <Globe className="size-3" />
                                {log.user_agent || 'Unknown Agent'}
                              </div>
                              <div className="flex-1" />
                              {log.action !== 'LOGIN' && log.action !== 'LOGOUT' && log.action !== 'PASSWORD_FORGOT' && config.label !== 'Verification' && (
                                <div className="flex items-center gap-1 text-primary hover:underline font-semibold pointer-events-auto">
                                  <Eye className="size-3" />
                                  {isExpanded ? 'Show less' : 'View details'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (!['LOGIN', 'LOGOUT', 'PASSWORD_FORGOT'].includes(log.action)) && config.label !== 'Verification' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                            >
                              <div className="p-5 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Activity Context</h4>
                                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-xs text-muted-foreground">Log ID:</span>
                                        <span className="text-xs font-mono font-medium">{log.id.substring(0, 8)}...</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-muted-foreground">Action:</span>
                                        <Badge variant="outline" className="text-[10px] h-4 text-black">{toPascalCase(log.action)}</Badge>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-muted-foreground">Timestamp:</span>
                                        <span className="text-xs">{format(new Date(log.created_at), 'PPP pp')}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Changes Summary</h4>
                                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 overflow-hidden">
                                      {log.new_values ? (
                                        <div className="space-y-1.5 h-full overflow-y-auto max-h-40 scrollbar-thin">
                                          {Object.entries(log.new_values).map(([key, value]) => (
                                            <div key={key} className="flex flex-col gap-0.5 border-b border-slate-50 dark:border-slate-800 last:border-0 pb-1 mb-1">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{key.replace(/_/g, ' ')}</span>
                                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 break-all">
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-muted-foreground italic">No values captured</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {log.old_values && (
                                  <div className="space-y-2">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Previous Data</h4>
                                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {Object.entries(log.old_values).map(([key, value]) => (
                                          <div key={key} className="flex flex-col gap-0.5">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{key.replace(/_/g, ' ')}</span>
                                            <span className="text-[11px] text-slate-500 truncate">{String(value)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
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

        {filteredLogs.length === 0 && !loading && (
          <div className="py-20 text-center space-y-4">
            <div className="inline-flex items-center justify-center size-16 rounded-3xl bg-slate-50 text-slate-300">
              <History className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">No activities found</h3>
              <p className="text-muted-foreground text-sm">We couldn't find any audit logs matching your search criteria.</p>
            </div>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedAction(null); }}>
              Clear All Filters
            </Button>
          </div>
        )}

        {pagination?.hasMore && (
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
              Load Older Activities
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
