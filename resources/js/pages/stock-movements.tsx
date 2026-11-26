import { Head, router, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import type { SharedData } from '@/types';

type StockMovement = {
  id: number;
  product: { name: string | null } | null;
  movementType: { movement_status: string | null } | null;
  quantity_change: number;
  status: string;
  created_at: string;
  stockLogs: Array<{
    id: number;
    user_id: number | null;
    status: string;
    user?: { name: string | null } | null;
    created_at: string | null;
  }>;
};

type SelectValueType = string | number | null | undefined;

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};

const isAdmin = (user: any) =>
  user?.roles?.some((r: any) => r.name === 'Admin' || r.role_name === 'Admin');

const isStaffOrAdmin = (user: any) =>
  user?.roles?.some(
    (r: any) => r.role_name === 'Staff' || r.role_name === 'Admin' || r.name === 'Staff' || r.name === 'Admin',
  );

export default function StockMovementsPage() {
  const { auth, flash, movements, products = [], movementTypes = [] } = usePage<SharedData>().props;

  const user = auth?.user ?? null;
  const movementList: StockMovement[] = (movements ?? []) as StockMovement[];
  const productOptions = (products ?? []) as { value: number; label: string }[];
  const movementTypeOptions = (movementTypes ?? []) as { value: number; label: string }[];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ] as const;

  const statusCounts: Record<(typeof statusOptions)[number]['value'], number> = {
    all: movementList.length,
    pending: movementList.filter((m) => m.status === 'pending').length,
    approved: movementList.filter((m) => m.status === 'approved').length,
    rejected: movementList.filter((m) => m.status === 'rejected').length,
  };

  const filteredMovements = movementList.filter((m) => {
    const matchesSearch =
      !search ||
      m.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      String(m.movementType?.movement_status ?? '').toLowerCase().includes(search.toLowerCase()) ||
      m.status.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const form = useForm<{
    product_id: string | '';
    movement_id: string | '';
    quantity_change: string | '';
  }>({
    product_id: '',
    movement_id: '',
    quantity_change: '',
  });

  const canSubmit = user && isStaffOrAdmin(user);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(route('stock-movements.store'), {
      preserveScroll: true,
      onSuccess: () => {
        form.reset();
        setDialogOpen(false);
        router.reload();
      },
    });
  };

  const handleApprove = (id: number) => {
    if (!confirm('Approve this stock movement?')) return;
    router.post(route('stockmovement.approve', id), {
      preserveScroll: true,
      onSuccess: () => router.reload(),
      onError: () => {},
    });
  };

  const handleReject = (id: number) => {
    if (!confirm('Reject this stock movement?')) return;
    router.post(route('stockmovement.reject', id), {
      preserveScroll: true,
      onSuccess: () => router.reload(),
      onError: () => {},
    });
  };

  if (!isStaffOrAdmin(user)) {
    return (
      <AppLayout>
        <Head title="Access Denied" />
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to view stock movements.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head title="Stock Movements | LS Dolocab" />

      {(flash?.success || flash?.message) && (
        <div className="mb-4 p-3 rounded-md border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-sm">
          {flash.success ?? flash.message}
        </div>
      )}

      <div className="space-y-6 p-6">
        {/* OUTER HEADER — eyebrow + title */}
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            Stock Movements
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-sm text-muted-foreground">
            Track stock additions and approval workflow.
          </p>
        </div>

        {/* BORDERED INNER CARD */}
        <section className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                Stock Movements
              </p>
              <h2 className="mt-0.5 text-lg font-semibold">Stock Movements</h2>
              <p className="text-xs text-muted-foreground">
                Track stock additions and approval workflow.
              </p>
            </div>

            {/* right-aligned search + Add button */}
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search product, movement type, status..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-8 pl-9"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!canSubmit}>Add Stock Movement</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Stock Movement</DialogTitle>
                    <DialogDescription>
                      Record a new stock addition. Staff submissions require admin
                      approval before stock is incremented.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Product</Label>
                      <Select
                        value={String(form.data.product_id ?? '')}
                        onValueChange={(value: SelectValueType) => {
                          form.setData('product_id', String(value ?? ''));
                        }}
                        disabled={form.processing || !canSubmit}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {productOptions.map((product) => (
                            <SelectItem key={product.value} value={String(product.value)}>
                              {product.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Movement Type</Label>
                      <Select
                        value={String(form.data.movement_id ?? '')}
                        onValueChange={(value: SelectValueType) => {
                          form.setData('movement_id', String(value ?? ''));
                        }}
                        disabled={form.processing || !canSubmit}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a movement type" />
                        </SelectTrigger>
                        <SelectContent>
                          {movementTypeOptions
                            .filter((movementType) =>
                              isAdmin(user) ||
                              String(movementType.label).toLowerCase() === 'stock in',
                            )
                            .map((movementType) => (
                              <SelectItem
                                key={movementType.value}
                                value={String(movementType.value)}
                              >
                                {movementType.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity Change</Label>
                      <Input
                        type="number"
                        value={String(form.data.quantity_change ?? '')}
                        onChange={(e) => {
                          form.setData(
                            'quantity_change',
                            e.target.value === '' ? '' : e.target.value,
                          );
                        }}
                        disabled={form.processing || !canSubmit}
                        placeholder="0"
                      />
                    </div>
                    {Object.keys(form.errors).length > 0 && (
                      <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
                        {Object.entries(form.errors).map(([field, messages], idx) => (
                          <p key={idx}>
                            {field}: {Array.isArray(messages) ? messages.join(', ') : messages}
                          </p>
                        ))}
                      </div>
                    )}
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          form.processing ||
                          !canSubmit ||
                          !form.data.product_id ||
                          !form.data.movement_id ||
                          !form.data.quantity_change
                        }
                      >
                        {form.processing ? 'Submitting...' : 'Submit'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* segmented filter pills with counts */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {statusOptions.map((tab) => (
              <Button
                key={tab.value}
                type="button"
                size="sm"
                variant={statusFilter === tab.value ? 'default' : 'outline'}
                onClick={() => setStatusFilter(tab.value)}
                className="capitalize"
              >
                {tab.label} ({statusCounts[tab.value]})
              </Button>
            ))}
          </div>

          {/* full-width table */}
          <div className="w-full overflow-hidden rounded-md border">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Movement Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-sm">Created</TableHead>
                  <TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No stock movements found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {m.product?.name ?? 'N/A'}
                      </TableCell>
                      <TableCell>
                        {m.movementType?.movement_status
                          ? String(m.movementType.movement_status).replace(
                              /\b\w/g,
                              (c) => c.toUpperCase(),
                            )
                          : Number(m.quantity_change) < 0
                            ? 'Stock Out'
                            : 'Stock In'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {m.quantity_change}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const stockLog = m.stockLogs?.[0] ?? null;
                          const status = (stockLog?.status ?? 'pending').toLowerCase();
                          return (
                            <Badge
                              className={
                                statusColors[status] ?? 'bg-muted text-muted-foreground'
                              }
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const stockLog = m.stockLogs?.[0] ?? null;
                          const status = (stockLog?.status ?? 'pending').toLowerCase();
                          if (status === 'pending' && isAdmin(user)) {
                            return (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(m.id)}
                                  disabled={form.processing}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(m.id)}
                                  disabled={form.processing}
                                >
                                  Reject
                                </Button>
                              </div>
                            );
                          }
                          return (
                            <span className="text-xs text-muted-foreground">
                              {status === 'approved'
                                ? 'Approved'
                                : status === 'rejected'
                                  ? 'Rejected'
                                  : '—'}
                            </span>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
