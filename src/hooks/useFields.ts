import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Field {
  id: string;
  user_id: string;
  name: string;
  area: number | null;
  area_unit: string;
  district: string | null;
  municipality: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export function useFields() {
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFields = async () => {
    if (!user) {
      setFields([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from("fields")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setFields(data || []);
    } catch (err) {
      console.error("Error fetching fields:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const addField = async (field: Omit<Field, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("fields")
      .insert({ ...field, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setFields((prev) => [data, ...prev]);
    return data;
  };

  const updateField = async (id: string, updates: Partial<Field>) => {
    const { data, error } = await supabase
      .from("fields")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    setFields((prev) => prev.map((f) => (f.id === id ? data : f)));
    return data;
  };

  const deleteField = async (id: string) => {
    const { error } = await supabase.from("fields").delete().eq("id", id);
    if (error) throw error;
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  useEffect(() => {
    fetchFields();
  }, [user]);

  return {
    fields,
    isLoading,
    error,
    refetch: fetchFields,
    addField,
    updateField,
    deleteField,
  };
}
