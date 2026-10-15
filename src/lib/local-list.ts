
import { useCallback, useEffect, useState } from "react";

type Quantities = Record<string, number>;

const CART_KEY = "nexa-cart";
const CART_QUANTITIES_KEY = "nexa-cart-quantities";

function readIds(key: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function readQuantities(): Quantities {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(CART_QUANTITIES_KEY) || "{}",
    );

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    const result: Quantities = {};

    for (const [id, quantity] of Object.entries(value)) {
      if (
        typeof quantity === "number" &&
        Number.isFinite(quantity) &&
        quantity > 0
      ) {
        result[id] = Math.floor(quantity);
      }
    }

    return result;
  } catch {
    return {};
  }
}

function notifyListsChanged() {
  window.dispatchEvent(new Event("nexa-list"));
}

export function useLocalList(key: string) {
  const [ids, setIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Quantities>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      const nextIds = readIds(key);
      setIds(nextIds);

      if (key === CART_KEY) {
        const storedQuantities = readQuantities();
        const normalized: Quantities = {};

        for (const id of nextIds) {
          normalized[id] = Math.max(1, storedQuantities[id] ?? 1);
        }

        setQuantities(normalized);
      } else {
        setQuantities({});
      }

      setReady(true);
    };

    sync();
    window.addEventListener("nexa-list", sync);

    return () => window.removeEventListener("nexa-list", sync);
  }, [key]);

  const write = useCallback(
    (nextIds: string[]) => {
      try {
        localStorage.setItem(key, JSON.stringify(nextIds));
        setIds(nextIds);
        notifyListsChanged();
      } catch (error) {
        console.error("Unable to save this list on the device:", error);
      }
    },
    [key],
  );

  const toggle = useCallback(
    (id: string) => {
      write(ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
    },
    [ids, write],
  );

  const add = useCallback(
    (id: string) => {
      if (key !== CART_KEY) {
        write(ids.includes(id) ? ids : [...ids, id]);
        return;
      }

      try {
        const nextIds = ids.includes(id) ? ids : [...ids, id];
        const nextQuantities = readQuantities();

        nextQuantities[id] = Math.max(0, nextQuantities[id] ?? 0) + 1;         

        localStorage.setItem(CART_KEY, JSON.stringify(nextIds));
        localStorage.setItem(
          CART_QUANTITIES_KEY,
          JSON.stringify(nextQuantities),
        );

        setIds(nextIds);
        setQuantities(nextQuantities);
        notifyListsChanged();
      } catch (error) {
        console.error("Unable to add this product to the cart:", error);
      }
    },
    [ids, key, write],
  );

  const setQuantity = useCallback(
    (id: string, quantity: number) => {
      if (key !== CART_KEY || !Number.isFinite(quantity)) return;

      const nextQuantity = Math.floor(quantity);

      if (nextQuantity <= 0) {
        const nextIds = ids.filter((item) => item !== id);
        const nextQuantities = readQuantities();
        delete nextQuantities[id];

        try {
          localStorage.setItem(CART_KEY, JSON.stringify(nextIds));
          localStorage.setItem(
            CART_QUANTITIES_KEY,
            JSON.stringify(nextQuantities),
          );
          setIds(nextIds);
          setQuantities(nextQuantities);
          notifyListsChanged();
        } catch (error) {
          console.error("Unable to update the cart:", error);
        }

        return;
      }

      try {
        const nextIds = ids.includes(id) ? ids : [...ids, id];
        const nextQuantities = readQuantities();
        nextQuantities[id] = nextQuantity;

        localStorage.setItem(CART_KEY, JSON.stringify(nextIds));
        localStorage.setItem(
          CART_QUANTITIES_KEY,
          JSON.stringify(nextQuantities),
        );

        setIds(nextIds);
        setQuantities(nextQuantities);
        notifyListsChanged();
      } catch (error) {
        console.error("Unable to update the cart quantity:", error);
      }
    },
    [ids, key],
  );

  const remove = useCallback(
    (id: string) => {
      const nextIds = ids.filter((item) => item !== id);

      if (key === CART_KEY) {
        const nextQuantities = readQuantities();
        delete nextQuantities[id];

        try {
          localStorage.setItem(CART_KEY, JSON.stringify(nextIds));
          localStorage.setItem(
            CART_QUANTITIES_KEY,
            JSON.stringify(nextQuantities),
          );
          setIds(nextIds);
          setQuantities(nextQuantities);
          notifyListsChanged();
        } catch (error) {
          console.error("Unable to remove this product:", error);
        }
      } else {
        write(nextIds);
      }
    },
    [ids, key, write],
  );

  return {
    ids,
    quantities,
    ready,
    toggle,
    add,
    setQuantity,
    remove,
    has: (id: string) => ids.includes(id),
  };
}
