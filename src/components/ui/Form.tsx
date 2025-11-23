import { useForm, type UseFormReturn, type FieldValues, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import type { z } from 'zod';

interface FormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  onSubmit: SubmitHandler<T>;
  children: (methods: UseFormReturn<T>) => ReactNode;
  defaultValues?: Partial<T>;
  className?: string;
}

export function Form<T extends FieldValues>({
  schema,
  onSubmit,
  children,
  defaultValues,
  className,
}: FormProps<T>) {
  const methods = useForm<T>({
    // @ts-expect-error - zodResolver type mismatch with react-hook-form generics
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  });

  return (
    <form onSubmit={methods.handleSubmit(onSubmit as any)} className={className}>
      {children(methods as any)}
    </form>
  );
}

export type { UseFormReturn } from 'react-hook-form';

