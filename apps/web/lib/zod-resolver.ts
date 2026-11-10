import { toNestErrors } from "@hookform/resolvers";
import type { Resolver } from "react-hook-form";
import type { ZodType } from "zod";

/**
 * Zod v4 compatible resolver for react-hook-form.
 * (@hookform/resolvers/zod v3 expects ZodError.errors from Zod v3, whereas Zod v4 uses ZodError.issues).
 */
export function zodResolver<T extends Record<string, any>>(
  schema: ZodType<any, any, any>,
): Resolver<T> {
  return async (values, _context, options) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) {
      return { values: result.data as T, errors: {} };
    }

    const errors: Record<string, { message: string; type: string }> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!errors[path]) {
        errors[path] = {
          message: issue.message,
          type: issue.code,
        };
      }
    }

    return {
      values: {},
      errors: toNestErrors(errors, options),
    };
  };
}

