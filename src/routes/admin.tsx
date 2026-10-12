import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ImagePlus, Package, Plus, RefreshCw, ShieldCheck } from "lucide-react";
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
      supabase.from("products").select("*").order("created_at", {
        ascending: false,
      }),
      supabase.from("categories").select("*").order("sort_order"),
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

  const registeredName =
    profile?.full_name?.trim() ||
    userResult.user.user_metadata?.full_name ||
    "";

  setAdminFirstName(
    registeredName.split(/\s+/).filter(Boolean)[0] ||
      "Admin",
  );
} 
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
      setErrorMessage(
        `Could not save the product. ${result.error.message}`,
      );
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
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="surface rounded-2xl p-6" role="status">
          Checking administrator access...
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <section className="surface rounded-3xl border border-gold/30 p-6 md:p-10">
          <ShieldCheck className="h-10 w-10 text-gold" />
          <h1 className="mt-4 text-2xl font-bold">Admin access required</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
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
    <main className="min-h-[70vh] bg-background pb-16">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-10">
        <header className="rounded-3xl border border-gold/40 bg-ink p-6 text-ink-foreground md:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            NEXA · Administration
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
  Welcome back, {adminFirstName}
</h1>

<h2 className="mt-3 text-xl font-semibold text-gold">
  Product Management
</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-foreground/75">
            Add products, maintain your catalogue and control which products
            are published to customers. Changes are saved to the NEXA database.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-2xl border border-white/15 p-4">
              <p className="text-xs text-ink-foreground/65">All products</p>
              <p className="mt-1 text-2xl font-bold">{products.length}</p>
            </div>
            <div className="rounded-2xl border border-white/15 p-4">
              <p className="text-xs text-ink-foreground/65">Published</p>
              <p className="mt-1 text-2xl font-bold">{activeCount}</p>
            </div>
          </div>
        </header>

        {(message || errorMessage) && (
          <div
            role={errorMessage ? "alert" : "status"}
            className={`rounded-xl border p-4 text-sm ${
              errorMessage
                ? "border-red-500/40 text-red-600"
                : "border-gold/40 text-foreground"
            }`}
          >
            {errorMessage || message}
          </div>
        )}

        <section className="surface rounded-2xl border p-5 md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold-soft">
              {editingId ? (
                <Package className="h-5 w-5 text-gold" />
              ) : (
                <Plus className="h-5 w-5 text-gold" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {editingId ? "Edit product" : "Add a product"}
              </h2>
              <p className="text-sm text-muted-foreground">
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
                  onChange={(event) => updateForm("price", event.target.value)}
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
                  onChange={(event) => updateForm("stock", event.target.value)}
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
                  onChange={(event) => updateForm("sku", event.target.value)}
                  placeholder="Optional stock code"
                  className="field w-full"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Product image URL
              <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
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
              <div className="max-w-xs overflow-hidden rounded-xl border p-2">
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
              <label className="flex items-start gap-3 rounded-xl border p-4">
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
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Published products can be shown to customers.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-xl border p-4">
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
                  <span className="mt-1 block text-xs text-muted-foreground">
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

        <section className="surface rounded-2xl border p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Product catalogue</h2>
              <p className="mt-1 text-sm text-muted-foreground">
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
            <p className="py-8 text-sm text-muted-foreground">
              Loading products...
            </p>
          ) : products.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
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
                    className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-20 w-20 rounded-lg border object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-ink text-gold">
                        <Package className="h-7 w-7" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {product.slug}
                      </p>
                      <p className="mt-1 text-sm">
                        R{Number(product.price).toFixed(2)} · Stock:{" "}
                        {product.stock}
                        {category ? ` · ${category.name}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span
                          className={`rounded-full px-2 py-1 ${
                            product.is_active
                              ? "bg-gold-soft text-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {product.is_active ? "Published" : "Unpublished"}
                        </span>
                        {product.is_featured && (
                          <span className="rounded-full border border-gold/40 px-2 py-1">
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
                        onClick={() => void toggleProduct(product, "is_active")}
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
    </main>
  );
}
