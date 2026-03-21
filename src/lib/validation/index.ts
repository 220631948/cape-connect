/**
 * @file src/lib/validation/index.ts
 * @description Central validation utilities using Zod.
 * Provides a standardised request-body parser that returns
 * a typed result or a 400 NextResponse.
 */
import {NextResponse} from 'next/server';
import {z} from 'zod';

export type ValidationSuccess<T> = { success: true; data: T; response?: undefined };
export type ValidationFailure = { success: false; response: NextResponse; data?: undefined };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns `{ success: true, data }` on valid input, or
 * `{ success: false, response }` with a 400 JSON response on failure.
 */
export async function validateBody<T extends z.ZodType>(
    request: Request,
    schema: T,
): Promise<ValidationResult<z.infer<T>>> {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return {
            success: false,
            response: NextResponse.json(
                {error: 'Invalid JSON body'},
                {status: 400},
            ),
        };
    }

    const result = schema.safeParse(body);
    if (!result.success) {
        const issues = result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
        }));
        return {
            success: false,
            response: NextResponse.json(
                {error: 'Validation failed', issues},
                {status: 400},
            ),
        };
    }

    return {success: true, data: result.data};
}

/**
 * Parse and validate URL search params against a Zod schema.
 * Returns `{ success: true, data }` or `{ success: false, response }`.
 */
export function validateQuery<T extends z.ZodType>(
    searchParams: URLSearchParams,
    schema: T,
): ValidationResult<z.infer<T>> {
    const raw: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        raw[key] = value;
    });

    const result = schema.safeParse(raw);
    if (!result.success) {
        const issues = result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
        }));
        return {
            success: false,
            response: NextResponse.json(
                {error: 'Validation failed', issues},
                {status: 400},
            ),
        };
    }

    return {success: true, data: result.data};
}
