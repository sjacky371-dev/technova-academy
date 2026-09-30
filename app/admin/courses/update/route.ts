import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      new URL('/auth', request.url)
    )
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  if (!adminEmails.includes((user.email || '').toLowerCase())) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    )
  }

  const formData = await request.formData()

  const courseId = String(formData.get('course_id') || '')
  const title = String(formData.get('title') || '').trim()
  const slug = String(formData.get('slug') || '').trim()
  const description = String(
    formData.get('description') || ''
  ).trim()
  const level = String(formData.get('level') || '').trim()

  const priceInr = Number(
    formData.get('price_inr') || 0
  )

  const durationMonths = Number(
    formData.get('duration_months') || 12
  )

  const published =
    formData.get('published') === 'true'

  if (!courseId || !title || !slug) {
    return NextResponse.json(
      {
        error:
          'Course ID, title and slug are required.',
      },
      { status: 400 }
    )
  }

  if (!Number.isFinite(priceInr) || priceInr < 0) {
    return NextResponse.json(
      {
        error: 'Price must be a valid non-negative number.',
      },
      { status: 400 }
    )
  }

  if (
    !Number.isFinite(durationMonths) ||
    durationMonths < 1
  ) {
    return NextResponse.json(
      {
        error:
          'Duration must be at least 1 month.',
      },
      { status: 400 }
    )
  }

  const normalizedSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!normalizedSlug) {
    return NextResponse.json(
      {
        error: 'Please provide a valid URL slug.',
      },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { data: existingCourse } = await admin
    .from('courses')
    .select('id')
    .eq('slug', normalizedSlug)
    .neq('id', courseId)
    .maybeSingle()

  if (existingCourse) {
    return NextResponse.json(
      {
        error:
          'Another course already uses this slug.',
      },
      { status: 409 }
    )
  }

  const { error } = await admin
    .from('courses')
    .update({
      title,
      slug: normalizedSlug,
      description: description || null,
      price_inr: priceInr,
      duration_months: durationMonths,
      level: level || null,
      published,
    })
    .eq('id', courseId)

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    )
  }

  return NextResponse.redirect(
    new URL(
      `/admin/courses/${courseId}?saved=1`,
      request.url
    )
  )
}