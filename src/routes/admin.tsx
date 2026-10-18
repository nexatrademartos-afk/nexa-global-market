
import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  ImagePlus,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
type Category = Tables<"categories">;

const MERCHANDISING_OPTIONS = [
  {
    value: "hot",
    label: "Hot",
    description: "Show in the Hot section.",
  },
  {
    value: "promotion",
    label: "Promotion",
    description: "Show in Promotions; set a comparison price for a sale.",
  },
  {
    value: "luxury",
    label: "Luxury / Premium",
    description: "Show in the Luxury section.",
  },
  {
    value: "affordable",
    label: "Affordable",
    description: "Show in the Affordable section.",
  },
] as const;

type MerchandisingTag = (typeof MERCHANDISING_OPTIONS)[number]["value"];
type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
  sort_order: string;
};

const emptyCategoryForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  is_active: true,
  sort_order: "10",
};

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  price: string;
  compare_at_price: string;
  stock: string;
  sku: string;
  gallery_urls: string[];
  image_url: string;
  category_id: string;
  is_active: boolean;
  is_featured: boolean;
  merchandising_tags: MerchandisingTag[];
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  compare_at_price: "",
  stock: "0",
  sku: "",
  gallery_urls: [],
  image_url: "",
  category_id: "",
  is_active: false,
  is_featured: false,
  merchandising_tags: [],
};

export const Route = createFileRoute("/admin")({
  component: AdminProductsPage,
});

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function safeTags(value: unknown): MerchandisingTag[] {
  if (!Array.isArray(value)) return [];

  const allowed = MERCHANDISING_OPTIONS.map((option) => option.value);
  return value.filter(
    (tag): tag is MerchandisingTag =>
      typeof tag === "string" && allowed.includes(tag as MerchandisingTag),
  );
}

const MAX_PRODUCT_IMAGES = 5;
const MAX_ORIGINAL_IMAGE_BYTES = 20 * 1024 * 1024;
const TARGET_IMAGE_BYTES = 90 * 1024;
const MAX_IMAGE_DIMENSION = 1400;

async function compressProductImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
    throw new Error("Each original image must be 20 MB or smaller.");
  }

  const bitmap = await createImageBitmap(file);

  try {
    let width = bitmap.width;
    let height = bitmap.height;
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(width, height),
    );

    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    for (let resizeAttempt = 0; resizeAttempt < 6; resizeAttempt++) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Your browser could not process this image.");
      }

      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of [0.88, 0.80, 0.72, 0.64, 0.56, 0.48]) {
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) => {
              if (result) resolve(result);
              else reject(new Error("Image compression failed."));
            },
            "image/webp",
            quality,
          );
        });

        if (blob.size <= TARGET_IMAGE_BYTES) return blob;
      }

      width = Math.max(1, Math.round(width * 0.8));
      height = Math.max(1, Math.round(height * 0.8));
    }

    throw new Error(
      "This image could not be reduced enough. Please choose a simpler or smaller image.",
    );
  } finally {
    bitmap.close();
  }
}

function getProductImageUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  return supabase.storage
    .from("store-media")
    .getPublicUrl(path.replace(/^\/+/, "").replace(/^store-media\//, ""))
    .data.publicUrl;
            }

function AdminProductsPage() {
  const [uploadingImages, setUploadingImages] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryForm, setCategoryForm] =
  useState<CategoryForm>(emptyCategoryForm);
const [editingCategoryId, setEditingCategoryId] =
  useState<string | null>(null);
const [savingCategory, setSavingCategory] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
const [showCategoryPanel, setShowCategoryPanel] = useState(false);
const [activeProductFilter, setActiveProductFilter] = useState("all");

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    setErrorMessage("");

    const [productResult, categoryResult] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);

    if (productResult.error) {
      setErrorMessage(`Could not load products: ${productResult.error.message}`);
    } else {
      setProducts(productResult.data ?? []);
    }

    if (categoryResult.error) {
      setErrorMessage((current) =>
        current
          ? `${current} Categories: ${categoryResult.error.message}`
          : `Could not load categories: ${categoryResult.error.message}`,
      );
    } else {
      setCategories(categoryResult.data ?? []);
    }

    setLoadingProducts(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function checkAdminAccess() {
      const { data: userResult, error: userError } =
        await supabase.auth.getUser();

      if (!active) return;

      if (userError || !userResult.user) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      const { data: role, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userResult.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!active) return;

      setIsAdmin(!roleError && Boolean(role));
      setChecking(false);
    }

    void checkAdminAccess();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isAdmin) void loadProducts();
  }, [isAdmin, loadProducts]);

  function updateForm<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateCategoryForm<K extends keyof CategoryForm>(
  key: K,
  value: CategoryForm[K],
) {
  setCategoryForm((current) => ({ ...current, [key]: value }));
}

function resetCategoryForm() {
  setEditingCategoryId(null);
  setCategoryForm(emptyCategoryForm);
  setMessage("");
  setErrorMessage("");
}

function startEditingCategory(category: Category) {
  setShowCategoryPanel(true);
  setEditingCategoryId(category.id);
  setCategoryForm({
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    image_url: category.image_url ?? "",
    is_active: category.is_active,
    sort_order: String(category.sort_order),
  });
  setMessage("");
  setErrorMessage("");
}

  async function uploadProductImages(files: FileList | null) {
  if (!files?.length) return;

  const selected = Array.from(files);
  const remaining = MAX_PRODUCT_IMAGES - form.gallery_urls.length;

  if (selected.length > remaining) {
    setErrorMessage(
      `You can add only ${remaining} more image(s). The limit is five per product.`,
    );
    return;
  }

  setUploadingImages(true);
  setErrorMessage("");
  setMessage("");

  try {
    for (const file of selected) {
      const compressed = await compressProductImage(file);
      const path = `products/${crypto.randomUUID()}.webp`;

      const { error } = await supabase.storage
        .from("store-media")
        .upload(path, compressed, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: false,
        });

      if (error) throw error;

      setForm((current) => ({
        ...current,
        gallery_urls: [...current.gallery_urls, path],
        image_url: current.image_url || path,
      }));
    }

    setMessage("Image upload complete. Save the product to keep the changes.");
  } catch (error) {
    setErrorMessage(
      error instanceof Error ? error.message : "Could not upload the image.",
    );
  } finally {
    setUploadingImages(false);
  }
}

function removeProductImage(path: string) {
  setForm((current) => {
    const gallery_urls = current.gallery_urls.filter((item) => item !== path);

    return {
      ...current,
      gallery_urls,
      image_url:
        current.image_url === path
          ? gallery_urls[0] ?? ""
          : current.image_url,
    };
  });
  }

async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setSavingCategory(true);
  setMessage("");
  setErrorMessage("");

  const name = categoryForm.name.trim();
  const slug = makeSlug(categoryForm.slug || name);
  const sortOrder = Number(categoryForm.sort_order);

  if (!name || !slug) {
    setErrorMessage("Enter a category name and valid URL slug.");
    setSavingCategory(false);
    return;
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    setErrorMessage(
      "Category display order must be a whole number of zero or more.",
    );
    setSavingCategory(false);
    return;
  }

  const values = {
    name,
    slug,
    description: categoryForm.description.trim() || null,
    image_url: categoryForm.image_url.trim() || null,
    is_active: categoryForm.is_active,
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  };

  const result = editingCategoryId
    ? await supabase
        .from("categories")
        .update(values)
        .eq("id", editingCategoryId)
    : await supabase.from("categories").insert(values);

  if (result.error) {
    setErrorMessage(
      result.error.code === "23505"
        ? "That category URL slug already exists. Choose another."
        : "Could not save category: " + result.error.message,
    );
    setSavingCategory(false);
    return;
  }

  setMessage(
    editingCategoryId
      ? "Category updated successfully."
      : "Category created successfully.",
  );

  setEditingCategoryId(null);
  setCategoryForm(emptyCategoryForm);
  await loadProducts();
  setSavingCategory(false);
}

async function toggleCategory(category: Category) {
  setMessage("");
  setErrorMessage("");

  const nextValue = !category.is_active;

  const { error } = await supabase
    .from("categories")
    .update({
      is_active: nextValue,
      updated_at: new Date().toISOString(),
    })
    .eq("id", category.id);

  if (error) {
    setErrorMessage("Could not update category: " + error.message);
    return;
  }

  setCategories((current) =>
    current.map((item) =>
      item.id === category.id
        ? { ...item, is_active: nextValue }
        : item,
    ),
  );

  setMessage(nextValue ? "Category activated." : "Category deactivated.");
}

async function deleteCategory(category: Category) {
  const assignedProducts = products.filter(
    (product) => product.category_id === category.id,
  ).length;

  if (assignedProducts > 0) {
    setErrorMessage(
      'Cannot delete "' +
        category.name +
        '" because ' +
        assignedProducts +
        " product(s) are assigned to it. Reassign those products first.",
    );
    setMessage("");
    return;
  }

  const confirmed = window.confirm(
    'Delete the category "' +
      category.name +
      '"? This is only allowed when no products are assigned to it.',
  );

  if (!confirmed) return;

  setMessage("");
  setErrorMessage("");

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", category.id);

  if (error) {
    setErrorMessage("Could not delete category: " + error.message);
    return;
  }

  setCategories((current) =>
    current.filter((item) => item.id !== category.id),
  );

  if (editingCategoryId === category.id) {
    resetCategoryForm();
  }

  setMessage("Category deleted.");
      }
  
  function startEditing(product: Product) {
    setShowProductForm(true);
    setEditingId(product.id);
    setForm({
      gallery_urls: Array.isArray(product.gallery)
  ? product.gallery.filter(
      (item): item is string => typeof item === "string",
    )
  : product.image_url
    ? [product.image_url]
    : [],
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: String(product.price),
      compare_at_price:
        product.compare_at_price == null
          ? ""
          : String(product.compare_at_price),
      stock: String(product.stock),
      sku: product.sku ?? "",
      image_url: product.image_url ?? "",
      category_id: product.category_id ?? "",
      is_active: product.is_active,
      is_featured: product.is_featured,
      merchandising_tags: safeTags(product.merchandising_tags),
    });
    setMessage("");
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setShowProductForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setErrorMessage("");
  }

  function toggleMerchandisingTag(tag: MerchandisingTag, checked: boolean) {
    setForm((current) => ({
      ...current,
      merchandising_tags: checked
        ? Array.from(new Set([...current.merchandising_tags, tag]))
        : current.merchandising_tags.filter((item) => item !== tag),
    }));
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (uploadingImages) {
    setErrorMessage("Please wait for the image upload to finish.");
    return;
  }

  setSaving(true);
  setMessage("");
  setErrorMessage("");
    
    const name = form.name.trim();
    const slug = makeSlug(form.slug || name);
    const price = Number(form.price);
    const stock = Number(form.stock);
    const compareText = form.compare_at_price.trim();
    const compareAtPrice = compareText ? Number(compareText) : null;

    if (!name || !slug) {
      setErrorMessage("Enter a product name and valid URL slug.");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setErrorMessage("Price must be greater than zero.");
      setSaving(false);
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setErrorMessage("Stock must be a whole number of zero or more.");
      setSaving(false);
      return;
    }

    if (
      compareAtPrice !== null &&
      (!Number.isFinite(compareAtPrice) || compareAtPrice <= price)
    ) {
      setErrorMessage(
        "The comparison price must be greater than the selling price.",
      );
      setSaving(false);
      return;
    }

    const values = {
      name,
      slug,
      description: form.description.trim() || null,
      price,
      compare_at_price: compareAtPrice,
      discount_pct:
        compareAtPrice !== null
          ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
          : null,
      stock,
      sku: form.sku.trim() || null,
      image_url: form.image_url.trim() || form.gallery_urls[0] || null,
gallery: form.gallery_urls.length ? form.gallery_urls : null,
      category_id: form.category_id || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      merchandising_tags: form.merchandising_tags,
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase.from("products").update(values).eq("id", editingId)
      : await supabase.from("products").insert(values);

    if (result.error) {
      setErrorMessage(`Could not save the product: ${result.error.message}`);
      setSaving(false);
      return;
    }

    setMessage(editingId ? "Product updated successfully." : "Product added successfully.");
    setEditingId(null);
    setForm(emptyForm);
    setShowProductForm(false);
    await loadProducts();
    setSaving(false);
  }

  async function toggleProduct(
    product: Product,
    field: "is_active" | "is_featured",
  ) {
    setMessage("");
    setErrorMessage("");

    const nextValue = !product[field];
    const { error } = await supabase
      .from("products")
      .update({
        [field]: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id ? { ...item, [field]: nextValue } : item,
      ),
    );

    setMessage(
      field === "is_active"
        ? nextValue
          ? "Product published."
          : "Product unpublished."
        : nextValue
          ? "Product marked as featured."
          : "Product removed from featured items.",
    );
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Permanently delete "${product.name}"? This cannot be undone. If this product is linked to an order, the database may block deletion.`,
    );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      setErrorMessage(`Could not delete product: ${error.message}`);
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== product.id));

    if (editingId === product.id) resetForm();

    setMessage("Product deleted.");
  }

  if (checking) {
    return (
      <main className="min-h-[70vh] bg-[#050505] px-4 py-10 text-white">
        <p className="mx-auto max-w-5xl rounded-xl border border-white/10 bg-[#090909] p-5">
          Checking administrator access...
        </p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-[70vh] bg-[#050505] px-4 py-10 text-white">
        <section className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#090909] p-6 md:p-10">
          <ShieldCheck className="h-10 w-10 text-[#E4C15A]" />
          <h1 className="mt-4 text-2xl font-bold">Admin access required</h1>
          <p className="mt-3 text-sm leading-6 text-[#A6A6A6]">
            This area is for authorised administrators. Sign in with an account
            that has the admin role. A customer account alone does not grant access.
          </p>
          <a href="/sign-in" className="btn btn-primary mt-5 inline-flex">
            Go to sign in
          </a>
        </section>
      </main>
    );
  }

  const publishedCount = products.filter((product) => product.is_active).length;

const inStockCount = products.filter(
  (product) => Number(product.stock) > 0,
).length;

const outOfStockCount = products.filter(
  (product) => Number(product.stock) <= 0,
).length;

const luxuryCount = products.filter((product) =>
  safeTags(product.merchandising_tags).includes("luxury"),
).length;

const affordableCount = products.filter((product) =>
  safeTags(product.merchandising_tags).includes("affordable"),
).length;

const featuredCount = products.filter(
  (product) => product.is_featured,
).length;

const productMetrics = [
  {
    label: "Total products",
    count: products.length,
    filter: "all",
    note: "Entire catalogue",
  },
  {
    label: "Published",
    count: publishedCount,
    filter: "published",
    note: "Published listings",
  },
  {
    label: "In stock",
    count: inStockCount,
    filter: "in-stock",
    note: "Products with stock available",
  },
  {
    label: "Out of stock",
    count: outOfStockCount,
    filter: "out-of-stock",
    note: "Products with no stock",
  },
  {
    label: "Luxury / Premium",
    count: luxuryCount,
    filter: "tag:luxury",
    note: "Luxury collection",
  },
  {
    label: "Affordable",
    count: affordableCount,
    filter: "tag:affordable",
    note: "Affordable collection",
  },
  {
    label: "Featured",
    count: featuredCount,
    filter: "featured",
    note: "Featured listings",
  },
];

const visibleProducts = products.filter((product) => {
  if (activeProductFilter === "published") {
    return product.is_active;
  }

  if (activeProductFilter === "featured") {
    return product.is_featured;
  }

  if (activeProductFilter === "in-stock") {
    return Number(product.stock) > 0;
  }

  if (activeProductFilter === "out-of-stock") {
    return Number(product.stock) <= 0;
  }

  if (activeProductFilter === "tag:luxury") {
    return safeTags(product.merchandising_tags).includes("luxury");
  }

  if (activeProductFilter === "tag:affordable") {
    return safeTags(product.merchandising_tags).includes("affordable");
  }

  if (activeProductFilter.startsWith("category:")) {
    return (
      product.category_id ===
      activeProductFilter.slice("category:".length)
    );
  }

  return true;
});

return (
    <main className="min-h-screen bg-[#050505] px-3 py-5 text-white sm:px-4">
      <div className="mx-auto max-w-6xl space-y-5">
        >
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              NEXA GLOBAL MART
            </p>
            <h1 className="mt-2 text-3xl font-bold">Products</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Add products, manage catalogue details, and choose the shop sections
              where customers discover each product.
            </p>
          </div>
        </header>

        {(message || errorMessage) && (
          <div
            role={errorMessage ? "alert" : "status"}
            className={`rounded-xl border p-4 text-sm ${
              errorMessage
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-success/30 bg-success/10 text-success"
            }`}
          >
            {errorMessage || message}
          </div>
        )}

      <section
  aria-label="Product actions"
  className="grid grid-cols-2 gap-3 sm:gap-4"
>
  <button
    type="button"
    aria-expanded={showProductForm}
    onClick={() => setShowProductForm((open) => !open)}
    className="surface group flex min-h-32 w-full flex-col justify-between gap-3 p-4 text-left transition hover:border-gold/70 sm:p-5"
  >
    <span className="grid h-11 w-11 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
      <Plus className="h-5 w-5" />
    </span>

    <span>
      <span className="block font-semibold">
        {showProductForm ? "Close Product Form" : "Add Products"}
      </span>
      <span className="mt-1 block text-xs text-muted-foreground">
        Add product details and upload images.
      </span>
    </span>
  </button>

  <button
    type="button"
    aria-expanded={showCategoryPanel}
    onClick={() => setShowCategoryPanel((open) => !open)}
    className="surface group flex min-h-32 w-full flex-col justify-between gap-3 p-4 text-left transition hover:border-gold/70 sm:p-5"
  >
    <span className="grid h-11 w-11 place-items-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
      <Tag className="h-5 w-5" />
    </span>

    <span>
      <span className="block font-semibold">
        {showCategoryPanel ? "Close Category Panel" : "Add Category"}
      </span>
      <span className="mt-1 block text-xs text-muted-foreground">
        Create and manage product categories.
      </span>
    </span>
  </button>
</section>

<section
  aria-label="Product statistics and filters"
  className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
>
  {productMetrics.map((metric) => {
    const selected = activeProductFilter === metric.filter;

    return (
      <button
        key={metric.filter}
        type="button"
        aria-pressed={selected}
        onClick={() => setActiveProductFilter(metric.filter)}
        className={`surface flex min-h-32 flex-col justify-between p-4 text-left transition sm:p-5 ${
          selected
            ? "border-gold/70 bg-gold-soft"
            : "hover:border-gold/70"
        }`}
      >
        <span className="text-sm text-muted-foreground">
          {metric.label}
        </span>

        <span className="mt-3 block text-3xl font-bold text-gold">
          {metric.count}
        </span>

        <span className="mt-1 block text-xs text-muted-foreground">
          {metric.note}
        </span>
      </button>
    );
  })}
</section>

<section aria-label="Product categories" className="space-y-4">
  <div>
    <h2 className="text-xl font-bold">Your categories</h2>
    <p className="mt-1 text-sm text-muted-foreground">
      Select a category to filter the catalogue. Counts update when
      products are added, edited, or deleted.
    </p>
  </div>

  {categories.length === 0 ? (
    <div className="surface rounded-xl p-4 text-sm text-muted-foreground">
      No categories exist yet. Use Add Category to create one.
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => {
        const filter = `category:${category.id}`;
        const selected = activeProductFilter === filter;
        const count = products.filter(
          (product) => product.category_id === category.id,
        ).length;

        return (
          <button
            key={category.id}
            type="button"
            aria-pressed={selected}
            onClick={() => setActiveProductFilter(selected ? "all" : filter)}
            className={`surface min-h-28 p-4 text-left transition sm:p-5 ${
              selected
                ? "border-gold/70 bg-gold-soft"
                : "hover:border-gold/70"
            }`}
          >
            <span className="block font-semibold">{category.name}</span>

            <span className="mt-3 block text-sm text-gold">
              {count} {count === 1 ? "product" : "products"}
            </span>

            {!category.is_active && (
              <span className="mt-2 block text-xs text-muted-foreground">
                Inactive category
              </span>
            )}
          </button>
        );
      })}
    </div>
  )}
</section>
      
      {showCategoryPanel && (
  <section className="surface rounded-2xl p-4 sm:p-6">  
  <div className="mb-5">
    <h2 className="text-xl font-bold">Category management</h2>
    <p className="mt-1 text-sm text-[#A6A6A6]">
      Create and manage product categories without changing source code.
    </p>
  </div>

  <form onSubmit={saveCategory} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium">
        Category name *
        <input
          required
          value={categoryForm.name}
          onChange={(event) => {
            const name = event.target.value;
            setCategoryForm((current) => ({
              ...current,
              name,
              slug: current.slug || makeSlug(name),
            }));
          }}
          placeholder="e.g. Laptops"
          className="field w-full"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        URL slug *
        <input
          required
          value={categoryForm.slug}
          onChange={(event) =>
            updateCategoryForm("slug", makeSlug(event.target.value))
          }
          placeholder="laptops"
          className="field w-full"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Category image URL
        <input
          type="url"
          value={categoryForm.image_url}
          onChange={(event) =>
            updateCategoryForm("image_url", event.target.value)
          }
          placeholder="https://example.com/category.jpg"
          className="field w-full"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Display order
        <input
          required
          type="number"
          min="0"
          step="1"
          value={categoryForm.sort_order}
          onChange={(event) =>
            updateCategoryForm("sort_order", event.target.value)
          }
          className="field w-full"
        />
      </label>
    </div>

    <label className="grid gap-2 text-sm font-medium">
      Description
      <textarea
        rows={2}
        value={categoryForm.description}
        onChange={(event) =>
          updateCategoryForm("description", event.target.value)
        }
        placeholder="Optional category description."
        className="field w-full"
      />
    </label>

    <label className="flex items-start gap-3 rounded-xl border border-white/10 p-4">
      <input
        type="checkbox"
        checked={categoryForm.is_active}
        onChange={(event) =>
          updateCategoryForm("is_active", event.target.checked)
        }
        className="mt-1 accent-[#E4C15A]"
      />
      <span>
        <span className="block text-sm font-semibold">
          Active category
        </span>
        <span className="mt-1 block text-xs text-[#A6A6A6]">
          Active categories can be offered in the storefront.
        </span>
      </span>
    </label>

    <div className="flex flex-wrap gap-3">
      <button
        type="submit"
        disabled={savingCategory}
        className="btn btn-primary"
      >
        {savingCategory
          ? "Saving category..."
          : editingCategoryId
            ? "Save category changes"
            : "Create category"}
      </button>

      {editingCategoryId && (
        <button
          type="button"
          onClick={resetCategoryForm}
          className="btn btn-outline"
        >
          Cancel editing
        </button>
      )}
    </div>
  </form>

  <div className="mt-6 border-t border-white/10 pt-5">
    <h3 className="mb-3 font-semibold">
      Existing categories ({categories.length})
    </h3>

    {categories.length === 0 ? (
      <p className="py-4 text-sm text-[#A6A6A6]">
        No categories found. Create your first category above.
      </p>
    ) : (
      <div className="space-y-3">
        {categories.map((category) => {
          const assignedProducts = products.filter(
            (product) => product.category_id === category.id,
          ).length;

          return (
            <article
              key={category.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#080808] p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold">{category.name}</h4>
                <p className="mt-1 break-all text-xs text-[#A6A6A6]">
                  {category.slug} · Order {category.sort_order} ·{" "}
                  {assignedProducts} product(s)
                </p>
                {category.description && (
                  <p className="mt-1 text-sm text-[#A6A6A6]">
                    {category.description}
                  </p>
                )}
                <span className="mt-2 inline-flex rounded-full border border-white/15 px-2 py-1 text-xs">
                  {category.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEditingCategory(category)}
                  className="btn btn-outline"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => void toggleCategory(category)}
                  className="btn btn-outline"
                >
                  {category.is_active ? "Deactivate" : "Activate"}
                </button>

                <button
                  type="button"
                  onClick={() => void deleteCategory(category)}
                  disabled={assignedProducts > 0}
                  className="btn btn-outline disabled:cursor-not-allowed disabled:opacity-40"
                  title={
                    assignedProducts > 0
                      ? "Reassign products before deleting this category."
                      : "Delete category"
                  }
                >
                  <Trash2 className="mr-1 inline h-4 w-4" />
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    )}
  </div>
  </section>
)}
        
        {showProductForm && (
  <section className="surface rounded-2xl p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#15120A] text-[#E4C15A]">
              {editingId ? <Package className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {editingId ? "Edit product" : "Add a product"}
              </h2>
              <p className="text-sm text-[#A6A6A6]">
                Manage product details and customer-facing merchandising.
              </p>
            </div>
          </div>

          <form onSubmit={saveProduct} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Product name *
                <input
                  required
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setForm((current) => ({
                      ...current,
                      name,
                      slug: current.slug || makeSlug(name),
                    }));
                  }}
                  placeholder="e.g. Premium leather jacket"
                  className="field w-full"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                URL slug *
                <input
                  required
                  value={form.slug}
                  onChange={(event) => updateForm("slug", makeSlug(event.target.value))}
                  placeholder="premium-leather-jacket"
                  className="field w-full"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Selling price (ZAR) *
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => updateForm("price", event.target.value)}
                  placeholder="299.00"
                  className="field w-full"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Comparison price (ZAR)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.compare_at_price}
                  onChange={(event) => updateForm("compare_at_price", event.target.value)}
                  placeholder="e.g. 399.00 before discount"
                  className="field w-full"
                />
                <span className="text-xs font-normal text-[#A6A6A6]">
                  Optional. Must be higher than the selling price.
                </span>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Stock quantity *
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) => updateForm("stock", event.target.value)}
                  className="field w-full"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Category
                <select
                  value={form.category_id}
                  onChange={(event) => updateForm("category_id", event.target.value)}
                  className="field w-full"
                >
                  <option value="">Choose a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                SKU / product code
                <input
                  value={form.sku}
                  onChange={(event) => updateForm("sku", event.target.value)}
                  placeholder="Optional stock code"
                  className="field w-full"
                />
              </label>
            </div>

            <div className="space-y-3">
  <div>
    <h3 className="text-sm font-semibold">Product images</h3>
    <p className="mt-1 text-xs text-[#A6A6A6]">
      Upload up to five images. Images are compressed before they are sent
      to storage. Select a main image for product cards.
    </p>
  </div>

  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#C9A227]/50 p-6 text-center hover:bg-white/[0.03]">
    <ImagePlus className="h-8 w-8 text-[#E4C15A]" />
    <span className="font-semibold">
      {uploadingImages ? "Compressing and uploading..." : "Choose product images"}
    </span>
    <span className="text-xs text-[#A6A6A6]">
      {form.gallery_urls.length} of {MAX_PRODUCT_IMAGES} images selected
    </span>
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      disabled={uploadingImages || form.gallery_urls.length >= MAX_PRODUCT_IMAGES}
      className="sr-only"
      onChange={(event) => {
        void uploadProductImages(event.target.files);
        event.currentTarget.value = "";
      }}
    />
  </label>

  {form.gallery_urls.length > 0 && (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {form.gallery_urls.map((path) => (
        <div key={path} className="space-y-2 rounded-xl border border-white/10 p-2">
          <img
            src={getProductImageUrl(path)}
            alt="Product preview"
            className="aspect-square w-full rounded-lg bg-white object-contain"
          />
          <button
            type="button"
            onClick={() =>
              updateForm("image_url", path)
            }
            className={`w-full rounded-lg border px-2 py-2 text-xs ${
              form.image_url === path
                ? "border-[#E4C15A] text-[#E4C15A]"
                : "border-white/15"
            }`}
          >
            {form.image_url === path ? "Main image" : "Set as main"}
          </button>
          <button
            type="button"
            disabled={uploadingImages}
            onClick={() => removeProductImage(path)}
            className="w-full rounded-lg border border-red-500/30 px-2 py-2 text-xs text-red-300"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )}

  <label className="grid gap-2 text-sm font-medium">
    Or use an existing image URL
    <input
      type="url"
      value={/^https?:\/\//i.test(form.image_url) ? form.image_url : ""}
      onChange={(event) => updateForm("image_url", event.target.value)}
      placeholder="https://example.com/product-image.jpg"
      className="field w-full"
    />
  </label>
</div>

            <label className="grid gap-2 text-sm font-medium">
              Description
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                placeholder="Describe the product and its key details."
                className="field w-full"
              />
            </label>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">
                Shop placement and merchandising
              </legend>
              <p className="text-xs text-[#A6A6A6]">
                Select any combination. These labels are separate from the product category.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {MERCHANDISING_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start gap-3 rounded-xl border border-white/10 p-4 transition-colors hover:border-[#C9A227]/60"
                  >
                    <input
                      type="checkbox"
                      checked={form.merchandising_tags.includes(option.value)}
                      onChange={(event) =>
                        toggleMerchandisingTag(option.value, event.target.checked)
                      }
                      className="mt-1 accent-[#E4C15A]"
                    />
                    <span>
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="mt-1 block text-xs text-[#A6A6A6]">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-xl border border-white/10 p-4">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => updateForm("is_active", event.target.checked)}
                  className="mt-1 accent-[#E4C15A]"
                />
                <span>
                  <span className="block text-sm font-semibold">Publish product</span>
                  <span className="mt-1 block text-xs text-[#A6A6A6]">
                    Published products can appear in the customer shop.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-white/10 p-4">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(event) => updateForm("is_featured", event.target.checked)}
                  className="mt-1 accent-[#E4C15A]"
                />
                <span>
                  <span className="block text-sm font-semibold">Featured product</span>
                  <span className="mt-1 block text-xs text-[#A6A6A6]">
                    Include in the existing Featured products section.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? "Saving..." : editingId ? "Save product changes" : "Save product"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn btn-outline">
                  Cancel editing
                </button>
              )}
            </div>
          </form>
          </section>
)}

        <section className="rounded-2xl border border-white/10 bg-[#090909] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Product catalogue</h2>
              <p className="mt-1 text-sm text-[#A6A6A6]">
                Existing database products and their shop placement.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadProducts()}
              disabled={loadingProducts}
              className="btn btn-outline"
            >
              <RefreshCw className="mr-2 inline h-4 w-4" />
              Refresh
            </button>
          </div>

          
          {loadingProducts ? (
            <p className="py-8 text-sm text-muted-foreground">
              Loading products...
            </p>
          ) : products.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              No products found. Add your first product above.
            </p>
          ) : visibleProducts.length === 0 ? (
            <div className="surface rounded-xl p-5 text-center">
              <p className="text-sm text-muted-foreground">
                No products match this filter.
              </p>

              <button
                type="button"
                onClick={() => setActiveProductFilter("all")}
                className="btn btn-outline mt-4"
              >
                Show all products
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {visibleProducts.map((product) => {
                const category = categories.find(
                  (item) => item.id === product.category_id,
                );
                const tags = safeTags(product.merchandising_tags);

                return (
                  <article
                    key={product.id}
                    className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#080808] p-4 sm:flex-row sm:items-center"
                  >
                    {product.image_url ? (
                      <img
                        src={getProductImageUrl(product.image_url)}
                        alt={product.name}
                        className="h-20 w-20 shrink-0 rounded-lg bg-white object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
           <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-[#15120A] text-[#E4C15A]">
                        <Package className="h-7 w-7" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="mt-1 break-all text-xs text-[#A6A6A6]">
                        {product.slug}
                        {product.sku ? ` · SKU: ${product.sku}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-[#D0D0D0]">
                        R{Number(product.price).toFixed(2)} · Stock: {product.stock}
                        {category ? ` · ${category.name}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-white/15 px-2 py-1">
                          {product.is_active ? "Published" : "Unpublished"}
                        </span>
                        {product.is_featured && (
                          <span className="rounded-full border border-[#C9A227]/50 px-2 py-1 text-[#E4C15A]">
                            Featured
                          </span>
                        )}
                        {tags.map((tag) => {
                          const option = MERCHANDISING_OPTIONS.find(
                            (item) => item.value === tag,
                          );
                          return (
                            <span
                              key={tag}
                              className="rounded-full border border-[#C9A227]/40 px-2 py-1 text-[#E4C15A]"
                            >
                              {option?.label ?? tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => startEditing(product)}
                        className="btn btn-outline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleProduct(product, "is_active")}
                        className="btn btn-outline"
                      >
                        {product.is_active ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleProduct(product, "is_featured")}
                        className="btn btn-outline"
                        aria-label={
                          product.is_featured
                            ? `Remove ${product.name} from featured products`
                            : `Feature ${product.name}`
                        }
                      >
                        <Star className="mr-1 inline h-4 w-4" />
                        {product.is_featured ? "Unfeature" : "Feature"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteProduct(product)}
                        className="btn btn-outline"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="mr-1 inline h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
