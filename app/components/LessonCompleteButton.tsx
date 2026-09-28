'use client'

import { useState } from 'react'
import { createClient } from '../../src/lib/supabase/client'

export default function LessonCompleteButton({
  lessonId,
  enrollmentId,
  initialCompleted,
}: {
  lessonId: string
  enrollmentId: string
  initialCompleted: boolean
}) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function markComplete() {
    if (completed || saving) {
      return
    }

    setSaving(true)
    setError('')

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Please sign in to save your progress.')
      setSaving(false)
      return
    }

    const { error: saveError } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          user_id: user.id,
          completed: true,
          watched_seconds: 0,
          last_watched_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,lesson_id',
        }
      )

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    setCompleted(true)
    setSaving(false)
  }

  return (
    <div style={{ marginTop: '25px' }}>
      <button
        onClick={markComplete}
        disabled={completed || saving}
        style={{
          padding: '12px 18px',
          borderRadius: '9px',
          border: completed
            ? '1px solid #0e8f78'
            : '1px solid #315ee7',
          background: completed ? '#e7f7f3' : '#315ee7',
          color: completed ? '#087b67' : '#fff',
          cursor: completed || saving ? 'default' : 'pointer',
          fontWeight: '700',
          fontSize: '14px',
        }}
      >
        {saving
          ? 'Saving...'
          : completed
            ? '✓ Lesson Completed'
            : 'Mark Lesson Complete'}
      </button>

      {error && (
        <p
          style={{
            marginTop: '10px',
            color: '#cc0000',
            fontSize: '13px',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}