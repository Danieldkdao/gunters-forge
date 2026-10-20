import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
  TableHead,
  TableBody,
} from "@/components/ui/table";

export const ProductsFiltersSkeleton = () => {
  return (
    <div aria-hidden="true" className="flex w-full min-w-0 items-center gap-2">
      <Skeleton className="h-9 min-w-0 flex-1 rounded-md" />
      <Skeleton className="size-9 shrink-0 rounded-md" />
    </div>
  );
};

export const ProductsListRowSkeleton = () => {
  return (
    <TableRow aria-hidden="true">
      <TableCell>
        <div className="flex items-start gap-3">
          <Skeleton className="size-12 shrink-0 rounded-md" />
          <div className="flex min-w-0 flex-col gap-2 py-1">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 shrink-0" />
          <Skeleton className="h-5 w-24" />
        </div>
      </TableCell>
      <TableCell className="min-w-22 text-right">
        <Skeleton className="ml-auto h-5 w-16" />
      </TableCell>
      <TableCell className="min-w-32 text-right">
        <Skeleton className="ml-auto h-5 w-20" />
      </TableCell>
      <TableCell className="min-w-22">
        <Skeleton className="h-7 w-18 rounded-full" />
      </TableCell>
      <TableCell className="min-w-22">
        <Skeleton className="h-7 w-22 rounded-full" />
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-26" />
          <Skeleton className="h-4 w-18" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-26" />
          <Skeleton className="h-4 w-18" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="size-9 rounded-md" />
      </TableCell>
    </TableRow>
  );
};

export const ProductsListSkeleton = ({ rows = 6 }: { rows?: number }) => {
  return (
    <div aria-busy="true" className="min-w-0">
      <span role="status" className="sr-only">
        Loading products…
      </span>
      <ProductsFiltersSkeleton />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Crafting Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, index) => (
            <ProductsListRowSkeleton key={index} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
