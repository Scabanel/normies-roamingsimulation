'use client'
import { useEffect, useRef } from 'react'
import Script from 'next/script'

interface Props {
  tweetUrl: string
}

export default function TweetEmbed({ tweetUrl }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // If the Twitter widget script already loaded before this component mounted
    const tw = (window as { twttr?: { widgets?: { load: (el?: HTMLElement | null) => void } } }).twttr
    if (tw?.widgets) {
      tw.widgets.load(ref.current)
    }
  }, [])

  function handleScriptLoad() {
    const tw = (window as { twttr?: { widgets?: { load: (el?: HTMLElement | null) => void } } }).twttr
    if (tw?.widgets) {
      tw.widgets.load(ref.current)
    }
  }

  return (
    <div ref={ref} style={{ maxWidth: 550 }}>
      <blockquote
        className="twitter-tweet"
        data-theme="dark"
        data-dnt="true"
      >
        <a href={tweetUrl}></a>
      </blockquote>
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
      />
    </div>
  )
}
