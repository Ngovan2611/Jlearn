import Navbar from "../../components/layout/Navbar/Navbar.jsx";
import Footer from "../../components/layout/Footer/Footer.jsx";
import Hero from "../../components/home/Hero/Hero.jsx";
import Features from "../../components/home/Features/Feature.jsx";
import Courses from "../../components/home/Courses/Course.jsx";
import AiTutor from "../../components/home/AiTutor/AiTutor.jsx";
import CTA from "../../components/home/CTA/CTA.jsx";
import "./Home.css"

function Home() {
    return (
        <>
            <Navbar />

            <main>
                <Hero />

                <Features />

                <Courses />

                <AiTutor />

                <CTA />
            </main>

            <Footer />
        </>
    );
}

export default Home;

