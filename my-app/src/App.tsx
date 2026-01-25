function App() {
  const name = "Chey Rotana";
  return (
    <>
      <div className="flex flex-row items-center justify-between min-h-screen bg-green-500 text-white p-12 gap-8">
        <div className="flex-1">
          <h1 className="text-5xl font-bold mb-4">
            Hello, I'm <b>{name}</b>
          </h1>
          <p className="text-xl">Welcome to my portfolio</p>
        </div>
        <div>
          <img
            src="/profile-picture.png"
            alt="Profile"
            className="rounded-full w-16 h-16 object-cover"
          />
        </div>
      </div>
    </>
  );
}

export default App;
