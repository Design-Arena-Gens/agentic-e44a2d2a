import useSWR from "swr";
import type { MacroSnapshot } from "@/lib/types";

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch macro data");
  }
  return response.json();
};

export function useMacroSnapshot() {
  const { data, error, isLoading, mutate } = useSWR<MacroSnapshot>(
    "/api/macro",
    fetcher,
    {
      refreshInterval: 120_000,
      revalidateOnFocus: false,
    }
  );

  return {
    data: data ?? null,
    error,
    isLoading,
    refresh: mutate,
  };
}
