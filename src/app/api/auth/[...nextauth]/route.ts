import NextAuth, { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log('Authorize called with:', credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log('No credentials provided');
          throw new Error("Invalid credentials");
        }

        // Hardcoded admin for immediate access
        if (credentials.email === "admin" && credentials.password === "123456") {
          return {
            id: "admin-master",
            name: "Admin User",
            email: "admin@constructhub.com",
            role: "ADMIN",
          } as any;
        }

        if (credentials.email === "manager" && credentials.password === "123456") {
          return {
            id: "manager-master",
            name: "Manager User",
            email: "manager@constructhub.com",
            role: "MANAGER",
          } as any;
        }

        if (credentials.email === "engineer" && credentials.password === "123456") {
          return {
            id: "engineer-master",
            name: "Engineer User",
            email: "engineer@constructhub.com",
            role: "ENGINEER",
          } as any;
        }

        if (credentials.email === "client" && credentials.password === "123456") {
          return {
            id: "client-master",
            name: "Client User",
            email: "client@constructhub.com",
            role: "CLIENT",
          } as any;
        }

        if (credentials.email === "user" && credentials.password === "123456") {
          return {
            id: "user-master",
            name: "Regular User",
            email: "user@constructhub.com",
            role: "CLIENT",
          } as any;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        console.log('User lookup result:', user ? 'found' : 'not found', credentials.email);

        if (!user || !user.password) {
          console.log('User not found or no password');
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        console.log('Password check:', isCorrectPassword, 'for', credentials.email);

        if (!isCorrectPassword) {
          console.log('Password incorrect');
          throw new Error("Invalid credentials");
        }

        console.log('Login successful for:', user.email);
        return user;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      console.log('Session callback:', { session, token });
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      console.log('JWT callback:', { token, user });
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
