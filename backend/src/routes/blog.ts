import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import {  verify } from "hono/jwt";
const prisma = new PrismaClient().$extends(withAccelerate());

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  
  const authHeader = c.req.header("authorization") || "";
  try {
    const user = await verify(authHeader, c.env.JWT_SECRET);
    if (user && typeof user.id === 'string') {
      c.set("userId", user.id);
      await next();
    } else {
      c.status(401);
      return c.json({ message: "unauthorized" });
    }
  } catch (error) {
    c.status(401);
    return c.json({ message: "unauthorized" });
  }
});




blogRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const userId = c.get("userId");

  if (typeof userId !== 'string') {
    c.status(400);
    return c.json({ message: "Invalid userId" });
  }

  const blog = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: userId,
    },
  });

  return c.json({ id: blog.id });
});






blogRouter.put("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const userId = c.get("userId");

  if (typeof userId !== 'string') {
    c.status(400);
    return c.json({ message: "Invalid userId" });
  }

  const blog = await prisma.post.update({
    where: { id: body.id },
    data: {
      title: body.title,
      content: body.content,
      authorId: userId,
    },
  });

  return c.json({ id: blog.id });
});

blogRouter.get("/bulk", async (c) => {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
  
    const blogs = await prisma.post.findMany();
  
    return c.json({ blogs });
  });

blogRouter.get("/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const id = c.req.param("id");

  try {
    const blog = await prisma.post.findFirst({
      where: { id },
    });

    return c.json({ blog });
  } catch (error) {
    c.status(411);
    return c.json({
      error: "Error while fetching blog",
    });
  }
});


