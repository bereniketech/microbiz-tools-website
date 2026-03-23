import { z } from "zod";

export const taskPrioritySchema = z.enum(["low", "medium", "high"]);
export const taskStatusSchema = z.enum(["todo", "completed", "done"]);

const nullableTaskDateTimeSchema = z.preprocess(
  (value) => {
    if (value === "" || value === undefined) {
      return null;
    }

    return value;
  },
  z.string().datetime({ offset: true }).nullable(),
);

const optionalNullableTaskClientSchema = z.preprocess(
  (value) => {
    if (value === "" || value === undefined) {
      return null;
    }

    return value;
  },
  z.string().uuid().nullable(),
);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  client_id: optionalNullableTaskClientSchema.optional(),
  priority: taskPrioritySchema.default("medium"),
  due_at: nullableTaskDateTimeSchema.optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").optional(),
    client_id: optionalNullableTaskClientSchema.optional(),
    priority: taskPrioritySchema.optional(),
    due_at: nullableTaskDateTimeSchema.optional(),
    status: taskStatusSchema.optional(),
    complete: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
    path: ["body"],
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;