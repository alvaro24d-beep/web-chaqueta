import Nav from "@/components/Nav";
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
      <Nav />
      <main>
        <Hero />
        <Manifesto />
        <Details />
        <FeaturesGrid />
        <Orbit />
        <FieldTest />
        <Finale />
      </main>
      <Footer />
      <div className="grain" aria-hidden="true" />
    </div>
  );
}
