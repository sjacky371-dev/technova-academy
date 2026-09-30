type CoursePreviewVideoProps = {
  title: string
  description?: string
  youtubeUrl: string
}

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url)

    if (parsed.hostname === 'youtu.be') {
      const videoId = parsed.pathname.replace('/', '').trim()

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }
    }

    if (
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'm.youtube.com'
    ) {
      const videoId = parsed.searchParams.get('v')

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }

      const parts = parsed.pathname.split('/')

      const embedIndex = parts.indexOf('embed')

      if (embedIndex !== -1 && parts[embedIndex + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIndex + 1]}`
      }
    }

    return null
  } catch {
    return null
  }
}

export default function CoursePreviewVideo({
  title,
  description,
  youtubeUrl,
}: CoursePreviewVideoProps) {
  const embedUrl = getYouTubeEmbedUrl(youtubeUrl)

  if (!embedUrl) {
    return null
  }

  return (
    <section
      style={{
        padding: '70px 24px',
        background: '#fff',
      }}
    >
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '7px 10px',
            borderRadius: '7px',
            background: '#eef3ff',
            color: '#315ee7',
            fontSize: '10px',
            fontWeight: 900,
            letterSpacing: '1px',
            marginBottom: '12px',
          }}
        >
          FREE PREVIEW
        </div>

        <h2
          style={{
            margin: '0 0 10px',
            fontSize: 'clamp(28px,4vw,40px)',
            lineHeight: 1.15,
            letterSpacing: '-1px',
            color: '#111827',
          }}
        >
          {title}
        </h2>

        {description && (
          <p
            style={{
              maxWidth: '720px',
              margin: '0 0 28px',
              color: '#667085',
              fontSize: '14px',
              lineHeight: 1.7,
            }}
          >
            {description}
          </p>
        )}

        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            overflow: 'hidden',
            borderRadius: '18px',
            background: '#0b1222',
            boxShadow: '0 18px 50px rgba(16,24,40,.14)',
          }}
        >
          <iframe
            src={embedUrl}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 0,
            }}
          />
        </div>

        <p
          style={{
            margin: '12px 0 0',
            color: '#98a2b3',
            fontSize: '11px',
          }}
        >
          Free preview video. Full course lessons and resources are available
          after enrollment.
        </p>
      </div>
    </section>
  )
}