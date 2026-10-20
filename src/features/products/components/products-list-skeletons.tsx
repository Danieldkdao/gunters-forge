import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

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

export const ProductsGridSkeleton = ({ rows = 6 }: { rows?: number }) => {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: rows }, (_, index) => (
        <Card key={index} className="h-full gap-4 pt-0">
          <Skeleton className="aspect-4/3 w-full rounded-none" />
          <CardHeader className="gap-3">
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-7 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="h-4 w-40 max-w-full" />
            </div>
          </CardContent>
          <CardFooter className="mt-auto justify-between gap-3 border-t">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-5 w-28" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export const ProductsListSkeleton = ({
  rows = 6,
  view = "grid",
}: {
  rows?: number;
  view?: "grid" | "list";
}) => {
  return (
    <div aria-busy="true" className="flex w-full min-w-0 flex-col gap-4">
      <span role="status" className="sr-only">
        Loading products…
      </span>
      <ProductsFiltersSkeleton />
      {view === "grid" ? (
        <ProductsGridSkeleton rows={rows} />
      ) : (
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
      )}
    </div>
  );
};
