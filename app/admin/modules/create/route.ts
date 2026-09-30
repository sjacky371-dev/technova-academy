import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'

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

  if (
    !user.email ||
    !adminEmails.includes(user.email.toLowerCase())
  ) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    )
  }

  const formData = await request.formData()
  const courseId = String(formData.get('courseId') || '')

  if (!courseId) {
    return NextResponse.json(
      { error: 'Course ID is required.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { data: lastModule } = await admin
    .from('course_modules')
    .select('sort_order')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = (lastModule?.sort_order || 0) + 1

  const { error } = await admin
    .from('course_modules')
    .insert({
      course_id: courseId,
      title: `Module ${nextOrder}`,
      description: '',
      sort_order: nextOrder,
    })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.redirect(
    new URL(`/admin/courses/${courseId}?added=module`, request.url)
  )
}