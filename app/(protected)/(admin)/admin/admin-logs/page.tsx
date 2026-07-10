'use client';

import { useState } from 'react';
import { Content } from '@/components/layouts/crm/components/content';
import AuditLogsList from '@/components/audit-logs/audit-logs-list';
import AuditReportsList from '@/components/audit-logs/audit-reports-list';
import { Shield, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLogsPage() {
    const [activeTab, setActiveTab] = useState<'auth' | 'reports'>('auth');

    return (
        <Content className="block py-6">
            <div className="max-w-5xl mx-auto mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">System Audit Logs</h1>
                <p className="text-sm text-slate-500 mb-6 font-medium">Monitor user actions, security events, and generated report audit trails.</p>

                {/* Custom premium tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
                    <button
                        onClick={() => setActiveTab('auth')}
                        className={`relative pb-3 text-sm cursor-pointer font-semibold transition-colors flex items-center gap-2 outline-none ${activeTab === 'auth'
                                ? 'text-primary'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        <Shield className="size-4" />
                        Auth Logs
                        {activeTab === 'auth' && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`relative pb-3 text-sm font-semibold cursor-pointer transition-colors flex items-center gap-2 outline-none ${activeTab === 'reports'
                                ? 'text-primary'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        <FileText className="size-4" />
                        Reports Log
                        {activeTab === 'reports' && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                        )}
                    </button>
                </div>
            </div>

            <div className="mt-6">
                {activeTab === 'auth' ? <AuditLogsList /> : <AuditReportsList />}
            </div>
        </Content>
    );
}