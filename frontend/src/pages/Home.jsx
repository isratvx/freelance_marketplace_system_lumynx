import logo from '../assets/logo1.jpeg';

const features = [
  {
    title: 'Post Jobs',
    description:
      'Clients can post jobs and manage their project requirements.'
  },
  {
    title: 'Find Work',
    description:
      'Freelancers can browse available jobs and submit proposals.'
  },
  {
    title: 'Manage Proposals',
    description:
      'Clients can review proposals and choose the right freelancer for their projects.'
  }
];

export default function Home() {
  return (
    <div className="lumynx-container">

      {/* MAIN INTRODUCTION */}
      <section className="glass-panel mt-10 p-8 text-center md:p-12">

        <img
          src={logo}
          alt="lumynx logo"
          className="mx-auto mb-5 h-16 w-auto object-contain"
        />

        <h1 className="neon-title text-4xl font-black md:text-5xl">
          lumynx
        </h1>

        <p className="mt-3 text-lg font-semibold text-purple-300">
          Freelance Marketplace System
        </p>

        <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#a995b8]">
          A simple platform where clients can post jobs and
          freelancers can find work, submit proposals, and
          connect with suitable projects.
        </p>

      </section>

      {/* MAIN FEATURES */}
      <section className="mt-8">

        <h2 className="text-center text-2xl font-bold text-white">
          Main Features
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-3">

          {features.map((feature) => (
            <article
              key={feature.title}
              className="glass-card p-6 text-center"
            >
              <h3 className="text-xl font-bold text-white">
                {feature.title}
              </h3>

              <p className="mt-3 leading-6 text-[#a995b8]">
                {feature.description}
              </p>
            </article>
          ))}

        </div>

      </section>

      {/* FOOTER */}
      <footer className="mt-10 border-t border-white/10 py-6 text-center">

        <p className="text-sm text-[#806f8d]">
          © 2026 lumynx — Freelance Marketplace System
        </p>

      </footer>

    </div>
  );
}