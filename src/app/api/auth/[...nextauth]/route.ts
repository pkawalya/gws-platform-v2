import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@gws.co.ug' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Try to find the user
        let user = await db.user.findUnique({
          where: { email: credentials.email },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
          },
        })

        // Auto-seed admin user on first login attempt
        if (!user && credentials.email === 'admin@gws.co.ug') {
          const hashedPassword = await bcrypt.hash('admin123', 12)

          // Ensure admin role exists
          let adminRole = await db.role.findUnique({ where: { name: 'admin' } })
          if (!adminRole) {
            adminRole = await db.role.create({
              data: {
                name: 'admin',
                display_name: 'Administrator',
                description: 'Full access to all platform features and data',
                color: '#ef4444',
                is_system: true,
              },
            })
          }

          // Create admin user
          user = await db.user.create({
            data: {
              email: 'admin@gws.co.ug',
              name: 'System Administrator',
              password_hash: hashedPassword,
              job_title: 'Administrator',
              department: 'IT',
              status: 'active',
              userRoles: {
                create: {
                  role_id: adminRole.id,
                  assigned_by: 'system',
                },
              },
            },
            include: {
              userRoles: {
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        include: { permission: true },
                      },
                    },
                  },
                },
              },
            },
          })
        }

        if (!user || !user.password_hash) {
          throw new Error('Invalid email or password')
        }

        if (user.status !== 'active') {
          throw new Error('Account is inactive. Please contact an administrator.')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!isValid) {
          throw new Error('Invalid email or password')
        }

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { last_login_at: new Date() },
        })

        // Extract roles and permissions
        const roles = user.userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          display_name: ur.role.display_name,
          color: ur.role.color,
        }))

        // If admin role, grant all permissions (wildcard)
        const isAdmin = roles.some(r => r.name === 'admin')
        const permissions = isAdmin
          ? ['*']
          : user.userRoles.flatMap(ur =>
              ur.role.rolePermissions.map(rp => rp.permission.code)
            )

        // Deduplicate permissions
        const uniquePermissions = [...new Set(permissions)]

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar_url,
          roles,
          permissions: uniquePermissions,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in — add role/permissions to token
      if (user) {
        token.id = user.id
        token.roles = (user as any).roles || []
        token.permissions = (user as any).permissions || []
      }
      return token
    },
    async session({ session, token }) {
      // Add role/permissions to session
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).roles = token.roles || []
        ;(session.user as any).permissions = token.permissions || []
      }
      return session
    },
  },
  pages: {
    signIn: '/', // We handle login in-page
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
