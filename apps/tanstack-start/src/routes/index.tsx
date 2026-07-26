/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { Suspense } from "react";
import { useForm } from "@tanstack/react-form";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import type { RouterOutputs } from "@klaro/api";
import { cn } from "@klaro/ui";
import { Button } from "@klaro/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@klaro/ui/field";
import { Input } from "@klaro/ui/input";
import { toast } from "@klaro/ui/toast";

import { AuthShowcase } from "~/component/auth-showcase";
import { useTRPC } from "~/lib/trpc";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const { trpc, queryClient } = context;
    await queryClient.prefetchQuery(
      trpc.documents.list.queryOptions({
        limit: 10,
        offset: 0,
      }),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-primary">T3</span> Turbo
        </h1>
        <AuthShowcase />

        <CreateDocumentForm />
        <div className="w-full max-w-2xl overflow-y-scroll">
          <Suspense
            fallback={
              <div className="flex w-full flex-col gap-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            }
          >
            <DocumentList />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

function CreateDocumentForm() {
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  const createDocument = useMutation(
    trpc.documents.upload.mutationOptions({
      onSuccess: async () => {
        form.reset();
        await queryClient.invalidateQueries(trpc.documents.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to upload documents"
            : "Failed to create document",
        );
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      fileName: "",
      mimeType: "application/pdf",
      fileSize: undefined as number | undefined,
    },
    onSubmit: (data) => createDocument.mutate(data.value),
  });

  return (
    <form
      className="w-full max-w-2xl"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="fileName">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>File name</FieldLabel>
                </FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="lab-results-jan.pdf"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="mimeType">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>MIME type</FieldLabel>
                </FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="application/pdf"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="fileSize">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>
                    File size (bytes)
                  </FieldLabel>
                </FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    if (!nextValue) {
                      field.handleChange(undefined);
                      return;
                    }
                    const parsed = Number(nextValue);
                    field.handleChange(
                      Number.isFinite(parsed) ? parsed : field.state.value,
                    );
                  }}
                  aria-invalid={isInvalid}
                  placeholder="120000"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>
      <Button type="submit">Create</Button>
    </form>
  );
}

function DocumentList() {
  const trpc = useTRPC();
  const { data: documents } = useSuspenseQuery(
    trpc.documents.list.queryOptions({
      limit: 10,
      offset: 0,
    }),
  );

  if (documents.length === 0) {
    return (
      <div className="relative flex w-full flex-col gap-4">
        <PostCardSkeleton pulse={false} />
        <PostCardSkeleton pulse={false} />
        <PostCardSkeleton pulse={false} />

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
          <p className="text-2xl font-bold text-white">No documents yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {documents.map((doc) => {
        return <DocumentCard key={doc.id} document={doc} />;
      })}
    </div>
  );
}

function DocumentCard(
  props: Readonly<{ document: RouterOutputs["documents"]["list"][number] }>,
) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteDocument = useMutation(
    trpc.documents.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.documents.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to delete a document"
            : "Failed to delete document",
        );
      },
    }),
  );

  return (
    <div className="bg-muted flex flex-row rounded-lg p-4">
      <div className="grow">
        <h2 className="text-primary text-2xl font-bold">
          {props.document.fileName}
        </h2>
        <p className="mt-2 text-sm">
          {props.document.status.toUpperCase()} •{" "}
          {new Date(props.document.createdAt).toLocaleString()}
        </p>
      </div>
      <div>
        <Button
          variant="ghost"
          className="text-primary cursor-pointer text-sm font-bold uppercase hover:bg-transparent hover:text-white"
          onClick={() => deleteDocument.mutate({ id: props.document.id })}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

function PostCardSkeleton(props: Readonly<{ pulse?: boolean }>) {
  const { pulse = true } = props;
  return (
    <div className="bg-muted flex flex-row rounded-lg p-4">
      <div className="grow">
        <h2
          className={cn(
            "bg-primary w-1/4 rounded-sm text-2xl font-bold",
            pulse && "animate-pulse",
          )}
        >
          &nbsp;
        </h2>
        <p
          className={cn(
            "mt-2 w-1/3 rounded-sm bg-current text-sm",
            pulse && "animate-pulse",
          )}
        >
          &nbsp;
        </p>
      </div>
    </div>
  );
}
