'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Content } from '@/components/layouts/crm/components/content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getImportFields, importPropertiesFile, getImportJobs, getImportJobStatus } from '@/lib/actions';
import { toast } from 'sonner';
import {
    UploadCloud,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle,
    HelpCircle,
    Download,
    Info,
    RefreshCw,
    X,
    FileCheck,
    AlertTriangle,
    Clock,
    Loader2
} from 'lucide-react';

interface ImportFields {
    required_fields: string[];
    optional_fields: string[];
}

interface ImportJob {
    jobId: string;
    status: 'waiting' | 'active' | 'completed' | 'failed';
    progress?: number;
    fileName: string;
    processedRecords?: number;
    totalRecords?: number;
    inserted?: number;
    skipped?: number;
    failed?: number;
    error?: string;
    createdAt?: string;
}

export default function ImportPage() {
    const [fields, setFields] = useState<ImportFields | null>(null);
    const [message, setMessage] = useState<string>('');
    const [loadingFields, setLoadingFields] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [jobs, setJobs] = useState<ImportJob[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchJobs = async () => {
        try {
            const res = await getImportJobs();
            if (res.success && res.data) {
                const jobsList = Array.isArray(res.data) ? res.data : res.data.jobs || [];
                setJobs(jobsList);
            }
        } catch (error) {
            console.error('Error fetching import jobs:', error);
        } finally {
            setLoadingJobs(false);
        }
    };

    // Fetch required/optional fields and jobs on mount
    useEffect(() => {
        const fetchFields = async () => {
            setLoadingFields(true);
            const res = await getImportFields();
            if (res.success && res.data) {
                setFields(res.data);
                setMessage((res as any).message || 'These are the exact column names expected in the CSV/XLSX import file.');
            } else {
                // Fail-safe defaults if API fails
                setFields({
                    required_fields: ['address', 'address2', 'city_name', 'state_name', 'property_type'],
                    optional_fields: [
                        'latitude', 'longitude', 'zip', 'property_owner_id', 'parcel_id',
                        'yearbuilt', 'square_foot', 'front_image', 'other_image', 'street_view_link'
                    ]
                });
                setMessage('These are the exact column names expected in the CSV/XLSX import file.');
                toast.error('Failed to load fields from API. Using local template definitions.');
            }
            setLoadingFields(false);
        };
        fetchFields();
        fetchJobs();
    }, []);

    useEffect(() => {
        const hasActiveJobs = jobs.some(
            job => job.status === 'active' || job.status === 'waiting'
        );

        if (!hasActiveJobs) return;

        let intervalId: any;

        const startPolling = () => {
            intervalId = setInterval(() => {
                if (document.hidden) return;
                fetchJobs();
            }, 3000);
        };

        startPolling();

        const handleVisibilityChange = () => {
            if (document.hidden) {
                clearInterval(intervalId);
            } else {
                clearInterval(intervalId);
                fetchJobs();
                startPolling();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [jobs]);

    const handleFileChange = (file: File | null) => {
        if (!file) {
            setSelectedFile(null);
            return;
        }

        const fileName = file.name.toLowerCase();
        const extension = fileName.substring(fileName.lastIndexOf('.'));

        if (extension !== '.csv' && extension !== '.xlsx') {
            setSelectedFile(null);
            toast.error("Invalid file format. Please select a .csv or .xlsx file.");
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        setSelectedFile(file);
        setSuccessMessage(null);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error("Please select a file first.");
            return;
        }

        setUploading(true);
        setSuccessMessage(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        const fileInfo = `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`;
        const isLargeFile = selectedFile.size > 2 * 1024 * 1024;

        toast.info(
            isLargeFile
                ? `Uploading large file: ${fileInfo}. Processing may take 1-3 minutes. Please keep this tab open.`
                : `Uploading and processing file...`
        );

        try {
            const res = await importPropertiesFile(formData);
            if (res.success) {
                const data = res.data?.data || res.data;
                const apiMessage = data?.message || (res as any).message || 'Property import job queued successfully.';
                setSuccessMessage(apiMessage);
                toast.success(apiMessage, { duration: 6000 });
                fetchJobs();
            } else {
                toast.error(res.message || 'Failed to import properties file.');
            }
        } catch (error: any) {
            console.error('Import error:', error);
            toast.error(error.message || 'Something went wrong during file upload.');
        } finally {
            setUploading(false);
            handleRemoveFile();
        }
    };

    const downloadTemplate = () => {
        if (!fields) return;

        const headers = [...fields.required_fields, ...fields.optional_fields];

        const sampleRow = headers.map(header => {
            switch (header) {
                case 'address': return '123 Main Street';
                case 'address2': return 'Suite 100';
                case 'city_name': return 'Minneapolis';
                case 'state_name': return 'Minnesota';
                case 'property_type': return 'Residential';
                case 'latitude': return '44.9778';
                case 'longitude': return '-93.2650';
                case 'zip': return '55401';
                case 'property_owner_id': return 'owner_uuid_123';
                case 'parcel_id': return 'PARCEL987654';
                case 'yearbuilt': return '2015';
                case 'square_foot': return '2400';
                case 'front_image': return 'front_image.jpg';
                case 'other_image': return 'other_image.jpg';
                case 'street_view_link': return 'http://google.com/maps';
                default: return '';
            }
        });

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(','), sampleRow.join(',')].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "property_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Import Template downloaded successfully.");
    };

    return (
        <Content className="p-6 max-w-6xl mx-auto space-y-8">
            {/* SEO Heading & Title */}
            <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground" id="page-title">
                    Bulk Import Properties
                </h1>
                <p className="text-muted-foreground text-sm max-w-2xl">
                    Import property data in bulk from spreadsheet formats (CSV and XLSX). Ensure your column headers match the specifications below to guarantee a seamless database integration.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1 & 2: Upload Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border border-border shadow-md overflow-hidden bg-card/60 backdrop-blur-md">
                        <CardHeader className="bg-muted/30 border-b border-border/80 px-6 py-4">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <FileSpreadsheet className="size-5 text-primary" />
                                <span>Spreadsheet Upload</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Upload a spreadsheet. We support both CSV and Excel workbook (XLSX) formats.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-6">
                            <form onSubmit={handleImportSubmit} className="space-y-6">
                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${dragActive
                                        ? 'border-primary bg-primary/5 scale-[1.01]'
                                        : selectedFile
                                            ? 'border-emerald-500 bg-emerald-50/5'
                                            : 'border-border hover:border-primary/50 hover:bg-muted/10'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragOver={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={handleUploadClick}
                                    id="dropzone"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                        disabled={uploading}
                                        id="import-file-input"
                                    />

                                    {selectedFile ? (
                                        <div className="flex flex-col items-center text-center space-y-3">
                                            <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                                                <FileCheck className="size-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-semibold text-sm max-w-[280px] sm:max-w-md truncate text-foreground">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.name.endsWith('.csv') ? 'CSV File' : 'Excel Workbook'}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg px-3"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveFile();
                                                }}
                                                disabled={uploading}
                                            >
                                                <X className="size-4 mr-1.5" /> Remove file
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <div className="size-14 rounded-full bg-primary/5 flex items-center justify-center text-primary/80 group-hover:scale-110 transition-transform">
                                                <UploadCloud className="size-7" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium text-sm text-foreground">
                                                    Drag and drop your spreadsheet here
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    or click to browse from your device
                                                </p>
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60 bg-muted px-2 py-0.5 rounded">
                                                CSV or XLSX only
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {selectedFile && selectedFile.size > 2 * 1024 * 1024 && (
                                    <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs shadow-sm">
                                        <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="font-semibold">Large File Detected</p>
                                            <p className="leading-relaxed">
                                                This file exceeds 2MB. The upload and server processing might take between 1 to 3 minutes depending on your internet speed. Please do not refresh, close this page, or navigate away while the import is processing.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {uploading ? (
                                    <div className="space-y-3.5 bg-muted/30 p-4 rounded-xl border border-border/80">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold flex items-center gap-1.5 text-primary">
                                                <RefreshCw className="size-3.5 animate-spin" />
                                                Processing and validating spreadsheet...
                                            </span>
                                            <span className="text-muted-foreground font-medium">Please wait</span>
                                        </div>
                                        <div className="w-full bg-border/60 h-2 rounded-full overflow-hidden">
                                            <div className="bg-primary h-full rounded-full animate-pulse-progress" style={{ width: '85%' }}></div>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
                                            The server is importing rows, checking database duplicates, and saving property entities. Large files require parsing thousands of cells and setting up geocoding/caching structures.
                                        </p>
                                    </div>
                                ) : (
                                    <Button
                                        type="submit"
                                        className="w-full h-11 font-semibold text-sm shadow-md transition-all duration-200 rounded-lg hover:shadow-lg disabled:opacity-50"
                                        disabled={!selectedFile || uploading}
                                    >
                                        <UploadCloud className="size-4 mr-2" /> Start Property Import
                                    </Button>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    {successMessage && (
                        <Card className="border border-emerald-100 dark:border-emerald-950/30 shadow-lg overflow-hidden bg-card animate-in fade-in-50 duration-300">
                            <CardHeader className="bg-emerald-50/10 dark:bg-emerald-950/5 border-b border-border px-6 py-4">
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                                    <CheckCircle className="size-5 shrink-0" />
                                    <span>Import Job Initiated</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    The background processing job has started successfully.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-sm">
                                    <Info className="size-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-semibold text-emerald-900 dark:text-emerald-100">Status Update</p>
                                        <p className="leading-relaxed">
                                            {successMessage}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Since this import now runs asynchronously in the background, you can safely browse other sections of the dashboard. Once the data is processed, the properties will appear in your properties list.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recent Import Jobs List */}
                    <Card className="border border-border shadow-md bg-card">
                        <CardHeader className="bg-muted/30 border-b border-border/80 px-6 py-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <FileSpreadsheet className="size-5 text-indigo-500" />
                                    <span>Recent Import Jobs</span>
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Track progress of bulk import processing runs.
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-8"
                                onClick={fetchJobs}
                                disabled={loadingJobs}
                            >
                                <RefreshCw className={`size-4 ${loadingJobs ? 'animate-spin' : ''}`} />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            {loadingJobs && jobs.length === 0 ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 2 }).map((_, i) => (
                                        <div key={i} className="border border-border rounded-xl p-4 space-y-3 animate-pulse">
                                            <div className="flex justify-between">
                                                <div className="h-4 bg-muted rounded w-1/4"></div>
                                                <div className="h-5 bg-muted rounded w-16"></div>
                                            </div>
                                            <div className="h-2 bg-muted rounded w-full"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : jobs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                                    <Clock className="size-8 text-muted-foreground/50" />
                                    <p>No recent import jobs found.</p>
                                    <p className="text-xs">Upload a spreadsheet above to initiate a bulk import.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {jobs.map((job) => {
                                        const isWaiting = job.status === 'waiting';
                                        const isActive = job.status === 'active';
                                        const isCompleted = job.status === 'completed';
                                        const isFailed = job.status === 'failed';

                                        return (
                                            <div
                                                key={job.jobId}
                                                className={`border rounded-xl p-4 space-y-3 transition-all duration-200 ${isActive
                                                    ? 'border-indigo-200 bg-indigo-50/5 dark:border-indigo-950/20'
                                                    : isFailed
                                                        ? 'border-rose-100 bg-rose-50/5 dark:border-rose-950/10'
                                                        : isCompleted
                                                            ? 'border-emerald-100 bg-emerald-50/5 dark:border-emerald-950/10'
                                                            : 'border-border bg-card'
                                                    }`}
                                            >
                                                {/* Job Meta Header */}
                                                <div className="flex justify-between items-center">
                                                    <div className="space-y-0.5">
                                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                                            {job.fileName}
                                                        </h4>
                                                        {job.createdAt && (
                                                            <p className="text-[10px] text-muted-foreground">
                                                                {new Date(job.createdAt).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div>
                                                        {isWaiting && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
                                                                <Clock className="size-3 shrink-0" />
                                                                Waiting
                                                            </span>
                                                        )}
                                                        {isActive && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300">
                                                                <Loader2 className="size-3 shrink-0 animate-spin" />
                                                                Processing
                                                            </span>
                                                        )}
                                                        {isCompleted && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
                                                                <CheckCircle className="size-3 shrink-0" />
                                                                Completed
                                                            </span>
                                                        )}
                                                        {isFailed && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300">
                                                                <AlertCircle className="size-3 shrink-0" />
                                                                Failed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Active Job Progress Bar */}
                                                {isActive && (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-muted-foreground font-medium">
                                                                Progress: {job.progress ?? 0}%
                                                            </span>
                                                            {job.processedRecords !== undefined && job.totalRecords !== undefined && (
                                                                <span className="font-bold text-foreground">
                                                                    {job.processedRecords.toLocaleString()} / {job.totalRecords.toLocaleString()} rows
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
                                                            <div
                                                                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                                                style={{ width: `${job.progress ?? 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Completed Job Stats Summary */}
                                                {isCompleted && (
                                                    <div className="grid grid-cols-4 gap-2 text-center pt-1">
                                                        <div className="bg-muted/40 rounded-lg p-2">
                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total</p>
                                                            <p className="text-sm font-extrabold text-foreground mt-0.5">{(job.totalRecords ?? job.processedRecords ?? 0).toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2">
                                                            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Inserted</p>
                                                            <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">{(job.inserted ?? 0).toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-2">
                                                            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Skipped</p>
                                                            <p className="text-sm font-extrabold text-blue-700 dark:text-blue-400 mt-0.5">{(job.skipped ?? 0).toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-2">
                                                            <p className="text-[9px] font-bold text-rose-600 uppercase tracking-wider">Failed</p>
                                                            <p className="text-sm font-extrabold text-rose-700 dark:text-rose-400 mt-0.5">{(job.failed ?? 0).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Failed Job Stats & Error Msg */}
                                                {isFailed && (
                                                    <div className="space-y-2 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 text-xs text-rose-800 dark:text-rose-300">
                                                        <p className="font-semibold">Error Message:</p>
                                                        <p className="leading-relaxed font-mono text-[11px]">{job.error || 'Unknown error occurred during processing.'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Column 3: Expected Schema */}
                <div className="space-y-6">
                    <Card className="border border-border shadow-md bg-card">
                        <CardHeader className="border-b border-border/80 px-6 py-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                                <Info className="size-5 text-indigo-500" />
                                <span>Template Schema</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Header columns must match these names exactly.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-6 space-y-6">
                            {loadingFields ? (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className="h-6 bg-muted animate-pulse rounded-md w-16"></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <div key={i} className="h-6 bg-muted animate-pulse rounded-md w-16"></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : fields ? (
                                <div className="space-y-6">
                                    {/* Required Columns */}
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-xs uppercase tracking-wider text-rose-500 flex items-center gap-1">
                                            Required Columns *
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {fields.required_fields.map((col) => (
                                                <span
                                                    key={col}
                                                    className="inline-flex items-center text-xs font-semibold px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-md font-mono"
                                                >
                                                    {col}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Optional Columns */}
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-500">
                                            Optional Columns
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {fields.optional_fields.map((col) => (
                                                <span
                                                    key={col}
                                                    className="inline-flex items-center text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-md font-mono"
                                                >
                                                    {col}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* API Message Callout */}
                                    {message && (
                                        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-indigo-900 text-xs">
                                            <Info className="size-4 shrink-0 text-indigo-500 mt-0.5" />
                                            <p className="leading-relaxed font-medium">
                                                {message}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </CardContent>

                        <CardFooter className="bg-muted/30 border-t border-border/80 p-6 flex flex-col gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full flex items-center justify-center font-semibold text-xs py-5 rounded-lg border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/45"
                                onClick={downloadTemplate}
                                disabled={loadingFields || !fields}
                            >
                                <Download className="size-4 mr-2" /> Download Sample CSV
                            </Button>
                            <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
                                Use the sample CSV to structure your sheet correctly before uploading. Check spelling, spacing, and letter casing to prevent import validation errors.
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </Content>
    );
}
