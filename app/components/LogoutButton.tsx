'use client'

import { createClient } from '../../src/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)

    const supabase = createClient()

    await supabase.auth.signOut()

    router.push('/auth')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{
        border: '1px solid #d7dee8',
        background: '#ffffff',
        color: '#1f2937',
        borderRadius: '10px',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: 700,
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? 'Logging out...' : 'Log out'}
    </button>
  )
}