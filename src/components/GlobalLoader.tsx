export default function GlobalLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <img
          src="/GIFS/Loading-State.gif"
          alt="Loading"
          className="w-40 h-40 object-contain mb-4"
        />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}


