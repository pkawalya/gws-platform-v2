/**
 * GWS Platform V2 — Auth Seed Script
 * 
 * Seeds the database with default roles, permissions, and admin user.
 * Run with: npx ts-node prisma/seed-auth.ts
 * Or: bun run prisma/seed-auth.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { ROLE_DEFINITIONS, ALL_PERMISSIONS_SEED } from '../src/lib/permissions'

const pool = new pg.Pool({
  host: 'pooled.db.prisma.io',
  port: 5432,
  database: 'postgres',
  user: '74fac8522f9f4853ff359b7132f6c62288f1b6c30b6662a06224e4708215bfb5',
  password: 'sk_vjZOzfwwXnFepaWbCeriL',
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding auth data...\n')

  // ── 1. Seed Permissions ──
  console.log('📋 Seeding permissions...')
  let permCount = 0
  for (const perm of ALL_PERMISSIONS_SEED) {
    const existing = await db.permission.findUnique({ where: { code: perm.code } })
    if (!existing) {
      await db.permission.create({
        data: {
          code: perm.code,
          name: perm.name,
          module: perm.module,
          description: perm.description,
        },
      })
      permCount++
    }
  }
  console.log(`   ✅ ${permCount} new permissions created (${ALL_PERMISSIONS_SEED.length} total defined)\n`)

  // ── 2. Seed Roles ──
  console.log('👥 Seeding roles...')
  const roleMap: Record<string, string> = {}
  for (const [key, def] of Object.entries(ROLE_DEFINITIONS)) {
    const existing = await db.role.findUnique({ where: { name: def.name } })
    if (existing) {
      roleMap[key] = existing.id
      console.log(`   ⏭️  Role "${def.display_name}" already exists (id: ${existing.id})`)
    } else {
      const role = await db.role.create({
        data: {
          name: def.name,
          display_name: def.display_name,
          description: def.description,
          color: def.color,
          is_system: key === 'admin',
        },
      })
      roleMap[key] = role.id
      console.log(`   ✅ Created role "${def.display_name}" (id: ${role.id})`)
    }
  }
  console.log()

  // ── 3. Seed Role-Permission Mappings ──
  console.log('🔗 Seeding role-permission mappings...')
  let mappingCount = 0
  for (const [key, def] of Object.entries(ROLE_DEFINITIONS)) {
    const roleId = roleMap[key]
    if (!roleId) continue

    for (const permCode of def.permissions) {
      const permission = await db.permission.findUnique({ where: { code: permCode } })
      if (!permission) {
        console.log(`   ⚠️  Permission "${permCode}" not found, skipping...`)
        continue
      }

      const existingMapping = await db.rolePermission.findUnique({
        where: {
          role_id_permission_id: {
            role_id: roleId,
            permission_id: permission.id,
          },
        },
      })

      if (!existingMapping) {
        await db.rolePermission.create({
          data: {
            role_id: roleId,
            permission_id: permission.id,
          },
        })
        mappingCount++
      }
    }
  }
  console.log(`   ✅ ${mappingCount} new role-permission mappings created\n`)

  // ── 4. Seed Admin User ──
  console.log('👤 Seeding admin user...')
  const adminEmail = 'admin@gws.co.ug'
  const adminPassword = 'admin123'

  const existingUser = await db.user.findUnique({ where: { email: adminEmail } })
  if (existingUser) {
    console.log(`   ⏭️  Admin user "${adminEmail}" already exists (id: ${existingUser.id})`)
    
    // Ensure admin has the admin role
    const adminRoleId = roleMap['admin']
    if (adminRoleId) {
      const existingUserRole = await db.userRole.findUnique({
        where: {
          user_id_role_id: {
            user_id: existingUser.id,
            role_id: adminRoleId,
          },
        },
      })
      if (!existingUserRole) {
        await db.userRole.create({
          data: {
            user_id: existingUser.id,
            role_id: adminRoleId,
            assigned_by: 'system',
          },
        })
        console.log('   ✅ Assigned admin role to existing user')
      }
    }
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    const adminUser = await db.user.create({
      data: {
        email: adminEmail,
        name: 'System Administrator',
        password_hash: hashedPassword,
        job_title: 'Administrator',
        department: 'IT',
        status: 'active',
        userRoles: {
          create: {
            role_id: roleMap['admin'],
            assigned_by: 'system',
          },
        },
      },
    })
    console.log(`   ✅ Created admin user (id: ${adminUser.id})`)
    console.log(`   📧 Email: ${adminEmail}`)
    console.log(`   🔑 Password: ${adminPassword}`)
  }
  console.log()

  // ── 5. Seed Demo Users ──
  console.log('🎭 Seeding demo users...')
  const demoUsers = [
    { email: 'surveyor@gws.co.ug', name: 'James Okello', role: 'surveyor', job_title: 'Senior Surveyor', department: 'Field Operations' },
    { email: 'reviewer@gws.co.ug', name: 'Grace Nalubega', role: 'reviewer', job_title: 'Quality Reviewer', department: 'Quality Assurance' },
    { email: 'accountant@gws.co.ug', name: 'Robert Mugisha', role: 'accountant', job_title: 'Senior Accountant', department: 'Finance' },
    { email: 'viewer@gws.co.ug', name: 'Patricia Achieng', role: 'viewer', job_title: 'Viewer', department: 'General' },
  ]

  for (const demo of demoUsers) {
    const existing = await db.user.findUnique({ where: { email: demo.email } })
    if (existing) {
      console.log(`   ⏭️  Demo user "${demo.email}" already exists`)
      
      // Ensure user has the correct role
      const roleId = roleMap[demo.role]
      if (roleId) {
        const existingUserRole = await db.userRole.findUnique({
          where: {
            user_id_role_id: {
              user_id: existing.id,
              role_id: roleId,
            },
          },
        })
        if (!existingUserRole) {
          await db.userRole.create({
            data: {
              user_id: existing.id,
              role_id: roleId,
              assigned_by: 'system',
            },
          })
          console.log(`   ✅ Assigned ${demo.role} role to ${demo.email}`)
        }
      }
      continue
    }

    const hashedPassword = await bcrypt.hash('demo123', 12)
    const roleId = roleMap[demo.role]
    const user = await db.user.create({
      data: {
        email: demo.email,
        name: demo.name,
        password_hash: hashedPassword,
        job_title: demo.job_title,
        department: demo.department,
        status: 'active',
        userRoles: roleId ? {
          create: {
            role_id: roleId,
            assigned_by: 'system',
          },
        } : undefined,
      },
    })
    console.log(`   ✅ Created demo user "${demo.name}" (${demo.email}) — password: demo123`)
  }

  console.log('\n🎉 Auth seeding complete!\n')
  console.log('═══════════════════════════════════════')
  console.log('  Default Login Credentials:')
  console.log('═══════════════════════════════════════')
  console.log('  Admin:     admin@gws.co.ug / admin123')
  console.log('  Surveyor:  surveyor@gws.co.ug / demo123')
  console.log('  Reviewer:  reviewer@gws.co.ug / demo123')
  console.log('  Accountant: accountant@gws.co.ug / demo123')
  console.log('  Viewer:    viewer@gws.co.ug / demo123')
  console.log('═══════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
    await pool.end()
  })
