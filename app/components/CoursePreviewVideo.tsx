'use client'

type CoursePreviewVideoProps = {
  title: string
  description?: string
  youtubeUrl?: string | null
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url)

    let videoId = ''

    // Standard YouTube URL
    if (
      parsedUrl.hostname === 'www.youtube.com' ||
      parsedUrl.hostname === 'youtube.com'
    ) {
      videoId = parsedUrl.searchParams.get('v') || ''

      // YouTube short URL path such as /embed/VIDEO_ID
      if (!videoId && parsedUrl.pathname.startsWith('/embed/')) {
        videoId = parsedUrl.pathname.replace('/embed/', '').split('/')[0]
      }
    }

    // youtu.be/VIDEO_ID
    if (parsedUrl.hostname === 'youtu.be') {
      videoId = parsedUrl.pathname.replace('/', '').split('/')[0]
    }

    if (!videoId) {
      return null
    }

    return `https://www.youtube.com/embed/${videoId}`
  } catch {
    return null
  }
}

export default function CoursePreviewVideo({
  title,
  description,
  youtubeUrl,
}: CoursePreviewVideoProps) {
  const embedUrl = youtubeUrl
    ? getYouTubeEmbedUrl(youtubeUrl)
    : null

  if (!embedUrl) {
    return null
  }

  return (
    <section
      style={{
        padding: '70px 24px',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              marginBottom: '10px',
              color: '#315ee7',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '1.5px',
            }}
          >
            COURSE PREVIEW
          </span>

          <h2
            style={{
              margin: '0 0 12px',
              color: '#111827',
              fontSize: 'clamp(28px, 4vw, 42px)',
              lineHeight: 1.15,
              letterSpacing: '-1.2px',
            }}
          >
            {title}
          </h2>

          {description && (
            <p
              style={{
                maxWidth: '680px',
                margin: '0 auto 28px',
                color: '#667085',
                fontSize: '14px',
                lineHeight: 1.7,
              }}
            >
              {description}
            </p>
          )}
        </div>

        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            overflow: 'hidden',
            borderRadius: '18px',
            background: '#000',
            boxShadow: '0 20px 60px rgba(0,0,0,.15)',
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingTop: '56.25%',
            }}
          >
            <iframe
              src={embedUrl}
              title={title}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 0,
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  )
}