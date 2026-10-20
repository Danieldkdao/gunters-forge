"use client";

import { productCategories, ProductSelectData } from "@/db/schema";
import { Controller, useForm } from "react-hook-form";
import { createProductSchema, CreateProductSchema } from "../actions/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn, generateSlug } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatProductCategory } from "../lib/formatters";
import { Textarea } from "@/components/ui/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ClockIcon, DollarSignIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/loading-swap";
import { createProductAction, updateProductAction } from "../actions/actions";
import { toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export const ProductForm = ({
  existingProduct,
  afterAction,
}: {
  existingProduct?: ProductSelectData;
  afterAction?: () => void;
}) => {
  const router = useRouter();
  const form = useForm<CreateProductSchema>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      category: "armor",
      price: undefined,
      craftingTimeMinutes: undefined,
      featured: false,
      imageUrl: "",
      isActive: true,
    },
  });

  const handleSubmit = async (data: CreateProductSchema) => {
    const action = existingProduct
      ? updateProductAction(existingProduct.id, data)
      : createProductAction(data);
    const response = await action;
    if (response.error) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
      // Refresh to update UI after successful action
      router.refresh();
      afterAction?.();
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="flex flex-col gap-4"
    >
      <Controller
        control={form.control}
        name="name"
        render={({ field: { onChange, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor="product-form-name">Name</FieldLabel>
            <FieldContent>
              <Input
                id="product-form-name"
                placeholder="Enter product name"
                aria-invalid={!!fieldState.error}
                onChange={(e) => {
                  onChange(e);
                  // Derives the slug from the name
                  form.setValue("slug", generateSlug(e.target.value));
                }}
                {...props}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="slug"
        render={({ field }) => (
          <Field>
            <FieldLabel>Slug</FieldLabel>
            <FieldContent>
              <Input
                placeholder="Slug will appear here"
                value={field.value}
                disabled
              />
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="category"
        render={({ field: { value, onChange }, fieldState }) => {
          const { label, icon: Icon } = formatProductCategory(value);

          return (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor="product-form-category">Category</FieldLabel>
              <FieldContent>
                <Select value={value} onValueChange={onChange}>
                  <SelectTrigger
                    aria-invalid={!!fieldState.error}
                    className="w-full"
                  >
                    <SelectValue placeholder="Select a category">
                      <Icon />
                      <span>{label}</span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((category) => {
                      const { label, icon: Icon } =
                        formatProductCategory(category);

                      return (
                        <SelectItem key={category} value={category}>
                          <Icon />
                          <span>{label}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FieldContent>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          );
        }}
      />
      <Controller
        control={form.control}
        name="imageUrl"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor="product-form-imageUrl">Image URL</FieldLabel>
            <FieldContent>
              <Input
                id="product-form-imageUrl"
                placeholder="Enter an image URL"
                aria-invalid={!!fieldState.error}
                {...field}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor="product-form-description">
              Description
            </FieldLabel>
            <FieldContent>
              <Textarea
                id="product-form-description"
                placeholder="Enter product description"
                aria-invalid={!!fieldState.error}
                {...field}
              />
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="price"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor="product-form-price">Price</FieldLabel>
            <FieldContent>
              <InputGroup aria-invalid={!!fieldState.error} className="w-full">
                <InputGroupInput
                  id="product-form-price"
                  placeholder="Enter a price"
                  aria-invalid={!!fieldState.error}
                  value={value ?? ""}
                  type="number"
                  min="1"
                  // Keep NaN value as undefined so we can show validation error
                  onChange={(e) =>
                    onChange(
                      Number.isNaN(e.target.valueAsNumber)
                        ? undefined
                        : e.target.valueAsNumber,
                    )
                  }
                  {...props}
                />
                <InputGroupAddon>
                  <DollarSignIcon />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <span>USD</span>
                </InputGroupAddon>
              </InputGroup>
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="craftingTimeMinutes"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor="product-form-craftingTimeMinutes">
              Estimated Crafting Time
            </FieldLabel>
            <FieldContent>
              <InputGroup aria-invalid={!!fieldState.error}>
                <InputGroupInput
                  id="product-form-craftingTimeMinutes"
                  placeholder="Enter estimated crafting time"
                  aria-invalid={!!fieldState.error}
                  type="number"
                  step="1"
                  min="1"
                  value={value ?? ""}
                  onChange={(e) =>
                    onChange(
                      Number.isNaN(e.target.valueAsNumber)
                        ? undefined
                        : e.target.valueAsNumber,
                    )
                  }
                  {...props}
                />
                <InputGroupAddon>
                  <ClockIcon />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <span>minutes</span>
                </InputGroupAddon>
              </InputGroup>
            </FieldContent>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="featured"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <label
              id="product-form-featured"
              className={cn(
                "flex flex-col gap-2 w-full cursor-pointer",
                !value && "opacity-75",
              )}
            >
              <div className="flex items-center gap-2 justify-between w-full">
                <FieldLabel className="inline text-base">Featured</FieldLabel>
                <Switch
                  id="product-form-featured"
                  checked={value}
                  onCheckedChange={onChange}
                  {...props}
                />
              </div>
              <p className="text-muted-foreground text-base">
                Featured products appear on the landing page and have list
                priority over other products.
              </p>
            </label>
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="isActive"
        render={({ field: { value, onChange, ...props }, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <label
              id="product-form-featured"
              className={cn(
                "flex flex-col gap-2 w-full cursor-pointer",
                !value && "opacity-75",
              )}
            >
              <div className="flex items-center gap-2 justify-between w-full">
                <FieldLabel className="inline text-base">Active</FieldLabel>
                <Switch
                  id="product-form-featured"
                  checked={value}
                  onCheckedChange={onChange}
                  {...props}
                />
              </div>
              <p className="text-muted-foreground text-base">
                Disabled products do not appear on the site and customers will
                not be able to order them.
              </p>
            </label>
          </Field>
        )}
      />
      <Button type="submit" disabled={form.formState.isSubmitting}>
        <LoadingSwap isLoading={form.formState.isSubmitting}>
          {existingProduct ? "Save Changes" : "Create"}
        </LoadingSwap>
      </Button>
    </form>
  );
};
