'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

interface RulesTableProps {
    value: string;
    onChange: (value: string) => void;
}

interface Row {
    key: string;
    value: string;
}

export function RulesTable({ value, onChange }: RulesTableProps) {
    const [rows, setRows] = useState<Row[]>([{ key: '', value: '' }]);
    const lastValueRef = React.useRef<string>('');

    useEffect(() => {
        if (value === lastValueRef.current) return;

        if (!value) {
            setRows([{ key: '', value: '' }]);
            lastValueRef.current = '';
            return;
        }

        try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'object' && parsed !== null) {
                const newRows = Object.entries(parsed).map(([k, v]) => ({
                    key: k,
                    value: typeof v === 'string' ? v : JSON.stringify(v)
                }));
                if (newRows.length > 0) {
                    setRows(newRows);
                    lastValueRef.current = value;
                }
            }
        } catch (e) {
            // Keep current rows if parsing fails (likely mid-edit)
        }
    }, [value]);

    const updateRows = (newRows: Row[]) => {
        setRows(newRows);
        const obj: Record<string, any> = {};
        newRows.forEach(row => {
            if (row.key.trim()) {
                let val: any = row.value.trim();
                try {
                    // Try to parse as JSON if it looks like an array or object
                    if (val.startsWith('[') || val.startsWith('{')) {
                        val = JSON.parse(val);
                    } else if (val !== '' && !isNaN(Number(val))) {
                        val = Number(val);
                    }
                } catch (e) {
                    // Stay as string
                }
                obj[row.key] = val;
            }
        });

        const stringified = JSON.stringify(obj);
        if (stringified !== lastValueRef.current) {
            lastValueRef.current = stringified;
            onChange(stringified);
        }
    };

    const addRow = () => {
        const newRows = [...rows, { key: '', value: '' }];
        setRows(newRows);
        // Don't call onChange yet, wait for user to type
    };

    const removeRow = (index: number) => {
        const newRows = rows.filter((_, i) => i !== index);
        if (newRows.length === 0) {
            updateRows([{ key: '', value: '' }]);
        } else {
            updateRows(newRows);
        }
    };

    const handleRowChange = (index: number, field: keyof Row, newVal: string) => {
        const newRows = [...rows];
        newRows[index][field] = newVal;
        updateRows(newRows);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Rules</h3>
                <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={addRow}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add New
                </Button>
            </div>
            <div className="border rounded-lg overflow-hidden border-gray-100 bg-white">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="w-[40%] font-semibold text-gray-900">Rule Key</TableHead>
                            <TableHead className="font-semibold text-gray-900">Rule Value</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, index) => (
                            <TableRow key={index} className="hover:bg-transparent">
                                <TableCell className="p-2 px-3">
                                    <Input
                                        placeholder="e.g. max_stay"
                                        value={row.key}
                                        onChange={(e) => handleRowChange(index, 'key', e.target.value)}
                                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/10 transition-all"
                                    />
                                </TableCell>
                                <TableCell className="p-2 px-3">
                                    <Input
                                        placeholder='e.g. 14 or ["fire_pits"]'
                                        value={row.value}
                                        onChange={(e) => handleRowChange(index, 'value', e.target.value)}
                                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/10 transition-all"
                                    />
                                </TableCell>
                                <TableCell className="p-2 px-3 text-right">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeRow(index)}
                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
