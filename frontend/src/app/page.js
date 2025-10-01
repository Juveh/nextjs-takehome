"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function Home() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    if (search.trim()) params.set("search", search.trim());
    return params.toString();
  }, [page, pageSize, search]);

  useEffect(() => {
    let cancelled = false;
    const fetchItems = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/items?${query}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setItems(data.items || []);
          setTotalPages(data.total_pages || 0);
          setTotalItems(data.total_items || 0);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const canPrev = page > 1;
  const canNext = totalPages > 0 && page < totalPages;

  return (
    <div className="min-h-screen p-8 sm:p-12 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-2xl font-semibold mb-6">Items</h1>

      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">Search</label>
          <input
            className="border rounded px-3 py-2 w-64"
            placeholder="Search by name or description"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">Page size</label>
          <select
            className="border rounded px-3 py-2 w-32"
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded">
        {loading ? (
          <div className="p-6">Loading…</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-6">No items found.</div>
        ) : (
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.id} className="p-4">
                <div className="font-medium">{it.name}</div>
                {it.description ? (
                  <div className="text-sm text-gray-600">{it.description}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Page {totalPages === 0 ? 0 : page} of {totalPages} • {totalItems} items
        </div>
        <div className="flex gap-2">
          <button
            className="border rounded px-3 py-2 disabled:opacity-50"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            className="border rounded px-3 py-2 disabled:opacity-50"
            disabled={!canNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
