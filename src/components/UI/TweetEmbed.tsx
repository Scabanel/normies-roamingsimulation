'use client'
import Script from 'next/script'

interface Props {
  tweetUrl: string
}

export default function TweetEmbed({ tweetUrl }: Props) {
  return (
    <div style={{ maxWidth: 550 }}>
      <blockquote
        className="twitter-tweet"
        data-theme="dark"
        data-dnt="true"
      >
        <a href={tweetUrl}></a>
      </blockquote>
      <Script src="https://platform.twitter.com/widgets.js" strategy="lazyOnload" />
    </div>
  )
}
