import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.DATABASE_URL
  return NextResponse.json({
    url: url ? url.substring(0, 30) + '...' : 'NOT SET',
    startsWithPostgres: url?.startsWith('postgres'),
    startsWithPostgresql: url?.startsWith('postgresql'),
    length: url?.length,
  })
}
