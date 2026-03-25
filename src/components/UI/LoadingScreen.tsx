export default function LoadingScreen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
      <div className="font-mono text-gray-400 text-sm mb-4 tracking-widest uppercase">
        Normies World
      </div>
      <div className="font-mono text-gray-700 text-xs animate-pulse">
        Initializing simulation...
      </div>
      <div className="mt-4 flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="w-2 h-2 bg-gray-600 rounded-sm animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
