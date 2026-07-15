import Nav from "@/components/Nav";
import BackToTop from "@/components/motion/BackToTop";
import ScrollProgress from "@/components/motion/ScrollProgress";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import Details from "@/components/sections/Details";
import FeaturesGrid from "@/components/sections/FeaturesGrid";
import Orbit from "@/components/sections/Orbit";
import FieldTest from "@/components/sections/FieldTest";
import Finale from "@/components/sections/Finale";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <div id="top">
      <ScrollProgress />
      <Nav />
      {/* El contenido va por encima (z-10) del footer telón (z-0) */}
      <main className="relative z-10 bg-coal">
        <Hero />
        <Manifesto />
        <Details />
        <FeaturesGrid />
        <Orbit />
        <FieldTest />
        <Finale />
      </main>
      <Footer />
      <BackToTop />
      <div className="grain" aria-hidden="true" />
    </div>
  );
}
