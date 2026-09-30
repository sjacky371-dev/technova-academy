import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

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
  ).trim()

  const courseId = String(
    formData.get('courseId') || ''
  ).trim()

  const moduleId = String(
    formData.get('moduleId') || ''
  ).trim()

  const title = String(
    formData.get('title') || ''
  ).trim()

  const description = String(
    formData.get('description') || ''
  ).trim()

  const videoUrl = String(
    formData.get('video_url') || ''
  ).trim()

  const durationRaw = String(
    formData.get('duration_minutes') || ''
  ).trim()

  const sortOrderRaw = String(
    formData.get('sort_order') || ''
  ).trim()

  const isPreview =
    formData.get('is_preview') === 'on'

  if (
    !lessonId ||
    !courseId ||
    !moduleId ||
    !title
  ) {
    return NextResponse.redirect(
      new URL(
        `/admin/lessons/${lessonId}?error=missing`,
        request.url
      )
    )
  }

  const durationMinutes = durationRaw
    ? Number(durationRaw)
    : null

  const sortOrder = sortOrderRaw
    ? Number(sortOrderRaw)
    : 1

  if (
    durationMinutes !== null &&
    (!Number.isFinite(durationMinutes) ||
      durationMinutes < 0)
  ) {
    return NextResponse.redirect(
      new URL(
        `/admin/lessons/${lessonId}?error=duration`,
        request.url
      )
    )
  }

  if (
    !Number.isFinite(sortOrder) ||
    sortOrder < 1
  ) {
    return NextResponse.redirect(
      new URL(
        `/admin/lessons/${lessonId}?error=order`,
        request.url
      )
    )
  }

  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('lessons')
    .update({
      title,
      description: description || null,
      video_url: videoUrl || null,
      duration_minutes: durationMinutes,
      sort_order: sortOrder,
      is_preview: isPreview,
    })
    .eq('id', lessonId)
    .eq('module_id', moduleId)

  if (error) {
    console.error(
      'Admin lesson update error:',
      error
    )

    return NextResponse.redirect(
      new URL(
        `/admin/lessons/${lessonId}?error=save`,
        request.url
      )
    )
  }

  return NextResponse.redirect(
    new URL(
      `/admin/lessons/${lessonId}?saved=1`,
      request.url
    )
  )
}