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

  const moduleId = String(
    formData.get('moduleId') || ''
  )

  const courseId = String(
    formData.get('courseId') || ''
  )

  if (!moduleId || !courseId) {
    return NextResponse.json(
      { error: 'Module ID and course ID are required.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { data: lastLesson } = await admin
    .from('lessons')
    .select('sort_order')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = (lastLesson?.sort_order || 0) + 1

  const { data: lesson, error } = await admin
    .from('lessons')
    .insert({
      module_id: moduleId,
      title: `Lesson ${nextOrder}`,
      description: '',
      sort_order: nextOrder,
      video_url: null,
      duration_minutes: null,
      is_preview: false,
    })
    .select('id')
    .single()

  if (error || !lesson) {
    return NextResponse.json(
      { error: error?.message || 'Lesson creation failed.' },
      { status: 500 }
    )
  }

  return NextResponse.redirect(
    new URL(
      `/admin/lessons/${lesson.id}`,
      request.url
    )
  )
}