import Profile from './assets/Profile.png';

function App() {
  const name = "Chey Rotana";
  return (
    <>
      <section className="flex flex-row items-center justify-between bg-green-500 text-white p-12 gap-8">
        <div className="flex-3 p-12">
          <h1 className="text-5xl font-bold mb-4">
            Hello, I'm <b>{name}</b>
          </h1>
          <p className="text-xl">Welcome to my portfolio</p>
        </div>
        <div className='flex-1'>
          <img
            src={Profile}
            alt="Profile"
            className="rounded-full w-64 h-64 object-cover "
          />
        </div>
      </section>
      
      <section>
        <div className=''> 
          <h2>
            Skills
          </h2>
        </div>
      </section>
    </>
  );
}

export default App;
  