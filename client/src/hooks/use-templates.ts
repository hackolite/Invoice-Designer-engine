import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateTemplateRequest, UpdateTemplateRequest, Template } from "@shared/schema";
import { z } from "zod";

// Helper for strict typing of the response
function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    // For development, we might want to throw, but for prod, maybe return partial?
    // We'll throw to ensure we catch these issues early.
    throw result.error;
  }
  return result.data;
}

// GET /api/templates
export function useTemplates() {
  return useQuery({
    queryKey: [api.templates.list.path],
    queryFn: async () => {
      const res = await fetch(api.templates.list.path, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      return parseWithLogging(api.templates.list.responses[200], data, "templates.list");
    },
  });
}

// GET /api/templates/:id
export function useTemplate(id: number | null) {
  return useQuery({
    queryKey: [api.templates.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const url = buildUrl(api.templates.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch template');
      const data = await res.json();
      return parseWithLogging(api.templates.get.responses[200], data, "templates.get");
    },
  });
}

// POST /api/templates
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTemplateRequest) => {
      // Validate input before sending
      const validated = api.templates.create.input.parse(data);
      
      const res = await fetch(api.templates.create.path, {
        method: api.templates.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.templates.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to create template');
      }
      
      const responseData = await res.json();
      return parseWithLogging(api.templates.create.responses[201], responseData, "templates.create");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.templates.list.path] }),
  });
}

// PUT /api/templates/:id
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateTemplateRequest) => {
      // Validate input
      const validated = api.templates.update.input.parse(updates);
      
      const url = buildUrl(api.templates.update.path, { id });
      const res = await fetch(url, {
        method: api.templates.update.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.templates.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 404) throw new Error('Template not found');
        throw new Error('Failed to update template');
      }
      
      const responseData = await res.json();
      return parseWithLogging(api.templates.update.responses[200], responseData, "templates.update");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.templates.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.templates.get.path, data.id] });
    },
  });
}

// DELETE /api/templates/:id
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.templates.delete.path, { id });
      const res = await fetch(url, { 
        method: api.templates.delete.method, 
        credentials: "include" 
      });
      
      if (res.status === 404) throw new Error('Template not found');
      if (!res.ok) throw new Error('Failed to delete template');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.templates.list.path] }),
  });
}
