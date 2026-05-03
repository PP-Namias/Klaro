import type { TRPCRouterRecord } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { z } from "zod/v4";

import { desc, eq } from "@klaro/db";
import { CreatePostSchema, Post } from "@klaro/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

type PostRow = typeof Post.$inferSelect;

const fallbackPosts: PostRow[] = [];

function getFallbackPosts() {
  return [...fallbackPosts].sort((a, b) => {
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export const postRouter = {
  all: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.db.query.Post.findMany({
        orderBy: desc(Post.id),
        limit: 10,
      });
    } catch {
      return getFallbackPosts().slice(0, 10);
    }
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.Post.findFirst({
        where: eq(Post.id, input.id),
      });
    }),

  create: protectedProcedure
    .input(CreatePostSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.insert(Post).values(input);
      } catch {
        const post: PostRow = {
          id: randomUUID(),
          title: input.title,
          content: input.content,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        fallbackPosts.unshift(post);
        return post;
      }
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    try {
      return await ctx.db.delete(Post).where(eq(Post.id, input));
    } catch {
      const index = fallbackPosts.findIndex((post) => post.id === input);
      if (index !== -1) {
        fallbackPosts.splice(index, 1);
      }

      return { success: true };
    }
  }),
} satisfies TRPCRouterRecord;
