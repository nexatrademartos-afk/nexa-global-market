import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  ClipboardCheck,
  Headset,
  ImagePlus,
  Megaphone,
  Package,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Users,
  Warehouse,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
type Category = Tables<"categories">;

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  sku: string;
  image_url: string;
  category_id: string;
  is_active: boolean;
  is_featured: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: "0",
  sku: "",
  image_url: "",
  category_id: "",
  is_active: false,
  is_featured: false,
};

const ADMIN_MODULES = [
  {
    name: "Products",
    description: "Add, edit and publish products.",
    status: "active",
    icon: Package,
  },
  {
    name: "Categories",
    description: "Organise the product catalogue.",
    status: "soon",
    icon: Tags,
  },
  {
    name: "Staff & Access",
    description: "Staff accounts and permissions.",
    status: "soon",
    icon: Users,
  },
  {
    name: "Role Applications",
    description: "Review requests for platform roles.",
    status: "soon",
    icon: ClipboardCheck,
  },
  {
    name: "Orders & Returns",
    description: "Manage customer orders and returns.",
    status: "soon",
    icon: ShoppingCart,
  },
  {
    name: "Suppliers & Warehouse",
    description: "Supplier and inventory operations.",
    status: "soon",
    icon: Warehouse,
  },
  {
    name: "Marketing",
    description: "Promotions and campaigns.",
    status: "soon",
    icon: Megaphone,
  },
  {
    name: "Support & Policies",
    description: "Customer support and policies.",
    status: "soon",
    icon: Headset,
  },
] as const;

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
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

function AdminDashboard() {
  const [adminFirstName, setAdminFirstName] = useState("Admin");
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
        .order("sort_order"),
    ]);

    if (productResult.error) {
      setErrorMessage(productResult.error.message);
    } else {
      setProducts(productResult.data ?? []);
    }

    if (categoryResult.error) {
      setErrorMessage((current) =>
        current
          ? `${current} Categories: ${categoryResult.error.message}`
          : `Categories: ${categoryResult.error.message}`,
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

      const approvedAdmin = !roleError && Boolean(role);
      setIsAdmin(approvedAdmin);

      if (approvedAdmin) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userResult.user.id)
          .maybeSingle();

        if (!active) return;

        const registeredName =
          profile?.full_name?.trim() ||
          userResult.user.user_metadata?.full_name ||
          "";

        setAdminFirstName(
          registeredName.split(/\s+/).filter(Boolean)[0] || "Admin",
        );
      }

      if (active) setChecking(false);
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

  function startEditing(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: String(product.price),
      stock: String(product.stock),
      sku: product.sku ?? "",
      image_url: product.image_url ?? "",
      category_id: product.category_id ?? "",
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setMessage("");
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setErrorMessage("");
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const name = form.name.trim();
    const slug = makeSlug(form.slug || name);
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name || !slug) {
      setErrorMessage("Enter a product name and a valid URL slug.");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setErrorMessage("Enter a valid, non-negative product price.");
      setSaving(false);
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setErrorMessage("Stock must be a whole number of zero or more.");
      setSaving(false);
      return;
    }

    const values = {
      name,
      slug,
      description: form.description.trim() || null,
      price,
      stock,
      sku: form.sku.trim() || null,
      image_url: form.image_url.trim() || null,
      category_id: form.category_id || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      updated_at: new Date().toISOString(),
    };

    const result = editingId
      ? await supabase.from("products").update(values).eq("id", editingId)
      : await supabase.from("products").insert(values);

    if (result.error) {
      setErrorMessage(`Could not save the product. ${result.error.message}`);
      setSaving(false);
      return;
    }

    setMessage(
      editingId
        ? "Product details saved successfully."
        : "Product created successfully.",
    );
    setEditingId(null);
    setForm(emptyForm);
    await loadProducts();
    setSaving(false);
  }

  async function toggleProduct(
    product: Product,
    field: "is_active" | "is_featured",
  ) {
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("products")
      .update({
        [field]: !product[field],
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? { ...item, [field]: !product[field] }
          : item,
      ),
    );

    setMessage(
      field === "is_active"
        ? product.is_active
          ? "Product unpublished."
          : "Product published."
        : product.is_featured
          ? "Product removed from featured items."
          : "Product marked as featured.",
    );
  }

  if (checking) {
    return (
      <main className="min-h-[70vh] bg-[#050505] px-4 py-12 text-white">
        <div
          className="mx-auto max-w-4xl rounded-2xl border border-[#C9A227]/60 bg-[#090909] p-6 shadow-[0_0_14px_rgba(201,162,39,0.16)]"
          role="status"
        >
          Checking administrator access...
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-[70vh] bg-[#050505] px-4 py-12 text-white">
        <section className="mx-auto max-w-3xl rounded-3xl border border-[#C9A227]/60 bg-[#090909] p-6 shadow-[0_0_14px_rgba(201,162,39,0.16)] md:p-10">
          <ShieldCheck className="h-10 w-10 text-[#E4C15A]" />
          <h1 className="mt-4 text-2xl font-bold">
            Admin access required
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#A6A6A6]">
            This area is for authorised NEXA administrators. Sign in with an
            account that has the admin role. A customer account alone does not
            grant access.
          </p>
          <a href="/sign-in" className="btn btn-primary mt-5 inline-flex">
            Go to sign in
          </a>
        </section>
      </main>
    );
  }

  const activeCount = products.filter((product) => product.is_active).length;

  return (
    <main className="min-h-[70vh] bg-[#050505] px-3 pb-16 pt-5 text-white sm:px-4">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#C9A227] p-2 shadow-[0_0_14px_rgba(201,162,39,0.22),0_0_30px_rgba(201,162,39,0.10)] md:p-3">
        <div className="space-y-6 rounded-[1.5rem] bg-[#080808] px-3 py-5 sm:px-5 md:px-6 md:py-8">
          <header className="rounded-2xl border border-[#C9A227] bg-[#090909] p-5 text-white shadow-[0_0_14px_rgba(201,162,39,0.20)] sm:p-6 md:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#E4C15A]">
              NEXA · Administration
            </p>

            <h1 className="mt-3 text-3xl font-bold md:text-4xl">
              Welcome back, {adminFirstName}
            </h1>

            <h2 className="mt-3 text-xl font-semibold text-[#E4C15A]">
              Product Management
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A6A6A6]">
              Add products, maintain your catalogue and control which products
              are published to customers. Changes are saved to the NEXA database.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
              <div className="rounded-xl border border-[#C9A227]/40 bg-[#080808] p-4">
                <p className="text-xs text-[#A6A6A6]">All products</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {products.length}
                </p>
              </div>

              <div className="rounded-xl border border-[#C9A227]/40 bg-[#080808] p-4">
                <p className="text-xs text-[#A6A6A6]">Published</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {activeCount}
                </p>
              </div>
            </div>
          </header>

          <section aria-label="Administration modules" className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#E4C15A]">
                Admin Dashboard
              </h2>
              <p className="mt-1 text-sm text-[#A6A6A6]">
                Select an available area to manage your operations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {ADMIN_MODULES.map((module) => {
                const Icon = module.icon;
                const isActive = module.status === "active";

                const tileClass =
                  "flex min-h-[150px] flex-col items-start rounded-2xl border border-[#C9A227] bg-[#090909] p-3 text-left shadow-[0_0_10px_rgba(201,162,39,0.16)] transition duration-200 sm:min-h-[165px] sm:p-4";

                const tileContent = (
                  <>
                    <div className="flex w-full items-start justify-between gap-2">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C9A227]/70 bg-[#15120A] text-[#E4C15A] sm:h-11 sm:w-11">
                        <Icon className="h-5 w-5" />
                      </span>

                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-semibold leading-tight sm:text-[10px] ${
                          isActive
                            ? "border-[#C9A227] text-[#E4C15A]"
                            : "border-[#555555] text-[#A6A6A6]"
                        }`}
                      >
                        {isActive ? "Active" : "Coming soon"}
                      </span>
                    </div>

                    <span className="mt-4 text-sm font-semibold leading-snug text-white sm:text-base">
                      {module.name}
                    </span>

                    <span className="mt-1 text-xs leading-5 text-[#A6A6A6] sm:text-sm">
                      {module.description}
                    </span>

                    {isActive && (
                      <span className="mt-3 text-xs font-semibold text-[#E4C15A]">
                        Open products →
                      </span>
                    )}
                  </>
                );

                return isActive ? (
                  <button
                    key={module.name}
                    type="button"
                    onClick={() =>
                      document.getElementById("products")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                    }
                    className={`${tileClass} cursor-pointer hover:border-[#E4C15A] hover:shadow-[0_0_18px_rgba(201,162,39,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4C15A]`}
                  >
                    {tileContent}
                  </button>
                ) : (
                  <div
                    key={module.name}
                    aria-label={`${module.name}, coming soon`}
                    className={`${tileClass} cursor-not-allowed`}
                  >
                    {tileContent}
                  </div>
                );
              })}
            </div>
          </section>

          {(message || errorMessage) && (
            <div
              role={errorMessage ? "alert" : "status"}
              className={`rounded-xl border p-4 text-sm ${
                errorMessage
                  ? "border-[#C9A227]/60 text-[#E4C15A]"
                  : "border-[#C9A227]/40 text-white"
              }`}
            >
              {errorMessage || message}
            </div>
          )}

          <section
            id="products"
            className="scroll-mt-6 rounded-2xl border border-[#C9A227]/70 bg-[#090909] p-5 shadow-[0_0_12px_rgba(201,162,39,0.12)] md:p-7"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-[#C9A227]/50 bg-[#15120A]">
                {editingId ? (
                  <Package className="h-5 w-5 text-[#E4C15A]" />
                ) : (
                  <Plus className="h-5 w-5 text-[#E4C15A]" />
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingId ? "Edit product" : "Add a product"}
                </h2>
                <p className="text-sm text-[#A6A6A6]">
                  Fields marked with * are required.
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
                    placeholder="e.g. Leather Travel Bag"
                    className="field w-full"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium">
                  URL slug *
                  <input
                    required
                    value={form.slug}
                    onChange={(event) =>
                      updateForm("slug", makeSlug(event.target.value))
                    }
                    placeholder="leather-travel-bag"
                    className="field w-full"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium">
                  Price (ZAR) *
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      updateForm("price", event.target.value)
                    }
                    placeholder="299.00"
                    className="field w-full"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium">
                  Stock quantity *
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) =>
                      updateForm("stock", event.target.value)
                    }
                    className="field w-full"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium">
                  Category
                  <select
                    value={form.category_id}
                    onChange={(event) =>
                      updateForm("category_id", event.target.value)
                    }
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
                    onChange={(event) =>
                      updateForm("sku", event.target.value)
                    }
                    placeholder="Optional stock code"
                    className="field w-full"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-medium">
                Product image URL
                <span className="flex items-center gap-2 text-xs font-normal text-[#A6A6A6]">
                  <ImagePlus className="h-4 w-4" />
                  Use a direct, publicly accessible image URL for now.
                </span>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(event) =>
                    updateForm("image_url", event.target.value)
                  }
                  placeholder="https://example.com/product-image.jpg"
                  className="field w-full"
                />
              </label>

              {form.image_url && (
                <div className="max-w-xs overflow-hidden rounded-xl border border-[#C9A227]/40 p-2">
                  <img
                    src={form.image_url}
                    alt="Product image preview"
                    className="aspect-square w-full rounded-lg object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              <label className="grid gap-2 text-sm font-medium">
                Description
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Describe the product, its features and key details."
                  className="field w-full"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-xl border border-[#C9A227]/40 p-4">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      updateForm("is_active", event.target.checked)
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      Publish product
                    </span>
                    <span className="mt-1 block text-xs text-[#A6A6A6]">
                      Published products can be shown to customers.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-[#C9A227]/40 p-4">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(event) =>
                      updateForm("is_featured", event.target.checked)
                    }
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      Featured product
                    </span>
                    <span className="mt-1 block text-xs text-[#A6A6A6]">
                      Mark this item for future featured catalogue sections.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save product changes"
                      : "Save product"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-outline"
                  >
                    Cancel editing
                  </button>
                )}
              </div>
            </form>
          </section>
                    <section className="rounded-2xl border border-[#C9A227]/70 bg-[#090909] p-5 shadow-[0_0_12px_rgba(201,162,39,0.12)] md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Product catalogue
                </h2>
                <p className="mt-1 text-sm text-[#A6A6A6]">
                  Existing database products. No records are deleted here.
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
              <p className="py-8 text-sm text-[#A6A6A6]">
                Loading products...
              </p>
            ) : products.length === 0 ? (
              <p className="py-8 text-sm text-[#A6A6A6]">
                No products found. Add your first product using the form above.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {products.map((product) => {
                  const category = categories.find(
                    (item) => item.id === product.category_id,
                  );

                  return (
                    <article
                      key={product.id}
                      className="flex flex-col gap-4 rounded-xl border border-[#C9A227]/50 bg-[#080808] p-4 shadow-[0_0_8px_rgba(201,162,39,0.10)] sm:flex-row sm:items-center"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-20 w-20 shrink-0 rounded-lg border border-[#C9A227]/40 bg-white object-contain"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-[#C9A227]/50 bg-[#15120A] text-[#E4C15A]">
                          <Package className="h-7 w-7" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white">
                          {product.name}
                        </h3>

                        <p className="mt-1 break-all text-xs text-[#A6A6A6]">
                          {product.slug}
                        </p>

                        <p className="mt-1 text-sm text-[#D0D0D0]">
                          R{Number(product.price).toFixed(2)} · Stock:{" "}
                          {product.stock}
                          {category ? ` · ${category.name}` : ""}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span
                            className={`rounded-full border px-2 py-1 ${
                              product.is_active
                                ? "border-[#C9A227] text-[#E4C15A]"
                                : "border-[#555555] text-[#A6A6A6]"
                            }`}
                          >
                            {product.is_active ? "Published" : "Unpublished"}
                          </span>

                          {product.is_featured && (
                            <span className="rounded-full border border-[#C9A227]/60 px-2 py-1 text-[#E4C15A]">
                              Featured
                            </span>
                          )}
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
                          onClick={() =>
                            void toggleProduct(product, "is_active")
                          }
                          className="btn btn-outline"
                        >
                          {product.is_active ? "Unpublish" : "Publish"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void toggleProduct(product, "is_featured")
                          }
                          aria-label={
                            product.is_featured
                              ? `Remove ${product.name} from featured products`
                              : `Feature ${product.name}`
                          }
                          className="btn btn-outline"
                        >
                          <CheckCircle2 className="mr-1 inline h-4 w-4" />
                          {product.is_featured ? "Unfeature" : "Feature"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

