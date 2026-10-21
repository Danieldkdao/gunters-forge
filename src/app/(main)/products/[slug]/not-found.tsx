import Link from "next/link";
import { NotFound } from "@/components/not-found";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return <NotFound title="Product not found" description="This product is unavailable. Explore the rest of Gunter's collection.">
    <Button render={<Link href="/products" />} nativeButton={false}>Browse products</Button>
  </NotFound>;
}
