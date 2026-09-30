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

  if (
    !user.email ||
    !adminEmails.includes(user.email.toLowerCase())
  ) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    )
  }

  const formData = await request.formData()

  const lessonId = String(
    formData.get('lessonId') || ''
  )

  const courseId = String(
    formData.get('courseId') || ''
  )

  if (!lessonId || !courseId) {
    return NextResponse.json(
      { error: 'Lesson ID and course ID are required.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('lessons')
    .delete()
    .eq('id', lessonId)

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.redirect(
    new URL(
      `/admin/courses/${courseId}?deleted=lesson`,
      request.url
    )
  )
}