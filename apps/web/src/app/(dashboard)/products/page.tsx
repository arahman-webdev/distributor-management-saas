import { getProductsAction } from "@/lib/actions/product-actions";
import ProductCatalogView from "@/components/products/product-catalog-view";

export default async function ProductsPage() {
  const data = await getProductsAction();

  return (
    <ProductCatalogView
      initialProducts={data.products}
      categories={data.categories}
      brands={data.brands}
      role={data.role}
      metrics={data.metrics}
    />
  );
}
